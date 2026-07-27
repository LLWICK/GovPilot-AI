"""Create users, citizen sessions, workflow steps, and messages.

Revision ID: 20260728_0001
Revises:
Create Date: 2026-07-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260728_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DEVELOPMENT_USER_ID = "00000000-0000-0000-0000-000000000001"


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
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
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "citizen_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("service_id", sa.String(length=100), nullable=False),
        sa.Column("service_name", sa.String(length=200), nullable=False),
        sa.Column("agency_name", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=80), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False),
        sa.Column("current_step", sa.Integer(), nullable=False),
        sa.Column("total_steps", sa.Integer(), nullable=False),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_citizen_sessions_service_id",
        "citizen_sessions",
        ["service_id"],
        unique=False,
    )
    op.create_index(
        "ix_citizen_sessions_user_id",
        "citizen_sessions",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "workflow_steps",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["session_id"],
            ["citizen_sessions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "session_id",
            "position",
            name="uq_workflow_step_session_position",
        ),
    )
    op.create_index(
        "ix_workflow_steps_session_id",
        "workflow_steps",
        ["session_id"],
        unique=False,
    )

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "cards",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
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
        sa.ForeignKeyConstraint(
            ["session_id"],
            ["citizen_sessions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_messages_session_id",
        "messages",
        ["session_id"],
        unique=False,
    )

    users = sa.table(
        "users",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("email", sa.String),
        sa.column("name", sa.String),
    )
    op.bulk_insert(
        users,
        [
            {
                "id": DEVELOPMENT_USER_ID,
                "email": "citizen@govpilot.local",
                "name": "Development Citizen",
            }
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_messages_session_id", table_name="messages")
    op.drop_table("messages")
    op.drop_index("ix_workflow_steps_session_id", table_name="workflow_steps")
    op.drop_table("workflow_steps")
    op.drop_index("ix_citizen_sessions_user_id", table_name="citizen_sessions")
    op.drop_index("ix_citizen_sessions_service_id", table_name="citizen_sessions")
    op.drop_table("citizen_sessions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
