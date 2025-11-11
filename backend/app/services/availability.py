from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.availability import DailyAvailability
from app.schemas.availability import DailyAvailabilityCreate, DailyAvailabilityRead


def upsert_daily_availability(db: Session, payload: DailyAvailabilityCreate) -> DailyAvailability:
    stmt = select(DailyAvailability).where(DailyAvailability.user_id == payload.user_id, DailyAvailability.day == payload.day)
    availability = db.scalar(stmt)

    if availability is None:
        availability = DailyAvailability(
            user_id=payload.user_id,
            day=payload.day,
            minutes_available=payload.minutes_available,
            source=payload.source,
        )
        db.add(availability)
    else:
        availability.minutes_available = payload.minutes_available
        availability.source = payload.source

    db.commit()
    db.refresh(availability)
    return availability


def get_daily_availability(db: Session, user_id: str, day: date) -> DailyAvailability | None:
    stmt = select(DailyAvailability).where(DailyAvailability.user_id == user_id, DailyAvailability.day == day)
    return db.scalar(stmt)


def serialize_availability(availability: DailyAvailability) -> DailyAvailabilityRead:
    return DailyAvailabilityRead(
        id=availability.id,
        user_id=availability.user_id,
        day=availability.day,
        minutes_available=availability.minutes_available,
        source=availability.source,
        created_at=availability.created_at,
    )
