"""Persist service catalog and AI-requested documents; remove development citizen.

Revision ID: 20260729_0004
Revises: 20260729_0003
Create Date: 2026-07-29
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260729_0004"
down_revision: str | Sequence[str] | None = "20260729_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

LEGACY_DEVELOPMENT_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

SERVICES = [
    {
        "service_id": "general-dispatcher",
        "name": "GovPilot AI Central Dispatcher",
        "agency_name": "Government of Sri Lanka",
        "description": "Describe your need and let the AI identify the correct government service.",
        "fee": "Depends on service",
        "processing_time": "Varies",
        "workflow_steps": [
            "State Citizen Request",
            "Identify Government Service",
            "Generate Official Guidance",
        ],
        "is_public": False,
    },
    {
        "service_id": "passport-renewal",
        "name": "Passport Renewal",
        "agency_name": "Department of Immigration and Emigration",
        "description": (
            "Start a passport renewal workflow and receive requirements from the AI pipeline."
        ),
        "fee": "LKR 10,000",
        "processing_time": "3-5 business days",
        "workflow_steps": [
            "Identify Requirements",
            "Prepare Documents",
            "Review Application Guidance",
        ],
        "is_public": True,
    },
    {
        "service_id": "nic-application",
        "name": "National Identity Card Application",
        "agency_name": "Department for Registration of Persons",
        "description": (
            "Start a new or replacement NIC workflow with official application guidance."
        ),
        "fee": "LKR 2,000",
        "processing_time": "7-10 business days",
        "workflow_steps": [
            "Identify Requirements",
            "Prepare Documents",
            "Review Application Guidance",
        ],
        "is_public": True,
    },
    {
        "service_id": "birth-cert-copy",
        "name": "Birth Certificate Copy Request",
        "agency_name": "Registrar General's Department",
        "description": "Request guidance for obtaining a certified birth certificate copy.",
        "fee": "LKR 1,500",
        "processing_time": "2-3 business days",
        "workflow_steps": [
            "Identify Record",
            "Prepare Request Details",
            "Review Application Guidance",
        ],
        "is_public": True,
    },
]


def upgrade() -> None:
    op.create_table(
        "government_services",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("service_id", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("agency_name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("fee", sa.String(length=80), nullable=False),
        sa.Column("processing_time", sa.String(length=80), nullable=False),
        sa.Column("workflow_steps", postgresql.JSONB(), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False),
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
    op.create_index(
        "ix_government_services_service_id",
        "government_services",
        ["service_id"],
        unique=True,
    )

    services = sa.table(
        "government_services",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("service_id", sa.String),
        sa.column("name", sa.String),
        sa.column("agency_name", sa.String),
        sa.column("description", sa.Text),
        sa.column("fee", sa.String),
        sa.column("processing_time", sa.String),
        sa.column("workflow_steps", postgresql.JSONB),
        sa.column("is_public", sa.Boolean),
    )
    op.bulk_insert(
        services,
        [{"id": uuid.uuid4(), **service} for service in SERVICES],
    )

    op.create_table(
        "required_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("note", sa.String(length=500), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=True),
        sa.Column("content_type", sa.String(length=120), nullable=True),
        sa.Column("content", sa.LargeBinary(), nullable=True),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=True),
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
        sa.ForeignKeyConstraint(["session_id"], ["citizen_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", "name", name="uq_required_document_session_name"),
    )
    op.create_index(
        "ix_required_documents_session_id",
        "required_documents",
        ["session_id"],
        unique=False,
    )

    # Clean up installations that ran the original development-only seed.
    op.execute(
        sa.text("DELETE FROM users WHERE id = :user_id").bindparams(
            user_id=LEGACY_DEVELOPMENT_USER_ID
        )
    )


def downgrade() -> None:
    op.drop_index("ix_required_documents_session_id", table_name="required_documents")
    op.drop_table("required_documents")
    op.drop_index("ix_government_services_service_id", table_name="government_services")
    op.drop_table("government_services")
