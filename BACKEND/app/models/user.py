import uuid

from sqlalchemy import String
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
    nic: Mapped[str | None] = mapped_column(String(12), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))

    sessions = relationship(
        "CitizenSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )
