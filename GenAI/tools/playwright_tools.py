import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)

from langchain_core.tools import tool
from pydantic import BaseModel, Field
from tools.browser_session import BrowserSession

# session is injected per-request — see wiring below
_session: BrowserSession = None

def bind_session(session: BrowserSession):
    global _session
    _session = session


class NavigateInput(BaseModel):
    url: str = Field(description="The exact government agency page URL to navigate to. Must be a .gov.lk domain.")

@tool("navigate_to_page", args_schema=NavigateInput)
async def navigate_to_page(url: str) -> str:
    """Navigate to a government website page. Read-only — does not submit any forms.
    Returns the page title and status once loaded."""
    if ".gov.lk" not in url:
        return f"Refused: '{url}' is not a .gov.lk domain. Only official government sites may be navigated to."

    page = await _session.get_page()
    try:
        response = await page.goto(url, wait_until="domcontentloaded", timeout=15000)
        title = await page.title()
        status = response.status if response else "unknown"
        return f"Navigated successfully. Page title: '{title}'. HTTP status: {status}."
    except Exception as e:
        return f"Navigation failed: {str(e)}"


class ExtractLinksInput(BaseModel):
    keyword: str = Field(description="Keyword or phrase to match against link text, e.g. 'Form 1' or 'application'")

@tool("find_links_matching", args_schema=ExtractLinksInput)
async def find_links_matching(keyword: str) -> str:
    """Search the current page for all links whose visible text contains the given keyword.
    Returns matching link text and URLs. Use this to locate a specific form's download link
    after navigating to a page."""
    page = await _session.get_page()
    try:
        links = await page.eval_on_selector_all(
            "a",
            """(elements, kw) => elements
                .filter(el => el.innerText.toLowerCase().includes(kw.toLowerCase()))
                .map(el => ({ text: el.innerText.trim(), href: el.href }))
                .filter(l => l.text.length > 0)
            """,
            keyword,
        )
        if not links:
            return f"No links found matching '{keyword}' on the current page."

        formatted = "\n".join(f"- {l['text']}: {l['href']}" for l in links[:10])
        return f"Found {len(links)} matching link(s):\n{formatted}"
    except Exception as e:
        return f"Link search failed: {str(e)}"


@tool("get_page_text")
async def get_page_text() -> str:
    """Get the visible text content of the current page, truncated to the first 3000 characters.
    Use this to read page content when link matching alone isn't enough to find what you need."""
    page = await _session.get_page()
    try:
        text = await page.inner_text("body")
        return text[:3000]
    except Exception as e:
        return f"Failed to read page text: {str(e)}"


class CheckFileInput(BaseModel):
    url: str = Field(description="The URL of a suspected form/download link to verify")

@tool("verify_downloadable_file", args_schema=CheckFileInput)
async def verify_downloadable_file(url: str) -> str:
    """Check whether a URL points to an actual downloadable file (PDF, DOC) rather than
    another HTML page, without downloading the full file. Use this to confirm a link is
    the real form before returning it to the citizen."""
    page = await _session.get_page()
    try:
        response = await page.request.head(url, timeout=10000)
        content_type = response.headers.get("content-type", "unknown")
        is_file = any(ft in content_type for ft in ["pdf", "msword", "officedocument"])
        return f"URL responds with content-type '{content_type}'. {'Confirmed downloadable file.' if is_file else 'This does NOT appear to be a direct file download — likely another webpage.'}"
    except Exception as e:
        return f"Could not verify URL: {str(e)}"


RA_TOOLS = [navigate_to_page, find_links_matching, get_page_text, verify_downloadable_file]

