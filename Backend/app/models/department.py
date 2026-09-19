from sqlalchemy import Column, String, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class GovernmentDepartment(Base):
    __tablename__ = "government_departments"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    code = Column(String(32), nullable=False)
    category = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    statutory_act = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    services = relationship("GovernmentService", back_populates="department", cascade="all, delete-orphan")
    users = relationship("User", back_populates="department")
    applications = relationship("Application", back_populates="department")
