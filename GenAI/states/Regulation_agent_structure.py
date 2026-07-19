# states/Regulation_agent_structure.py
from typing import Optional, Literal
from pydantic import BaseModel, Field


class DocumentRequirement(BaseModel):
    doc_id: str = Field(description="Unique identifier e.g. 'nic', 'birth_cert'")
    doc_name: str = Field(description="Full English name of document")
    doc_name_si: str = Field(default="", description="Sinhala name of document")
    doc_name_ta: str = Field(default="", description="Tamil name of document")
    mandatory: bool = Field(default=True, description="Whether document is required")
    format: str = Field(default="original", description="'original' | 'certified_copy' | 'photocopy' | 'any'")
    notes: str = Field(default="", description="Any special notes about the document")


class FeeStructure(BaseModel):
    amount: str = Field(default="", description="Fee amount as string e.g. 'LKR 5,000'")
    currency: str = Field(default="LKR")
    payment_methods: list[str] = Field(default_factory=list)
    notes: str = Field(default="")


class RAOutput(BaseModel):
    # status is what the orchestrator/CA actually route and respond on —
    # this is the field that was missing and caused the fallback crash
    retrieval_status: Literal["success", "partial", "not_found", "error"] = "partial"

    discovered_agency: str = Field(default="", description="Name of the government agency found")
    source_url: str = Field(default="", description="Exact URL where requirements were found")
    pdf_urls: list[str] = Field(default_factory=list)
    regulations: list[dict] = Field(default_factory=list)
    required_documents: list[DocumentRequirement] = Field(default_factory=list)
    fees: Optional[FeeStructure] = Field(default=None)
    processing_time: str = Field(default="")
    data_source: str = Field(default="live_web", description="'live_web' | 'faiss_fallback'")
    notes: str = Field(default="", description="Error details or caveats, e.g. 'requires login'")