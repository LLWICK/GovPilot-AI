import uuid
from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.ai_service import AIService
from app.services.legacy_langgraph_pipeline import LegacyLangGraphPipeline
from app.services.session_service import DEVELOPMENT_USER_ID

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user_id() -> uuid.UUID:
    """Temporary development identity, replaced by verified authentication later."""
    return DEVELOPMENT_USER_ID


CurrentUserId = Annotated[uuid.UUID, Depends(get_current_user_id)]


@lru_cache
def get_ai_service() -> AIService:
    return AIService(LegacyLangGraphPipeline())


AIServiceDependency = Annotated[AIService, Depends(get_ai_service)]
