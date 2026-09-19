import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class CitizenProfile(Base):
    __tablename__ = "citizen_profiles"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Personal Information
    dob = Column(String(32), nullable=True)

    # Address
    address = Column(String(512), nullable=True)
    city = Column(String(128), nullable=True)
    district = Column(String(128), nullable=True)
    state = Column(String(128), nullable=True)
    pincode = Column(String(16), nullable=True)

    # Professional Information
    occupation = Column(String(128), nullable=True)
    education = Column(String(128), nullable=True)

    # Preferences
    preferred_language = Column(String(64), default="English", nullable=True)
    notification_preferences = Column(String(255), default="Email and SMS", nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="profile")
