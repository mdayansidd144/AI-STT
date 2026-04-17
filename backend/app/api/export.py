from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.services.pdf_export import PDFExportService
from app.models.user import User
from app.models.transcription import Transcription
from app.api.auth import get_current_user

router = APIRouter()
pdf_service = PDFExportService()

@router.post("/export/pdf")
async def export_to_pdf(
    original_text: str,
    translated_text: str = "",
    source_lang: str = "en",
    target_lang: str = "",
    processing_time_ms: int = 0,
    word_count: int = 0,
    accuracy_score: float = 0,
    current_user: User = Depends(get_current_user)
):
    """Export single transcription to PDF"""
    
    pdf_path = await pdf_service.create_pdf(
        original_text=original_text,
        translated_text=translated_text,
        source_lang=source_lang,
        target_lang=target_lang,
        user_name=current_user.username,
        processing_time_ms=processing_time_ms,
        word_count=word_count,
        accuracy_score=accuracy_score
    )
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
        headers={"Content-Disposition": "attachment; filename=transcript.pdf"}
    )

@router.post("/export/batch")
async def export_batch_to_pdf(
    transcription_ids: list[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export multiple transcriptions to PDF"""
    
    transcriptions = db.query(Transcription).filter(
        Transcription.id.in_(transcription_ids),
        Transcription.user_id == current_user.id
    ).all()
    
    if not transcriptions:
        raise HTTPException(status_code=404, detail="No transcriptions found")
    
    data = [{
        "text": t.original_text,
        "translated_text": t.translated_text,
        "language": t.detected_language,
        "created_at": t.created_at.strftime('%Y-%m-%d %H:%M:%S')
    } for t in transcriptions]
    
    pdf_path = await pdf_service.create_batch_pdf(data, current_user.username)
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"batch_transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    )