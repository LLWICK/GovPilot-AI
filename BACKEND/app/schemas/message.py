import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import Field

from app.schemas.base import APIModel


class MessageCreate(APIModel):
    content: str = Field(min_length=1, max_length=10_000)
    language: Literal["en", "si", "ta"] = "en"


class MessageResponse(APIModel):
    id: uuid.UUID
    sender: Literal["user", "agent", "system"]
    content: str = Field(serialization_alias="text")
    cards: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(serialization_alias="timestamp")


class ChatTurnResponse(APIModel):
    user_message: MessageResponse
    assistant_message: MessageResponse
    needs_clarification: bool = False
