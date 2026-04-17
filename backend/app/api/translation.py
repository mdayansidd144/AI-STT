from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.services.translation_service import TranslationService
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter()
translation_service = TranslationService()

@router.post("/translate")
async def translate_text(
    text: str,
    source_lang: str = "auto",
    target_lang: str = "hi",
    current_user: User = Depends(get_current_user)
):
    """Translate text between any languages"""
    
    if not text or not text.strip():
        return {"success": True, "translated_text": "", "original_text": text}
    
    result = await translation_service.translate(text, source_lang, target_lang)
    return result