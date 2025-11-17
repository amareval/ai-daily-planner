from __future__ import annotations

from datetime import datetime, timedelta
from typing import Sequence
import json
import logging
from urllib.parse import quote_plus

from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.recommendation_history import RecommendationHistory
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationsResponse,
    RecommendedTodo,
)
from app.services import users as user_service

logger = logging.getLogger(__name__)


def generate_recommendations(db: Session, payload: RecommendationRequest) -> RecommendationsResponse:
    user = user_service.get_user(db, payload.user_id)
    if user is None:
        raise ValueError("User not found")

    latest_goal = user.goals[-1] if user.goals else None
    if latest_goal is None:
        raise ValueError("User has not set a goal yet")

    primary_goal = payload.primary_goal or latest_goal.goal_statement
    secondary_goals = payload.secondary_goals or latest_goal.secondary_goals or "related priorities"
    focus_term = payload.skills_focus or latest_goal.skills_focus or "progress"
    budget = latest_goal.default_learning_minutes or 90

    context = {
        "primary_goal": primary_goal,
        "secondary_goals": secondary_goals,
        "focus": focus_term,
    }

    todos = _call_llm_recommendations(primary_goal, secondary_goals, focus_term, budget)
    if not todos:
        durations = _allocate_minutes(budget)
        logger.info("Falling back to template recommendations for goal=%s", primary_goal)
        todos = _build_template_todos(context, durations)

    filtered = _filter_recent_duplicates(db, payload.user_id, todos)
    if filtered:
        final_todos = filtered
    else:
        final_todos = todos
        logger.info("All recommended todos for user=%s were duplicates within 15 days; keeping original set", payload.user_id)

    _persist_recommendation_history(db, payload.user_id, final_todos)

    return RecommendationsResponse(
        user_id=user.id,
        scheduled_date=payload.scheduled_date,
        goal_statement=primary_goal,
        recommended_todos=final_todos,
    )


def _call_llm_recommendations(primary_goal: str, secondary_goals: str, focus_term: str, budget: int) -> list[RecommendedTodo]:
    api_key = settings.openai_api_key
    if not api_key:
        logger.info("Skipping LLM recommendations because OPENAI_API_KEY is not configured")
        return []

    prompt = (
        "You are a focused productivity coach crafting three recommended to-dos for a professional. "
        "Always use the following structure and output valid JSON with a top-level `recommended_todos` array. "
        "Each todo must include `title`, `description`, `category`, `estimated_minutes`, and `resource_url`. "
        "Set `category` to one of: Research, Practice, Share. "
        "Lean on short YouTube explainers or concise online readings. "
        f"Primary goal: {primary_goal}\n"
        f"Secondary goals: {secondary_goals}\n"
        f"Skills focus: {focus_term}\n"
        f"Available minutes: {budget}\n"
        "Distribute the time across the three todos balancing depth and urgency. "
        "Keep descriptions practical and action-oriented."
    )

    try:
        client = OpenAI(api_key=api_key)
        response = client.responses.create(model=settings.openai_model, input=prompt)
        content = response.output[0].content[0].text  # type: ignore[attr-defined]
        payload = _extract_json_block(content)
        if not payload:
            logger.warning("LLM response did not include parsable JSON block; content=%s", content)
            return []
        todos_data = payload.get("recommended_todos")
        if not isinstance(todos_data, list):
            logger.warning("LLM response missing recommended_todos array; payload=%s", payload)
            return []

        normalized: list[RecommendedTodo] = []
        for entry in todos_data[:3]:
            if not isinstance(entry, dict):
                continue
            title = entry.get("title")
            description = entry.get("description")
            category = entry.get("category")
            minutes = entry.get("estimated_minutes") or entry.get("estimatedMinutes")
            resource_url = entry.get("resource_url") or entry.get("resourceUrl")
            if not (title and description and category):
                continue
            try:
                minutes = int(minutes)
            except (TypeError, ValueError):
                minutes = max(budget // 3, 15)
            minutes = max(10, min(minutes, 240))
            normalized.append(
                RecommendedTodo(
                    title=title,
                    description=description,
                    category=category,
                    estimated_minutes=minutes,
                    resource_url=resource_url,
                )
            )
        return normalized
    except Exception as exc:  # pragma: no cover
        logger.warning("LLM recommendation failed: %s", exc)
        return []


def _extract_json_block(raw: str) -> dict | None:
    if not raw:
        return None
    start = raw.find("{")
    if start == -1:
        return None
    end = raw.rfind("}")
    if end == -1 or end < start:
        return None
    candidate = raw[start : end + 1]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError as exc:
        logger.warning("LLM recommendation payload not parseable as JSON: %s", exc)
        return None


def _build_template_todos(context: dict[str, str], durations: list[int]) -> list[RecommendedTodo]:
    templates = _recommendation_templates()
    todos: list[RecommendedTodo] = []
    primary_snippet = " ".join(context["primary_goal"].split()[:3]) or "Goal"
    for idx, template in enumerate(templates):
        estimated_minutes = durations[idx] if idx < len(durations) else durations[-1]
        description = template["description"].format(**context)
        resource_query_template = template.get("resource_query")
        resource_query = resource_query_template.format(**context) if resource_query_template else None
        resource_url = _build_resource_url(resource_query, template.get("resource_type"))
        todos.append(
            RecommendedTodo(
                title=f"{template['label']}: {primary_snippet}",
                category=template["label"],
                description=description,
                estimated_minutes=estimated_minutes,
                resource_url=resource_url,
            )
        )
    return todos


def _filter_recent_duplicates(db: Session, user_id: str, todos: list[RecommendedTodo]) -> list[RecommendedTodo]:
    if not todos:
        return []
    cutoff = datetime.utcnow() - timedelta(days=15)
    stmt = select(RecommendationHistory).where(
        RecommendationHistory.user_id == user_id,
        RecommendationHistory.created_at >= cutoff,
    )
    history = db.scalars(stmt).all()
    seen_titles = {entry.title.strip().lower() for entry in history if entry.title}
    seen_urls = {entry.resource_url for entry in history if entry.resource_url}
    unique: list[RecommendedTodo] = []
    for todo in todos:
        title_key = todo.title.strip().lower()
        if title_key in seen_titles:
            continue
        if todo.resource_url and todo.resource_url in seen_urls:
            continue
        unique.append(todo)
    return unique


def _persist_recommendation_history(db: Session, user_id: str, todos: list[RecommendedTodo]) -> None:
    if not todos:
        return
    now = datetime.utcnow()
    entries = [
        RecommendationHistory(
            user_id=user_id,
            title=todo.title,
            resource_url=todo.resource_url,
            category=todo.category,
            estimated_minutes=todo.estimated_minutes,
            created_at=now,
        )
        for todo in todos
    ]
    db.add_all(entries)
    db.commit()


def _recommendation_templates() -> Sequence[dict[str, str | None]]:
    return [
        {
            "label": "Research",
            "description": "Watch a short YouTube explainer or read a quick brief that connects {primary_goal} to industry shifts. Note two insights that inform {secondary_goals}.",
            "resource_query": "YouTube {primary_goal} trends",
            "resource_type": "youtube",
        },
        {
            "label": "Practice",
            "description": "Lean into a video lesson or article on {focus} and immediately try a tiny exercise that ties what you learn back to {primary_goal}.",
            "resource_query": "YouTube {focus} tutorial {primary_goal}",
            "resource_type": "youtube",
        },
        {
            "label": "Share",
            "description": "Document what you learned for {secondary_goals} by summarizing a video/article, and publish it so the learning momentum stays visible.",
            "resource_query": "article {secondary_goals} reflection prompts",
            "resource_type": "reading",
        },
    ]


def _build_resource_url(query: str | None, resource_type: str | None = None) -> str | None:
    if not query:
        return None
    encoded = quote_plus(query)
    if resource_type == "youtube":
        return f"https://www.youtube.com/results?search_query={encoded}"
    return f"https://www.google.com/search?q={encoded}"


def _allocate_minutes(minutes_budget: int) -> list[int]:
    if minutes_budget <= 0:
        return [20, 15, 15]

    base = max(minutes_budget // 3, 15)
    return [
        min(base + 5, 240),
        min(base, 240),
        min(max(base - 5, 10), 240),
    ]
