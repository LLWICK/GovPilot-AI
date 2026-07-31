import uuid
from typing import Literal

from app.schemas.base import APIModel


class DocumentResponse(APIModel):
    id: uuid.UUID
    name: str
    status: Literal["pending", "uploaded", "processing", "verified", "issue"]
    note: str | None = None
    file_name: str | None = None
    content_type: str | None = None
