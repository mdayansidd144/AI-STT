import json
import hashlib
from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlalchemy.orm import Session
from loguru import logger
from app.models.user import User
from app.models.correction import Correction
from app.models.adaptive_pattern import AdaptivePattern
from app.models.transcription import Transcription

class AdaptiveLearner:
    """Dynamic adaptive learning system that improves over time"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def process_correction(
        self, 
        user_id: int, 
        original: str, 
        corrected: str, 
        language: str,
        transcription_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Process a user correction and update adaptive patterns"""
        
        # Analyze correction pattern
        pattern_type = self._analyze_pattern(original, corrected)
        pattern_key = self._generate_pattern_key(original, corrected, language)
        
        # Check if pattern already exists
        existing_pattern = self.db.query(AdaptivePattern).filter(
            AdaptivePattern.user_id == user_id,
            AdaptivePattern.pattern_key == pattern_key
        ).first()
        
        if existing_pattern:
            # Update existing pattern
            existing_pattern.frequency += 1
            existing_pattern.confidence = min(1.0, existing_pattern.confidence + 0.05)
            existing_pattern.last_used = datetime.now()
        else:
            # Create new pattern
            new_pattern = AdaptivePattern(
                user_id=user_id,
                pattern_key=pattern_key,
                original=original,
                corrected=corrected,
                language=language,
                pattern_type=pattern_type,
                frequency=1,
                confidence=0.6,
                last_used=datetime.now()
            )
            self.db.add(new_pattern)
        
        # Save correction record
        correction = Correction(
            user_id=user_id,
            transcription_id=transcription_id,
            original_text=original,
            corrected_text=corrected,
            language=language,
            pattern_type=pattern_type
        )
        self.db.add(correction)
        
        # Update transcription if linked
        if transcription_id:
            transcription = self.db.query(Transcription).filter(
                Transcription.id == transcription_id
            ).first()
            if transcription:
                transcription.was_corrected = True
        
        self.db.commit()
        
        logger.info(f"Learned new pattern for user {user_id}: {original} -> {corrected}")
        
        return {
            "success": True,
            "pattern_type": pattern_type,
            "frequency": existing_pattern.frequency if existing_pattern else 1,
            "confidence": existing_pattern.confidence if existing_pattern else 0.6
        }
    
    async def apply_corrections(self, text: str, user_id: int, language: str) -> str:
        """Apply learned corrections to new transcription"""
        
        # Get all patterns for this user and language
        patterns = self.db.query(AdaptivePattern).filter(
            AdaptivePattern.user_id == user_id,
            AdaptivePattern.language == language,
            AdaptivePattern.confidence > 0.5
        ).order_by(AdaptivePattern.frequency.desc()).limit(50).all()
        
        corrected_text = text
        applied_count = 0
        
        for pattern in patterns:
            if pattern.original in corrected_text:
                corrected_text = corrected_text.replace(pattern.original, pattern.corrected)
                applied_count += 1
                pattern.last_used = datetime.now()
        
        if applied_count > 0:
            self.db.commit()
            logger.info(f"Applied {applied_count} adaptive corrections for user {user_id}")
        
        return corrected_text
    
    def _analyze_pattern(self, original: str, corrected: str) -> str:
        """Analyze the type of correction pattern"""
        from difflib import SequenceMatcher
        
        similarity = SequenceMatcher(None, original.lower(), corrected.lower()).ratio()
        
        # Homophone detection
        homophones = [
            ("their", "there"), ("your", "youre"), ("its", "its"),
            ("to", "too"), ("here", "hear"), ("write", "right"),
            ("know", "no"), ("see", "sea"), ("buy", "by"),
            ("two", "too"), ("for", "four"), ("ate", "eight")
        ]
        
        for h1, h2 in homophones:
            if (original.lower() == h1 and corrected.lower() == h2) or \
               (original.lower() == h2 and corrected.lower() == h1):
                return "homophone"
        
        # Accent correction
        if 0.6 < similarity < 0.85:
            return "accent"
        
        # Code-switching (Hinglish detection)
        hindi_indicators = ['hai', 'hain', 'tha', 'thi', 'the', 'ho', 'raha', 'rahi', 'kar', 'kya', 'nahi', 'kahan']
        if any(word in original.lower() for word in hindi_indicators):
            return "code_switching"
        
        # Jargon/domain-specific
        if len(corrected) > len(original) + 3:
            return "jargon"
        
        return "general"
    
    def _generate_pattern_key(self, original: str, corrected: str, language: str) -> str:
        """Generate unique key for pattern"""
        normalized_original = original.lower().strip()
        normalized_corrected = corrected.lower().strip()
        key_string = f"{language}:{normalized_original}:{normalized_corrected}"
        return hashlib.md5(key_string.encode()).hexdigest()[:32]