"""
Pydantic schemas for GovEaseAI Multimodal AI endpoints.
All AI responses are validated through these schemas before storing or returning.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ── Requests ──────────────────────────────────────────────────────────────────

class MultimodalChatRequest(BaseModel):
    """Chat message with optional file attachments."""
    message: str = Field(..., min_length=1, max_length=4000)
    # Files are base64-encoded; validated server-side for type/size
    attachments: Optional[List["FileAttachment"]] = None
    serviceId: Optional[str] = None
    applicationId: Optional[str] = None
    serviceContext: Optional[Dict[str, Any]] = None
    applicationContext: Optional[Dict[str, Any]] = None
    conversationHistory: Optional[List[Dict[str, Any]]] = None


class FileAttachment(BaseModel):
    """A base64-encoded file attachment."""
    filename: str
    mime_type: str
    data_base64: str   # base64 content WITHOUT data URI prefix
    size_bytes: int


class DocumentAnalyzeRequest(BaseModel):
    """Request to analyze a stored document by ID."""
    question: str = Field(default="Extract all relevant information from this document.", max_length=1000)
    extract_fields: Optional[List[str]] = None  # specific fields to extract
    application_id: Optional[str] = None


class ApplicationSummaryRequest(BaseModel):
    """Request for officer AI summary of an application."""
    include_verification: bool = True


# ── Structured AI Output Schemas ─────────────────────────────────────────────

class ExtractionResult(BaseModel):
    document_type: Optional[str] = None
    extracted_fields: Dict[str, Any] = {}
    confidence: Dict[str, float] = {}
    warnings: List[str] = []
    missing_fields: List[str] = []
    needs_human_review: bool = True
    extraction_notes: Optional[str] = None


class ComparisonField(BaseModel):
    field: str
    application_value: Optional[str] = None
    document_value: Optional[str] = None
    status: str = "REVIEW_REQUIRED"  # MATCH | MISMATCH | REVIEW_REQUIRED | NOT_FOUND
    confidence: float = 0.0
    explanation: Optional[str] = None


class VerificationResult(BaseModel):
    document_type: Optional[str] = None
    comparison_results: List[ComparisonField] = []
    overall_status: str = "REVIEW_REQUIRED"
    warnings: List[str] = []
    needs_human_review: bool = True
    ai_disclaimer: str = (
        "AI-assisted verification only. "
        "Final decision by authorized government officer."
    )


class OfficerSummary(BaseModel):
    completeness_score: int = 0  # 0-100
    document_count: Dict[str, int] = {}
    potential_issues: List[str] = []
    verification_summary: str = ""
    needs_officer_attention: bool = True
    ai_disclaimer: str = (
        "This is AI-assisted analysis. "
        "Final government approval authority rests solely with the authorized officer."
    )


# ── Responses ─────────────────────────────────────────────────────────────────

class MultimodalChatResponse(BaseModel):
    success: bool
    answer: Optional[str] = None
    error: Optional[str] = None
    analysis_id: Optional[str] = None  # stored AIAnalysis record ID


class DocumentExtractionResponse(BaseModel):
    success: bool
    extraction: Optional[ExtractionResult] = None
    raw_answer: Optional[str] = None
    error: Optional[str] = None
    analysis_id: Optional[str] = None


class VerificationResponse(BaseModel):
    success: bool
    verification: Optional[VerificationResult] = None
    error: Optional[str] = None
    analysis_id: Optional[str] = None


class ApplicationSummaryResponse(BaseModel):
    success: bool
    summary: Optional[OfficerSummary] = None
    error: Optional[str] = None
    analysis_id: Optional[str] = None


class AIStatusResponse(BaseModel):
    success: bool
    configured: bool
    primary_provider: str
    openrouter: Dict[str, Any]
    gemini: Dict[str, Any]


# Update forward refs
MultimodalChatRequest.model_rebuild()
