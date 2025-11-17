"""Add recommendation history for deduping suggested to-dos.

Revision ID: 0004_add_recommendation_history
Revises: 0003_add_secondary_goals
Create Date: 2025-11-17
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0004_add_recommendation_history"
down_revision: str | None = "0003_add_secondary_goals"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "recommendation_history",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("resource_url", sa.Text()),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("estimated_minutes", sa.Integer()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_recommendation_history_user_id", "recommendation_history", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_recommendation_history_user_id", table_name="recommendation_history")
    op.drop_table("recommendation_history")
