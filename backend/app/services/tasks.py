from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import CarryForwardRequest, TaskCreate, TaskRead, TaskUpdate


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


def update_task(db: Session, task_id: str, payload: TaskUpdate) -> Task | None:
    task = db.get(Task, task_id)
    if task is None:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


def carry_forward_tasks(db: Session, request: CarryForwardRequest) -> list[Task]:
    to_date = request.to_date or request.from_date + timedelta(days=1)
    stmt = select(Task).where(
        Task.user_id == request.user_id,
        Task.scheduled_date == request.from_date,
        Task.status != "complete",
    )
    tasks = list(db.scalars(stmt))
    for task in tasks:
        task.scheduled_date = to_date
        task.status = "pending"
    db.commit()
    return tasks


def delete_task(db: Session, task_id: str) -> bool:
    task = db.get(Task, task_id)
    if task is None:
        return False
    db.delete(task)
    db.commit()
    return True


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
        pdf_ingestion_id=task.pdf_ingestion_id,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )
