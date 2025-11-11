from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from app.schemas.brief import DailyBrief, LearningSuggestion
from app.schemas.task import TaskRead
from app.services import availability as availability_service
from app.services import tasks as task_service
from app.services import users as user_service


def generate_daily_brief(db: Session, user_id: str, brief_date: date) -> DailyBrief:
    user = user_service.get_user(db, user_id)
    if user is None:
        raise ValueError("User not found")

    raw_tasks = task_service.list_tasks_for_day(db, user_id=user_id, scheduled_day=brief_date)
    tasks = [task_service.serialize_task(t) for t in raw_tasks]
    total_task_minutes = sum(filter(None, (task.estimated_minutes for task in tasks)))

    availability = availability_service.get_daily_availability(db, user_id=user_id, day=brief_date)
    learning_minutes_budget = max(((availability.minutes_available if availability else 0) - total_task_minutes), 0)

    suggestion_payload = build_learning_suggestions(
        goal_statement=(user.goals[-1].goal_statement if user.goals else "Stay productive"),
        minutes_budget=learning_minutes_budget,
    )

    return DailyBrief(
        user_id=user_id,
        goal_statement=suggestion_payload["goal_statement"],
        scheduled_date=brief_date,
        total_task_minutes=total_task_minutes,
        tasks=tasks,
        learning_suggestions=suggestion_payload["items"],
    )


def build_learning_suggestions(goal_statement: str, minutes_budget: int) -> dict:
    categories = [
        ("Skill Drill", "Hands-on exercise to sharpen a critical capability."),
        ("Market Pulse", "Stay current on industry or role-specific news."),
        ("Job Search Tactic", "Concrete action to move applications forward."),
    ]

    durations = _allocate_minutes(minutes_budget)
    suggestions: list[LearningSuggestion] = []

    for idx, (title_prefix, description) in enumerate(categories):
        short_goal = " ".join(goal_statement.split()[0:3]) or "Goal"
        suggestions.append(
            LearningSuggestion(
                title=f"{title_prefix}: {short_goal} Focus",
                description=description,
                resource_url=None,
                time_minutes=durations[idx],
                category=title_prefix,
            )
        )

    return {"goal_statement": goal_statement, "items": suggestions}


def _allocate_minutes(minutes_budget: int) -> list[int]:
    if minutes_budget <= 0:
        return [20, 15, 15]

    base = max(minutes_budget // 3, 15)
    return [base + 10, base, base]
