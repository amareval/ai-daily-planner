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
    status: str
    source: str
    pdf_ingestion_id: str | None = None
    created_at: datetime
    updated_at: datetime


class TaskUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    scheduled_date: date | None = None
    estimated_minutes: int | None = Field(default=None, ge=5, le=480)
    status: str | None = Field(default=None, pattern="^(pending|complete|deferred)$")


class CarryForwardRequest(BaseModel):
    user_id: str
    from_date: date
    to_date: date | None = None
