
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Correction(Base):
    __tablename__ = "corrections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transcription_id = Column(Integer, ForeignKey("transcriptions.id"), nullable=True)
    
    original_text = Column(Text, nullable=False)
    corrected_text = Column(Text, nullable=False)
    language = Column(String, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="corrections")
    transcription = relationship("Transcription", backref="corrections")