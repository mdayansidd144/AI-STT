from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class AdaptivePattern(Base):
    __tablename__ = "adaptive_patterns"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    pattern_key = Column(String, index=True)
    original = Column(String, nullable=False)
    corrected = Column(String, nullable=False)
    language = Column(String, nullable=False)
    
    frequency = Column(Integer, default=1)
    confidence = Column(Float, default=0.5)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used = Column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User", backref="adaptive_patterns")