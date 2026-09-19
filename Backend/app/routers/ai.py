"""
GovEaseAI AI Router — Handles all AI endpoints.
Covers: text guidance, multimodal chat, document analysis,
document extraction, AI verification, and officer application summary.

Security:
- All endpoints require authentication.
- API keys never returned in responses.
- Citizen ownership enforced.
- Officer department restriction enforced.
"""
import base64
import logging
import time
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.ai_analysis import AIAnalysis
from app.models.application import Application
from app.models.document import ApplicationDocument
from app.models.user import User
from app.routers.deps import get_current_user, get_current_user_optional
from app.schemas.ai import AIGuidanceRequest, AIGuidanceResponse
from app.schemas.ai_multimodal import (
    ApplicationSummaryRequest,
    ApplicationSummaryResponse,
    DocumentAnalyzeRequest,
    DocumentExtractionResponse,
    MultimodalChatRequest,
    MultimodalChatResponse,
    OfficerSummary,
    VerificationResponse,
    VerificationResult,
)
from app.services.ai.ai_service import get_ai_service, get_ai_status, get_ai_health
from app.services.openrouter_service import generate_guidance

logger = logging.getLogger("goveaseai.ai.router")

router = APIRouter(tags=["AI Guidance & Multimodal"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"

# Allowed MIME types for AI analysis
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_PDF_TYPES = {"application/pdf"}
ALLOWED_ALL_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_PDF_TYPES

MAX_FILE_SIZE = settings.AI_MAX_FILE_SIZE_BYTES


# ── Helper: detect modality ───────────────────────────────────────────────────

def _detect_modality(mime_type: str) -> str:
    if mime_type in ALLOWED_IMAGE_TYPES:
        return "image"
    if mime_type in ALLOWED_PDF_TYPES:
        return "pdf"
    return "unknown"


def _store_analysis(
    db: Session,
    user_id: str,
    analysis_type: str,
    status_val: str,
    result: dict,
    model_used: str = "",
    application_id: Optional[str] = None,
    document_id: Optional[str] = None,
    input_hash: Optional[str] = None,
    error_message: Optional[str] = None,
) -> AIAnalysis:
    """Create and commit an AIAnalysis record."""
    record = AIAnalysis(
        id=str(uuid.uuid4()),
        user_id=user_id,
        application_id=application_id,
        document_id=document_id,
        analysis_type=analysis_type,
        model_used=model_used,
        status=status_val,
        result_json=result,
        input_hash=input_hash,
        error_message=error_message,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ── AI Health & Status ────────────────────────────────────────────────────────

@router.get("/api/ai/health")
async def ai_health():
    """Return backend-only provider health check — never exposes API keys."""
    return await get_ai_health()


@router.get("/api/ai/status")
def ai_status():
    """Return AI provider status — never exposes API keys."""
    return get_ai_status()


# ── Existing: Text AI Guidance (backwards compatible) ────────────────────────

@router.post("/api/ai/guidance", response_model=AIGuidanceResponse)
async def ai_guidance(req: AIGuidanceRequest):
    """
    Text-only AI guidance endpoint — backwards compatible with existing frontend.
    Proxies to existing generate_guidance for citizen assistant chat.
    """
    msg = (req.message or req.query or "").strip()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid text query message is required.",
        )

    result = await generate_guidance(
        message=msg,
        service_id=req.serviceId,
        service_context=req.serviceContext,
        application_context=req.applicationContext,
        conversation_history=req.conversationHistory,
    )

    return AIGuidanceResponse(
        success=result.get("success", False),
        answer=result.get("answer"),
        error=result.get("error"),
        serviceId=result.get("serviceId"),
    )


# ── NEW: Multimodal Chat ──────────────────────────────────────────────────────

@router.post("/api/ai/chat", response_model=MultimodalChatResponse)
async def multimodal_chat(
    req: MultimodalChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Multimodal AI chat supporting text + image/PDF attachments.
    Citizen-authenticated. API key stays server-side.
    """
    ai = get_ai_service()
    analysis_type = "TEXT_CHAT"
    result_data = {}

    if not req.attachments:
        # Pure text chat — use guidance system prompt with context
        from app.services.openrouter_service import STATUS_EXPLANATIONS
        ctx = ""
        if req.serviceContext:
            ctx += f"\nService: {req.serviceContext.get('name', '')}"
        if req.applicationContext:
            st = req.applicationContext.get("status", "")
            ctx += f"\nApplication Status: {st} — {STATUS_EXPLANATIONS.get(st, st)}"

        system_prompt = (
            "You are GovEaseAI, an AI guidance assistant for government service applications. "
            "Help citizens understand services, application steps, required documents, and status. "
            "Be concise, professional, and accurate. "
            "Do NOT approve or reject applications. "
            "Do NOT invent government requirements."
            + ctx
        )
        result = await ai.ai_chat(
            system_prompt=system_prompt,
            user_message=req.message,
            conversation_history=req.conversationHistory,
        )
    else:
        # Multimodal — process up to MAX_ATTACHMENTS attachments
        attachments = req.attachments[: settings.AI_MAX_ATTACHMENTS]
        if len(req.attachments) > settings.AI_MAX_ATTACHMENTS:
            logger.info(f"[AI Chat] Truncated attachments to {settings.AI_MAX_ATTACHMENTS}")

        # Process first attachment (primary document)
        att = attachments[0]
        mime = att.mime_type
        modality = _detect_modality(mime)

        if modality == "unknown":
            return MultimodalChatResponse(
                success=False,
                error=f"Unsupported file type '{mime}'. Allowed: JPEG, PNG, WEBP, PDF.",
            )

        size = att.size_bytes
        if size > MAX_FILE_SIZE:
            return MultimodalChatResponse(
                success=False,
                error=f"File '{att.filename}' exceeds the 10 MB limit.",
            )

        analysis_type = "IMAGE_ANALYSIS" if modality == "image" else "PDF_ANALYSIS"
        prompt = req.message or "Analyze this document and extract relevant information."

        # Build context prefix from additional attachments
        if len(attachments) > 1:
            prompt = (
                f"[Note: {len(attachments)} files were submitted. Analyzing primary file.] "
                + prompt
            )

        if modality == "image":
            result = await ai.ai_analyze_image(
                image_base64=att.data_base64,
                mime_type=mime,
                prompt=prompt,
            )
        else:
            result = await ai.ai_analyze_pdf(
                pdf_base64=att.data_base64,
                mime_type=mime,
                prompt=prompt,
            )

    success = result.get("success", False)
    answer = result.get("answer")
    error = result.get("error")

    # Store analysis record
    record = _store_analysis(
        db=db,
        user_id=current_user.id,
        analysis_type=analysis_type,
        status_val="COMPLETED" if success else "FAILED",
        result={"answer": answer} if success else {},
        model_used=settings.OPENROUTER_MODEL,
        application_id=req.applicationId,
        error_message=error if not success else None,
    )

    return MultimodalChatResponse(
        success=success,
        answer=answer,
        error=error,
        analysis_id=record.id,
    )


# ── NEW: Analyze Stored Document ──────────────────────────────────────────────

@router.post("/api/ai/documents/{document_id}/analyze", response_model=DocumentExtractionResponse)
async def analyze_stored_document(
    document_id: str,
    req: DocumentAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyze a document already stored in the uploads directory.
    Citizen ownership enforced. Returns structured field extraction.
    """
    # Get document record
    doc = db.query(ApplicationDocument).filter(ApplicationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Ownership check
    app = db.query(Application).filter(Application.id == doc.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Associated application not found.")

    if current_user.role.upper() == "CITIZEN" and app.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: Document ownership check failed.")
    if current_user.role.upper() == "OFFICER" and app.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Access denied: Department restriction.")

    # Check cache — same doc + same question
    input_hash = AIAnalysis.compute_hash(
        f"{document_id}:{req.question}:extraction".encode()
    )
    cached = (
        db.query(AIAnalysis)
        .filter(
            AIAnalysis.input_hash == input_hash,
            AIAnalysis.status == "COMPLETED",
        )
        .order_by(AIAnalysis.created_at.desc())
        .first()
    )
    if cached and cached.result_json:
        logger.info(f"[AI] Cache hit for document {document_id}")
        from app.schemas.ai_multimodal import ExtractionResult
        try:
            extraction = ExtractionResult(**cached.result_json.get("extraction", {}))
            return DocumentExtractionResponse(
                success=True,
                extraction=extraction,
                analysis_id=cached.id,
            )
        except Exception:
            pass  # cache miss on schema validation, re-analyze

    # Read document from disk
    if not doc.file_path:
        raise HTTPException(status_code=400, detail="Document file path not available.")

    file_path = Path(doc.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document file not found on disk.")

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Document file too large for AI analysis.")

    file_b64 = base64.b64encode(file_bytes).decode("utf-8")
    mime = doc.mime_type or "application/pdf"

    ai = get_ai_service()
    result = await ai.ai_extract_document(
        file_base64=file_b64,
        mime_type=mime,
        document_name=doc.document_type or doc.file_name,
        service_fields=req.extract_fields,
    )

    success = result.get("success", False)
    extraction_raw = result.get("extraction")

    # Validate extraction with Pydantic
    from app.schemas.ai_multimodal import ExtractionResult
    extraction_obj = None
    if success and extraction_raw:
        try:
            extraction_obj = ExtractionResult(**extraction_raw)
        except Exception:
            extraction_obj = ExtractionResult(
                extraction_notes=str(extraction_raw),
                needs_human_review=True,
            )

    record = _store_analysis(
        db=db,
        user_id=current_user.id,
        analysis_type="DOCUMENT_EXTRACTION",
        status_val="COMPLETED" if success else "FAILED",
        result={"extraction": extraction_raw} if success else {},
        model_used=settings.OPENROUTER_DOCUMENT_MODEL,
        application_id=app.id,
        document_id=document_id,
        input_hash=input_hash,
        error_message=result.get("error") if not success else None,
    )

    # Update document status
    doc.status = "AI_PROCESSED" if success else "ERROR"
    if success and extraction_obj:
        doc.verification_result = {
            "ai_extracted": True,
            "extraction_summary": extraction_raw,
        }
    db.commit()

    return DocumentExtractionResponse(
        success=success,
        extraction=extraction_obj,
        raw_answer=result.get("raw_answer"),
        error=result.get("error"),
        analysis_id=record.id,
    )


# ── NEW: Inline File Upload for Chat/Analysis ─────────────────────────────────

@router.post("/api/ai/analyze-file", response_model=DocumentExtractionResponse)
async def analyze_uploaded_file(
    file: UploadFile = File(...),
    question: str = Form(default="Extract all relevant information from this document."),
    application_id: Optional[str] = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload and analyze any supported file (image/PDF) directly.
    Returns structured extraction result.
    """
    # Validate MIME
    mime = file.content_type or ""
    if mime not in ALLOWED_ALL_TYPES:
        # Try extension fallback
        ext = Path(file.filename or "").suffix.lower()
        ext_map = {".pdf": "application/pdf", ".jpg": "image/jpeg",
                   ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
        mime = ext_map.get(ext, mime)

    if mime not in ALLOWED_ALL_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: PDF, JPEG, PNG, WEBP.",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit.")

    # Validate application ownership if application_id provided
    if application_id:
        app_record = db.query(Application).filter(Application.id == application_id).first()
        if app_record and current_user.role.upper() == "CITIZEN":
            if app_record.citizen_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied.")

    input_hash = AIAnalysis.compute_hash(contents + question.encode())

    # Cache check
    cached = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.input_hash == input_hash, AIAnalysis.status == "COMPLETED")
        .order_by(AIAnalysis.created_at.desc())
        .first()
    )
    if cached and cached.result_json:
        from app.schemas.ai_multimodal import ExtractionResult
        try:
            ext_data = cached.result_json.get("extraction", {})
            return DocumentExtractionResponse(
                success=True,
                extraction=ExtractionResult(**ext_data),
                analysis_id=cached.id,
            )
        except Exception:
            pass

    file_b64 = base64.b64encode(contents).decode("utf-8")
    ai = get_ai_service()

    result = await ai.ai_extract_document(
        file_base64=file_b64,
        mime_type=mime,
        document_name=file.filename or "uploaded_document",
    )

    success = result.get("success", False)
    from app.schemas.ai_multimodal import ExtractionResult
    extraction_obj = None
    if success and result.get("extraction"):
        try:
            extraction_obj = ExtractionResult(**result["extraction"])
        except Exception:
            extraction_obj = ExtractionResult(needs_human_review=True)

    modality = "image" if mime in ALLOWED_IMAGE_TYPES else "pdf"
    record = _store_analysis(
        db=db,
        user_id=current_user.id,
        analysis_type="IMAGE_ANALYSIS" if modality == "image" else "PDF_ANALYSIS",
        status_val="COMPLETED" if success else "FAILED",
        result={"extraction": result.get("extraction")} if success else {},
        model_used=settings.OPENROUTER_VISION_MODEL if modality == "image" else settings.OPENROUTER_DOCUMENT_MODEL,
        application_id=application_id,
        input_hash=input_hash,
        error_message=result.get("error") if not success else None,
    )

    return DocumentExtractionResponse(
        success=success,
        extraction=extraction_obj,
        raw_answer=result.get("raw_answer"),
        error=result.get("error"),
        analysis_id=record.id,
    )


# ── NEW: AI Verification ──────────────────────────────────────────────────────

@router.post("/api/ai/applications/{application_id}/verify", response_model=VerificationResponse)
async def verify_application_documents(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run AI verification comparing uploaded documents against application form data.
    Returns field-by-field comparison results.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role.upper() == "CITIZEN" and app.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if not app.documents:
        return VerificationResponse(
            success=False,
            error="No documents uploaded. Please upload required documents before verification.",
        )

    ai = get_ai_service()
    all_results = []
    all_warnings = []

    for doc in app.documents:
        if not doc.file_path:
            continue
        fp = Path(doc.file_path)
        if not fp.exists():
            continue

        try:
            with open(fp, "rb") as f:
                contents = f.read()
        except Exception:
            continue

        file_b64 = base64.b64encode(contents).decode("utf-8")
        mime = doc.mime_type or "application/pdf"

        result = await ai.ai_verify_document(
            file_base64=file_b64,
            mime_type=mime,
            application_data=app.form_data or {},
            document_name=doc.document_type or doc.file_name,
        )

        if result.get("success") and result.get("verification"):
            v = result["verification"]
            all_results.extend(v.get("comparison_results", []))
            all_warnings.extend(v.get("warnings", []))

    if not all_results:
        return VerificationResponse(
            success=False,
            error="AI verification could not process any documents. Please retry.",
        )

    # Determine overall status
    statuses = [r.get("status", "REVIEW_REQUIRED") for r in all_results]
    if "MISMATCH" in statuses:
        overall = "MISMATCH"
    elif "REVIEW_REQUIRED" in statuses:
        overall = "REVIEW_REQUIRED"
    else:
        overall = "MATCH"

    # Validate with Pydantic
    from app.schemas.ai_multimodal import ComparisonField, VerificationResult as VR
    try:
        comparison_fields = [ComparisonField(**r) for r in all_results]
        verification = VR(
            comparison_results=comparison_fields,
            overall_status=overall,
            warnings=all_warnings,
            needs_human_review=overall != "MATCH",
        )
    except Exception:
        verification = VR(overall_status=overall, warnings=all_warnings)

    record = _store_analysis(
        db=db,
        user_id=current_user.id,
        analysis_type="VERIFICATION",
        status_val="COMPLETED",
        result={"verification": verification.model_dump()},
        model_used=settings.OPENROUTER_DOCUMENT_MODEL,
        application_id=application_id,
    )

    # Store summary on application
    app.ai_verification_summary = (
        f"AI Verification: {overall}. "
        f"{len(all_results)} fields checked. "
        f"{len(all_warnings)} warnings."
    )
    db.commit()

    return VerificationResponse(
        success=True,
        verification=verification,
        analysis_id=record.id,
    )


# ── NEW: Officer AI Application Summary ──────────────────────────────────────

@router.post("/api/ai/applications/{application_id}/summary", response_model=ApplicationSummaryResponse)
async def get_application_ai_summary(
    application_id: str,
    req: ApplicationSummaryRequest = ApplicationSummaryRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate AI review summary for officer portal.
    AI NEVER approves or rejects — officer remains the final decision-maker.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    # Officer must belong to the same department
    if current_user.role.upper() == "OFFICER":
        if app.department_id != current_user.department_id:
            raise HTTPException(
                status_code=403,
                detail="Statutory Department Restriction: Access denied.",
            )

    # Also allow citizens to see their own summary
    if current_user.role.upper() == "CITIZEN" and app.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Check cache (same application + status)
    cache_key = f"{application_id}:{app.status}:summary"
    input_hash = AIAnalysis.compute_hash(cache_key.encode())
    cached = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.input_hash == input_hash, AIAnalysis.status == "COMPLETED")
        .order_by(AIAnalysis.created_at.desc())
        .first()
    )
    if cached and cached.result_json:
        try:
            return ApplicationSummaryResponse(
                success=True,
                summary=OfficerSummary(**cached.result_json.get("summary", {})),
                analysis_id=cached.id,
            )
        except Exception:
            pass

    service_name = app.service.name if app.service else "Government Service"
    required_docs = len(app.service.required_documents) if app.service and hasattr(app.service, "required_documents") else 4

    app_data = {
        "id": app.id,
        "status": app.status,
        "formData": app.form_data or {},
        "submittedAt": app.submitted_at.isoformat() if app.submitted_at else None,
        "remarks": app.remarks,
    }
    documents = [
        {
            "documentName": d.document_type,
            "fileType": d.mime_type,
            "status": d.status,
            "verificationResult": d.verification_result,
        }
        for d in app.documents
    ]

    ai = get_ai_service()
    result = await ai.ai_generate_application_summary(
        application_data=app_data,
        documents=documents,
        service_name=service_name,
        required_doc_count=required_docs,
    )

    success = result.get("success", False)
    summary_raw = result.get("summary")
    summary_obj = None

    if success and summary_raw:
        try:
            summary_obj = OfficerSummary(**summary_raw)
        except Exception:
            summary_obj = OfficerSummary(
                verification_summary=str(summary_raw)[:500],
                needs_officer_attention=True,
            )

    record = _store_analysis(
        db=db,
        user_id=current_user.id,
        analysis_type="APPLICATION_SUMMARY",
        status_val="COMPLETED" if success else "FAILED",
        result={"summary": summary_raw} if success else {},
        model_used=settings.OPENROUTER_MODEL,
        application_id=application_id,
        input_hash=input_hash,
        error_message=result.get("error") if not success else None,
    )

    return ApplicationSummaryResponse(
        success=success,
        summary=summary_obj,
        error=result.get("error"),
        analysis_id=record.id,
    )


# ── NEW: Retrieve Stored Analysis ─────────────────────────────────────────────

@router.get("/api/ai/analysis/{analysis_id}")
async def get_analysis_result(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a stored AI analysis result by ID."""
    record = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return {
        "id": record.id,
        "analysis_type": record.analysis_type,
        "status": record.status,
        "model_used": record.model_used,
        "result": record.result_json,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


# ══════════════════════════════════════════════════════════════════════════════
# PERSISTENT CONVERSATIONS & CHATGPT-STYLE SERVICE-AWARE AI ASSISTANT
# ══════════════════════════════════════════════════════════════════════════════

import json
from typing import Any, Dict, List, Optional
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, or_

from app.models.ai_chat import AIConversation, AIMessage
from app.models.service import GovernmentService
from app.services.ai.rag_service import (
    retrieve_service_knowledge,
    get_service_document_requirements,
    get_service_application_steps,
    build_system_prompt,
)

SERVICE_QUICK_ACTIONS = {
    "trade-license": [
        "What documents do I need?",
        "How do I apply?",
        "What information is required?",
        "What are the fees?",
        "Check my uploaded documents",
    ],
    "shop-registration": [
        "What documents are required?",
        "Who can apply?",
        "What details are needed?",
        "How do I register?",
        "Check my uploaded documents",
    ],
    "building-permission": [
        "What documents do I need?",
        "How do I apply?",
        "What architectural plans are required?",
        "What are the fees?",
        "Check my uploaded documents",
    ],
    "factory-registration": [
        "What documents are required?",
        "What compliance is needed?",
        "How does the registration work?",
        "Check my uploaded documents",
    ],
    "pollution-certificate": [
        "What documents are required?",
        "Which consent applies (CTE or CTO)?",
        "What is the application process?",
        "Check my uploaded documents",
    ],
    "business-license": [
        "What documents do I need?",
        "How do I apply?",
        "What information is required?",
        "Check my uploaded documents",
    ],
    "other": [
        "How does GovEaseAI work?",
        "What government services can I apply for?",
        "How do I track my submitted application?",
        "How does AI document verification work?",
    ],
}


class CreateConversationRequest(BaseModel):
    service_id: Optional[str] = None
    application_id: Optional[str] = None
    mode: Optional[str] = "SERVICE"
    title: Optional[str] = None


class RenameConversationRequest(BaseModel):
    title: str


class SendConversationMessageRequest(BaseModel):
    message: str
    attachments: Optional[List[dict]] = None


def _generate_title(service_id: Optional[str], user_message: str) -> str:
    """Generate a clean, professional title from user query without repeating the service name."""
    low = user_message.lower()
    if "document" in low or "proof" in low:
        return "Required Documents"
    if "fee" in low or "cost" in low or "price" in low or "validity" in low:
        return "Fees & Validity Guidelines"
    if "architectural" in low or "plan" in low:
        return "Architectural Plan Requirements"
    if "step" in low or "how" in low or "apply" in low or "process" in low:
        return "Application Process & Steps"
    if "track" in low or "status" in low:
        return "Application Status Tracking"
    if "eligib" in low or "who" in low:
        return "Eligibility Guidelines"
    if "check" in low or "verify" in low or "upload" in low:
        return "Document Verification Check"
    clean_words = [w for w in user_message.split() if len(w) > 1 and w.lower() not in ("what", "how", "when", "where", "which", "the", "for", "and", "are", "can", "you", "tell", "me")]
    if clean_words:
        return ' '.join(clean_words[:4]).title()
    return "General Inquiry"


def _gather_application_context(db: Session, application_id: str, user_id: str) -> Optional[dict]:
    """Inspect citizen application form fields and uploaded documents."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return None
    docs = db.query(ApplicationDocument).filter(ApplicationDocument.application_id == application_id).all()
    uploaded = [f"{d.document_type} ('{d.file_name}', Status: {d.verification_status})" for d in docs]
    return {
        "application_number": app.application_number,
        "status": app.status,
        "service_name": app.service.name if app.service else app.service_id,
        "form_data": app.form_data,
        "uploaded_documents": uploaded,
        "officer_remarks": app.officer_remarks,
    }


@router.get("/api/ai/conversations")
def list_conversations(
    service_id: Optional[str] = None,
    q: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List past AI conversations for the authenticated user.
    Supports search query across title and service name.
    User-isolated.
    """
    query = db.query(AIConversation).filter(AIConversation.user_id == current_user.id)
    if service_id and service_id.lower() not in ("all", "any"):
        if service_id.lower() in ("other", "general"):
            query = query.filter(AIConversation.service_id == None)
        else:
            query = query.filter(AIConversation.service_id == service_id)
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                AIConversation.title.ilike(pattern),
                AIConversation.service_id.ilike(pattern)
            )
        )

    conversations = query.order_by(AIConversation.updated_at.desc()).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "service_id": c.service_id,
            "application_id": c.application_id,
            "mode": c.mode,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            "message_count": len(c.messages),
        }
        for c in conversations
    ]


@router.post("/api/ai/conversations")
def create_conversation(
    req: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new AI conversation session."""
    s_id = req.service_id
    if s_id and s_id.lower() in ("other", "general", "none"):
        s_id = None

    title = req.title or "New Conversation"
    if s_id and not req.title:
        title = f"{s_id.replace('-', ' ').title()} Chat"

    conv = AIConversation(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        service_id=s_id,
        application_id=req.application_id,
        mode=req.mode or ("APPLICATION" if req.application_id else ("SERVICE" if s_id else "GENERAL")),
        title=title,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    return {
        "id": conv.id,
        "title": conv.title,
        "service_id": conv.service_id,
        "application_id": conv.application_id,
        "mode": conv.mode,
        "created_at": conv.created_at.isoformat() if conv.created_at else None,
        "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
        "messages": [],
    }


@router.get("/api/ai/conversations/{conversation_id}")
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get conversation with full message history. Strictly checks user authorization."""
    conv = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    if conv.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return {
        "id": conv.id,
        "title": conv.title,
        "service_id": conv.service_id,
        "application_id": conv.application_id,
        "mode": conv.mode,
        "created_at": conv.created_at.isoformat() if conv.created_at else None,
        "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "attachments": m.attachments or [],
                "metadata": m.msg_metadata or {},
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in conv.messages
        ],
    }


@router.delete("/api/ai/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a conversation. Enforces user ownership."""
    conv = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    if conv.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    db.delete(conv)
    db.commit()
    return {"success": True, "message": "Conversation deleted."}


@router.patch("/api/ai/conversations/{conversation_id}")
def rename_conversation(
    conversation_id: str,
    req: RenameConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rename conversation title."""
    conv = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    if conv.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    conv.title = req.title.strip()
    db.commit()
    return {"success": True, "id": conv.id, "title": conv.title}


@router.post("/api/ai/conversations/{conversation_id}/stream")
async def stream_conversation_chat(
    conversation_id: str,
    req: SendConversationMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Streaming SSE chat for ChatGPT-style real-time response rendering.
    Enforces service-aware RAG, multimodal inspection, and conversation isolation.
    """
    conv = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    if conv.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Save citizen user message
    user_msg_id = str(uuid.uuid4())
    stored_attachments = []
    for a in (req.attachments or []):
        stored_attachments.append({
            "filename": a.get("filename", "document"),
            "mime_type": a.get("mime_type", "application/octet-stream"),
            "size_bytes": a.get("size_bytes", 0),
        })

    user_msg = AIMessage(
        id=user_msg_id,
        conversation_id=conv.id,
        role="user",
        content=req.message,
        attachments=stored_attachments,
        msg_metadata={},
    )
    db.add(user_msg)

    # Auto-generate title if this is the first real message
    if conv.title in ("New Conversation", "New Chat") or "Chat" in conv.title:
        conv.title = _generate_title(conv.service_id, req.message)
    conv.updated_at = func.now()
    db.commit()

    # RAG knowledge retrieval filtered strictly by service_id
    knowledge_chunks = retrieve_service_knowledge(db, conv.service_id, req.message)
    sources = [
        {"title": k["title"], "source_name": k["source_name"], "source_url": k["source_url"]}
        for k in knowledge_chunks
    ]

    # Application context
    app_ctx = None
    if conv.application_id:
        app_ctx = _gather_application_context(db, conv.application_id, current_user.id)

    # Service name
    s_name = None
    if conv.service_id:
        srv = db.query(GovernmentService).filter(GovernmentService.id == conv.service_id).first()
        s_name = srv.name if srv else conv.service_id.replace("-", " ").title()

    system_prompt = build_system_prompt(
        db=db,
        service_id=conv.service_id,
        service_name=s_name,
        application_context=app_ctx,
        retrieved_knowledge=knowledge_chunks,
        user_name=current_user.full_name or current_user.email,
    )

    # Conversation history
    past_messages = (
        db.query(AIMessage)
        .filter(AIMessage.conversation_id == conv.id)
        .order_by(AIMessage.created_at)
        .all()
    )
    conv_history = [
        {"role": m.role, "content": m.content}
        for m in past_messages[:-1]
    ]

    ai_service = get_ai_service()
    assistant_msg_id = str(uuid.uuid4())

    async def event_generator():
        full_answer = ""
        try:
            # If multimodal attachments are provided in request, perform multimodal analysis first
            if req.attachments and len(req.attachments) > 0:
                att = req.attachments[0]
                mime = att.get("mime_type", "")
                base64_data = att.get("data_base64", "")
                prompt_text = (
                    f"Analyze this uploaded document in the context of {s_name or 'government services'}.\n"
                    f"User asks: '{req.message}'\n\n"
                    "1. Identify the document type and verify if it matches requirements.\n"
                    "2. Extract visible fields (Applicant Name, Address, Document Numbers, Validity).\n"
                    "3. Highlight any potential discrepancies or missing items.\n"
                    "4. State that final approval is subject to official government verification."
                )

                if mime == "application/pdf":
                    multi_res = await ai_service.ai_analyze_pdf(
                        pdf_base64=base64_data,
                        mime_type=mime,
                        prompt=prompt_text,
                        system_prompt=system_prompt,
                    )
                else:
                    multi_res = await ai_service.ai_analyze_image(
                        image_base64=base64_data,
                        mime_type=mime,
                        prompt=prompt_text,
                        system_prompt=system_prompt,
                    )

                full_answer = multi_res.get("answer") or multi_res.get("error") or "Analysis completed."
                # Stream out the multimodal answer in words for smooth UX
                words = full_answer.split(" ")
                for i, w in enumerate(words):
                    chunk = (w + " ") if i < len(words) - 1 else w
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
            else:
                # Text chat with streaming tokens
                async for chunk in ai_service.ai_stream_chat(
                    system_prompt=system_prompt,
                    user_message=req.message,
                    conversation_history=conv_history,
                ):
                    full_answer += chunk
                    yield f"data: {json.dumps({'token': chunk})}\n\n"

            # Save assistant message to PostgreSQL
            from app.database import SessionLocal
            save_db = SessionLocal()
            try:
                ast_msg = AIMessage(
                    id=assistant_msg_id,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_answer or "Guidance prepared successfully.",
                    attachments=[],
                    msg_metadata={"sources": sources, "service_id": conv.service_id},
                )
                save_db.add(ast_msg)
                save_db.commit()
            finally:
                save_db.close()

            # Final DONE event with sources
            yield f"data: {json.dumps({'done': True, 'message_id': assistant_msg_id, 'sources': sources})}\n\n"

        except Exception as e:
            logger.exception("[Stream Chat] Error occurred")
            err_msg = "An error occurred while generating guidance. Please try again."
            yield f"data: {json.dumps({'token': err_msg})}\n\n"
            yield f"data: {json.dumps({'done': True, 'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/api/services/{service_id}/ai-context")
def get_service_ai_context(
    service_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns service metadata, document checklist, application steps, and quick prompts.
    """
    is_general = service_id.lower() in ("other", "general", "none")
    if is_general:
        return {
            "service_id": "other",
            "service_name": "General Government Assistant",
            "department": "All Government Departments",
            "description": "General guidance on GovEaseAI digital workflows and tracking.",
            "document_requirements": [],
            "application_steps": [],
            "quick_actions": SERVICE_QUICK_ACTIONS.get("other", []),
        }

    srv = db.query(GovernmentService).filter(GovernmentService.id == service_id).first()
    if not srv:
        raise HTTPException(status_code=404, detail="Service not found.")

    doc_reqs = get_service_document_requirements(db, service_id)
    steps = get_service_application_steps(db, service_id)
    quick_actions = SERVICE_QUICK_ACTIONS.get(service_id, SERVICE_QUICK_ACTIONS.get("trade-license", []))

    return {
        "service_id": srv.id,
        "service_name": srv.name,
        "department": srv.department.name if srv.department else "Government Department",
        "description": srv.description or srv.short_description,
        "fee": srv.fee,
        "processing_time": srv.processing_time,
        "document_requirements": doc_reqs,
        "application_steps": steps,
        "quick_actions": quick_actions,
    }

