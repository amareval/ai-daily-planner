from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskRead


def create_task(db: Session, payload: TaskCreate) -> Task:
    task = Task(
        user_id=payload.user_id,
        title=payload.title,
        notes=payload.notes,
        scheduled_date=payload.scheduled_date,
        estimated_minutes=payload.estimated_minutes,
        source=payload.source,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def list_tasks_for_day(db: Session, user_id: str, scheduled_day: date) -> list[Task]:
    stmt = select(Task).where(Task.user_id == user_id, Task.scheduled_date == scheduled_day).order_by(Task.created_at)
    return list(db.scalars(stmt))


def serialize_task(task: Task) -> TaskRead:
    return TaskRead(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        notes=task.notes,
        scheduled_date=task.scheduled_date,
        estimated_minutes=task.estimated_minutes,
        status=task.status,
        source=task.source,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )
