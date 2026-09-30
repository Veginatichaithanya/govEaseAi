from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(32), unique=True, index=True, nullable=True)
    applicant_id = Column(String(64), unique=True, index=True, nullable=True)
    role = Column(String(32), nullable=False, default="CITIZEN")  # CITIZEN or OFFICER
    department_id = Column(String(64), ForeignKey("government_departments.id"), nullable=True)
    officer_title = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    profile_completion = Column(String(16), default="45", nullable=True)  # Stored percentage or calculated
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    department = relationship("GovernmentDepartment", back_populates="users")
    applications = relationship("Application", back_populates="citizen")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    profile = relationship("CitizenProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    password_resets = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
