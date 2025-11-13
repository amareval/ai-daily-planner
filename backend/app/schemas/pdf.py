from datetime import date, datetime

from pydantic import BaseModel, Field


class PDFIngestionCreate(BaseModel):
    user_id: str = Field(min_length=1)
    scheduled_date: date = Field(description="Date to assign parsed tasks to if no explicit date found.")


class PDFIngestionRead(BaseModel):
    id: str
    user_id: str
    original_filename: str
    status: str
    parsed_task_count: int
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class PDFIngestionWithTasks(PDFIngestionRead):
    tasks_created: list[str] = Field(default_factory=list)
