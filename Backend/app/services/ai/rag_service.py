"""
GovEaseAI Service-Specific RAG & Context Resolver.
Strictly isolates knowledge retrieval by service_id to prevent cross-service leaks.
Formats retrieved statutory rules and official sources into AI context.
"""
import re
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.knowledge import (
    ServiceKnowledgeDocument,
    ServiceDocumentRequirement,
    ServiceApplicationStep,
)
from app.models.service import GovernmentService


def _tokenize(text: str) -> List[str]:
    """Tokenize and filter stop words for keyword relevance scoring."""
    stop_words = {
        "the", "is", "at", "which", "on", "a", "an", "and", "or", "in", "for", "to",
        "of", "with", "what", "how", "can", "do", "i", "need", "my", "me", "please",
        "tell", "about", "are", "by", "from", "it", "this", "that"
    }
    words = re.findall(r"\w+", text.lower())
    return [w for w in words if len(w) > 2 and w not in stop_words]


def retrieve_service_knowledge(
    db: Session,
    service_id: Optional[str],
    query: str,
    limit: int = 4,
) -> List[Dict[str, Any]]:
    """
    Retrieve knowledge documents strictly filtered by service_id.
    Prevents cross-service leaks: Trade License never returns Factory Registration docs.
    """
    is_general = not service_id or service_id.lower() in ("other", "general", "none")

    query_builder = db.query(ServiceKnowledgeDocument).filter(
        ServiceKnowledgeDocument.is_active == True
    )

    if is_general:
        # General AI mode: retrieve documents where service_id is NULL or general
        query_builder = query_builder.filter(ServiceKnowledgeDocument.service_id == None)
    else:
        # Strict service filter
        query_builder = query_builder.filter(ServiceKnowledgeDocument.service_id == service_id)

    candidates = query_builder.all()
    if not candidates:
        return []

    # Score candidates based on query token overlap
    tokens = _tokenize(query)
    scored = []
    for doc in candidates:
        score = 0
        title_lower = doc.title.lower()
        content_lower = doc.content.lower()
        cat_lower = doc.category.lower()

        # Check category match
        if ("document" in query.lower() or "proof" in query.lower()) and "document" in cat_lower:
            score += 10
        if ("fee" in query.lower() or "cost" in query.lower() or "price" in query.lower()) and "fee" in cat_lower:
            score += 10
        if ("step" in query.lower() or "how" in query.lower() or "process" in query.lower()) and "step" in cat_lower:
            score += 10
        if ("eligib" in query.lower() or "who" in query.lower()) and "eligibility" in cat_lower:
            score += 10

        for tok in tokens:
            if tok in title_lower:
                score += 5
            if tok in content_lower:
                score += 2

        scored.append((score, doc))

    # Sort by relevance score descending
    scored.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, doc in scored[:limit]:
        results.append({
            "id": doc.id,
            "title": doc.title,
            "category": doc.category,
            "content": doc.content,
            "source_name": doc.source_name,
            "source_url": doc.source_url,
            "document_type": doc.document_type,
        })
    return results


def get_service_document_requirements(db: Session, service_id: str) -> List[Dict[str, Any]]:
    """Fetch structured document requirements for a specific service."""
    reqs = (
        db.query(ServiceDocumentRequirement)
        .filter(ServiceDocumentRequirement.service_id == service_id)
        .order_by(ServiceDocumentRequirement.display_order)
        .all()
    )
    return [
        {
            "id": r.id,
            "document_type": r.document_type,
            "name": r.document_name,
            "description": r.description,
            "required": r.required,
            "accepted_formats": r.accepted_formats,
            "verification_rules": r.verification_rules,
        }
        for r in reqs
    ]


def get_service_application_steps(db: Session, service_id: str) -> List[Dict[str, Any]]:
    """Fetch sequential application steps for a service."""
    steps = (
        db.query(ServiceApplicationStep)
        .filter(ServiceApplicationStep.service_id == service_id)
        .order_by(ServiceApplicationStep.step_number)
        .all()
    )
    return [
        {
            "step_number": s.step_number,
            "title": s.title,
            "description": s.description,
            "route": s.route,
            "required": s.required,
        }
        for s in steps
    ]


def build_system_prompt(
    db: Session,
    service_id: Optional[str],
    service_name: Optional[str] = None,
    application_context: Optional[Dict[str, Any]] = None,
    retrieved_knowledge: Optional[List[Dict[str, Any]]] = None,
    user_name: Optional[str] = None,
) -> str:
    """
    Builds a ChatGPT-grade system prompt with strict service awareness,
    official knowledge citations, and application status.
    """
    is_general = not service_id or service_id.lower() in ("other", "general", "none")
    citizen_greeting = f"The authenticated citizen's name is {user_name}." if user_name else ""

    if is_general:
        prompt = (
            "You are GovEaseAI Assistant, an AI guidance system for the GovEaseAI Government Service Platform.\n"
            "You provide helpful, accurate, and professional information about government service workflows, "
            "platform navigation, required general document proofs, and application tracking.\n\n"
            f"{citizen_greeting}\n\n"
            "RULES:\n"
            "1. Be polite, concise, structured, and informative.\n"
            "2. For general questions (how GovEaseAI works, status definitions, how to apply), answer clearly.\n"
            "3. If the citizen asks for specific legal or statutory requirements of a particular department (e.g., Trade License, Factory License), "
            "kindly invite them to select that specific service from the Assistant header dropdown for tailored, verified guidance.\n"
            "4. NEVER invent government fees, penal provisions, or legal sanctions.\n"
            "5. Clearly state: 'AI-assisted guidance. Verify official requirements with the authorized department.'\n"
        )
    else:
        s_name = service_name or service_id.replace("-", " ").title()
        prompt = (
            f"You are the official GovEaseAI {s_name} Assistant.\n"
            f"You specialize exclusively in guiding citizens through {s_name} applications, statutory prerequisites, "
            "document checklists, verification criteria, and approval timelines.\n\n"
            f"{citizen_greeting}\n\n"
            "CORE OPERATIONAL MANDATES:\n"
            f"1. You are strictly in {s_name} mode. Focus your responses on this service.\n"
            "2. Use the provided OFFICIAL KNOWLEDGE base as your authoritative source of truth.\n"
            "3. Cite official sources whenever providing requirements or legal mandates.\n"
            "4. NEVER hallucinate mandatory documents, fees, or timelines that are not verified.\n"
            "5. You are an ASSISTIVE tool. You do NOT have the authority to grant, reject, or issue government approvals. "
            "All final decisions remain with the authorized Government Officer.\n"
            "6. Always structure answers with clear bullet points, bold key terms, and step-by-step guidance.\n"
        )

        # Inject structured document checklist if available
        doc_reqs = get_service_document_requirements(db, service_id)
        if doc_reqs:
            prompt += f"\n--- MANDATORY DOCUMENT CHECKLIST ({s_name}) ---\n"
            for d in doc_reqs:
                req_badge = "REQUIRED" if d["required"] else "CONDITIONAL"
                prompt += f"• [{req_badge}] {d['name']}: {d['description']} (Formats: {', '.join(d['accepted_formats'])})\n"
            prompt += "------------------------------------------------\n"

        # Inject application steps if available
        steps = get_service_application_steps(db, service_id)
        if steps:
            prompt += f"\n--- APPLICATION WORKFLOW STEPS ({s_name}) ---\n"
            for s in steps:
                prompt += f"{s['step_number']}. {s['title']}: {s['description']}\n"
            prompt += "----------------------------------------------\n"

    # Inject application-specific context if the citizen is viewing an existing application
    if application_context:
        prompt += "\n--- CITIZEN CURRENT APPLICATION CONTEXT ---\n"
        prompt += f"Application Number: {application_context.get('application_number', 'N/A')}\n"
        prompt += f"Current Status: {application_context.get('status', 'N/A')}\n"
        prompt += f"Service: {application_context.get('service_name', s_name if not is_general else 'General')}\n"
        if application_context.get("form_data"):
            prompt += f"Entered Form Fields: {application_context['form_data']}\n"
        if application_context.get("uploaded_documents"):
            prompt += f"Uploaded Documents: {application_context['uploaded_documents']}\n"
        if application_context.get("missing_documents"):
            prompt += f"Missing Documents: {application_context['missing_documents']}\n"
        if application_context.get("officer_remarks"):
            prompt += f"Officer Remarks / Action Required: {application_context['officer_remarks']}\n"
        prompt += (
            "When the citizen asks about their application (e.g., 'Is my application complete?', 'What is next?'), "
            "inspect these application details and provide actionable, specific advice based on the above fields.\n"
            "-------------------------------------------\n"
        )

    # Inject retrieved knowledge chunks
    if retrieved_knowledge:
        prompt += "\n--- VERIFIED OFFICIAL KNOWLEDGE ---\n"
        for k in retrieved_knowledge:
            prompt += (
                f"[Source: {k['source_name']}] (URL: {k['source_url']})\n"
                f"Title: {k['title']}\n"
                f"Content: {k['content']}\n\n"
            )
        prompt += "-----------------------------------\n"

    return prompt
