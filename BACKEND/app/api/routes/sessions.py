import logging
import uuid

from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import AIServiceDependency, CurrentUserId, DatabaseSession
from app.schemas.message import ChatTurnResponse, MessageCreate, MessageResponse
from app.schemas.session import SessionCreate, SessionResponse, SessionSummary
from app.services.ai_service import (
    PipelineNotConfiguredError,
    PipelineRuntimeConfigurationError,
)
from app.services.document_service import DocumentService
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["sessions"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[SessionSummary])
async def list_sessions(
    db: DatabaseSession,
    user_id: CurrentUserId,
) -> list:
    return await SessionService(db).list_sessions(user_id)


@router.post(
    "",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    request: SessionCreate,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    try:
        return await SessionService(db).create_session(
            user_id=user_id,
            service_id=request.service_id,
        )
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown service: {exc.args[0]}",
        ) from exc


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: uuid.UUID,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    session = await SessionService(db).get_session(session_id, user_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session


@router.get("/{session_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    session_id: uuid.UUID,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    session = await SessionService(db).get_session(session_id, user_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session.messages


@router.post(
    "/{session_id}/messages",
    response_model=ChatTurnResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_message(
    session_id: uuid.UUID,
    request: MessageCreate,
    db: DatabaseSession,
    user_id: CurrentUserId,
    ai_service: AIServiceDependency,
):
    session_service = SessionService(db)
    try:
        session = await session_service.get_required_session(session_id, user_id)
        user_message = await session_service.add_message(
            session_id=session_id,
            user_id=user_id,
            sender="user",
            content=request.content,
        )
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found") from exc

    try:
        if session.awaiting_clarification:
            ai_result = await ai_service.resume(
                session_id=session_id,
                answer=request.content,
            )
        else:
            ai_result = await ai_service.run(
                session_id=session_id,
                message=request.content,
                language=request.language,
            )
    except (PipelineNotConfiguredError, PipelineRuntimeConfigurationError) as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("AI pipeline failed for session %s", session_id)
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "The AI guidance pipeline failed. The citizen message was saved.",
        ) from exc

    assistant_message = await session_service.add_message(
        session_id=session_id,
        user_id=user_id,
        sender="agent",
        content=ai_result.content,
        cards=ai_result.cards,
    )
    await DocumentService(db).sync_from_ai_cards(
        session_id=session_id,
        user_id=user_id,
        cards=ai_result.cards,
    )
    needs_clarification = ai_result.status == "clarification_required"
    await session_service.set_awaiting_clarification(
        session=session,
        awaiting=needs_clarification,
    )
    return ChatTurnResponse(
        user_message=user_message,
        assistant_message=assistant_message,
        needs_clarification=needs_clarification,
    )
