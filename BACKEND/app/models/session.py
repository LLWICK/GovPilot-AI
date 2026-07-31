import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class CitizenSession(TimestampMixin, Base):
    __tablename__ = "citizen_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    service_id: Mapped[str] = mapped_column(String(100), index=True)
    service_name: Mapped[str] = mapped_column(String(200))
    agency_name: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(80), default="created")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    current_step: Mapped[int] = mapped_column(Integer, default=1)
    total_steps: Mapped[int] = mapped_column(Integer, default=1)
    awaiting_clarification: Mapped[bool] = mapped_column(Boolean, default=False)

    user = relationship("User", back_populates="sessions")
    messages = relationship(
        "Message",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )
    steps = relationship(
        "WorkflowStep",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.position",
    )
    documents = relationship(
        "RequiredDocument",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="RequiredDocument.created_at",
    )
