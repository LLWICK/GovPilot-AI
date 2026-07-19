


from typing import TypedDict, Literal, Optional, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage
import operator

from states.Regulation_agent_structure import RAOutput
from states.web_discovery_structure import DiscoveryResult

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
    messages: Annotated[list, add_messages]

    # ── Intent & Service ─────────────────────────────────────────
    raw_input: str
    parsed_intent: Optional[IntentModel]
    service_id: Optional[str]
    agency_id: Optional[str]

    # ── RA agent analysis ─────────────────────────────────────────

    Regulation_agent_output: Optional[RAOutput]

    #── web discovery agent analysis ─────────────────────────────────────────

    web_discovery_agent_output: Optional[DiscoveryResult]

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