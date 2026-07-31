import uuid

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class GovernmentService(TimestampMixin, Base):
    __tablename__ = "government_services"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    agency_name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    fee: Mapped[str] = mapped_column(String(80))
    processing_time: Mapped[str] = mapped_column(String(80))
    workflow_steps: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
