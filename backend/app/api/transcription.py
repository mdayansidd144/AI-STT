# from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
# from sqlalchemy.orm import Session
# import tempfile
# import os
# from datetime import datetime
# from typing import Optional

# from app.core.database import get_db
# from app.services.transcriber import TranscriberService
# from app.services.audio_processor import AudioProcessor
# from app.services.adaptive_learner import AdaptiveLearner
# from app.services.translation_service import TranslationService
# from app.models.user import User
# from app.models.transcription import Transcription
# from app.api.auth import get_current_user

# router = APIRouter()
# transcriber = TranscriberService()
# audio_processor = AudioProcessor()
# translation_service = TranslationService()

# @router.post("/transcribe")
# async def transcribe_audio(
#     file: UploadFile = File(...),
#     language: str = "auto",
#     translate_to: str = "",
#     user_id: Optional[int] = None,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Transcribe audio with adaptive learning"""
    
#     content = await file.read()
    
#     if len(content) < 1000:
#         raise HTTPException(status_code=400, detail="Audio file too small")
    
#     # Save temp file
#     with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
#         tmp.write(content)
#         temp_path = tmp.name
    
#     try:
#         # Apply noise reduction
#         enhanced_path = await audio_processor.enhance_audio(temp_path)
        
#         # Transcribe
#         result = await transcriber.transcribe(enhanced_path, language)
        
#         if result.get("success"):
#             # Apply adaptive corrections
#             adaptive_learner = AdaptiveLearner(db)
#             corrected_text = await adaptive_learner.apply_corrections(
#                 result["text"], current_user.id, result["language"]
#             )
            
#             # Translate if requested
#             translated_text = None
#             if translate_to and translate_to != "none" and translate_to != "":
#                 if translate_to != result.get("language", "en"):
#                     translation = await translation_service.translate(
#                         corrected_text,
#                         result.get("language", "en"),
#                         translate_to
#                     )
#                     if translation.get("success"):
#                         translated_text = translation["translated_text"]
            
#             # Save to database
#             transcription = Transcription(
#                 user_id=current_user.id,
#                 original_text=corrected_text,
#                 translated_text=translated_text,
#                 source_language=language,
#                 target_language=translate_to if translate_to else None,
#                 detected_language=result["language"],
#                 processing_time_ms=result["processing_time_ms"],
#                 audio_duration_seconds=5,
#                 word_count=result["word_count"],
#                 efficiency_score=result.get("efficiency_score", 0),
#                 file_name=file.filename,
#                 file_size_bytes=len(content)
#             )
#             db.add(transcription)
#             db.commit()
            
#             result["text"] = corrected_text
#             result["translated_text"] = translated_text
#             result["transcription_id"] = transcription.id
        
#         # Cleanup
#         if os.path.exists(enhanced_path):
#             os.unlink(enhanced_path)
        
#         return result
        
#     finally:
#         if os.path.exists(temp_path):
#             os.unlink(temp_path)

# @router.get("/history")
# async def get_history(
#     skip: int = 0,
#     limit: int = 50,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get user's transcription history"""
    
#     transcriptions = db.query(Transcription).filter(
#         Transcription.user_id == current_user.id
#     ).order_by(Transcription.created_at.desc()).offset(skip).limit(limit).all()
    
#     return {
#         "transcriptions": [
#             {
#                 "id": t.id,
#                 "original_text": t.original_text,
#                 "translated_text": t.translated_text,
#                 "detected_language": t.detected_language,
#                 "target_language": t.target_language,
#                 "processing_time_ms": t.processing_time_ms,
#                 "word_count": t.word_count,
#                 "efficiency_score": t.efficiency_score,
#                 "created_at": t.created_at,
#                 "was_corrected": t.was_corrected
#             }
#             for t in transcriptions
#         ],
#         "count": len(transcriptions)
#     }
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
import tempfile
import os
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.services.transcriber import TranscriberService
from app.services.audio_processor import AudioProcessor
from app.services.adaptive_learner import AdaptiveLearner
from app.services.translation_service import TranslationService
from app.models.user import User
from app.models.transcription import Transcription
from app.api.auth import get_current_user

router = APIRouter()
transcriber = TranscriberService()
audio_processor = AudioProcessor()
translation_service = TranslationService()

# ✅ Add file size limit for Render
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB limit for Render free tier

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = "auto",
    translate_to: str = "",
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Transcribe audio with adaptive learning - Optimized for Render"""
    
    # ✅ Read file with size limit
    content = await file.read()
    file_size = len(content)
    
    # ✅ Check file size
    if file_size < 1000:
        raise HTTPException(status_code=400, detail="Audio file too small")
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"Audio file too large. Max {MAX_FILE_SIZE // 1024 // 1024}MB")
    
    # Save temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(content)
        temp_path = tmp.name
    
    try:
        # ✅ Only apply noise reduction if not too large (optional)
        enhanced_path = temp_path
        if file_size < 3 * 1024 * 1024:  # Only for files < 3MB
            enhanced_path = await audio_processor.enhance_audio(temp_path)
        
        # Transcribe
        result = await transcriber.transcribe(enhanced_path, language)
        
        if result.get("success"):
            # Apply adaptive corrections
            adaptive_learner = AdaptiveLearner(db)
            corrected_text = await adaptive_learner.apply_corrections(
                result["text"], current_user.id, result["language"]
            )
            
            # Translate if requested
            translated_text = None
            if translate_to and translate_to != "none" and translate_to != "":
                if translate_to != result.get("language", "en"):
                    translation = await translation_service.translate(
                        corrected_text,
                        result.get("language", "en"),
                        translate_to
                    )
                    if translation.get("success"):
                        translated_text = translation["translated_text"]
            
            # Save to database
            transcription = Transcription(
                user_id=current_user.id,
                original_text=corrected_text,
                translated_text=translated_text,
                source_language=language,
                target_language=translate_to if translate_to else None,
                detected_language=result["language"],
                processing_time_ms=result["processing_ms"],  # ✅ Fixed key name
                audio_duration_seconds=result.get("audio_duration", 5),
                word_count=result["words"],
                efficiency_score=result.get("efficiency_score", 0),
                file_name=file.filename,
                file_size_bytes=file_size
            )
            db.add(transcription)
            db.commit()
            
            result["text"] = corrected_text
            result["translated_text"] = translated_text
            result["transcription_id"] = transcription.id
        
        # Cleanup
        if enhanced_path != temp_path and os.path.exists(enhanced_path):
            os.unlink(enhanced_path)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)

@router.get("/history")
async def get_history(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's transcription history"""
    
    transcriptions = db.query(Transcription).filter(
        Transcription.user_id == current_user.id
    ).order_by(Transcription.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "transcriptions": [
            {
                "id": t.id,
                "original_text": t.original_text,
                "translated_text": t.translated_text,
                "detected_language": t.detected_language,
                "target_language": t.target_language,
                "processing_time_ms": t.processing_time_ms,
                "word_count": t.word_count,
                "efficiency_score": t.efficiency_score,
                "created_at": t.created_at,
                "was_corrected": t.was_corrected
            }
            for t in transcriptions
        ],
        "count": len(transcriptions)
    }