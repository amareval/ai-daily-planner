from __future__ import annotations

import logging
from typing import Iterable

import httpx
from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


def clean_task_lines_with_llm(lines: Iterable[str]) -> list[str]:
    api_key = settings.openai_api_key
    if not api_key:
        return list(lines)

    client = OpenAI(api_key=api_key)
    prompt_lines = "\n".join(f"- {line}" for line in lines)
    prompt = (
        "You are cleaning up messy OCR output from a handwritten to-do list. "
        "Fix only obvious spelling mistakes and spacing while keeping each task's meaning intact. "
        "Never invent new tasks or replace words with unrelated ones. "
        "Return the cleaned list as a numbered list. "
        "Example:\nMessy Input: '- y deveat evil'\nClean Output: '1. workout'\n\n"
        f"OCR Input:\n{prompt_lines}\n\nClean list:"
    )

    try:
        response = client.responses.create(
            model=settings.openai_model,
            input=prompt,
        )
        content = response.output[0].content[0].text  # type: ignore[attr-defined]
        cleaned = []
        for line in content.splitlines():
            stripped = line.strip(" -")
            if not stripped:
                continue
            if ". " in stripped[:4]:
                _, maybe = stripped.split(". ", 1)
                cleaned.append(maybe.strip())
            else:
                cleaned.append(stripped)
        return cleaned or list(lines)
    except (httpx.HTTPError, Exception) as exc:  # pragma: no cover
        logger.warning("LLM cleanup failed: %s", exc)
        return list(lines)
