# states/document_agent_structure.py
from pydantic import BaseModel, Field
from typing import Optional, Literal

class ExtractedField(BaseModel):
    field_name: str
    value: Optional[str] = None
    confidence: Literal["high", "low", "not_found"] = "not_found"

class DocumentExtractionResult(BaseModel):
    doc_id: str
    doc_type: str                          # "nic", "birth_certificate", etc.
    extraction_status: Literal["success", "partial", "failed"]
    extracted_fields: list[ExtractedField] = Field(default_factory=list)
    raw_ocr_text: str = ""
    notes: str = ""

class DAOutput(BaseModel):
    documents_processed: list[DocumentExtractionResult] = Field(default_factory=list)
    missing_required_fields: list[str] = Field(default_factory=list)
    citizen_provided_fields: dict = Field(default_factory=dict)  # filled via HITL