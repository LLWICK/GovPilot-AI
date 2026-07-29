import uuid
from urllib.parse import unquote

from fastapi import APIRouter, HTTPException, Request, status

from app.api.dependencies import CurrentUserId, DatabaseSession
from app.schemas.document import DocumentResponse
from app.services.document_service import DocumentService

router = APIRouter(prefix="/sessions/{session_id}/documents", tags=["documents"])
MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    session_id: uuid.UUID, db: DatabaseSession, user_id: CurrentUserId
) -> list:
    try:
        return await DocumentService(db).list_documents(session_id, user_id)
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found") from exc


@router.put("/{document_id}", response_model=DocumentResponse)
async def upload_document(
    session_id: uuid.UUID,
    document_id: uuid.UUID,
    request: Request,
    db: DatabaseSession,
    user_id: CurrentUserId,
) -> DocumentResponse:
    content_type = request.headers.get("content-type", "").split(";", maxsplit=1)[0].lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Unsupported document type")
    file_name = unquote(request.headers.get("x-file-name", "")).strip()
    if not file_name or len(file_name) > 255:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "A valid file name is required")
    content = await request.body()
    if not content:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "The uploaded file is empty")
    if len(content) > MAX_DOCUMENT_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Maximum file size is 10 MB")
    try:
        return await DocumentService(db).upload(
            session_id=session_id,
            document_id=document_id,
            user_id=user_id,
            file_name=file_name,
            content_type=content_type,
            content=content,
        )
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found") from exc
