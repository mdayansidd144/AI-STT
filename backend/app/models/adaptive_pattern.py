from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Float,
    ForeignKey,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class AdaptivePattern(Base):
    __tablename__ = "adaptive_patterns"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    pattern_key = Column(
        String,
        index=True,
        nullable=False
    )

    original = Column(
        String,
        nullable=False
    )

    corrected = Column(
        String,
        nullable=False
    )

    language = Column(
        String,
        nullable=False
    )

    frequency = Column(
        Integer,
        default=1,
        nullable=False
    )

    confidence = Column(
        Float,
        default=0.5,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    last_used = Column(
        DateTime(timezone=True),
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="adaptive_patterns"
    )