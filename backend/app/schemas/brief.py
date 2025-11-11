from datetime import date

from pydantic import BaseModel, Field

from app.schemas.task import TaskRead


class DailyBriefRequest(BaseModel):
    user_id: str = Field(min_length=1)
    scheduled_date: date


class LearningSuggestion(BaseModel):
    title: str
    description: str
    resource_url: str | None = None
    time_minutes: int
    category: str


class DailyBrief(BaseModel):
    user_id: str
    goal_statement: str
    scheduled_date: date
    total_task_minutes: int
    tasks: list[TaskRead]
    learning_suggestions: list[LearningSuggestion]
