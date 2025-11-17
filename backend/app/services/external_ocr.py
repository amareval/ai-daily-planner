from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from google.cloud import documentai_v1 as documentai

from app.core.config import settings


def use_document_ai(pdf_path: Path) -> list[dict]:
    project_id = settings.google_project_id
    location = settings.google_location
    processor_id = settings.google_processor_id
    credentials_path = settings.google_credentials_path

    if not (project_id and processor_id and credentials_path):
        return []

    client = documentai.DocumentProcessorServiceClient.from_service_account_file(credentials_path)
    name = client.processor_path(project_id, location, processor_id)

    with pdf_path.open("rb") as pdf_file:
        raw_document = documentai.RawDocument(content=pdf_file.read(), mime_type="application/pdf")

    request = documentai.ProcessRequest(name=name, raw_document=raw_document)
    result = client.process_document(request=request)
    document = result.document

    lines: list[dict] = []
    for page_index, page in enumerate(document.pages):
        source_elements = page.lines if page.lines else page.paragraphs
        for element in source_elements:
            text = _layout_to_text(element.layout, document)
            if not text.strip():
                continue
            bbox = _extract_normalized_bbox(element.layout)
            lines.append({"text": text.strip(), "bbox": bbox, "page_index": page_index})
    return lines


def _layout_to_text(layout: documentai.Document.Page.Layout, document: documentai.Document) -> str:
    if layout.text_anchor is None:
        return ""
    segments = layout.text_anchor.text_segments
    if not segments:
        return ""
    text = ""
    for segment in segments:
        start_index = int(segment.start_index or 0)
        end_index = int(segment.end_index or 0)
        text += document.text[start_index:end_index]
    return text


def _extract_normalized_bbox(layout: documentai.Document.Page.Layout) -> list[tuple[float, float]]:
    if layout is None or layout.bounding_poly is None:
        return []
    poly = layout.bounding_poly
    if poly.normalized_vertices:
        return [(vertex.x, vertex.y) for vertex in poly.normalized_vertices]
    if poly.vertices:
        # Fall back to absolute vertices by normalizing with 1000.
        return [(vertex.x / 1000.0, vertex.y / 1000.0) for vertex in poly.vertices]
    return []
