from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.services.adaptive_learner import AdaptiveLearner
from app.models.user import User
from app.models.transcription import Transcription
from app.models.correction import Correction
from app.models.adaptive_pattern import AdaptivePattern
from app.api.auth import get_current_user

router = APIRouter()

class CorrectionRequest(BaseModel):
    original: str
    corrected: str
    language: str
    transcription_id: Optional[int] = None

@router.post("/correct")
async def submit_correction(
    correction: CorrectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a correction for adaptive learning"""
    
    adaptive_learner = AdaptiveLearner(db)
    result = await adaptive_learner.process_correction(
        user_id=current_user.id,
        original=correction.original,
        corrected=correction.corrected,
        language=correction.language,
        transcription_id=correction.transcription_id
    )
    
    return result

@router.get("/patterns")
async def get_adaptive_patterns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's learned adaptive patterns"""
    
    patterns = db.query(AdaptivePattern).filter(
        AdaptivePattern.user_id == current_user.id
    ).order_by(AdaptivePattern.frequency.desc()).all()
    
    return {
        "patterns": [
            {
                "id": p.id,
                "original": p.original,
                "corrected": p.corrected,
                "pattern_type": p.pattern_type,
                "frequency": p.frequency,
                "confidence": p.confidence
            }
            for p in patterns
        ],
        "count": len(patterns)
    }

@router.get("/stats")
async def get_adaptive_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get adaptive learning statistics"""
    
    total_corrections = db.query(Correction).filter(
        Correction.user_id == current_user.id
    ).count()
    
    unique_patterns = db.query(Correction.pattern_type).filter(
        Correction.user_id == current_user.id
    ).distinct().count()
    
    return {
        "total_corrections": total_corrections,
        "unique_patterns": unique_patterns,
        "accuracy_improvement": current_user.avg_accuracy
    }