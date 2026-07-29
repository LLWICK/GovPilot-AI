import uuid

from sqlalchemy import ForeignKey, LargeBinary, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class RequiredDocument(TimestampMixin, Base):
    __tablename__ = "required_documents"
    __table_args__ = (
        UniqueConstraint("session_id", "name", name="uq_required_document_session_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("citizen_sessions.id", ondelete="CASCADE"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    note: Mapped[str | None] = mapped_column(String(500))
    file_name: Mapped[str | None] = mapped_column(String(255))
    content_type: Mapped[str | None] = mapped_column(String(120))
    content: Mapped[bytes | None] = mapped_column(LargeBinary)
    checksum_sha256: Mapped[str | None] = mapped_column(String(64))

    session = relationship("CitizenSession", back_populates="documents")
