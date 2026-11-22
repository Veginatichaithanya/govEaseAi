from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base


class AIConversation(Base):
    """
    Stores persistent chat sessions between citizens and the GovEaseAI Assistant.
    Enforces user isolation and service-specific or general context.
    """
    __tablename__ = "ai_conversations"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id = Column(String(64), nullable=True, index=True)  # e.g., 'trade-license', or None for General AI
    application_id = Column(String(64), ForeignKey("applications.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False, default="New Conversation")
    mode = Column(String(32), nullable=False, default="SERVICE")  # SERVICE | GENERAL | APPLICATION
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User")
    application = relationship("Application")
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")


class AIMessage(Base):
    """
    Individual message inside an AI conversation.
    """
    __tablename__ = "ai_messages"

    id = Column(String(64), primary_key=True)
    conversation_id = Column(String(64), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(32), nullable=False)  # 'user' | 'assistant' | 'system'
    content = Column(Text, nullable=False)
    attachments = Column(JSON, nullable=True, default=list)  # list of {filename, mime_type, size_bytes, url}
    msg_metadata = Column(JSON, nullable=True, default=dict)  # sources, confidence, service_id, model, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    conversation = relationship("AIConversation", back_populates="messages")
