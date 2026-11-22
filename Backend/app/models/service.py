from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base

class GovernmentService(Base):
    __tablename__ = "government_services"

    id = Column(String(64), primary_key=True)
    department_id = Column(String(64), ForeignKey("government_departments.id"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    short_description = Column(Text, nullable=True)
    fee = Column(String(255), nullable=True)
    processing_time = Column(String(255), nullable=True)
    eligibility = Column(JSON, nullable=False, default=list)
    required_documents = Column(JSON, nullable=False, default=list)
    application_steps = Column(JSON, nullable=False, default=list)
    icon_name = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    department = relationship("GovernmentDepartment", back_populates="services")
    applications = relationship("Application", back_populates="service")
