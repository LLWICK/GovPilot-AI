# GovPilot AI — Playwright MCP Agent Redesign

> **What changed:** Playwright MCP replaces the static scraper script.  
> Agents now hold a live browser as a tool — they navigate, click, and extract  
> government websites at runtime, not at ingestion time.

---

## What Playwright MCP Actually Is (vs. the scraper you had before)

| | Custom Playwright scraper (old) | Playwright MCP (new) |
|---|---|---|
| When it runs | Once, at ingestion time | At agent tool-call time |
| Who controls it | Your Python code | The LLM agent |
| What it produces | Static FAISS index | Live page content, on demand |
| Can navigate dynamically | Yes, but you hard-code the logic | Yes, the agent decides where to click |
| Requires pre-seeding | Yes | No |

With Playwright MCP, the **Regulation Agent browses government sites the same way a human would** — it navigates, reads pages, follows links to find procedures, and extracts content. The LLM decides where to go based on what it sees.

---

## Architecture Shift

```
BEFORE (static RAG):

  RA ──→ FAISS vector store ──→ regulation chunks
         (pre-built from scraped PDFs)

AFTER (Playwright MCP + hybrid):

  RA ──→ Playwright MCP browser ──→ live government website
          │                          (navigate, read, extract)
          │
          └──→ FAISS (fallback if site unreachable or slow)
```

The FAISS index stays as a **fallback and speed cache**, not the primary source. Fresh government regulation content is fetched live by the agent.

---

## Playwright MCP Setup

```bash
# Install the MCP server
npm install -g @playwright/mcp@latest
playwright install chromium
```

```python
# agents/browser_tools.py
# Wrap Playwright MCP tools as LangChain tools for use inside LangGraph

import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_mcp_adapters.tools import load_mcp_tools
from langchain_core.tools import BaseTool

_browser_tools: list[BaseTool] | None = None
_session: ClientSession | None = None

async def get_browser_tools() -> list[BaseTool]:
    """
    Lazy-initializes Playwright MCP session and returns LangChain-compatible tools.
    Call once at startup; reuse across all agent nodes.
    """
    global _browser_tools, _session

    if _browser_tools is not None:
        return _browser_tools

    server_params = StdioServerParameters(
        command="npx",
        args=["@playwright/mcp@latest", "--headless"],
        env=None
    )

    # Open MCP stdio connection
    read, write = await stdio_client(server_params).__aenter__()
    _session = ClientSession(read, write)
    await _session.initialize()

    # Load all Playwright MCP tools as LangChain tools
    _browser_tools = await load_mcp_tools(_session)
    return _browser_tools

# Convenience: get a specific tool by name
async def get_tool(name: str) -> BaseTool:
    tools = await get_browser_tools()
    return next(t for t in tools if t.name == name)
```

**Available Playwright MCP tools (what your agents can call):**

```
browser_navigate          → go to a URL
browser_click             → click a CSS selector or text match
browser_type              → fill input fields
browser_take_screenshot   → capture current page state
browser_get_text          → extract text from selector or full page
browser_find_element      → check if element exists
browser_scroll            → scroll to reveal content
browser_wait_for_element  → wait for dynamic content to load
browser_hover             → hover over elements (reveals dropdowns)
browser_select_option     → select from dropdowns
```

---

## Redesigned Regulation Agent (RA)

RA is the most changed. It no longer queries FAISS first — it browses live.

```python
# agents/regulation_agent.py  (Playwright MCP version)
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate
from agents.browser_tools import get_browser_tools

llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0)

# Known agency entry points — just root URLs, not specific doc URLs
AGENCY_PORTALS = {
    "business_registration": {
        "primary": "https://www.roc.gov.lk",
        "keywords": ["register", "company", "procedure", "requirements", "forms"]
    },
    "passport": {
        "primary": "https://www.immigration.gov.lk",
        "keywords": ["passport", "apply", "requirements", "documents", "fees"]
    },
    "nic": {
        "primary": "https://www.immigration.gov.lk",
        "keywords": ["national identity", "NIC", "apply", "requirements"]
    },
    "driving_license": {
        "primary": "https://www.motortraffic.gov.lk",
        "keywords": ["driving licence", "license", "apply", "requirements"]
    },
    "tax_registration": {
        "primary": "https://www.ird.gov.lk",
        "keywords": ["registration", "TIN", "taxpayer", "requirements"]
    },
}

RA_SYSTEM_PROMPT = """You are the Regulation Agent for GovPilot AI, a Sri Lankan government service assistant.

Your job:
1. Navigate to the correct government agency website
2. Find the specific page describing requirements for the citizen's service
3. Extract: required documents, eligibility criteria, fees, processing times
4. Assess whether the citizen profile meets the eligibility criteria
5. Return structured findings

You have a live browser. Use it like a human would:
- Start at the agency homepage
- Look for navigation menus: "Services", "How to Apply", "Requirements", "Forms"  
- Click through to the specific service page
- Take a screenshot if you're unsure what's on the page
- Extract the full text of requirement sections

Agency portals: {portals}

Citizen's service request: {service_category}
Citizen profile: {citizen_profile}

Return your findings as JSON with keys:
- regulations: list of extracted regulation text chunks
- required_documents: list with name, mandatory (bool), format
- eligibility: {{eligible: bool, failed_criteria: [], warnings: []}}
- fees: {{amount: str, currency: "LKR", payment_method: str}}
- processing_time: str
- source_url: the exact URL where you found the requirements
"""

async def regulation_agent_node(state: GovPilotState) -> dict:
    intent = state["parsed_intent"]
    service = intent["service_category"]
    citizen_profile = await get_citizen_profile(state["citizen_id"])

    # Load browser tools
    browser_tools = await get_browser_tools()

    # Also load FAISS tool as fallback
    faiss_tool = build_faiss_fallback_tool(service)

    all_tools = browser_tools + [faiss_tool]

    # Build agent that can use browser + FAISS
    prompt = ChatPromptTemplate.from_messages([
        ("system", RA_SYSTEM_PROMPT),
        ("placeholder", "{agent_scratchpad}")
    ])

    agent = create_tool_calling_agent(llm, all_tools, prompt)
    executor = AgentExecutor(
        agent=agent,
        tools=all_tools,
        max_iterations=12,      # enough to: navigate → click → read → extract
        verbose=True,
        handle_parsing_errors=True
    )

    result = await executor.ainvoke({
        "service_category": service,
        "citizen_profile": citizen_profile,
        "portals": AGENCY_PORTALS.get(service, {}),
        "agent_scratchpad": []
    })

    # Parse structured output from agent's final answer
    findings = parse_ra_output(result["output"])

    return {
        "fetched_regulations": findings["regulations"],
        "eligibility": findings["eligibility"],
        "required_docs": findings["required_documents"],
        "regulation_source_url": findings.get("source_url"),
        "next_agent": "citizen_agent"
    }


@tool
def faiss_regulation_fallback(service_category: str) -> list[dict]:
    """
    Fallback: retrieve regulations from pre-indexed FAISS store.
    Use this ONLY if the government website is unreachable or returns no useful content.
    """
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 6, "filter": {"service_type": service_category}}
    )
    docs = retriever.invoke(f"{service_category} requirements Sri Lanka")
    return [{"content": d.page_content, "source": d.metadata.get("source")} for d in docs]

def build_faiss_fallback_tool(service: str):
    return faiss_regulation_fallback
```

**What the RA agent actually does at runtime (example trace for passport):**

```
[RA] browser_navigate("https://www.immigration.gov.lk")
[RA] browser_get_text("nav, .menu")
  → "Home | Services | Passports | Visa | NIC | Contact"
[RA] browser_click("Passports")
[RA] browser_wait_for_element(".content")
[RA] browser_get_text(".content")
  → "Ordinary Passport Requirements: 1. Completed Application Form (PO1)..."
[RA] browser_take_screenshot()   ← if content is unclear
[RA] → LLM extracts structured requirements from raw text
[RA] → returns eligibility assessment + doc list
```

---

## Redesigned Document Intelligence Agent (DA)

DA gains two new Playwright MCP capabilities:
1. Navigate to **e-government portals** to verify documents online (e.g., NIC verification at DRP)
2. Navigate to **online submission portals** to pre-fill and submit applications

```python
# agents/document_agent.py  (Playwright MCP version)
from agents.browser_tools import get_browser_tools

DA_SYSTEM_PROMPT = """You are the Document Intelligence Agent for GovPilot AI.

Your capabilities:
1. LOCAL OCR: Extract text from uploaded document images (EasyOCR tool)
2. LOCAL VALIDATION: Validate format, check expiry, check completeness
3. ONLINE VERIFICATION: Navigate to government portals to verify document authenticity
4. ONLINE SUBMISSION: Navigate to e-gov portals, pre-fill forms with extracted data

For online verification:
- NIC → navigate https://www.drp.gov.lk to verify NIC number
- Business Reg → navigate https://www.roc.gov.lk to verify company registration
- Only verify online if local validation passes first (saves portal load)

For online submission (if citizen consents):
- Navigate to the agency's online application portal
- Fill in form fields using extracted document data
- Take a screenshot of the completed form for citizen review
- DO NOT submit — show citizen the pre-filled form and ask for confirmation

Uploaded documents: {uploaded_docs}
Required documents: {required_docs}
Citizen consent for online submission: {online_submission_consent}
"""

async def document_agent_node(state: GovPilotState) -> dict:
    browser_tools = await get_browser_tools()
    ocr_tools = build_ocr_tools()          # EasyOCR + Tesseract (unchanged)
    validation_tools = build_validation_tools()

    all_tools = ocr_tools + validation_tools + browser_tools

    prompt = ChatPromptTemplate.from_messages([
        ("system", DA_SYSTEM_PROMPT),
        ("placeholder", "{agent_scratchpad}")
    ])

    agent = create_tool_calling_agent(llm, all_tools, prompt)
    executor = AgentExecutor(agent=agent, tools=all_tools, max_iterations=15)

    result = await executor.ainvoke({
        "uploaded_docs": state["uploaded_doc_paths"],
        "required_docs": state["required_docs"],
        "online_submission_consent": state.get("citizen_consents", {}).get("online_submission", False),
        "agent_scratchpad": []
    })

    findings = parse_da_output(result["output"])

    return {
        "ocr_results": findings["ocr_results"],
        "validation_results": findings["validation_results"],
        "online_verification_results": findings.get("online_verifications", []),
        "prefilled_form_screenshot": findings.get("form_screenshot"),
        "next_agent": "citizen_agent"
    }
```

**Example DA trace (NIC + online verification):**

```
[DA] extract_text_from_document("/uploads/nic.jpg")
  → {nic_number: "200216900908", name: "Linal Wickramaarachchi", dob: "2002-..."}
[DA] validate_document(ocr_result, requirement)
  → {valid: true, issues: []}
[DA] browser_navigate("https://www.drp.gov.lk/verify")
[DA] browser_type("#nic_input", "200216900908")
[DA] browser_click("#verify_btn")
[DA] browser_wait_for_element(".result")
[DA] browser_get_text(".result")
  → "NIC 200216900908 — Valid. Holder: L. Wickramaarachchi"
[DA] → online_verification: {authentic: true, source: "DRP portal"}
```

---

## Updated LangGraph Graph

The graph topology stays the same (CA orchestrates), but nodes are now async and agents internally run `AgentExecutor` loops with browser tools.

```python
# agents/graph.py  (updated)
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver  # use Redis in prod

def build_govpilot_graph() -> StateGraph:
    graph = StateGraph(GovPilotState)

    # Nodes — all async now (Playwright MCP is async)
    graph.add_node("citizen_agent",      citizen_agent_node)
    graph.add_node("regulation_agent",   regulation_agent_node)   # ← Playwright MCP
    graph.add_node("document_agent",     document_agent_node)     # ← Playwright MCP
    graph.add_node("workflow_agent",     workflow_agent_node)
    graph.add_node("notification_agent", notification_agent_node)

    graph.set_entry_point("citizen_agent")

    # Routing: CA decides, sub-agents return to CA
    graph.add_conditional_edges(
        "citizen_agent",
        lambda s: s.get("next_agent") or END,
        {
            "regulation_agent":   "regulation_agent",
            "document_agent":     "document_agent",
            "workflow_agent":     "workflow_agent",
            "notification_agent": "notification_agent",
            END: END
        }
    )

    graph.add_edge("regulation_agent",   "citizen_agent")
    graph.add_edge("document_agent",     "citizen_agent")
    graph.add_edge("workflow_agent",     "citizen_agent")
    graph.add_edge("notification_agent", "citizen_agent")

    return graph.compile(checkpointer=MemorySaver())

# Initialize once — browser session stays open across requests
govpilot_graph = build_govpilot_graph()
```

**One critical change in `main.py` — startup event to warm browser:**

```python
# main.py
from agents.browser_tools import get_browser_tools

@app.on_event("startup")
async def startup():
    """
    Pre-initialize Playwright MCP session at startup.
    Avoids cold-start delay on first citizen request.
    """
    await get_browser_tools()
    print("Playwright MCP browser ready")

@app.on_event("shutdown")
async def shutdown():
    """Close browser session cleanly."""
    global _session
    if _session:
        await _session.__aexit__(None, None, None)
```

---

## Updated State Schema Additions

Add these fields to `GovPilotState` to capture browser-sourced data:

```python
class GovPilotState(TypedDict):
    # ... all existing fields ...

    # New fields for Playwright MCP
    regulation_source_url: Optional[str]        # URL where RA found live regulations
    online_verification_results: list[dict]     # DA's portal verification outcomes
    prefilled_form_screenshot: Optional[str]    # path to screenshot of pre-filled e-form
    browser_screenshots: list[str]              # debug screenshots from agent traces
    citizen_consents: dict                      # {"online_submission": bool, "data_sharing": bool}
```

---

## Updated Repository Structure

```
backend/
├── agents/
│   ├── browser_tools.py        ← NEW: Playwright MCP session + tool loader
│   ├── citizen_agent.py        (unchanged)
│   ├── regulation_agent.py     ← REDESIGNED: AgentExecutor + browser tools
│   ├── document_agent.py       ← REDESIGNED: adds browser for online verify/submit
│   ├── workflow_agent.py       (unchanged)
│   ├── notification_agent.py   (unchanged)
│   ├── graph.py                ← updated: async nodes, startup warm-up
│   └── state.py                ← updated: 4 new fields
├── rag/
│   ├── ingest.py               (scraper no longer needed — Playwright MCP handles live fetch)
│   └── faiss_fallback.py       ← RENAMED: FAISS is now fallback only
```

---

## Hybrid Strategy: When to Use Browser vs. FAISS

RA decides this at runtime based on a simple priority chain:

```python
# Inside RA system prompt — instruct the LLM on decision logic:

"""
Decision rule for fetching regulations:

1. ALWAYS try the live government website first (browser_navigate)
2. If the site loads but the page has no relevant content after 2 clicks → try a different navigation path
3. If the site is unreachable (timeout) OR you've spent 5+ browser steps without finding requirements
   → call faiss_regulation_fallback tool and use cached data
4. If FAISS also returns no results → tell the citizen you couldn't find the regulation 
   and provide the agency phone number instead

Never hallucinate regulations. Only report what you actually read from the page or FAISS.
"""
```

---

## Updated Requirements

```bash
# New additions to requirements.txt
langchain-mcp-adapters>=0.1.0
mcp>=1.0.0

# Node.js side (install once)
npm install -g @playwright/mcp@latest
playwright install chromium
```

---

## Hackathon Demo Impact

With Playwright MCP, your demo has a **visible browser loop** — judges can see the agent actually navigating a real government website. This is far more convincing than "we query a vector database."

**What judges see:**
```
Citizen: "I want to register a business"

[Regulation Agent thinking...]
  → Navigating roc.gov.lk...
  → Found "Business Registration Procedures" page
  → Extracting requirements...

✅ Eligibility confirmed
📋 Required documents: NIC, Proof of Address, Name Reservation Letter...
```

**Risk for demo:** Government sites go down or change structure. Mitigation: pre-run the exact demo scenario, cache a screenshot of each page the agent visits, and if the live site fails, serve the cached screenshots transparently. The agent behavior is identical either way.

---

*GovPilot AI — Playwright MCP Agent Redesign · Team Procrastinators · IDEALIZE 2026*
