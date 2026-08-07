import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CitizenSession, RequiredDocument


class DocumentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_documents(
        self, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[RequiredDocument]:
        await self._require_session(session_id, user_id)
        result = await self.db.scalars(
            select(RequiredDocument)
            .where(RequiredDocument.session_id == session_id)
            .order_by(RequiredDocument.created_at)
        )
        return list(result)

    async def sync_from_ai_cards(
        self,
        *,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        cards: list[dict],
    ) -> None:
        await self._require_session(session_id, user_id)
        required_names = {
            name.strip()
            for card in cards
            if card.get("type") == "document_request"
            for name in card.get("required", [])
            if isinstance(name, str) and name.strip()
        }
        if not required_names:
            return

        existing = set(
            await self.db.scalars(
                select(RequiredDocument.name).where(RequiredDocument.session_id == session_id)
            )
        )
        self.db.add_all(
            RequiredDocument(session_id=session_id, name=name, status="pending")
            for name in sorted(required_names - existing)
        )
        await self.db.commit()

    async def _require_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> CitizenSession:
        session = await self.db.scalar(
            select(CitizenSession).where(
                CitizenSession.id == session_id,
                CitizenSession.user_id == user_id,
            )
        )
        if session is None:
            raise LookupError(session_id)
        return session
