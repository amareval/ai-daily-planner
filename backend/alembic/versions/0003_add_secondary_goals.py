"""Add secondary goals to the goal table.

Revision ID: 0003_add_secondary_goals
Revises: 0002_pdf_ingestions
Create Date: 2024-04-11
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0003_add_secondary_goals"
down_revision: str | None = "0002_pdf_ingestions"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("goal", sa.Column("secondary_goals", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("goal", "secondary_goals")
