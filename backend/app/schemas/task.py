from datetime import date, datetime

from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    title: str = Field(min_length=3, max_length=512)
    notes: str | None = None
    scheduled_date: date
    estimated_minutes: int | None = Field(default=None, ge=5, le=480)


class TaskCreate(TaskBase):
    user_id: str
    source: str = "manual"


class TaskRead(TaskBase):
    id: str
    user_id: str
    source: str
    status: str
    created_at: datetime
    updated_at: datetime
