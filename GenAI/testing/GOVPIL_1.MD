# GovPilot AI — Full Agentic Architecture & Developer Guide

> **Your role:** Agentic AI Integration  
> **Stack:** LangGraph · Gemini/OpenAI · FAISS RAG · EasyOCR · FastAPI · Redis  
> **Context:** IDEALIZE 2026 Hackathon — AIESEC in University of Moratuwa

---

## 1. Proposal Analysis (Your Scope)

### What the proposal commits to

| Commitment | Your responsibility |
|---|---|
| 5 named agents (CA, RA, DA, WA, NA) | Design, implement, wire them |
| Autonomous end-to-end guidance (no human prompting between steps) | LangGraph graph with automatic edge transitions |
| RAG-powered live government regulations | FAISS vector store + retrieval pipeline |
| OCR document validation (EasyOCR + Tesseract) | DA agent tool chain |
| Dynamic document checklist per service | DA agent output |
| Multilingual: Sinhala · Tamil · English | Translation layer inside CA |
| Real-time eligibility checking | RA agent against rule engine |
| Progress tracking & proactive notifications | NA agent event loop |
| LangGraph as orchestration framework | Core graph implementation |

### What the proposal does NOT fully specify (design decisions you own)

- Exact state schema flowing between agents
- How agents hand off (edges vs tool calls)
- Supervisor vs peer-to-peer topology
- Memory architecture (short-term vs long-term)
- Async execution model
- Fallback/error handling policy
- How LangGraph integrates with FastAPI/WebSocket

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│   Chat UI  │  Doc Upload  │  Progress Tracker  │  Notification   │
└───────────────────────┬─────────────────────────────────────────┘
                        │ REST + WebSocket
┌───────────────────────▼─────────────────────────────────────────┐
│                    FASTAPI BACKEND                                │
│  /chat  /upload  /status  /ws/{session_id}                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              LANGGRAPH AGENT RUNTIME                      │    │
│  │                                                           │    │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐             │    │
│  │   │Citizen  │───▶│Regulat. │───▶│Document │             │    │
│  │   │Agent(CA)│    │Agent(RA)│    │Agent(DA)│             │    │
│  │   │(Orchest)│◀───│         │◀───│         │             │    │
│  │   └────┬────┘    └─────────┘    └─────────┘             │    │
│  │        │                                                  │    │
│  │   ┌────▼────┐    ┌─────────┐                             │    │
│  │   │Workflow │    │Notific. │                             │    │
│  │   │Agent(WA)│    │Agent(NA)│                             │    │
│  │   │         │───▶│         │                             │    │
│  │   └─────────┘    └─────────┘                             │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  Redis   │  │PostgreSQL│  │  FAISS   │  │  File Store  │    │
│  │(Session) │  │(CitizenDB│  │(VectorDB)│  │  (Uploads)   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Orchestration pattern:** Supervisor with conditional routing. CA is the supervisor. It decides which sub-agent(s) to invoke based on the current state. Sub-agents complete their tool calls and return results to CA. CA synthesizes and continues.

---

## 3. LangGraph State Schema

This is the most critical design decision. Every agent reads from and writes to this shared state object.

```python
# agents/state.py
from typing import TypedDict, Literal, Optional, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage
import operator

class IntentModel(TypedDict):
    service_category: str          # "business_registration" | "passport" | "pension" | etc.
    target_agency: str             # "Registrar of Companies" | "Dept of Immigration" | etc.
    urgency: Literal["low", "medium", "high"]
    clarifications_needed: list[str]

class DocRequirement(TypedDict):
    doc_id: str
    doc_name: str                  # "National Identity Card"
    doc_name_si: str               # Sinhala name
    doc_name_ta: str               # Tamil name
    mandatory: bool
    format: str                    # "original" | "copy" | "certified_copy"
    notes: str

class OCRResult(TypedDict):
    doc_id: str
    extracted_text: str
    confidence: float
    extracted_fields: dict         # {"name": "...", "nic_number": "..."}
    language_detected: str

class ValidationResult(TypedDict):
    doc_id: str
    valid: bool
    issues: list[str]
    authenticity_score: float

class WorkflowStep(TypedDict):
    step_id: str
    step_name: str
    agency: str
    dependencies: list[str]        # step_ids that must complete first
    status: Literal["pending", "in_progress", "completed", "failed"]
    estimated_days: int

class WorkflowPlan(TypedDict):
    plan_id: str
    total_steps: int
    steps: list[WorkflowStep]
    critical_path: list[str]       # ordered step_ids on critical path
    estimated_total_days: int

class EligibilityResult(TypedDict):
    eligible: bool
    failed_criteria: list[str]
    warnings: list[str]
    regulation_refs: list[str]

class GovPilotState(TypedDict):
    # ── Identity ──────────────────────────────────────────────────
    session_id: str
    citizen_id: Optional[str]
    language: Literal["si", "ta", "en"]

    # ── Conversation ──────────────────────────────────────────────
    messages: Annotated[list[BaseMessage], add_messages]

    # ── Intent & Service ─────────────────────────────────────────
    raw_input: str
    parsed_intent: Optional[IntentModel]
    service_id: Optional[str]
    agency_id: Optional[str]

    # ── Regulation & Eligibility ─────────────────────────────────
    fetched_regulations: list[dict]    # raw chunks from FAISS
    eligibility: Optional[EligibilityResult]

    # ── Documents ─────────────────────────────────────────────────
    required_docs: list[DocRequirement]
    uploaded_doc_paths: list[str]
    ocr_results: list[OCRResult]
    validation_results: list[ValidationResult]

    # ── Workflow ──────────────────────────────────────────────────
    workflow_plan: Optional[WorkflowPlan]
    current_step_index: int
    replan_count: int               # guard against infinite re-planning

    # ── Notifications ─────────────────────────────────────────────
    notifications_sent: Annotated[list[dict], operator.add]
    pending_appointments: list[dict]

    # ── Control Flow ─────────────────────────────────────────────
    next_agent: Optional[str]       # CA sets this to route
    error: Optional[str]
    final_response: Optional[str]   # multilingual response to citizen
```

---

## 4. The Five Agents — Detailed Design

### 4.1 Citizen Agent (CA) — The Orchestrator

CA is the only node connected to the frontend. It receives every message, understands intent, routes to sub-agents, and composes the final response in the citizen's language.

```python
# agents/citizen_agent.py
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1)

# Intent classification prompt — runs on first message
INTENT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are GovPilot AI, an assistant for Sri Lankan government services.
    
    Classify the citizen's request into:
    - service_category: one of [business_registration, passport, nic, driving_license, 
      birth_certificate, marriage_certificate, pension, university_enrollment, 
      land_registration, vehicle_registration, tax_registration, other]
    - target_agency: the most likely government department
    - urgency: low/medium/high
    - clarifications_needed: list of questions to ask if intent is unclear (max 2)
    
    Respond ONLY with valid JSON.
    Current language: {language}"""),
    ("human", "{input}")
])

# Translation prompt — wraps any agent output into citizen's language
TRANSLATE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """Translate and adapt the following government service guidance into {language}.
    - si: Sinhala (සිංහල)
    - ta: Tamil (தமிழ்)  
    - en: English
    
    Keep all document names, agency names, and deadlines exactly as stated.
    Be clear, simple, and reassuring in tone. Avoid bureaucratic jargon."""),
    ("human", "{content}")
])

def citizen_agent_node(state: GovPilotState) -> dict:
    """
    Responsibilities:
    1. Detect language of incoming message
    2. Parse intent (first message) or continue conversation
    3. Decide which sub-agent to invoke next
    4. After sub-agents complete, compose multilingual response
    """
    last_message = state["messages"][-1].content
    
    # Step 1: Detect language if not set
    language = state.get("language") or detect_language(last_message)
    
    # Step 2: Parse intent if not yet done
    if not state.get("parsed_intent"):
        chain = INTENT_PROMPT | llm | JsonOutputParser()
        intent = chain.invoke({"input": last_message, "language": language})
        
        # If clarifications needed, ask and wait (return to user)
        if intent.get("clarifications_needed"):
            question = intent["clarifications_needed"][0]
            translated_q = translate_to_language(question, language)
            return {
                "language": language,
                "parsed_intent": intent,
                "next_agent": None,   # wait for user reply
                "final_response": translated_q
            }
        
        return {
            "language": language,
            "parsed_intent": intent,
            "next_agent": "regulation_agent"  # start the pipeline
        }
    
    # Step 3: Route based on what's been completed
    return route_to_next_agent(state)


def route_to_next_agent(state: GovPilotState) -> dict:
    """Determines the next agent in the pipeline."""
    
    # No eligibility check yet → Regulation Agent
    if not state.get("eligibility"):
        return {"next_agent": "regulation_agent"}
    
    # Not eligible → stop and explain
    if not state["eligibility"]["eligible"]:
        response = compose_ineligibility_explanation(state)
        return {"next_agent": None, "final_response": response}
    
    # Documents not validated yet → Document Agent
    if state.get("uploaded_doc_paths") and not state.get("validation_results"):
        return {"next_agent": "document_agent"}
    
    # No workflow plan yet → Workflow Agent
    if not state.get("workflow_plan"):
        return {"next_agent": "workflow_agent"}
    
    # Workflow exists, trigger notifications
    if state.get("workflow_plan") and not state.get("notifications_sent"):
        return {"next_agent": "notification_agent"}
    
    # All done — compose final guidance
    response = compose_final_guidance(state)
    return {"next_agent": None, "final_response": response}
```

**Language detection:**
```python
# utils/language.py
from langdetect import detect

SINHALA_CHARS = set("අආඇඈඉඊඋඌඑඒඔඕකඛගඝඞචඡජඣඤටඨඩඪෆ")

def detect_language(text: str) -> str:
    # Check for Sinhala Unicode block
    if any(c in SINHALA_CHARS for c in text):
        return "si"
    try:
        lang = detect(text)
        if lang == "ta":
            return "ta"
    except:
        pass
    return "en"
```

---

### 4.2 Regulation Agent (RA) — RAG + Eligibility

```python
# agents/regulation_agent.py
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.retrievers import BM25Retriever, EnsembleRetriever
from langchain_core.tools import tool

embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
vector_store = FAISS.load_local("./data/faiss_govregs", embeddings)

# Hybrid retriever: 60% semantic + 40% keyword
semantic_retriever = vector_store.as_retriever(
    search_kwargs={"k": 8, "filter": None}  # filter by agency at query time
)
# BM25 over same documents (loaded separately)
bm25_retriever = BM25Retriever.from_documents(gov_docs, k=8)
ensemble_retriever = EnsembleRetriever(
    retrievers=[semantic_retriever, bm25_retriever],
    weights=[0.6, 0.4]
)

@tool
def search_regulations(service_category: str, agency: str) -> list[dict]:
    """Retrieve relevant government regulations for the given service."""
    query = f"{service_category} requirements {agency} Sri Lanka"
    docs = ensemble_retriever.invoke(
        query,
        config={"metadata_filter": {"agency": agency}}
    )
    return [{"content": d.page_content, "source": d.metadata["source"]} for d in docs]

@tool  
def check_eligibility(
    service_category: str,
    citizen_profile: dict,
    regulations: list[dict]
) -> EligibilityResult:
    """Assess citizen eligibility against fetched regulation rules."""
    prompt = f"""
    Service: {service_category}
    
    Regulations:
    {chr(10).join([r['content'] for r in regulations])}
    
    Citizen Profile:
    {citizen_profile}
    
    Determine if the citizen is eligible. Return JSON with:
    - eligible: bool
    - failed_criteria: list of specific criteria not met
    - warnings: list of conditions to watch out for
    - regulation_refs: list of regulation section references
    """
    result = llm.invoke(prompt)
    return JsonOutputParser().parse(result.content)

@tool
def get_required_documents(service_category: str, agency: str) -> list[DocRequirement]:
    """Extract required document list from regulations."""
    docs = search_regulations(service_category, agency)
    # Use LLM to extract structured document requirements
    prompt = f"""
    Extract the complete list of required documents for {service_category} at {agency}.
    From these regulations: {docs}
    
    Return JSON array. Each item has:
    - doc_id, doc_name, doc_name_si, doc_name_ta, mandatory (bool), format, notes
    """
    result = llm.invoke(prompt)
    return JsonOutputParser().parse(result.content)

def regulation_agent_node(state: GovPilotState) -> dict:
    intent = state["parsed_intent"]
    citizen_profile = get_citizen_profile(state["citizen_id"])
    
    # Tool call sequence
    regulations = search_regulations.invoke({
        "service_category": intent["service_category"],
        "agency": intent["target_agency"]
    })
    
    eligibility = check_eligibility.invoke({
        "service_category": intent["service_category"],
        "citizen_profile": citizen_profile,
        "regulations": regulations
    })
    
    required_docs = []
    if eligibility["eligible"]:
        required_docs = get_required_documents.invoke({
            "service_category": intent["service_category"],
            "agency": intent["target_agency"]
        })
    
    return {
        "fetched_regulations": regulations,
        "eligibility": eligibility,
        "required_docs": required_docs,
        "next_agent": "citizen_agent"  # return control to orchestrator
    }
```

---

### 4.3 Document Intelligence Agent (DA)

```python
# agents/document_agent.py
import easyocr
import pytesseract
from PIL import Image
import cv2
import numpy as np
from langchain_core.tools import tool

# Initialize EasyOCR with all three languages
reader = easyocr.Reader(
    ['si', 'ta', 'en'],
    gpu=False,              # set True if GPU available at hackathon
    model_storage_directory='./models/easyocr'
)

@tool
def extract_text_from_document(file_path: str) -> OCRResult:
    """
    Extract text from uploaded document using EasyOCR + Tesseract fallback.
    Handles NIC, Passport, Birth Cert, Utility Bills, etc.
    """
    img = cv2.imread(file_path)
    
    # Preprocessing pipeline for better OCR
    img = preprocess_image(img)
    
    # Primary: EasyOCR
    results = reader.readtext(img, detail=1, paragraph=False)
    confidence = np.mean([r[2] for r in results]) if results else 0.0
    extracted_text = " ".join([r[1] for r in results])
    
    # Fallback: Tesseract if confidence < 0.7
    if confidence < 0.7:
        pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        # Sinhala + Tamil + English
        tess_config = '--oem 3 --psm 6 -l sin+tam+eng'
        extracted_text = pytesseract.image_to_string(pil_img, config=tess_config)
        confidence = 0.65  # estimate for tesseract
    
    # Extract structured fields using LLM
    doc_type = classify_document_type(extracted_text)
    extracted_fields = extract_fields_by_type(extracted_text, doc_type)
    
    return {
        "doc_id": os.path.basename(file_path),
        "extracted_text": extracted_text,
        "confidence": float(confidence),
        "extracted_fields": extracted_fields,
        "language_detected": detect_language(extracted_text)
    }

def preprocess_image(img):
    """Standard preprocessing for government document OCR."""
    # Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Deskew
    gray = deskew(gray)
    # Denoise
    gray = cv2.fastNlMeansDenoising(gray, h=10)
    # Adaptive threshold for text contrast
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    # Scale up small documents
    h, w = thresh.shape
    if h < 600:
        thresh = cv2.resize(thresh, (w*2, h*2))
    return thresh

@tool
def validate_document(
    ocr_result: OCRResult,
    doc_requirement: DocRequirement
) -> ValidationResult:
    """
    Validate extracted document against expected format and required fields.
    Checks: field completeness, format patterns (NIC format, dates), expiry.
    """
    issues = []
    score = 1.0
    
    # NIC-specific validation
    if "nic" in doc_requirement["doc_id"].lower():
        nic = ocr_result["extracted_fields"].get("nic_number", "")
        if not validate_nic_format(nic):
            issues.append("NIC number format is invalid")
            score -= 0.3
    
    # Passport expiry check
    if "passport" in doc_requirement["doc_id"].lower():
        expiry = ocr_result["extracted_fields"].get("expiry_date")
        if expiry and is_expired(expiry):
            issues.append("Passport is expired")
            score -= 0.5
    
    # Low OCR confidence
    if ocr_result["confidence"] < 0.6:
        issues.append("Document image is unclear — please re-upload with better lighting")
        score -= 0.2
    
    # LLM-based authenticity check
    auth_check = llm_authenticity_check(ocr_result["extracted_text"], doc_requirement)
    if not auth_check["authentic"]:
        issues.extend(auth_check["issues"])
        score -= 0.3
    
    return {
        "doc_id": ocr_result["doc_id"],
        "valid": len(issues) == 0 and score >= 0.7,
        "issues": issues,
        "authenticity_score": max(0.0, score)
    }

@tool
def generate_doc_checklist(
    required_docs: list[DocRequirement],
    uploaded_docs: list[str],
    validation_results: list[ValidationResult]
) -> dict:
    """Generate current checklist status showing what's done and what's missing."""
    validated_ids = {v["doc_id"] for v in validation_results if v["valid"]}
    uploaded_ids = {os.path.basename(p) for p in uploaded_docs}
    
    checklist = []
    for doc in required_docs:
        checklist.append({
            "doc_id": doc["doc_id"],
            "doc_name": doc["doc_name"],
            "mandatory": doc["mandatory"],
            "uploaded": doc["doc_id"] in uploaded_ids,
            "validated": doc["doc_id"] in validated_ids,
            "status": (
                "validated" if doc["doc_id"] in validated_ids else
                "uploaded_pending_validation" if doc["doc_id"] in uploaded_ids else
                "missing"
            )
        })
    
    all_mandatory_valid = all(
        item["validated"] for item in checklist if item["mandatory"]
    )
    
    return {"checklist": checklist, "ready_to_submit": all_mandatory_valid}

def document_agent_node(state: GovPilotState) -> dict:
    ocr_results = []
    validation_results = []
    
    for path in state["uploaded_doc_paths"]:
        ocr = extract_text_from_document.invoke({"file_path": path})
        ocr_results.append(ocr)
        
        # Find corresponding doc requirement
        doc_req = find_matching_requirement(ocr, state["required_docs"])
        if doc_req:
            validation = validate_document.invoke({
                "ocr_result": ocr,
                "doc_requirement": doc_req
            })
            validation_results.append(validation)
    
    checklist = generate_doc_checklist.invoke({
        "required_docs": state["required_docs"],
        "uploaded_docs": state["uploaded_doc_paths"],
        "validation_results": validation_results
    })
    
    return {
        "ocr_results": ocr_results,
        "validation_results": validation_results,
        "doc_checklist": checklist,
        "next_agent": "citizen_agent"
    }
```

---

### 4.4 Workflow Planning Agent (WA)

```python
# agents/workflow_agent.py
from langchain_core.tools import tool
import json

# Service → multi-agency workflow templates
# These are seeded from scraped government procedure data
WORKFLOW_TEMPLATES = {
    "business_registration": [
        {"step_id": "s1", "step_name": "Name Reservation", "agency": "Registrar of Companies", 
         "dependencies": [], "estimated_days": 1},
        {"step_id": "s2", "step_name": "Tax Registration (TIN)", "agency": "IRD",
         "dependencies": ["s1"], "estimated_days": 3},
        {"step_id": "s3", "step_name": "Business Registration Certificate", 
         "agency": "Registrar of Companies", "dependencies": ["s2"], "estimated_days": 5},
        {"step_id": "s4", "step_name": "SVT Registration (if applicable)", "agency": "IRD",
         "dependencies": ["s3"], "estimated_days": 7},
        {"step_id": "s5", "step_name": "Local Authority Trade License", 
         "agency": "Local Government", "dependencies": ["s3"], "estimated_days": 14},
    ],
    "passport": [
        {"step_id": "s1", "step_name": "Online Application (ePassport portal)", 
         "agency": "Dept of Immigration", "dependencies": [], "estimated_days": 0},
        {"step_id": "s2", "step_name": "Payment of Fees", 
         "agency": "Bank of Ceylon", "dependencies": ["s1"], "estimated_days": 1},
        {"step_id": "s3", "step_name": "Appointment at Immigration Office", 
         "agency": "Dept of Immigration", "dependencies": ["s2"], "estimated_days": 3},
        {"step_id": "s4", "step_name": "Biometric Collection", 
         "agency": "Dept of Immigration", "dependencies": ["s3"], "estimated_days": 0},
        {"step_id": "s5", "step_name": "Passport Collection or Delivery", 
         "agency": "Dept of Immigration", "dependencies": ["s4"], "estimated_days": 10},
    ],
    # Add more service templates...
}

@tool
def create_workflow_plan(
    service_category: str,
    eligibility: dict,
    doc_validation_results: list[dict]
) -> WorkflowPlan:
    """
    Build a concrete step-by-step workflow plan.
    Prunes steps based on eligibility exceptions and doc status.
    Uses LLM to handle novel services not in templates.
    """
    template = WORKFLOW_TEMPLATES.get(service_category)
    
    if template:
        steps = template.copy()
    else:
        # LLM generates plan for unknown services
        prompt = f"""
        Create a step-by-step workflow plan for: {service_category}
        in Sri Lanka's government service system.
        
        Return JSON array of steps, each with:
        step_id, step_name, agency, dependencies (list of step_ids), estimated_days
        """
        steps = JsonOutputParser().parse(llm.invoke(prompt).content)
    
    # Calculate critical path (longest path through DAG)
    critical_path = compute_critical_path(steps)
    total_days = sum(
        s["estimated_days"] for s in steps if s["step_id"] in critical_path
    )
    
    return {
        "plan_id": generate_plan_id(),
        "total_steps": len(steps),
        "steps": steps,
        "critical_path": critical_path,
        "estimated_total_days": total_days
    }

@tool
def replan_on_rejection(
    current_plan: WorkflowPlan,
    failed_step_id: str,
    rejection_reason: str,
    replan_count: int
) -> WorkflowPlan:
    """
    Autonomously re-plans workflow when a step is rejected.
    Uses LLM to understand rejection reason and insert corrective steps.
    """
    if replan_count >= 3:
        raise ValueError("Max re-planning attempts exceeded. Manual review required.")
    
    prompt = f"""
    A government service step was rejected.
    
    Failed step: {failed_step_id}
    Reason: {rejection_reason}
    Current plan steps: {json.dumps(current_plan['steps'], indent=2)}
    
    Modify the plan to handle this rejection. Options:
    1. Insert a corrective step before the failed step
    2. Replace the failed step with alternative approach
    3. Add parallel steps from a different agency
    
    Return the modified steps array as JSON.
    """
    new_steps = JsonOutputParser().parse(llm.invoke(prompt).content)
    
    # Rebuild plan
    critical_path = compute_critical_path(new_steps)
    return {
        **current_plan,
        "steps": new_steps,
        "critical_path": critical_path,
        "estimated_total_days": sum(
            s["estimated_days"] for s in new_steps if s["step_id"] in critical_path
        )
    }

def workflow_agent_node(state: GovPilotState) -> dict:
    if state.get("replan_count", 0) > 0 and state.get("workflow_plan"):
        # Re-planning scenario
        failed_step = get_current_failed_step(state)
        new_plan = replan_on_rejection.invoke({
            "current_plan": state["workflow_plan"],
            "failed_step_id": failed_step["step_id"],
            "rejection_reason": state.get("error", "unknown"),
            "replan_count": state["replan_count"]
        })
        return {
            "workflow_plan": new_plan,
            "replan_count": state["replan_count"] + 1,
            "next_agent": "notification_agent"
        }
    
    plan = create_workflow_plan.invoke({
        "service_category": state["parsed_intent"]["service_category"],
        "eligibility": state["eligibility"],
        "doc_validation_results": state.get("validation_results", [])
    })
    
    return {
        "workflow_plan": plan,
        "current_step_index": 0,
        "next_agent": "notification_agent"
    }
```

---

### 4.5 Notification Agent (NA)

```python
# agents/notification_agent.py
from twilio.rest import Client as TwilioClient
import sendgrid
from langchain_core.tools import tool
import asyncio

twilio = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
sg = sendgrid.SendGridAPIClient(SENDGRID_API_KEY)

@tool
def send_sms(phone: str, message: str, language: str) -> dict:
    """Send SMS notification. Translates to citizen's language first."""
    translated = translate_to_language(message, language)
    msg = twilio.messages.create(
        body=translated,
        from_=TWILIO_PHONE_NUMBER,
        to=phone
    )
    return {"sid": msg.sid, "status": msg.status}

@tool
def send_email(email: str, subject: str, body: str, language: str) -> dict:
    """Send email with workflow summary and next steps."""
    translated_body = translate_to_language(body, language)
    # sendgrid send logic...
    return {"status": "sent"}

@tool
def schedule_appointment(
    agency: str,
    service_type: str,
    citizen_id: str,
    preferred_date: str
) -> dict:
    """
    Schedule appointment at government office.
    For hackathon: mock this with a confirmation code generator.
    Production: integrate with each agency's booking API.
    """
    # MVP: generate confirmation and store in DB
    confirmation_code = generate_confirmation_code(agency, service_type)
    
    appointment = {
        "confirmation_code": confirmation_code,
        "agency": agency,
        "service_type": service_type,
        "date": preferred_date,
        "citizen_id": citizen_id,
        "status": "confirmed"
    }
    
    # Store in PostgreSQL
    db.appointments.insert(appointment)
    return appointment

@tool
def check_milestones_and_escalate(
    workflow_plan: WorkflowPlan,
    current_step_index: int,
    deadlines_exceeded: list[str]
) -> list[dict]:
    """
    Check if any steps exceeded expected time. Auto-escalate without human prompting.
    """
    alerts = []
    for step_id in deadlines_exceeded:
        step = next(s for s in workflow_plan["steps"] if s["step_id"] == step_id)
        alerts.append({
            "type": "deadline_exceeded",
            "step_id": step_id,
            "agency": step["agency"],
            "action": "escalate",
            "message": f"Step '{step['step_name']}' at {step['agency']} has exceeded expected time."
        })
    return alerts

def notification_agent_node(state: GovPilotState) -> dict:
    citizen = get_citizen_profile(state["citizen_id"])
    plan = state["workflow_plan"]
    notifications = []
    appointments = []
    
    # Notify about workflow start
    summary = build_workflow_summary(plan, state["language"])
    
    sms_result = send_sms.invoke({
        "phone": citizen["phone"],
        "message": summary,
        "language": state["language"]
    })
    notifications.append(sms_result)
    
    email_result = send_email.invoke({
        "email": citizen["email"],
        "subject": "GovPilot AI — Your Service Plan",
        "body": summary,
        "language": state["language"]
    })
    notifications.append(email_result)
    
    # Schedule appointments for steps requiring office visit
    for step in plan["steps"]:
        if requires_in_person_visit(step):
            appt = schedule_appointment.invoke({
                "agency": step["agency"],
                "service_type": state["parsed_intent"]["service_category"],
                "citizen_id": state["citizen_id"],
                "preferred_date": compute_suggested_date(step)
            })
            appointments.append(appt)
    
    return {
        "notifications_sent": notifications,
        "pending_appointments": appointments,
        "next_agent": "citizen_agent"  # return to compose final response
    }
```

---

## 5. LangGraph Graph Construction

```python
# agents/graph.py
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.redis import RedisSaver

def build_govpilot_graph() -> StateGraph:
    graph = StateGraph(GovPilotState)
    
    # Add nodes
    graph.add_node("citizen_agent", citizen_agent_node)
    graph.add_node("regulation_agent", regulation_agent_node)
    graph.add_node("document_agent", document_agent_node)
    graph.add_node("workflow_agent", workflow_agent_node)
    graph.add_node("notification_agent", notification_agent_node)
    
    # Entry point
    graph.set_entry_point("citizen_agent")
    
    # Conditional routing from CA
    graph.add_conditional_edges(
        "citizen_agent",
        lambda state: state.get("next_agent") or END,
        {
            "regulation_agent": "regulation_agent",
            "document_agent": "document_agent",
            "workflow_agent": "workflow_agent",
            "notification_agent": "notification_agent",
            END: END
        }
    )
    
    # All sub-agents return to CA
    graph.add_edge("regulation_agent", "citizen_agent")
    graph.add_edge("document_agent", "citizen_agent")
    graph.add_edge("workflow_agent", "citizen_agent")
    graph.add_edge("notification_agent", "citizen_agent")
    
    # Persistence with Redis (enables session resume)
    checkpointer = RedisSaver.from_conn_string(REDIS_URL)
    
    return graph.compile(checkpointer=checkpointer)

# Singleton — reuse across requests
govpilot_graph = build_govpilot_graph()
```

### Graph execution flow (visual)

```
[START]
   │
   ▼
[Citizen Agent] ──→ no intent yet? ──→ ask clarification → [END wait for user]
   │
   │ parsed intent
   ▼
[Citizen Agent] ──→ next_agent="regulation_agent"
   │
   ▼
[Regulation Agent] → fetch regs → check eligibility → get doc list → return to CA
   │
   ▼
[Citizen Agent] ──→ ineligible? → [END explain why]
   │ eligible
   │
   │ user uploads docs?
   ▼
[Document Agent] → OCR → validate → checklist → return to CA
   │
   ▼
[Citizen Agent] ──→ next_agent="workflow_agent"
   │
   ▼
[Workflow Agent] → create plan → (replan if needed) → return to CA
   │
   ▼
[Citizen Agent] ──→ next_agent="notification_agent"
   │
   ▼
[Notification Agent] → SMS + email → schedule appointments → return to CA
   │
   ▼
[Citizen Agent] ──→ next_agent=END
   │
   ▼
[END] → final_response delivered to user via WebSocket
```

---

## 6. RAG Pipeline — Government Regulations Knowledge Base

### 6.1 Data Ingestion

```python
# rag/ingest.py
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Government regulation sources (scrape these for the hackathon)
REGULATION_SOURCES = [
    # PDFs from official sites
    "https://www.roc.gov.lk/web/images/pdf/procedures.pdf",
    "https://www.immigration.gov.lk/web/images/pdf/requirements.pdf",
    # Add more: IRD, DMT, Births/Deaths/Marriages, etc.
]

# Metadata taxonomy — critical for filtered retrieval
AGENCY_METADATA = {
    "Registrar of Companies": {"agency_code": "ROC", "service_types": ["business_registration"]},
    "Dept of Immigration": {"agency_code": "DOIE", "service_types": ["passport", "visa", "nic"]},
    "IRD": {"agency_code": "IRD", "service_types": ["tax_registration", "svt"]},
    # ...
}

def ingest_regulations():
    all_docs = []
    
    for url in REGULATION_SOURCES:
        loader = WebBaseLoader(url) if url.endswith('.html') else PyPDFLoader(url)
        docs = loader.load()
        
        # Tag with metadata
        agency = infer_agency_from_url(url)
        for doc in docs:
            doc.metadata.update({
                "agency": agency,
                "agency_code": AGENCY_METADATA[agency]["agency_code"],
                "service_types": AGENCY_METADATA[agency]["service_types"],
                "source_url": url,
                "ingested_at": datetime.utcnow().isoformat()
            })
        
        all_docs.extend(docs)
    
    # Chunking strategy: by section (government docs have clear sections)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        separators=["\n## ", "\n### ", "\n\n", "\n", " "]
    )
    chunks = splitter.split_documents(all_docs)
    
    # Build FAISS index
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vector_store = FAISS.from_documents(chunks, embeddings)
    vector_store.save_local("./data/faiss_govregs")
    
    print(f"Ingested {len(chunks)} regulation chunks into FAISS")

# Run once before hackathon demo
if __name__ == "__main__":
    ingest_regulations()
```

### 6.2 Retrieval with metadata filtering

```python
# rag/retriever.py
def get_filtered_retriever(agency: str = None, service_type: str = None):
    """Returns retriever scoped to specific agency or service type."""
    filter_dict = {}
    if agency:
        filter_dict["agency"] = agency
    if service_type:
        filter_dict["service_types"] = {"$in": [service_type]}
    
    return vector_store.as_retriever(
        search_type="mmr",              # Maximal Marginal Relevance — reduces redundancy
        search_kwargs={"k": 6, "filter": filter_dict if filter_dict else None}
    )
```

---

## 7. FastAPI + WebSocket Integration

```python
# main.py
from fastapi import FastAPI, WebSocket, UploadFile
from langgraph.types import Command
import asyncio, uuid, json

app = FastAPI(title="GovPilot AI Backend")

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "message":
                # Run agent graph asynchronously, stream updates
                async for event in govpilot_graph.astream_events(
                    input={"messages": [HumanMessage(content=data["content"])]},
                    config={"configurable": {"thread_id": session_id}},
                    version="v2"
                ):
                    # Stream intermediate agent updates to frontend
                    if event["event"] == "on_chain_start":
                        await websocket.send_json({
                            "type": "agent_thinking",
                            "agent": event["name"],
                            "message": f"Processing with {event['name']}..."
                        })
                    
                    elif event["event"] == "on_chain_end":
                        output = event["data"].get("output", {})
                        if output.get("final_response"):
                            await websocket.send_json({
                                "type": "final_response",
                                "content": output["final_response"]
                            })
                        if output.get("doc_checklist"):
                            await websocket.send_json({
                                "type": "doc_checklist_update",
                                "checklist": output["doc_checklist"]
                            })
                        if output.get("workflow_plan"):
                            await websocket.send_json({
                                "type": "workflow_plan",
                                "plan": output["workflow_plan"]
                            })
    
    except WebSocketDisconnect:
        pass

@app.post("/upload/{session_id}")
async def upload_document(session_id: str, file: UploadFile):
    """Handle document uploads and immediately trigger DA."""
    file_path = f"./uploads/{session_id}/{uuid.uuid4()}_{file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Resume session with new document
    await govpilot_graph.aupdate_state(
        config={"configurable": {"thread_id": session_id}},
        values={"uploaded_doc_paths": [file_path]}
    )
    
    return {"status": "uploaded", "path": file_path}

@app.get("/session/{session_id}/status")
async def get_session_status(session_id: str):
    """Return current state snapshot for reconnecting frontend."""
    state = await govpilot_graph.aget_state(
        config={"configurable": {"thread_id": session_id}}
    )
    return {
        "workflow_plan": state.values.get("workflow_plan"),
        "doc_checklist": state.values.get("doc_checklist"),
        "eligibility": state.values.get("eligibility"),
        "language": state.values.get("language")
    }
```

---

## 8. Repository Structure

```
govpilot-ai/
├── backend/
│   ├── main.py                    # FastAPI app + WebSocket
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── state.py               # GovPilotState TypedDict
│   │   ├── graph.py               # LangGraph graph construction
│   │   ├── citizen_agent.py       # CA orchestrator
│   │   ├── regulation_agent.py    # RA + RAG tools
│   │   ├── document_agent.py      # DA + OCR tools
│   │   ├── workflow_agent.py      # WA + task graph
│   │   └── notification_agent.py  # NA + SMS/email
│   ├── rag/
│   │   ├── ingest.py              # regulation ingestion pipeline
│   │   ├── retriever.py           # retrieval utilities
│   │   └── data/
│   │       └── faiss_govregs/     # FAISS index (generated)
│   ├── utils/
│   │   ├── language.py            # detection + translation
│   │   ├── ocr_utils.py           # image preprocessing
│   │   ├── workflow_utils.py      # critical path, DAG utils
│   │   └── validation.py          # NIC, passport format validators
│   ├── db/
│   │   ├── models.py              # SQLAlchemy models
│   │   └── session.py             # DB connection
│   ├── config.py                  # env vars + settings
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # main chat interface
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── DocUploader.tsx
│   │   │   ├── WorkflowTracker.tsx
│   │   │   ├── DocChecklist.tsx
│   │   │   └── LanguagePicker.tsx
│   │   └── hooks/
│   │       └── useWebSocket.ts    # WS connection + event routing
│   └── package.json
├── data/
│   └── service_templates/
│       ├── business_registration.json
│       ├── passport.json
│       └── ...                    # workflow templates per service
└── docker-compose.yml             # Redis + Postgres + backend + frontend
```

---

## 9. Environment Setup

```bash
# requirements.txt (backend)
langgraph>=0.2.0
langchain>=0.2.0
langchain-google-genai>=1.0.0
langchain-community>=0.2.0
fastapi>=0.111.0
uvicorn>=0.30.0
python-multipart>=0.0.9
websockets>=12.0
redis>=5.0.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.0
easyocr>=1.7.1
pytesseract>=0.3.10
opencv-python-headless>=4.9.0
Pillow>=10.0.0
faiss-cpu>=1.8.0
langdetect>=1.0.9
twilio>=9.0.0
sendgrid>=6.11.0
python-jose>=3.3.0
passlib>=1.7.4
pydantic>=2.7.0
```

```bash
# Install EasyOCR Sinhala model
python -c "import easyocr; easyocr.Reader(['si', 'ta', 'en'])"

# Install Tesseract + language packs (Ubuntu/Debian)
sudo apt-get install tesseract-ocr tesseract-ocr-sin tesseract-ocr-tam

# Seed FAISS index
python backend/rag/ingest.py
```

```env
# .env
GOOGLE_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key          # fallback
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost/govpilot
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=...
SECRET_KEY=your_jwt_secret
```

---

## 10. Hackathon MVP Prioritization

The proposal's Phase 1 + Phase 2 are your scope. Here's exactly what to build first vs what to stub.

### Build fully (demo-critical)

| Component | Why it matters to judges |
|---|---|
| CA intent classification + routing | Core "agentic" proof — shows autonomous decision-making |
| RA regulation fetch + eligibility | Shows RAG working, biggest differentiator from chatbot |
| DA OCR + validation (1-2 doc types) | Visual wow factor — upload NIC, see it validated live |
| WA workflow plan generation | Shows multi-agency orchestration |
| LangGraph graph + state | Proves the agentic architecture is real, not mocked |
| WebSocket streaming (agent thinking) | Judges see "Citizen Agent thinking..." — shows it's live |

### Stub / mock for hackathon

| Component | How to stub it |
|---|---|
| NA SMS/email | Print to console or mock API response |
| Appointment scheduling | Return a hardcoded confirmation code |
| Real government APIs | Use scraped static JSON files as "live" regulations |
| RBAC / AES-256 | Basic JWT auth, skip encryption |
| 60+ agencies | Demo with 3-5 most common: ROC, Immigration, IRD, DMT, Births |

### Hackathon demo flow (rehearse this)

1. Citizen opens app, switches to **Sinhala**
2. Types: "ව්‍යාපාරයක් ලියාපදිංචි කිරීමට අවශ්‍යයි" (I want to register a business)
3. CA detects Sinhala, parses intent → business_registration
4. Frontend shows: *"Regulation Agent thinking..."*
5. RA fetches ROC + IRD regulations, checks eligibility → eligible
6. Doc checklist appears: NIC, address proof, company name reservation form
7. User uploads NIC photo → DA OCR extracts name + NIC number
8. Validation passes → checklist shows ✅
9. WA generates 5-step plan with estimated days
10. NA fires mock SMS: "Your plan is ready. Step 1: Name Reservation at ROC"
11. Final CA response in Sinhala: full guidance summary

---

## 11. Key Implementation Risks & Mitigations

**Risk 1: Sinhala OCR accuracy**
EasyOCR's Sinhala model is decent but not perfect. Mitigation: preprocess aggressively (deskew, denoise, scale), use Tesseract as fallback, and for the hackathon demo, use a high-quality printed NIC photo you control.

**Risk 2: LangGraph session state with Redis**
Redis checkpointing can be fiddly on first setup. Mitigation: use `MemorySaver` for the hackathon (in-memory, same process) — swap to Redis for production. `MemorySaver` requires zero configuration.
```python
from langgraph.checkpoint.memory import MemorySaver
checkpointer = MemorySaver()  # hackathon mode
```

**Risk 3: Gemini rate limits during live demo**
Mitigation: cache regulation fetches aggressively. For the demo, pre-warm the graph with the exact demo scenario — LangGraph checkpointing means if you run it once, the state is cached and a repeat demo is instant.

**Risk 4: No real government API access**
This is fine. Mock it with JSON files seeded from scraped/curated regulation data. Judges will not test real API connectivity — they'll test the agent behavior and UX.

**Risk 5: Graph enters infinite loop (CA keeps routing)**
Add hard limits:
```python
# In CA node
if state.get("_hop_count", 0) > 10:
    return {"next_agent": END, "final_response": "Maximum processing steps reached."}
return {..., "_hop_count": state.get("_hop_count", 0) + 1}
```

---

## 12. Testing Each Agent

```python
# tests/test_agents.py
from agents.graph import govpilot_graph
from langchain_core.messages import HumanMessage

def test_business_registration_flow():
    """End-to-end test for business registration in English."""
    config = {"configurable": {"thread_id": "test-001"}}
    
    result = govpilot_graph.invoke(
        input={
            "messages": [HumanMessage(content="I want to register a private limited company")],
            "session_id": "test-001",
            "citizen_id": "test-citizen",
            "language": "en",
            "current_step_index": 0,
            "replan_count": 0,
            "notifications_sent": [],
        },
        config=config
    )
    
    assert result["parsed_intent"]["service_category"] == "business_registration"
    assert result["eligibility"] is not None
    assert len(result["required_docs"]) > 0
    assert result["workflow_plan"] is not None
    assert result["final_response"] is not None

def test_sinhala_intent():
    """Test Sinhala language detection and intent parsing."""
    config = {"configurable": {"thread_id": "test-si-001"}}
    
    result = govpilot_graph.invoke(
        input={
            "messages": [HumanMessage(content="ගමන් බලපත්‍රයක් ලබා ගන්නේ කෙසේද")],
            "session_id": "test-si-001",
            "citizen_id": "test-citizen-2",
            "current_step_index": 0,
            "replan_count": 0,
            "notifications_sent": [],
        },
        config=config
    )
    
    assert result["language"] == "si"
    assert result["parsed_intent"]["service_category"] == "passport"
```

---

## 13. Quick-Start Checklist

```
Day 1 — Foundation
 □ Set up FastAPI + WebSocket skeleton
 □ Implement GovPilotState TypedDict
 □ Implement CA node (intent parsing only, no routing yet)
 □ Build LangGraph graph with single CA node
 □ Test WebSocket from a simple HTML page

Day 2 — RAG + Regulation Agent  
 □ Scrape/collect regulation PDFs for 3 services
 □ Run ingest.py → build FAISS index
 □ Implement RA node with search + eligibility tools
 □ Wire CA → RA → CA in graph
 □ Test: input a service request, verify regulations are fetched

Day 3 — Document Agent
 □ Install EasyOCR + Tesseract + language packs
 □ Implement extract_text_from_document tool
 □ Implement validate_document for NIC format
 □ Implement generate_doc_checklist
 □ Wire DA into graph
 □ Test: upload a NIC image, verify OCR extracts name + number

Day 4 — Workflow + Notification Agents
 □ Seed workflow_templates for 3-5 services
 □ Implement WA node
 □ Implement NA node (mock SMS/email)
 □ Wire full graph end-to-end

Day 5 — Frontend Integration + Multilingual
 □ Next.js chat UI with WebSocket hook
 □ DocUploader component → /upload endpoint
 □ WorkflowTracker component (shows plan steps)
 □ DocChecklist component (live updates via WS)
 □ Add Sinhala/Tamil translation layer in CA

Day 6 — Polish + Demo Prep
 □ Seed realistic regulation data for demo scenario
 □ Pre-warm LangGraph state for demo flow
 □ Add "agent thinking" loading states in frontend
 □ Run full demo rehearsal (business registration in Sinhala)
 □ Record fallback demo video in case of live failures
```

---

*GovPilot AI — Built for IDEALIZE 2026 · Team Procrastinators · SLIIT*
