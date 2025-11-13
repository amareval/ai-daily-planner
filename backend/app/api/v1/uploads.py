from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi import Form
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.schemas.pdf import PDFIngestionWithTasks
from app.services import pdf_ingestions as pdf_service
from app.services import users as user_service

router = APIRouter()


@router.post("/uploads/pdf", response_model=PDFIngestionWithTasks, status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    user_id: str = Form(...),
    scheduled_date: date = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
) -> PDFIngestionWithTasks:
    if user_service.get_user(db, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    try:
        return pdf_service.ingest_pdf(db, user_id=user_id, file=file, scheduled_date=scheduled_date)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
