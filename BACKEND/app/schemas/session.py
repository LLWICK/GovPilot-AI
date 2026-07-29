import uuid
from datetime import datetime

from pydantic import Field, computed_field

from app.schemas.base import APIModel
from app.schemas.message import MessageResponse


class SessionCreate(APIModel):
    service_id: str | None = None


class WorkflowStepResponse(APIModel):
    id: uuid.UUID
    position: int
    label: str
    status: str

    @computed_field
    @property
    def completed(self) -> bool:
        return self.status == "completed"

    @computed_field
    @property
    def current(self) -> bool:
        return self.status == "active"


class SessionSummary(APIModel):
    id: uuid.UUID = Field(serialization_alias="sessionId")
    service_id: str
    service_name: str
    status: str
    progress: int
    updated_at: datetime


class SessionResponse(SessionSummary):
    agency_name: str
    current_step: int
    total_steps: int
    awaiting_clarification: bool
    steps: list[WorkflowStepResponse] = Field(default_factory=list)
    messages: list[MessageResponse] = Field(default_factory=list)
