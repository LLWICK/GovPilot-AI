# states/guidance_agent_structure.py
from pydantic import BaseModel, Field
from typing import Literal, Optional


class GuidanceStep(BaseModel):
    step_number: int
    title: str
    instruction: str


class GuidanceOutput(BaseModel):
    guidance_status: Literal["success", "partial", "failed"] = "partial"
    agency_name: str = ""
    steps: list[GuidanceStep] = Field(default_factory=list)
    documents_to_prepare: list[str] = Field(default_factory=list)
    form_links: list[str] = Field(default_factory=list)
    fees_summary: str = ""
    processing_time: str = ""
    language: str = "en"
    notes: str = ""