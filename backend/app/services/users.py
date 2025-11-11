from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import Goal, User
from app.schemas.user import GoalCreate, GoalRead, UserCreate, UserRead


def upsert_user_with_goal(db: Session, payload: UserCreate) -> User:
    stmt = select(User).where(User.email == payload.email)
    user = db.scalar(stmt)

    if user is None:
        user = User(email=payload.email, full_name=payload.full_name, timezone=payload.timezone)
        db.add(user)
        db.flush()
    else:
        user.full_name = payload.full_name
        user.timezone = payload.timezone

    if payload.goal:
        goal = Goal(
            user_id=user.id,
            goal_statement=payload.goal.goal_statement,
            target_role=payload.goal.target_role,
            industry=payload.goal.industry,
            skills_focus=payload.goal.skills_focus,
            default_learning_minutes=payload.goal.default_learning_minutes,
        )
        db.add(goal)

    db.commit()
    db.refresh(user)
    return user


def get_user(db: Session, user_id: str) -> User | None:
    return db.get(User, user_id)


def serialize_goal(goal: Goal) -> GoalRead:
    return GoalRead(
        id=goal.id,
        goal_statement=goal.goal_statement,
        target_role=goal.target_role,
        industry=goal.industry,
        skills_focus=goal.skills_focus,
        default_learning_minutes=goal.default_learning_minutes,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
    )


def serialize_user(user: User) -> UserRead:
    latest_goal = user.goals[-1] if user.goals else None
    return UserRead(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        timezone=user.timezone,
        created_at=user.created_at,
        updated_at=user.updated_at,
        goal=serialize_goal(latest_goal) if latest_goal else None,
    )
