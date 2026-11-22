from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(64), primary_key=True)
    application_number = Column(String(64), unique=True, index=True, nullable=False)
    service_id = Column(String(64), ForeignKey("government_services.id"), nullable=False)
    department_id = Column(String(64), ForeignKey("government_departments.id"), nullable=False)
    citizen_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    status = Column(String(64), nullable=False, default="DRAFT", index=True)
    current_step = Column(Integer, default=1, nullable=False)
    form_data = Column(JSON, nullable=False, default=dict)
    field_metadata = Column(JSON, nullable=False, default=dict)
    risk_level = Column(String(32), nullable=True)
    priority = Column(String(32), nullable=True)
    ai_verification_summary = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    officer_remarks = Column(Text, nullable=True)
    officer_decided_by = Column(String(255), nullable=True)
    officer_decided_at = Column(DateTime(timezone=True), nullable=True)
    approval_reference = Column(String(255), nullable=True)
    approval_date = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    service = relationship("GovernmentService", back_populates="applications")
    department = relationship("GovernmentDepartment", back_populates="applications")
    citizen = relationship("User", back_populates="applications")
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
    activities = relationship("ApplicationActivity", back_populates="application", cascade="all, delete-orphan")
