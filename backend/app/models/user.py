from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    goals: Mapped[list["Goal"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", order_by="Goal.created_at"
    )
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", order_by="Task.created_at"
    )
    daily_availability: Mapped[list["DailyAvailability"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", order_by="DailyAvailability.day"
    )
    pdf_ingestions: Mapped[list["PDFIngestion"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", order_by="PDFIngestion.created_at"
    )


class Goal(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id"), nullable=False)
    goal_statement: Mapped[str] = mapped_column(Text, nullable=False)
    target_role: Mapped[str | None] = mapped_column(String(255))
    industry: Mapped[str | None] = mapped_column(String(255))
    skills_focus: Mapped[str | None] = mapped_column(Text)
    secondary_goals: Mapped[str | None] = mapped_column(Text)
    default_learning_minutes: Mapped[int | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="goals")
