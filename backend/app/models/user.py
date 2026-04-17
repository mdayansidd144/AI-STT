from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    # User preferences
    default_source_lang = Column(String, default="auto")
    default_target_lang = Column(String, default="en")
    auto_translate = Column(Boolean, default=False)
    # Statistics
    total_transcriptions = Column(Integer, default=0)
    total_words = Column(Integer, default=0)
    avg_accuracy = Column(Float, default=0.0)
    # Relationships
    transcriptions = relationship("Transcription", back_populates="user", cascade="all, delete-orphan")
    corrections = relationship("Correction", back_populates="user", cascade="all, delete-orphan")
    adaptive_patterns = relationship("AdaptivePattern", back_populates="user", cascade="all, delete-orphan")