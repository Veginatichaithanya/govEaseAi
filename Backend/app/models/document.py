from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(String(64), primary_key=True)
    application_id = Column(String(64), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(128), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=True)
    mime_type = Column(String(128), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    status = Column(String(32), default="PENDING", nullable=False)  # PENDING, PROCESSING, VERIFIED, ERROR
    verification_result = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    application = relationship("Application", back_populates="documents")
