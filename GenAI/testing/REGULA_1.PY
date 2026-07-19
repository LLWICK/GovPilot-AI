"""
GovPilot AI — Regulation Agent (RA)
=====================================
Autonomously discovers the correct Sri Lankan government agency and its website
from the citizen's service intent alone. No hardcoded URLs.

Flow:
  1. Google search → find official .gov.lk site
  2. Navigate homepage → find requirements page
  3. Extract text + discover PDF links
  4. Download + parse PDFs
  5. LLM-powered eligibility assessment
  6. FAISS fallback if site unreachable

Dependencies:
  pip install langchain langchain-google-genai langchain-community
              langchain-mcp-adapters mcp faiss-cpu httpx pydantic
  npm install -g @playwright/mcp@latest && playwright install chromium
"""

import os
import re
import json
import httpx
import asyncio
import logging
import tempfile
from typing import Optional
from urllib.parse import urlparse, urljoin

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_community.document_loaders import PyPDFLoader
from pydantic import BaseModel, Field

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_mcp_adapters.tools import load_mcp_tools

from agents.state import GovPilotState, DocRequirement, EligibilityResult

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# SECTION 1: Playwright MCP Browser Session
# ──────────────────────────────────────────────────────────────────────────────

class BrowserSession:
    """
    Singleton Playwright MCP session.
    Initialized once at FastAPI startup, reused across all RA invocations.
    """
    _instance: Optional["BrowserSession"] = None
    _tools: list = []
    _client_ctx = None
    _session: Optional[ClientSession] = None

    @classmethod
    async def get_instance(cls) -> "BrowserSession":
        if cls._instance is None:
            cls._instance = BrowserSession()
            await cls._instance._initialize()
        return cls._instance

    async def _initialize(self):
        server_params = StdioServerParameters(
            command="npx",
            args=[
                "@playwright/mcp@latest",
                "--headless",
                "--viewport-size", "1280,900",
                "--user-agent",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ],
            env=None
        )
        self._client_ctx = stdio_client(server_params)
        read, write = await self._client_ctx.__aenter__()
        self._session = ClientSession(read, write)
        await self._session.initialize()
        self._tools = await load_mcp_tools(self._session)
        logger.info(
            f"Playwright MCP ready. Tools: {[t.name for t in self._tools]}"
        )

    def get_tools(self) -> list:
        return self._tools

    def get_tool(self, name: str):
        return next((t for t in self._tools if t.name == name), None)

    async def close(self):
        if self._client_ctx:
            await self._client_ctx.__aexit__(None, None, None)
            BrowserSession._instance = None


# ──────────────────────────────────────────────────────────────────────────────
# SECTION 2: Pydantic Output Models
# ──────────────────────────────────────────────────────────────────────────────

class DocumentRequirement(BaseModel):
    doc_id: str = Field(description="Unique identifier e.g. 'nic', 'birth_cert'")
    doc_name: str = Field(description="Full English name of document")
    doc_name_si: str = Field(description="Sinhala name of document", default="")
    doc_name_ta: str = Field(description="Tamil name of document", default="")
    mandatory: bool = Field(description="Whether document is required (not optional)")
    format: str = Field(
        description="'original' | 'certified_copy' | 'photocopy' | 'any'",
        default="original"
    )
    notes: str = Field(description="Any special notes about the document", default="")


class EligibilityCriteria(BaseModel):
    eligible: bool
    failed_criteria: list[str] = Field(
        description="List of specific criteria the citizen does not meet"
    )
    warnings: list[str] = Field(
        description="Conditions to watch (not disqualifying but important)"
    )
    regulation_refs: list[str] = Field(
        description="Section/clause references from the regulations"
    )


class FeeStructure(BaseModel):
    amount: str = Field(description="Fee amount as string e.g. 'LKR 5,000'")
    currency: str = Field(default="LKR")
    payment_methods: list[str] = Field(
        description="How fees can be paid",
        default=["Bank deposit", "Online payment"]
    )
    notes: str = Field(default="")


class RAOutput(BaseModel):
    discovered_agency: str = Field(
        description="Name of the government agency found"
    )
    source_url: str = Field(
        description="Exact URL where requirements were found"
    )
    pdf_urls: list[str] = Field(
        description="PDF document URLs found on the page",
        default=[]
    )
    regulations: list[dict] = Field(
        description="Extracted regulation text chunks with source"
    )
    required_documents: list[DocumentRequirement]
    eligibility: EligibilityCriteria
    fees: FeeStructure
    processing_time: str = Field(
        description="Expected processing time e.g. '5-7 working days'"
    )
    data_source: str = Field(
        description="'live_web' | 'faiss_fallback'",
        default="live_web"
    )


# ──────────────────────────────────────────────────────────────────────────────
# SECTION 3: Helper Utilities
# ──────────────────────────────────────────────────────────────────────────────

def is_official_gov_url(url: str) -> bool:
    """Only trust .gov.lk domains for Sri Lankan government regulations."""
    try:
        domain = urlparse(url).netloc.lower()
        return domain.endswith(".gov.lk") or domain == "gov.lk"
    except Exception:
        return False


def extract_urls_from_text(text: str, base_url: str = "") -> list[str]:
    """Pull all URLs from raw text (for when get_text returns anchor hrefs inline)."""
    url_pattern = re.compile(r'https?://[^\s\'"<>]+')
    found = url_pattern.findall(text)
    pdf_links = [u for u in found if u.lower().endswith(".pdf")]
    return list(set(pdf_links))


async def download_pdf(url: str, session: httpx.AsyncClient) -> Optional[str]:
    """Download a PDF to a temp file, return local path."""
    try:
        resp = await session.get(url, timeout=20, follow_redirects=True)
        if resp.status_code == 200 and "pdf" in resp.headers.get("content-type", ""):
            suffix = os.path.basename(urlparse(url).path) or "doc.pdf"
            tmp = tempfile.NamedTemporaryFile(
                delete=False, suffix=f"_{suffix}", dir="/tmp"
            )
            tmp.write(resp.content)
            tmp.close()
            logger.info(f"Downloaded PDF: {url} → {tmp.name}")
            return tmp.name
    except Exception as e:
        logger.warning(f"PDF download failed for {url}: {e}")
    return None


async def extract_text_from_pdf(path: str) -> str:
    """Extract text from a downloaded PDF."""
    try:
        loader = PyPDFLoader(path)
        pages = loader.load()
        return "\n".join(p.page_content for p in pages)
    except Exception as e:
        logger.warning(f"PDF text extraction failed for {path}: {e}")
        return ""


# ──────────────────────────────────────────────────────────────────────────────
# SECTION 4: LangChain Tools for the RA Agent
# ──────────────────────────────────────────────────────────────────────────────

@tool
def faiss_regulation_fallback(service_category: str) -> list[dict]:
    """
    Fallback: retrieve cached government regulations from FAISS vector store.

    ONLY use this tool when:
    - The government website is unreachable (timeout / HTTP error)
    - You have navigated the site but found no relevant requirements after 3 attempts
    - The site requires login to access procedures

    Args:
        service_category: The citizen's service type (e.g. 'business_registration')

    Returns:
        List of regulation text chunks from the cached knowledge base.
    """
    faiss_path = os.environ.get("FAISS_INDEX_PATH", "./data/faiss_govregs")

    if not os.path.exists(faiss_path):
        logger.warning("FAISS index not found. Returning empty fallback.")
        return [{"content": "Regulations not available offline.", "source": "none"}]

    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vector_store = FAISS.load_local(
        faiss_path, embeddings, allow_dangerous_deserialization=True
    )
    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 8,
            "filter": {"service_type": service_category}
        }
    )
    query = f"{service_category} requirements documents eligibility Sri Lanka government"
    docs = retriever.invoke(query)

    return [
        {
            "content": d.page_content,
            "source": d.metadata.get("source", "cached"),
            "agency": d.metadata.get("agency", "unknown")
        }
        for d in docs
    ]


# ──────────────────────────────────────────────────────────────────────────────
# SECTION 5: RA Agent Prompts
# ──────────────────────────────────────────────────────────────────────────────

RA_SYSTEM_PROMPT = """You are the Regulation Agent (RA) for GovPilot AI — an AI system that helps
Sri Lankan citizens navigate government services.

You receive a service category and citizen profile. You must discover the correct government
agency and its official website entirely on your own using the browser tools available to you.
You have NO pre-set URLs. Everything must be found through search and navigation.

══════════════════════════════════════════════════════
STEP 1 — DISCOVER THE AGENCY AND OFFICIAL WEBSITE
══════════════════════════════════════════════════════
1. Navigate to https://www.google.com
2. Search for: "{service_category} Sri Lanka official government requirements procedure"
3. Scan the search results. Look for links ending in .gov.lk — these are official.
   Examples of valid domains: roc.gov.lk, immigration.gov.lk, ird.gov.lk, dmv.gov.lk
4. Identify the most relevant .gov.lk result.
5. Navigate to that .gov.lk URL.

CRITICAL RULE: Only extract regulations from .gov.lk domains.
If you cannot find a .gov.lk result, try: "site:.gov.lk {service_category} requirements"
If still nothing, call faiss_regulation_fallback immediately.

══════════════════════════════════════════════════════
STEP 2 — NAVIGATE TO THE REQUIREMENTS PAGE
══════════════════════════════════════════════════════
On the agency website:
1. Read the navigation menu (browser_get_text on nav/header elements)
2. Look for links like: Services | How to Apply | Requirements | Forms | Downloads | Procedures
3. Click the most relevant one for "{service_category}"
4. If the page loads with no relevant content, go BACK and try another nav item
5. Use browser_take_screenshot if you are unsure what's on the page
6. Use browser_scroll to reveal content hidden below the fold
7. Maximum 4 navigation clicks before declaring the site unhelpful

Signs you found the right page:
- Contains words: "requirements", "documents required", "eligibility", "how to apply"
- Lists numbered steps or bullet-pointed document names
- Shows fee tables or processing time information

══════════════════════════════════════════════════════
STEP 3 — EXTRACT CONTENT AND FIND PDFs
══════════════════════════════════════════════════════
1. Extract the full text of the requirements section using browser_get_text
2. Look for PDF links on the page: <a href="...pdf"> elements
3. Note the full URL of any PDF links (application forms, guides, checklists)
   — do NOT navigate to the PDFs yourself, just record their URLs
4. If there is a table of fees, extract it

══════════════════════════════════════════════════════
STEP 4 — ASSESS ELIGIBILITY
══════════════════════════════════════════════════════
Using the extracted regulations and the citizen profile below:
1. Identify each eligibility criterion (age, citizenship, residency, prior registrations etc.)
2. Check each criterion against the citizen profile
3. List any criteria the citizen does NOT meet as failed_criteria
4. List any conditions to watch (not disqualifying but worth noting) as warnings
5. Set eligible=true only if ALL mandatory criteria are met

══════════════════════════════════════════════════════
OUTPUT FORMAT
══════════════════════════════════════════════════════
Return a single JSON object with this exact structure:
{{
  "discovered_agency": "Full agency name",
  "source_url": "https://exact.url.where.you.found.requirements.gov.lk/path",
  "pdf_urls": ["https://...", "https://..."],
  "regulations": [
    {{"content": "extracted text chunk", "source": "url"}}
  ],
  "required_documents": [
    {{
      "doc_id": "nic",
      "doc_name": "National Identity Card",
      "doc_name_si": "ජාතික හැඳුනුම්පත",
      "doc_name_ta": "தேசிய அடையாள அட்டை",
      "mandatory": true,
      "format": "original",
      "notes": ""
    }}
  ],
  "eligibility": {{
    "eligible": true,
    "failed_criteria": [],
    "warnings": [],
    "regulation_refs": ["Section 3(a)", "Schedule II"]
  }},
  "fees": {{
    "amount": "LKR 5,000",
    "currency": "LKR",
    "payment_methods": ["Bank deposit at BOC", "Online via eZ Cash"],
    "notes": ""
  }},
  "processing_time": "5-7 working days",
  "data_source": "live_web"
}}

If you used faiss_regulation_fallback, set data_source to "faiss_fallback".
Never invent or guess document names, fees, or eligibility rules.
Only report what you actually read from the page or FAISS.

══════════════════════════════════════════════════════
CITIZEN CONTEXT
══════════════════════════════════════════════════════
Service requested: {service_category}
Citizen profile:
{citizen_profile}
"""


# ──────────────────────────────────────────────────────────────────────────────
# SECTION 6: Post-Processing — PDF Download + Parse
# ──────────────────────────────────────────────────────────────────────────────

async def enrich_with_pdfs(ra_output: RAOutput) -> RAOutput:
    """
    After the agent finds PDF URLs, download and parse them.
    Appends extracted PDF content to ra_output.regulations.
    """
    if not ra_output.pdf_urls:
        return ra_output

    async with httpx.AsyncClient(
        headers={"User-Agent": "GovPilot-AI/1.0 (+https://govpilot.ai)"},
        follow_redirects=True
    ) as client:
        for pdf_url in ra_output.pdf_urls:
            # Only download from official .gov.lk domains
            if not is_official_gov_url(pdf_url):
                logger.warning(f"Skipping non-gov PDF: {pdf_url}")
                continue

            local_path = await download_pdf(pdf_url, client)
            if local_path:
                text = await extract_text_from_pdf(local_path)
                if text.strip():
                    ra_output.regulations.append({
                        "content": text[:3000],   # cap per PDF to avoid token overflow
                        "source": pdf_url,
                        "type": "pdf"
                    })
                    logger.info(
                        f"Appended {len(text)} chars from PDF: {pdf_url}"
                    )
                # Cleanup temp file
                try:
                    os.unlink(local_path)
                except OSError:
                    pass

    return ra_output


# ──────────────────────────────────────────────────────────────────────────────
# SECTION 7: Output Parser
# ──────────────────────────────────────────────────────────────────────────────

def parse_ra_output(raw_output: str) -> RAOutput:
    """
    Parse the agent's final JSON string into a typed RAOutput.
    Handles cases where the LLM wraps JSON in markdown code fences.
    """
    # Strip markdown fences if present
    cleaned = re.sub(r"```(?:json)?\s*", "", raw_output).strip()
    cleaned = cleaned.rstrip("```").strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"RA output JSON parse failed: {e}\nRaw: {raw_output[:500]}")
        # Return a safe fallback structure
        return RAOutput(
            discovered_agency="Unknown",
            source_url="",
            regulations=[],
            required_documents=[],
            eligibility=EligibilityCriteria(
                eligible=False,
                failed_criteria=["Could not fetch regulations — please try again"],
                warnings=[],
                regulation_refs=[]
            ),
            fees=FeeStructure(amount="Unknown"),
            processing_time="Unknown",
            data_source="error"
        )

    # Coerce required_documents into Pydantic models
    docs = [
        DocumentRequirement(**d) if isinstance(d, dict) else d
        for d in data.get("required_documents", [])
    ]
    eligibility = EligibilityCriteria(**data["eligibility"])
    fees = FeeStructure(**data.get("fees", {"amount": "Unknown"}))

    return RAOutput(
        discovered_agency=data.get("discovered_agency", "Unknown"),
        source_url=data.get("source_url", ""),
        pdf_urls=data.get("pdf_urls", []),
        regulations=data.get("regulations", []),
        required_documents=docs,
        eligibility=eligibility,
        fees=fees,
        processing_time=data.get("processing_time", "Unknown"),
        data_source=data.get("data_source", "live_web")
    )


# ──────────────────────────────────────────────────────────────────────────────
# SECTION 8: Main Regulation Agent Node (LangGraph)
# ──────────────────────────────────────────────────────────────────────────────

async def regulation_agent_node(state: GovPilotState) -> dict:
    """
    LangGraph node for the Regulation Agent.

    Reads:  state["parsed_intent"], state["citizen_id"]
    Writes: state["fetched_regulations"], state["eligibility"],
            state["required_docs"], state["discovered_agency"],
            state["regulation_source_url"], state["next_agent"]
    """
    intent = state["parsed_intent"]
    service_category = intent["service_category"]

    # ── Citizen profile (from DB or session) ─────────────────────────────────
    citizen_profile = await _load_citizen_profile(state.get("citizen_id"))

    logger.info(f"[RA] Starting for service: {service_category}")

    # ── LLM ──────────────────────────────────────────────────────────────────
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        temperature=0,
        max_tokens=4096,
        convert_system_message_to_human=False
    )

    # ── Tools: Playwright MCP browser + FAISS fallback ───────────────────────
    browser_session = await BrowserSession.get_instance()
    browser_tools = browser_session.get_tools()
    all_tools = browser_tools + [faiss_regulation_fallback]

    logger.info(
        f"[RA] Armed with {len(browser_tools)} browser tools + FAISS fallback"
    )

    # ── Build Agent ───────────────────────────────────────────────────────────
    prompt = ChatPromptTemplate.from_messages([
        ("system", RA_SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="agent_scratchpad")
    ])

    agent = create_tool_calling_agent(llm, all_tools, prompt)

    executor = AgentExecutor(
        agent=agent,
        tools=all_tools,
        max_iterations=18,          # Google(2) + navigate(4) + click-through(6) + extract(6)
        max_execution_time=120,     # 2-minute hard cap for hackathon demos
        verbose=True,
        return_intermediate_steps=True,
        handle_parsing_errors=True,
        early_stopping_method="generate"
    )

    # ── Invoke ────────────────────────────────────────────────────────────────
    try:
        result = await executor.ainvoke({
            "service_category": service_category,
            "citizen_profile": json.dumps(citizen_profile, indent=2),
            "agent_scratchpad": []
        })
        raw_output = result.get("output", "")
        intermediate_steps = result.get("intermediate_steps", [])

    except asyncio.TimeoutError:
        logger.error("[RA] Agent timed out — falling back to FAISS")
        fallback_regs = faiss_regulation_fallback.invoke(
            {"service_category": service_category}
        )
        return _build_fallback_state(fallback_regs, service_category)

    except Exception as e:
        logger.error(f"[RA] Agent execution error: {e}")
        return _build_error_state(str(e))

    # ── Parse structured output ───────────────────────────────────────────────
    ra_output = parse_ra_output(raw_output)

    # ── Security: reject any non-.gov.lk source URL ──────────────────────────
    if ra_output.source_url and not is_official_gov_url(ra_output.source_url):
        logger.warning(
            f"[RA] Non-gov source URL rejected: {ra_output.source_url}. "
            "Falling back to FAISS."
        )
        fallback_regs = faiss_regulation_fallback.invoke(
            {"service_category": service_category}
        )
        return _build_fallback_state(fallback_regs, service_category)

    # ── Download + parse any PDFs the agent found ─────────────────────────────
    ra_output = await enrich_with_pdfs(ra_output)

    # ── Debug: log intermediate browser steps ────────────────────────────────
    _log_browser_trace(intermediate_steps)

    logger.info(
        f"[RA] Done. Agency: {ra_output.discovered_agency} | "
        f"Source: {ra_output.source_url} | "
        f"Docs required: {len(ra_output.required_documents)} | "
        f"Eligible: {ra_output.eligibility.eligible} | "
        f"Data: {ra_output.data_source}"
    )

    # ── Convert Pydantic models → plain dicts for LangGraph state ─────────────
    required_docs: list[DocRequirement] = [
        DocRequirement(
            doc_id=d.doc_id,
            doc_name=d.doc_name,
            doc_name_si=d.doc_name_si,
            doc_name_ta=d.doc_name_ta,
            mandatory=d.mandatory,
            format=d.format,
            notes=d.notes
        )
        for d in ra_output.required_documents
    ]

    eligibility: EligibilityResult = {
        "eligible": ra_output.eligibility.eligible,
        "failed_criteria": ra_output.eligibility.failed_criteria,
        "warnings": ra_output.eligibility.warnings,
        "regulation_refs": ra_output.eligibility.regulation_refs
    }

    return {
        "fetched_regulations": ra_output.regulations,
        "eligibility": eligibility,
        "required_docs": required_docs,
        "discovered_agency": ra_output.discovered_agency,
        "regulation_source_url": ra_output.source_url,
        "regulation_fees": ra_output.fees.model_dump(),
        "regulation_processing_time": ra_output.processing_time,
        "regulation_data_source": ra_output.data_source,
        "next_agent": "citizen_agent"
    }


# ──────────────────────────────────────────────────────────────────────────────
# SECTION 9: Helper Functions
# ──────────────────────────────────────────────────────────────────────────────

async def _load_citizen_profile(citizen_id: Optional[str]) -> dict:
    """
    Load citizen profile from DB or return a default demo profile.
    Replace this with your actual DB call.
    """
    if not citizen_id:
        return {
            "age": 25,
            "nationality": "Sri Lankan",
            "nic_available": True,
            "existing_company": False,
            "residency": "Colombo",
            "occupation": "Software Engineer"
        }

    # TODO: replace with actual DB query
    # from db.session import AsyncSessionLocal
    # async with AsyncSessionLocal() as session:
    #     result = await session.execute(select(Citizen).where(Citizen.id == citizen_id))
    #     citizen = result.scalar_one_or_none()
    #     return citizen.to_dict() if citizen else {}

    return {"citizen_id": citizen_id, "profile": "loaded_from_db"}


def _build_fallback_state(fallback_regs: list[dict], service_category: str) -> dict:
    """Return a minimal valid state when live fetch fails and we fall back to FAISS."""
    return {
        "fetched_regulations": fallback_regs,
        "eligibility": {
            "eligible": True,          # assume eligible unless FAISS says otherwise
            "failed_criteria": [],
            "warnings": ["Regulations loaded from cache — may not reflect latest changes"],
            "regulation_refs": []
        },
        "required_docs": [],           # DA will handle specific doc list
        "discovered_agency": "Unknown (cached data)",
        "regulation_source_url": "faiss://local",
        "regulation_data_source": "faiss_fallback",
        "next_agent": "citizen_agent"
    }


def _build_error_state(error_msg: str) -> dict:
    """Return an error state that CA can surface to the citizen."""
    return {
        "fetched_regulations": [],
        "eligibility": {
            "eligible": False,
            "failed_criteria": [],
            "warnings": [],
            "regulation_refs": []
        },
        "required_docs": [],
        "error": f"Regulation Agent failed: {error_msg}",
        "next_agent": "citizen_agent"
    }


def _log_browser_trace(steps: list) -> None:
    """Log each browser tool call the agent made (for debug / transparency)."""
    logger.debug(f"[RA] Browser trace — {len(steps)} steps:")
    for i, (action, result) in enumerate(steps):
        tool_name = getattr(action, "tool", "unknown")
        tool_input = getattr(action, "tool_input", {})
        result_preview = str(result)[:120].replace("\n", " ")
        logger.debug(f"  [{i+1}] {tool_name}({tool_input}) → {result_preview}...")


# ──────────────────────────────────────────────────────────────────────────────
# SECTION 10: Standalone Test Runner
# ──────────────────────────────────────────────────────────────────────────────

async def _test_ra():
    """
    Quick local test — run with: python regulation_agent.py
    Tests business registration in English.
    """
    import sys
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stdout
    )

    # Minimal mock state
    mock_state: GovPilotState = {
        "session_id": "test-001",
        "citizen_id": None,
        "language": "en",
        "messages": [],
        "raw_input": "I want to register a private limited company",
        "parsed_intent": {
            "service_category": "business_registration",
            "target_agency": "",          # RA will discover this
            "urgency": "medium",
            "clarifications_needed": []
        },
        "service_id": None,
        "agency_id": None,
        "fetched_regulations": [],
        "eligibility": None,
        "required_docs": [],
        "uploaded_doc_paths": [],
        "ocr_results": [],
        "validation_results": [],
        "workflow_plan": None,
        "current_step_index": 0,
        "replan_count": 0,
        "notifications_sent": [],
        "pending_appointments": [],
        "next_agent": None,
        "error": None,
        "final_response": None
    }

    print("\n" + "═" * 60)
    print("  GovPilot AI — Regulation Agent Test")
    print("  Service: business_registration")
    print("═" * 60 + "\n")

    result = await regulation_agent_node(mock_state)

    print("\n" + "═" * 60)
    print("  RESULT")
    print("═" * 60)
    print(f"  Agency discovered : {result.get('discovered_agency')}")
    print(f"  Source URL        : {result.get('regulation_source_url')}")
    print(f"  Data source       : {result.get('regulation_data_source')}")
    print(f"  Eligible          : {result.get('eligibility', {}).get('eligible')}")
    print(f"  Docs required     : {len(result.get('required_docs', []))}")
    print(f"  Fees              : {result.get('regulation_fees', {}).get('amount')}")
    print(f"  Processing time   : {result.get('regulation_processing_time')}")

    if result.get("required_docs"):
        print("\n  Required Documents:")
        for doc in result["required_docs"]:
            flag = "✅" if doc["mandatory"] else "⬜"
            print(f"    {flag} {doc['doc_name']} ({doc['format']})")

    if result.get("eligibility", {}).get("failed_criteria"):
        print("\n  Failed Criteria:")
        for c in result["eligibility"]["failed_criteria"]:
            print(f"    ✗ {c}")

    if result.get("eligibility", {}).get("warnings"):
        print("\n  Warnings:")
        for w in result["eligibility"]["warnings"]:
            print(f"    ⚠ {w}")

    # Close browser session
    session = await BrowserSession.get_instance()
    await session.close()

    print("\n" + "═" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(_test_ra())
