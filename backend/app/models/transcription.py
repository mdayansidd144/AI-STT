from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Transcription(Base):
    __tablename__ = "transcriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    original_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=True)
    source_language = Column(String, nullable=False)
    target_language = Column(String, nullable=True)
    detected_language = Column(String, nullable=True)
    
    processing_time_ms = Column(Float, nullable=False)
    audio_duration_seconds = Column(Float, nullable=False)
    word_count = Column(Integer, nullable=False)
    efficiency_score = Column(Float, nullable=True)
    
    file_name = Column(String, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    
    was_corrected = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="transcriptions")
    corrections = relationship("Correction", back_populates="transcription", cascade="all, delete-orphan")