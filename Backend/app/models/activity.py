from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class ApplicationActivity(Base):
    __tablename__ = "application_activity"

    id = Column(String(64), primary_key=True)
    application_id = Column(String(64), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(64), ForeignKey("government_departments.id"), nullable=True)
    actor_user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(255), nullable=True)
    action_type = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    application = relationship("Application", back_populates="activities")
