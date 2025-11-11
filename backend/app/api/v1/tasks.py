from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.schemas.task import TaskCreate, TaskRead
from app.services import tasks as task_service
from app.services import users as user_service

router = APIRouter()


@router.post("/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db_session)) -> TaskRead:
    user = user_service.get_user(db, payload.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    task = task_service.create_task(db, payload)
    return task_service.serialize_task(task)


@router.get("/tasks", response_model=list[TaskRead])
def list_tasks(
    user_id: str = Query(..., description="User identifier"),
    scheduled_date: date = Query(..., description="Date to filter tasks by"),
    db: Session = Depends(get_db_session),
) -> list[TaskRead]:
    user = user_service.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    tasks = task_service.list_tasks_for_day(db, user_id=user_id, scheduled_day=scheduled_date)
    return [task_service.serialize_task(t) for t in tasks]
