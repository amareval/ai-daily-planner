from datetime import date

from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    user_id: str = Field(min_length=1)
    scheduled_date: date
    primary_goal: str | None = None
    secondary_goals: str | None = None
    skills_focus: str | None = None


class RecommendedTodo(BaseModel):
    title: str = Field(min_length=5)
    description: str = Field(min_length=10)
    category: str = Field(min_length=3)
    estimated_minutes: int = Field(ge=5, le=240)
    resource_url: str | None = None


class RecommendationsResponse(BaseModel):
    user_id: str
    scheduled_date: date
    goal_statement: str
    recommended_todos: list[RecommendedTodo]
