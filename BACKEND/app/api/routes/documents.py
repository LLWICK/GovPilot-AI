import uuid

from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import CurrentUserId, DatabaseSession
from app.schemas.document import DocumentResponse
from app.services.document_service import DocumentService

router = APIRouter(prefix="/sessions/{session_id}/documents", tags=["documents"])


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    session_id: uuid.UUID, db: DatabaseSession, user_id: CurrentUserId
) -> list:
    try:
        return await DocumentService(db).list_documents(session_id, user_id)
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found") from exc

