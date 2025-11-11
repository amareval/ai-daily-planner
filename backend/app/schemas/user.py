from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class GoalCreate(BaseModel):
    goal_statement: str = Field(min_length=3)
    target_role: str | None = None
    industry: str | None = None
    skills_focus: str | None = None
    default_learning_minutes: int | None = Field(default=120, ge=0)


class GoalRead(GoalCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str | None = None
    timezone: str | None = None
    goal: GoalCreate


class UserRead(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None = None
    timezone: str | None = None
    created_at: datetime
    updated_at: datetime
    goal: GoalRead | None = None
