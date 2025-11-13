"""Add PDF ingestion support and task linkage.

Revision ID: 0002_pdf_ingestions
Revises: 0001_initial
Create Date: 2024-04-09
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0002_pdf_ingestions"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "pdfingestion",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("stored_path", sa.String(length=512), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("parsed_task_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text()),
        sa.Column("raw_text", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime()),
    )

    with op.batch_alter_table("task") as batch_op:
        batch_op.add_column(sa.Column("pdf_ingestion_id", sa.String(), nullable=True))
        batch_op.create_index("ix_task_pdf_ingestion_id", ["pdf_ingestion_id"])
        batch_op.create_foreign_key(
            "fk_task_pdf_ingestion",
            "pdfingestion",
            ["pdf_ingestion_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("task") as batch_op:
        batch_op.drop_constraint("fk_task_pdf_ingestion", type_="foreignkey")
        batch_op.drop_index("ix_task_pdf_ingestion_id")
        batch_op.drop_column("pdf_ingestion_id")
    op.drop_table("pdfingestion")
