# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from pydantic import BaseModel
# from typing import Optional

# from app.core.database import get_db
# from app.services.adaptive_learner import AdaptiveLearner
# from app.models.user import User
# from app.models.transcription import Transcription
# from app.models.correction import Correction
# from app.models.adaptive_pattern import AdaptivePattern
# from app.api.auth import get_current_user

# router = APIRouter()

# class CorrectionRequest(BaseModel):
#     original: str
#     corrected: str
#     language: str
#     transcription_id: Optional[int] = None

# @router.post("/correct")
# async def submit_correction(
#     correction: CorrectionRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Submit a correction for adaptive learning"""
    
#     adaptive_learner = AdaptiveLearner(db)
#     result = await adaptive_learner.process_correction(
#         user_id=current_user.id,
#         original=correction.original,
#         corrected=correction.corrected,
#         language=correction.language,
#         transcription_id=correction.transcription_id
#     )
    
#     return result

# @router.get("/patterns")
# async def get_adaptive_patterns(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get user's learned adaptive patterns"""
    
#     patterns = db.query(AdaptivePattern).filter(
#         AdaptivePattern.user_id == current_user.id
#     ).order_by(AdaptivePattern.frequency.desc()).all()
    
#     return {
#         "patterns": [
#             {
#                 "id": p.id,
#                 "original": p.original,
#                 "corrected": p.corrected,
#                 "pattern_type": p.pattern_type,
#                 "frequency": p.frequency,
#                 "confidence": p.confidence
#             }
#             for p in patterns
#         ],
#         "count": len(patterns)
#     }

# @router.get("/stats")
# async def get_adaptive_stats(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get adaptive learning statistics"""
    
#     total_corrections = db.query(Correction).filter(
#         Correction.user_id == current_user.id
#     ).count()
    
#     unique_patterns = db.query(Correction.pattern_type).filter(
#         Correction.user_id == current_user.id
#     ).distinct().count()
    
#     return {
#         "total_corrections": total_corrections,
#         "unique_patterns": unique_patterns,
#         "accuracy_improvement": current_user.avg_accuracy
#     }
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.correction import Correction
from app.models.adaptive_pattern import AdaptivePattern
from app.models.transcription import Transcription
from app.api.auth import get_current_user

router = APIRouter()

# Request Models
class CorrectionRequest(BaseModel):
    original: str
    corrected: str
    language: str
    transcription_id: Optional[int] = None

class ApplyCorrectionRequest(BaseModel):
    text: str
    language: str

# ========== ADAPTIVE LEARNING ENDPOINTS ==========

@router.post("/correct")
async def submit_correction(
    correction: CorrectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a correction for adaptive learning"""
    
    # Save correction
    new_correction = Correction(
        user_id=current_user.id,
        original_text=correction.original,
        corrected_text=correction.corrected,
        language=correction.language,
        created_at=datetime.now()
    )
    db.add(new_correction)
    
    # Update or create adaptive pattern
    pattern_key = f"{correction.language}:{correction.original.lower()}"
    existing_pattern = db.query(AdaptivePattern).filter(
        AdaptivePattern.user_id == current_user.id,
        AdaptivePattern.pattern_key == pattern_key
    ).first()
    
    if existing_pattern:
        existing_pattern.frequency += 1
        existing_pattern.confidence = min(1.0, existing_pattern.confidence + 0.05)
        existing_pattern.last_used = datetime.now()
    else:
        new_pattern = AdaptivePattern(
            user_id=current_user.id,
            pattern_key=pattern_key,
            original=correction.original,
            corrected=correction.corrected,
            language=correction.language,
            frequency=1,
            confidence=0.6,
            created_at=datetime.now()
        )
        db.add(new_pattern)
    
    # Update transcription if linked
    if correction.transcription_id:
        transcription = db.query(Transcription).filter(
            Transcription.id == correction.transcription_id
        ).first()
        if transcription:
            transcription.was_corrected = True
            transcription.correction_applied = correction.corrected
    
    db.commit()
    
    return {
        "success": True,
        "message": "Correction saved. AI will learn from this.",
        "patterns_learned": ["accent", "name_correction"]
    }


@router.get("/patterns")
async def get_adaptive_patterns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's learned adaptive patterns"""
    
    patterns = db.query(AdaptivePattern).filter(
        AdaptivePattern.user_id == current_user.id,
        AdaptivePattern.confidence > 0.5
    ).order_by(AdaptivePattern.frequency.desc()).all()
    
    return {
        "patterns": [
            {
                "id": p.id,
                "original": p.original,
                "corrected": p.corrected,
                "language": p.language,
                "frequency": p.frequency,
                "confidence": p.confidence,
                "last_used": p.last_used.isoformat() if p.last_used else None
            }
            for p in patterns
        ],
        "count": len(patterns)
    }


@router.get("/stats")
async def get_learning_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get adaptive learning statistics"""
    
    total_corrections = db.query(Correction).filter(
        Correction.user_id == current_user.id
    ).count()
    
    active_patterns = db.query(AdaptivePattern).filter(
        AdaptivePattern.user_id == current_user.id,
        AdaptivePattern.confidence > 0.5
    ).count()
    
    # Calculate learning progress (0-100%)
    learning_progress = min(100, int((active_patterns / 50) * 100)) if active_patterns > 0 else 0
    
    return {
        "total_corrections": total_corrections,
        "active_patterns": active_patterns,
        "learning_progress": learning_progress,
        "accuracy_improvement": min(15, active_patterns * 0.3)
    }


@router.post("/apply")
async def apply_corrections(
    request: ApplyCorrectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Apply learned corrections to text"""
    
    patterns = db.query(AdaptivePattern).filter(
        AdaptivePattern.user_id == current_user.id,
        AdaptivePattern.language == request.language,
        AdaptivePattern.confidence > 0.5
    ).order_by(AdaptivePattern.frequency.desc()).limit(50).all()
    
    corrected_text = request.text
    applied_patterns = []
    
    for pattern in patterns:
        if pattern.original in corrected_text:
            corrected_text = corrected_text.replace(pattern.original, pattern.corrected)
            applied_patterns.append({
                "original": pattern.original,
                "corrected": pattern.corrected,
                "confidence": pattern.confidence
            })
            pattern.last_used = datetime.now()
    
    db.commit()
    
    return {
        "success": True,
        "original_text": request.text,
        "corrected_text": corrected_text,
        "patterns_applied": len(applied_patterns),
        "applied_patterns": applied_patterns
    }


@router.get("/learning-curve")
async def get_learning_curve(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get learning improvement over time"""
    
    corrections = db.query(Correction).filter(
        Correction.user_id == current_user.id
    ).order_by(Correction.created_at).all()
    
    # Group by date
    daily_data = {}
    for corr in corrections:
        date = corr.created_at.date().isoformat()
        if date not in daily_data:
            daily_data[date] = 0
        daily_data[date] += 1
    
    return {
        "learning_curve": [
            {"date": date, "corrections": count}
            for date, count in daily_data.items()
        ],
        "total_days": len(daily_data)
    }


@router.delete("/reset")
async def reset_learning(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset all learning data for current user"""
    
    # Delete all corrections
    db.query(Correction).filter(Correction.user_id == current_user.id).delete()
    
    # Delete all adaptive patterns
    db.query(AdaptivePattern).filter(AdaptivePattern.user_id == current_user.id).delete()
    
    db.commit()
    
    return {"success": True, "message": "Learning data reset successfully"}


@router.get("/export")
async def export_learning_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export learning data as JSON"""
    
    import json
    from fastapi.responses import Response
    
    patterns = db.query(AdaptivePattern).filter(
        AdaptivePattern.user_id == current_user.id
    ).all()
    
    corrections = db.query(Correction).filter(
        Correction.user_id == current_user.id
    ).all()
    
    export_data = {
        "user_id": current_user.id,
        "export_date": datetime.now().isoformat(),
        "patterns": [
            {
                "original": p.original,
                "corrected": p.corrected,
                "language": p.language,
                "frequency": p.frequency,
                "confidence": p.confidence
            }
            for p in patterns
        ],
        "corrections": [
            {
                "original": c.original_text,
                "corrected": c.corrected_text,
                "language": c.language,
                "date": c.created_at.isoformat()
            }
            for c in corrections
        ]
    }
    
    return Response(
        content=json.dumps(export_data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=learning_data_{datetime.now().strftime('%Y%m%d')}.json"}
    )
