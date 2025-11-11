from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.schemas.brief import DailyBrief, DailyBriefRequest
from app.services import briefs as brief_service
from app.services import users as user_service

router = APIRouter()


@router.post("/briefs", response_model=DailyBrief, status_code=status.HTTP_200_OK)
def generate_brief(payload: DailyBriefRequest, db: Session = Depends(get_db_session)) -> DailyBrief:
    if user_service.get_user(db, payload.user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    try:
        return brief_service.generate_daily_brief(db, user_id=payload.user_id, brief_date=payload.scheduled_date)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
