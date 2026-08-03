
from pydantic import BaseModel, Field
from typing import Optional

class FormFieldDefinition(BaseModel):
    field_number: Optional[str] = None
    label_english: str
    label_sinhala: Optional[str] = None
    label_tamil: Optional[str] = None
    field_type: str = "text"  # "text", "date", "choice", "id_number", "checkbox"
    notes: str = ""

class FormStructure(BaseModel):
    source_url: str
    page_count: int = 0
    fields: list[FormFieldDefinition] = Field(default_factory=list)
    extraction_notes: str = ""