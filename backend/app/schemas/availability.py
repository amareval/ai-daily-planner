from datetime import date, datetime

from pydantic import BaseModel, Field


class DailyAvailabilityCreate(BaseModel):
    user_id: str
    day: date
    minutes_available: int = Field(ge=15, le=720)
    source: str = "manual"


class DailyAvailabilityRead(DailyAvailabilityCreate):
    id: int
    created_at: datetime
