from __future__ import annotations

import re
from datetime import date, datetime
from difflib import get_close_matches
from pathlib import Path
from typing import Iterable

from fastapi import UploadFile
from pdf2image import convert_from_path
from PIL import Image
from pytesseract import Output, image_to_data
import easyocr
import numpy as np
from pypdf import PdfReader
import pytesseract
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.pdf_ingestion import PDFIngestion
from app.models.task import Task
from app.schemas.pdf import PDFIngestionWithTasks
from app.services.llm_cleanup import clean_task_lines_with_llm
from app.services.external_ocr import use_document_ai

STORAGE_ROOT = Path(__file__).resolve().parents[2] / "storage" / "uploads"
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

LINE_PATTERN = re.compile(r"^[\-\u2022\*\d\)\(\.\s]*(.+)$")
DURATION_PATTERN = re.compile(r"\((\d{1,3})\s?(?:m|min|minutes)\)", re.IGNORECASE)
REPLACEMENTS = {
    "\\": "l",
    "—": "-",
    "°": "",
    "|": "l",
    "•": "-",
}
COMMON_FIXES = {
    "inveryitw": "interview",
    "agrnee": "agree",
    "poupo": "followup",
    "ibson": "gibson",
}
CANONICAL_WORDS = [
    "workout",
    "focus",
    "time",
    "test",
    "ai",
    "youtube",
    "realtor",
    "followup",
    "paypal",
    "interview",
    "notes",
    "house",
    "laundry",
    "prep",
    "review",
    "component",
    "email",
    "resume",
]


def save_upload_to_disk(file: UploadFile, ingestion_id: str) -> Path:
    destination = STORAGE_ROOT / f"{ingestion_id}_{file.filename}"
    with destination.open("wb") as buffer:
        buffer.write(file.file.read())
    return destination


def extract_lines_from_pdf(pdf_path: Path) -> list[dict]:
    reader = PdfReader(str(pdf_path))
    lines: list[dict] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        for raw_line in text.splitlines():
            match = LINE_PATTERN.match(raw_line.strip())
            if not match:
                continue
            normalized = normalize_text_line(match.group(1))
            if normalized:
                lines.append({"text": normalized, "crossed": False})
    return lines


def ocr_pdf_lines(pdf_path: Path) -> list[dict]:
    images: list[Image.Image] = []
    try:
        images = convert_from_path(str(pdf_path))
    except Exception:  # pragma: no cover
        images = []

    doc_ai_lines = use_document_ai(pdf_path)
    if doc_ai_lines:
        normalized: list[dict] = []
        for item in doc_ai_lines:
            text = item.get("text", "").strip()
            if not text:
                continue
            page_index = item.get("page_index", 0)
            bbox = item.get("bbox", [])
            crossed = False
            if bbox and page_index < len(images):
                gray = images[page_index].convert("L")
                pixel_bbox = _normalized_bbox_to_pixels(bbox, gray.size)
                crossed = _detect_strikethrough(gray, pixel_bbox)
            normalized.append({"text": normalize_text_line(text), "crossed": crossed})
        return normalized

    if not images:
        return []

    ocr_lines: list[dict] = []
    reader = easyocr.Reader(["en"], gpu=False)

    for image in images:
        if not isinstance(image, Image.Image):
            continue
        gray = image.convert("L")
        easy_lines = reader.readtext(np.array(gray), detail=1)
        if easy_lines:
            for bbox, raw_line, _ in easy_lines:
                normalized = normalize_text_line(raw_line)
                if not normalized:
                    continue
                top = min(point[1] for point in bbox)
                bottom = max(point[1] for point in bbox)
                left = min(point[0] for point in bbox)
                right = max(point[0] for point in bbox)
                crossed = _detect_strikethrough(gray, [left, top, right, bottom])
                ocr_lines.append({"text": normalized, "crossed": crossed})
            continue

        data = image_to_data(gray, output_type=Output.DICT)
        buckets: dict[tuple[int, int, int], dict] = {}
        n = len(data["text"])
        for idx in range(n):
            text = data["text"][idx].strip()
            if not text:
                continue
            key = (data["block_num"][idx], data["par_num"][idx], data["line_num"][idx])
            bucket = buckets.setdefault(
                key,
                {
                    "text": [],
                    "bbox": [
                        data["left"][idx],
                        data["top"][idx],
                        data["left"][idx] + data["width"][idx],
                        data["top"][idx] + data["height"][idx],
                    ],
                },
            )
            bucket["text"].append(text)
            bbox = bucket["bbox"]
            bbox[0] = min(bbox[0], data["left"][idx])
            bbox[1] = min(bbox[1], data["top"][idx])
            bbox[2] = max(bbox[2], data["left"][idx] + data["width"][idx])
            bbox[3] = max(bbox[3], data["top"][idx] + data["height"][idx])

        for bucket in buckets.values():
            line_text = normalize_text_line(" ".join(bucket["text"]))
            if not line_text:
                continue
            crossed = _detect_strikethrough(gray, bucket["bbox"])
            ocr_lines.append({"text": line_text, "crossed": crossed})
    return ocr_lines


def _detect_strikethrough(image: Image.Image, bbox: list[int]) -> bool:
    x1, y1, x2, y2 = bbox
    if x2 <= x1 or y2 <= y1:
        return False
    width = x2 - x1
    height = y2 - y1
    if width <= 0 or height <= 0:
        return False
    band_height = max(1, int(height * 0.08))
    center_y = y1 + int(height * 0.82)
    top = max(y1, center_y - band_height // 2)
    bottom = min(y2, center_y + band_height // 2)
    if bottom <= top:
        return False
    sample = image.crop((x1, top, x2, bottom))
    pixels = list(sample.getdata())
    if not pixels:
        return False
    dark_pixels = sum(1 for value in pixels if value < 85)
    dark_ratio = dark_pixels / len(pixels)
    aspect_ratio = width / max(1, band_height)
    return dark_ratio > 0.45 and aspect_ratio > 6


def _normalized_bbox_to_pixels(bbox: list[tuple[float, float]], size: tuple[int, int]) -> list[int]:
    width, height = size
    xs = [int(max(0, min(1, x)) * width) for x, _ in bbox]
    ys = [int(max(0, min(1, y)) * height) for _, y in bbox]
    if not xs or not ys:
        return [0, 0, width, height]
    return [min(xs), min(ys), max(xs), max(ys)]


def parse_tasks_from_lines(lines: Iterable[dict | str]) -> list[dict]:
    tasks: list[dict] = []
    for line in lines:
        if isinstance(line, dict):
            text = line.get("text", "").strip()
            if not text or line.get("crossed"):
                continue
        else:
            text = line.strip()
            if not text:
                continue
        if len(text) < 3:
            continue
        estimated_minutes = None
        duration_match = DURATION_PATTERN.search(text)
        title = text
        if duration_match:
            estimated_minutes = int(duration_match.group(1))
            title = DURATION_PATTERN.sub("", text).strip(" -–")
        tasks.append({"title": title, "estimated_minutes": estimated_minutes})
    return tasks


def normalize_text_line(line: str) -> str:
    cleaned = line.strip()
    for bad, good in REPLACEMENTS.items():
        cleaned = cleaned.replace(bad, good)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    lower = cleaned.lower()
    for typo, correct in COMMON_FIXES.items():
        if typo in lower:
            cleaned = lower.replace(typo, correct)
            lower = cleaned
    words = []
    for token in cleaned.split():
        if len(token) < 3:
            words.append(token)
            continue
        match = get_close_matches(token.lower().strip("-"), CANONICAL_WORDS, n=1, cutoff=0.72)
        if match:
            replacement = match[0]
            if token.istitle():
                replacement = replacement.title()
            words.append(replacement)
        else:
            words.append(token)
    cleaned_text = " ".join(words)
    return cleaned_text.strip(" -–.")


def ingest_pdf(
    db: Session,
    *,
    user_id: str,
    file: UploadFile,
    scheduled_date: date,
) -> PDFIngestionWithTasks:
    ingestion = PDFIngestion(user_id=user_id, original_filename=file.filename, stored_path="")
    db.add(ingestion)
    db.flush()

    try:
        stored_path = save_upload_to_disk(file, ingestion.id)
        ingestion.stored_path = str(stored_path)
        lines = extract_lines_from_pdf(stored_path)

        if not lines:
            lines = ocr_pdf_lines(stored_path)

        raw_text = "\n".join(line["text"] if isinstance(line, dict) else line for line in lines)
        eligible_for_cleanup = [
            line["text"]
            if isinstance(line, dict) and not line.get("crossed")
            else line
            for line in lines
            if not (isinstance(line, dict) and line.get("crossed"))
        ]
        cleaned_lines = clean_task_lines_with_llm(eligible_for_cleanup)
        parsed_tasks = parse_tasks_from_lines(cleaned_lines)

        created_task_titles: list[str] = []
        for payload in parsed_tasks:
            if not payload["title"]:
                continue
            task = Task(
                user_id=user_id,
                title=payload["title"],
                scheduled_date=scheduled_date,
                estimated_minutes=payload["estimated_minutes"],
                source="pdf",
                pdf_ingestion_id=ingestion.id,
            )
            db.add(task)
            created_task_titles.append(task.title)

        ingestion.status = "parsed"
        ingestion.parsed_task_count = len(created_task_titles)
        ingestion.completed_at = datetime.utcnow()
        ingestion.raw_text = raw_text
        db.commit()
        db.refresh(ingestion)

        return PDFIngestionWithTasks(
            id=ingestion.id,
            user_id=user_id,
            original_filename=ingestion.original_filename,
            status=ingestion.status,
            parsed_task_count=ingestion.parsed_task_count,
            error_message=ingestion.error_message,
            created_at=ingestion.created_at,
            completed_at=ingestion.completed_at,
            tasks_created=created_task_titles,
        )
    except Exception as exc:  # pragma: no cover - defensive, logged upstream
        ingestion.status = "failed"
        ingestion.error_message = str(exc)
        ingestion.completed_at = datetime.utcnow()
        db.commit()
        raise


def get_ingestion(db: Session, ingestion_id: str) -> PDFIngestion | None:
    stmt = select(PDFIngestion).where(PDFIngestion.id == ingestion_id)
    return db.scalar(stmt)
