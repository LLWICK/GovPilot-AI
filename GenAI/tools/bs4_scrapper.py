"""
HTTP/BeautifulSoup tool set for GovPilot AI's Regulation Agent (RA).

Same tool names/signatures as the Playwright tool set, so RA's prompt and
reasoning loop don't need to change — only the transport underneath differs.
Use this as the DEFAULT for static government pages; fall back to the
Playwright tool set only for agencies confirmed to render content via JS.
"""

from typing import Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup
from langchain_core.tools import tool
from pydantic import BaseModel, Field

# search_tool.py
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from bs4 import BeautifulSoup
import httpx

class SearchInput(BaseModel):
    query: str = Field(description="Search query to find the relevant Sri Lankan government agency page")

@tool("search_government_site", args_schema=SearchInput)
async def search_government_site(query: str) -> str:
    """Search the web for the official Sri Lankan government agency page relevant to
    a citizen's request. Automatically biases toward .gov.lk domains. Returns a list
    of candidate result titles and URLs — does NOT navigate to them. Use navigate_to_page
    on the most promising .gov.lk result afterward."""
    biased_query = f"{query} site:gov.lk"

    async with httpx.AsyncClient(
        timeout=10.0,
        headers={"User-Agent": "Mozilla/5.0 (GovPilotAI/1.0)"},
    ) as client:
        try:
            response = await client.get(
                "https://html.duckduckgo.com/html/",
                params={"q": biased_query},
            )
            soup = BeautifulSoup(response.text, "lxml")
            results = []
            for result in soup.select(".result__a")[:6]:
                title = result.get_text(strip=True)
                href = result.get("href", "")
                if ".gov.lk" in href:
                    results.append((title, href))

            if not results:
                # retry without the site: filter in case it over-restricted
                response = await client.get(
                    "https://html.duckduckgo.com/html/", params={"q": query}
                )
                soup = BeautifulSoup(response.text, "lxml")
                results = [
                    (r.get_text(strip=True), r.get("href", ""))
                    for r in soup.select(".result__a")[:6]
                    if ".gov.lk" in r.get("href", "")
                ]

            if not results:
                return f"No .gov.lk results found for '{query}'. Try rephrasing the search."

            formatted = "\n".join(f"- {t}: {u}" for t, u in results)
            return f"Search results:\n{formatted}"

        except Exception as e:
            return f"Search failed: {str(e)}"


# ── Session management ───────────────────────────────────────────────────

class HttpSession:
    """Lightweight stand-in for a browser session — holds the current
    fetched page (URL + parsed soup) across tool calls within one RA
    invocation. No browser process, just an HTTP client + last response."""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._current_url: Optional[str] = None
        self._current_soup: Optional[BeautifulSoup] = None

    async def start(self):
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=15.0,
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (GovPilotAI/1.0)"},
            )

    async def get_client(self) -> httpx.AsyncClient:
        await self.start()
        return self._client

    def set_page(self, url: str, soup: BeautifulSoup):
        self._current_url = url
        self._current_soup = soup

    def get_page(self) -> tuple[Optional[str], Optional[BeautifulSoup]]:
        return self._current_url, self._current_soup

    async def close(self):
        if self._client:
            await self._client.aclose()
        self._client = None


# Module-level session, bound per RA invocation via bind_http_session().
_session: Optional[HttpSession] = None


def bind_http_session(session: HttpSession):
    """Call this once at the start of each RA agent invocation, before
    the agent runs, so its tool calls operate on a fresh session."""
    global _session
    _session = session


# ── Tools ─────────────────────────────────────────────────────────────────

class NavigateInput(BaseModel):
    url: str = Field(
        description="The exact government agency page URL to navigate to. Must be a .gov.lk domain."
    )


@tool("navigate_to_page", args_schema=NavigateInput)
async def navigate_to_page(url: str) -> str:
    """Fetch a government website page. Read-only — does not submit any forms.
    Returns the page title and HTTP status once loaded."""
    if ".gov.lk" not in url:
        return f"Refused: '{url}' is not a .gov.lk domain. Only official government sites may be navigated to."

    client = await _session.get_client()
    try:
        response = await client.get(url)
        soup = BeautifulSoup(response.text, "lxml")
        _session.set_page(url, soup)
        title = soup.title.string.strip() if soup.title else "(no title)"
        return f"Navigated successfully. Page title: '{title}'. HTTP status: {response.status_code}."
    except Exception as e:
        return f"Navigation failed: {str(e)}"


class ExtractLinksInput(BaseModel):
    keyword: str = Field(
        description="Keyword or phrase to match against link text, e.g. 'Form 1' or 'application'"
    )


@tool("find_links_matching", args_schema=ExtractLinksInput)
async def find_links_matching(keyword: str) -> str:
    """Search the current page for all links whose visible text contains the
    given keyword. Returns matching link text and absolute URLs. Use this to
    locate a specific form's download link after navigating to a page."""
    current_url, soup = _session.get_page()
    if soup is None:
        return "No page loaded yet. Call navigate_to_page first."

    matches = []
    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True)
        if keyword.lower() in text.lower():
            absolute_url = urljoin(current_url, a["href"])
            matches.append((text, absolute_url))

    if not matches:
        return f"No links found matching '{keyword}' on the current page."

    formatted = "\n".join(f"- {text}: {url}" for text, url in matches[:10])
    return f"Found {len(matches)} matching link(s):\n{formatted}"


@tool("get_page_text")
async def get_page_text() -> str:
    """Get the visible text content of the current page, truncated to the
    first 3000 characters. Use this to read page content when link matching
    alone isn't enough to find what you need."""
    _, soup = _session.get_page()
    if soup is None:
        return "No page loaded yet. Call navigate_to_page first."

    text = soup.get_text(separator=" ", strip=True)
    return text[:3000]


class CheckFileInput(BaseModel):
    url: str = Field(description="The URL of a suspected form/download link to verify")


@tool("verify_downloadable_file", args_schema=CheckFileInput)
async def verify_downloadable_file(url: str) -> str:
    """Check whether a URL points to an actual downloadable file (PDF, DOC)
    rather than another HTML page, without downloading the full file. Use
    this to confirm a link is the real form before returning it to the
    citizen."""
    client = await _session.get_client()
    try:
        response = await client.head(url)
        content_type = response.headers.get("content-type", "unknown")

        # Some government servers reject HEAD even when GET works fine —
        # fall back to a range-limited GET if HEAD looks unreliable.
        if content_type == "unknown" or response.status_code >= 400:
            response = await client.get(url, headers={"Range": "bytes=0-1"})
            content_type = response.headers.get("content-type", "unknown")

        is_file = any(ft in content_type for ft in ["pdf", "msword", "officedocument"])
        verdict = (
            "Confirmed downloadable file."
            if is_file
            else "This does NOT appear to be a direct file download — likely another webpage."
        )
        return f"URL responds with content-type '{content_type}'. {verdict}"
    except Exception as e:
        return f"Could not verify URL: {str(e)}"


HTTP_RA_TOOLS = [search_government_site,  navigate_to_page, find_links_matching, get_page_text, verify_downloadable_file]

