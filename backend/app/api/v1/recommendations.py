from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.schemas.recommendation import RecommendationRequest, RecommendationsResponse
from app.services import recommendations as recommendations_service
from app.services import users as user_service

router = APIRouter()


@router.post("/recommendations", response_model=RecommendationsResponse, status_code=status.HTTP_200_OK)
def fetch_recommendations(payload: RecommendationRequest, db: Session = Depends(get_db_session)) -> RecommendationsResponse:
    if user_service.get_user(db, payload.user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    try:
        return recommendations_service.generate_recommendations(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
