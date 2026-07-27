"""Add persistent clarification state to citizen sessions.

Revision ID: 20260728_0002
Revises: 20260728_0001
Create Date: 2026-07-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260728_0002"
down_revision: str | Sequence[str] | None = "20260728_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "citizen_sessions",
        sa.Column(
            "awaiting_clarification",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("citizen_sessions", "awaiting_clarification")
