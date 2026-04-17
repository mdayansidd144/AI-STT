# from fastapi import APIRouter, Depends, HTTPException
# from fastapi.responses import FileResponse
# from sqlalchemy.orm import Session
# from datetime import datetime
# from typing import Optional

# from app.core.database import get_db
# from app.services.pdf_export import PDFExportService
# from app.models.user import User
# from app.models.transcription import Transcription
# from app.api.auth import get_current_user

# router = APIRouter()
# pdf_service = PDFExportService()

# @router.post("/export/pdf")
# async def export_to_pdf(
#     original_text: str,
#     translated_text: str = "",
#     source_lang: str = "en",
#     target_lang: str = "",
#     processing_time_ms: int = 0,
#     word_count: int = 0,
#     accuracy_score: float = 0,
#     current_user: User = Depends(get_current_user)
# ):
#     """Export single transcription to PDF"""
    
#     pdf_path = await pdf_service.create_pdf(
#         original_text=original_text,
#         translated_text=translated_text,
#         source_lang=source_lang,
#         target_lang=target_lang,
#         user_name=current_user.username,
#         processing_time_ms=processing_time_ms,
#         word_count=word_count,
#         accuracy_score=accuracy_score
#     )
    
#     return FileResponse(
#         pdf_path,
#         media_type="application/pdf",
#         filename=f"transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
#         headers={"Content-Disposition": "attachment; filename=transcript.pdf"}
#     )

# @router.post("/export/batch")
# async def export_batch_to_pdf(
#     transcription_ids: list[int],
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Export multiple transcriptions to PDF"""
    
#     transcriptions = db.query(Transcription).filter(
#         Transcription.id.in_(transcription_ids),
#         Transcription.user_id == current_user.id
#     ).all()
    
#     if not transcriptions:
#         raise HTTPException(status_code=404, detail="No transcriptions found")
    
#     data = [{
#         "text": t.original_text,
#         "translated_text": t.translated_text,
#         "language": t.detected_language,
#         "created_at": t.created_at.strftime('%Y-%m-%d %H:%M:%S')
#     } for t in transcriptions]
    
#     pdf_path = await pdf_service.create_batch_pdf(data, current_user.username)
    
#     return FileResponse(
#         pdf_path,
#         media_type="application/pdf",
#         filename=f"batch_transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
#     )
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List

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
    
    try:
        pdf_path = await pdf_service.create_pdf(
            original_text=original_text,
            translated_text=translated_text,
            source_lang=source_lang,
            target_lang=target_lang,
            source=source_lang,  # ✅ Match parameter name
            target=target_lang    # ✅ Match parameter name
        )
        
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.post("/export/batch")
async def export_batch_to_pdf(
    transcription_ids: List[int],
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
    
    # ✅ Create batch PDF manually since create_batch_pdf doesn't exist
    from fpdf import FPDF
    from datetime import datetime
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"batch_transcript_{timestamp}.pdf"
    filepath = pdf_service.output_dir / filename
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font('Helvetica', '', 12)
    
    # Title
    pdf.set_font_size(20)
    pdf.cell(0, 10, "AI Speech-to-Text - Batch Transcript", ln=True, align='C')
    pdf.ln(10)
    
    # Metadata
    pdf.set_font_size(10)
    pdf.cell(0, 6, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
    pdf.cell(0, 6, f"User: {current_user.username}", ln=True)
    pdf.cell(0, 6, f"Total Transcriptions: {len(transcriptions)}", ln=True)
    pdf.ln(10)
    
    # Each transcription
    for idx, t in enumerate(transcriptions, 1):
        pdf.set_font_size(12)
        pdf.set_font(style='B')
        pdf.cell(0, 8, f"Transcription #{idx}", ln=True)
        pdf.set_font_size(10)
        pdf.set_font(style='')
        pdf.cell(0, 5, f"Date: {t.created_at.strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
        pdf.cell(0, 5, f"Language: {t.detected_language.upper() if t.detected_language else 'Unknown'}", ln=True)
        pdf.ln(3)
        
        pdf.set_font_size(10)
        pdf.multi_cell(0, 5, t.original_text)
        pdf.ln(5)
        
        if t.translated_text:
            pdf.set_font(style='I')
            pdf.multi_cell(0, 5, f"[Translation]: {t.translated_text}")
            pdf.set_font(style='')
            pdf.ln(5)
        
        if idx < len(transcriptions):
            pdf.add_page()
    
    pdf.output(str(filepath))
    
    return FileResponse(
        str(filepath),
        media_type="application/pdf",
        filename=filename
    )