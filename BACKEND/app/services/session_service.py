import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import CitizenSession, GovernmentService, Message, WorkflowStep


class SessionService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_sessions(self, user_id: uuid.UUID) -> list[CitizenSession]:
        result = await self.db.scalars(
            select(CitizenSession)
            .where(CitizenSession.user_id == user_id)
            .order_by(CitizenSession.updated_at.desc())
        )
        return list(result)

    async def get_session(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> CitizenSession | None:
        return await self.db.scalar(
            select(CitizenSession)
            .where(
                CitizenSession.id == session_id,
                CitizenSession.user_id == user_id,
            )
            .options(
                selectinload(CitizenSession.steps),
                selectinload(CitizenSession.messages),
            )
        )

    async def create_session(
        self,
        *,
        user_id: uuid.UUID,
        service_id: str | None,
    ) -> CitizenSession:
        selected_service_id = service_id or "general-dispatcher"
        definition = await self.db.scalar(
            select(GovernmentService).where(GovernmentService.service_id == selected_service_id)
        )
        if definition is None:
            raise KeyError(selected_service_id)
        session = CitizenSession(
            user_id=user_id,
            service_id=definition.service_id,
            service_name=definition.name,
            agency_name=definition.agency_name,
            status="Service Selection",
            progress=0,
            current_step=1,
            total_steps=len(definition.workflow_steps),
        )
        session.steps = [
            WorkflowStep(
                position=position,
                label=label,
                status="active" if position == 1 else "pending",
            )
            for position, label in enumerate(definition.workflow_steps, start=1)
        ]
        session.messages = [
            Message(
                sender="agent",
                content=(
                    f"Welcome to GovPilot AI. I can help you with "
                    f"{definition.name}. What do you need to know?"
                ),
                cards=[],
            )
        ]
        self.db.add(session)
        await self.db.commit()
        return await self.get_required_session(session.id, user_id)

    async def get_required_session(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> CitizenSession:
        session = await self.get_session(session_id, user_id)
        if session is None:
            raise LookupError(session_id)
        return session

    async def add_message(
        self,
        *,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        sender: str,
        content: str,
        cards: list[dict] | None = None,
    ) -> Message:
        await self.get_required_session(session_id, user_id)
        message = Message(
            session_id=session_id,
            sender=sender,
            content=content,
            cards=cards or [],
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return message

    async def set_awaiting_clarification(
        self,
        *,
        session: CitizenSession,
        awaiting: bool,
    ) -> None:
        session.awaiting_clarification = awaiting
        await self.db.commit()
