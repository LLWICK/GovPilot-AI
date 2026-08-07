import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    nic: Mapped[str | None] = mapped_column(String(12), unique=True, index=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    auth_provider: Mapped[str] = mapped_column(String(50), default="credentials")
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)

    sessions = relationship(
        "CitizenSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )
