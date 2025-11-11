from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.schemas.user import UserCreate, UserRead
from app.services import users as user_service

router = APIRouter()


@router.post("/onboarding", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def onboard_user(payload: UserCreate, db: Session = Depends(get_db_session)) -> UserRead:
    user = user_service.upsert_user_with_goal(db, payload)
    return user_service.serialize_user(user)


@router.get("/users/{user_id}", response_model=UserRead)
def fetch_user(user_id: str, db: Session = Depends(get_db_session)) -> UserRead:
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user_service.serialize_user(user)
