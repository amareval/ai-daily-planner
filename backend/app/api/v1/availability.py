from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.schemas.availability import DailyAvailabilityCreate, DailyAvailabilityRead
from app.services import availability as availability_service
from app.services import users as user_service

router = APIRouter()


@router.post("/availability", response_model=DailyAvailabilityRead, status_code=status.HTTP_201_CREATED)
def upsert_availability(
    payload: DailyAvailabilityCreate,
    db: Session = Depends(get_db_session),
) -> DailyAvailabilityRead:
    if user_service.get_user(db, payload.user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    availability = availability_service.upsert_daily_availability(db, payload)
    return availability_service.serialize_availability(availability)


@router.get("/availability", response_model=DailyAvailabilityRead)
def fetch_availability(
    user_id: str = Query(...),
    day: date = Query(...),
    db: Session = Depends(get_db_session),
) -> DailyAvailabilityRead:
    availability = availability_service.get_daily_availability(db, user_id=user_id, day=day)
    if availability is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability not found")
    return availability_service.serialize_availability(availability)
