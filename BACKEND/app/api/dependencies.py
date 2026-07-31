import uuid
from functools import lru_cache
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import InvalidTokenError, decode_access_token
from app.services.ai_service import AIService
from app.services.legacy_langgraph_pipeline import LegacyLangGraphPipeline

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> uuid.UUID:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required")
    try:
        return decode_access_token(credentials.credentials, get_settings().auth_secret)
    except InvalidTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc


CurrentUserId = Annotated[uuid.UUID, Depends(get_current_user_id)]


@lru_cache
def get_ai_service() -> AIService:
    return AIService(LegacyLangGraphPipeline())


AIServiceDependency = Annotated[AIService, Depends(get_ai_service)]
