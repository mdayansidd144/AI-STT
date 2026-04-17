
from sqlalchemy import create_engine, event, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app.core.config import settings
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
from loguru import logger
# Create engine with dynamic capabilities
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG,
    poolclass=StaticPool if "sqlite" in settings.DATABASE_URL else None
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database - creates all tables"""
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database initialized with dynamic learning support")


# ============ DYNAMIC DATA STORAGE HELPERS ============

class DynamicDataStore:
    """
    Dynamic data storage for adaptive AI learning
    Stores user corrections, patterns, and improves model over time
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.cache = {}
    
    def save_user_correction(self, user_id: int, original: str, corrected: str, language: str):
        """Save user correction for future learning"""
        from app.models.correction import Correction
        from app.models.adaptive_pattern import AdaptivePattern
        
        # Create correction record
        correction = Correction(
            user_id=user_id,
            original_text=original,
            corrected_text=corrected,
            language=language,
            created_at=datetime.now()
        )
        self.db.add(correction)
        
        # Update or create adaptive pattern
        pattern_key = f"{language}:{original.lower()}"
        existing_pattern = self.db.query(AdaptivePattern).filter(
            AdaptivePattern.user_id == user_id,
            AdaptivePattern.pattern_key == pattern_key
        ).first()
        
        if existing_pattern:
            existing_pattern.frequency += 1
            existing_pattern.confidence = min(1.0, existing_pattern.confidence + 0.05)
            existing_pattern.last_used = datetime.now()
        else:
            new_pattern = AdaptivePattern(
                user_id=user_id,
                pattern_key=pattern_key,
                original=original,
                corrected=corrected,
                language=language,
                frequency=1,
                confidence=0.6,
                created_at=datetime.now()
            )
            self.db.add(new_pattern)
        
        self.db.commit()
        logger.info(f"💾 Saved correction for user {user_id}: '{original}' → '{corrected}'")
    
    def get_adaptive_patterns(self, user_id: int, language: str, limit: int = 50) -> list:
        """Get adaptive patterns for a user"""
        from app.models.adaptive_pattern import AdaptivePattern
        
        patterns = self.db.query(AdaptivePattern).filter(
            AdaptivePattern.user_id == user_id,
            AdaptivePattern.language == language,
            AdaptivePattern.confidence > 0.5
        ).order_by(AdaptivePattern.frequency.desc()).limit(limit).all()
        
        return patterns
    
    def update_user_statistics(self, user_id: int, transcription_length: int, accuracy: float):
        """Update user statistics for better personalization"""
        from app.models.user import User
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.total_transcriptions += 1
            user.total_words += transcription_length
            # Moving average for accuracy
            user.avg_accuracy = (user.avg_accuracy * (user.total_transcriptions - 1) + accuracy) / user.total_transcriptions
            self.db.commit()
    
    def get_user_learning_stats(self, user_id: int) -> Dict[str, Any]:
        """Get user's learning statistics"""
        from app.models.correction import Correction
        from app.models.adaptive_pattern import AdaptivePattern
        
        total_corrections = self.db.query(Correction).filter(
            Correction.user_id == user_id
        ).count()
        
        active_patterns = self.db.query(AdaptivePattern).filter(
            AdaptivePattern.user_id == user_id,
            AdaptivePattern.confidence > 0.5
        ).count()
        
        return {
            "total_corrections": total_corrections,
            "active_patterns": active_patterns,
            "learning_progress": min(100, int((active_patterns / 100) * 100)) if active_patterns > 0 else 0
        }


# ============ DYNAMIC SCHEMA UPDATES ============

def add_column_if_not_exists(table_name: str, column_name: str, column_type):
    """Dynamically add column to table if it doesn't exist"""
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        
        if column_name not in columns:
            with engine.connect() as conn:
                conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
                conn.commit()
                logger.info(f"✅ Added column '{column_name}' to table '{table_name}'")
    except Exception as e:
        logger.warning(f"Could not add column: {e}")


def migrate_database():
    """Auto-migrate database schema for new features"""
    from sqlalchemy import inspect
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    # Add new columns dynamically if needed
    if 'users' in tables:
        add_column_if_not_exists('users', 'preferences', 'TEXT')
        add_column_if_not_exists('users', 'learning_data', 'TEXT')
    
    if 'transcriptions' in tables:
        add_column_if_not_exists('transcriptions', 'feedback_score', 'FLOAT')
        add_column_if_not_exists('transcriptions', 'learning_metadata', 'TEXT')
    
    logger.info("✅ Database migration completed")


# ============ DYNAMIC QUERY BUILDER ============

class DynamicQueryBuilder:
    """Build dynamic queries based on user preferences"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_personalized_transcriptions(self, user_id: int, limit: int = 50, 
                                        sort_by: str = "created_at", 
                                        order: str = "desc"):
        """Get personalized transcription history"""
        from app.models.transcription import Transcription
        
        query = self.db.query(Transcription).filter(Transcription.user_id == user_id)
        
        # Dynamic sorting
        if order == "desc":
            query = query.order_by(getattr(Transcription, sort_by).desc())
        else:
            query = query.order_by(getattr(Transcription, sort_by).asc())
        
        return query.limit(limit).all()
    
    def search_transcriptions(self, user_id: int, search_term: str) -> list:
        """Search transcriptions by content"""
        from app.models.transcription import Transcription
        
        return self.db.query(Transcription).filter(
            Transcription.user_id == user_id,
            Transcription.original_text.contains(search_term)
        ).all()


# ============ CACHE MANAGEMENT ============

class AdaptiveCache:
    """Cache for frequently accessed data"""
    
    def __init__(self):
        self._cache = {}
        self._ttl = {}
    
    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Set cache with TTL"""
        self._cache[key] = value
        self._ttl[key] = datetime.now().timestamp() + ttl_seconds
    
    def get(self, key: str) -> Optional[Any]:
        """Get from cache if not expired"""
        if key in self._cache:
            if datetime.now().timestamp() < self._ttl[key]:
                return self._cache[key]
            else:
                del self._cache[key]
                del self._ttl[key]
        return None
    
    def clear(self):
        """Clear all cache"""
        self._cache.clear()
        self._ttl.clear()


# Global cache instance
adaptive_cache = AdaptiveCache()


# ============ EXPORT ALL ============

__all__ = [
    'engine', 'SessionLocal', 'Base', 'get_db', 'init_db',
    'DynamicDataStore', 'DynamicQueryBuilder', 'adaptive_cache',
    'migrate_database'
]