import hashlib
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base


class AIAnalysis(Base):
    """
    Stores AI analysis results for documents, images, and application summaries.
    Uses input_hash for caching — identical input won't be re-analyzed.
    """
    __tablename__ = "ai_analysis"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(String(64), ForeignKey("applications.id", ondelete="CASCADE"), nullable=True, index=True)
    document_id = Column(String(64), nullable=True, index=True)  # references application_documents.id

    # Analysis metadata
    analysis_type = Column(
        String(64), nullable=False
    )  # TEXT_CHAT | IMAGE_ANALYSIS | PDF_ANALYSIS | DOCUMENT_EXTRACTION | VERIFICATION | APPLICATION_SUMMARY
    model_used = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="PROCESSING")  # PROCESSING | COMPLETED | FAILED

    # SHA-256 hash of input content for cache lookup
    input_hash = Column(String(64), nullable=True, index=True)

    # Validated AI result stored as JSONB
    result_json = Column(JSON, nullable=True)

    # Audit
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User")
    application = relationship("Application")

    @staticmethod
    def compute_hash(content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()
