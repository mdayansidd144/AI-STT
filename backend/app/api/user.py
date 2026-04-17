from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    
    return {
        "total_transcriptions": current_user.total_transcriptions,
        "total_words": current_user.total_words,
        "avg_accuracy": current_user.avg_accuracy,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "member_since": current_user.created_at
    }