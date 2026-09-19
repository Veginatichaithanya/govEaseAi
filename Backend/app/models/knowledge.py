from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base


class ServiceKnowledgeDocument(Base):
    """
    Official government service knowledge chunks used for Service-Specific RAG.
    Filterable strictly by service_id.
    """
    __tablename__ = "service_knowledge_documents"

    id = Column(String(64), primary_key=True)
    service_id = Column(String(64), nullable=True, index=True)  # e.g., 'trade-license', or None for general
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(64), nullable=False)  # eligibility | documents | steps | fees | processing_time | faq | official_source
    source_name = Column(String(255), nullable=False)  # e.g., "National Government Services Portal (India)"
    source_url = Column(String(512), nullable=True)
    document_type = Column(String(64), nullable=True)  # ACT | REGULATION | GUIDELINE | NOTIFICATION
    version = Column(String(32), nullable=True, default="1.0")
    effective_from = Column(String(64), nullable=True)
    effective_to = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ServiceDocumentRequirement(Base):
    """
    Structured document requirements per government service.
    """
    __tablename__ = "service_document_requirements"

    id = Column(String(64), primary_key=True)
    service_id = Column(String(64), nullable=False, index=True)
    document_type = Column(String(64), nullable=False)  # e.g., IDENTITY_PROOF, ADDRESS_PROOF, SITE_PLAN
    document_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    required = Column(Boolean, default=True, nullable=False)
    accepted_formats = Column(JSON, nullable=False, default=list)  # ["PDF", "PNG", "JPG", "WEBP"]
    verification_rules = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)


class ServiceApplicationStep(Base):
    """
    Sequential application milestones and instructions per service.
    """
    __tablename__ = "service_application_steps"

    id = Column(String(64), primary_key=True)
    service_id = Column(String(64), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    route = Column(String(255), nullable=True)
    required = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
