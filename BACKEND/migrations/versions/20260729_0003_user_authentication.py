"""Add citizen authentication fields.

Revision ID: 20260729_0003
Revises: 20260728_0002
Create Date: 2026-07-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260729_0003"
down_revision: str | Sequence[str] | None = "20260728_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("nic", sa.String(length=12), nullable=True))
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.create_index("ix_users_nic", "users", ["nic"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_nic", table_name="users")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "nic")
