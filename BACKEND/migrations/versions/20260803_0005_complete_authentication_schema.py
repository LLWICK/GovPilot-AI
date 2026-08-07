"""Complete the authentication and OTP schema.

Revision ID: 20260803_0005
Revises: 20260729_0004
Create Date: 2026-08-03
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260803_0005"
down_revision: str | Sequence[str] | None = "20260729_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "auth_provider",
            sa.String(length=50),
            nullable=False,
            server_default="credentials",
        ),
    )
    op.add_column("users", sa.Column("google_id", sa.String(length=255), nullable=True))
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)

    # Defaults above backfill existing users; new values are supplied by the ORM.
    op.alter_column("users", "is_verified", server_default=None)
    op.alter_column("users", "auth_provider", server_default=None)

    op.create_table(
        "otp_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("code", sa.String(length=6), nullable=False),
        sa.Column("purpose", sa.String(length=50), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_used", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_otp_codes_email", "otp_codes", ["email"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_otp_codes_email", table_name="otp_codes")
    op.drop_table("otp_codes")
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_column("users", "google_id")
    op.drop_column("users", "auth_provider")
    op.drop_column("users", "is_verified")
