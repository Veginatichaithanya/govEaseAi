import logging
from typing import Dict, Any, Optional, List
import httpx
from app.config import settings

logger = logging.getLogger("goveaseai.ai")

STATUS_EXPLANATIONS = {
    "DRAFT": "The application is still being prepared.",
    "SUBMITTED": "The application has been submitted and is waiting for processing.",
    "AI_PROCESSING": "The uploaded documents are being analyzed.",
    "OFFICER_REVIEW": "An authorized officer is reviewing the application.",
    "CORRECTION_REQUIRED": "The officer has requested changes or additional information.",
    "RESUBMITTED": "The corrected application has been submitted again.",
    "APPROVED": "The application has been approved by the authorized officer.",
    "REJECTED": "The application was rejected. Check the officer's remarks for details.",
    "DIGITAL_APPROVAL": "The approved application has a digital approval record available."
}

def mask_secret(key: str) -> str:
    if not key:
        return "(not set)"
    if len(key) <= 8:
        return "****"
    return f"{key[:8]}...{key[-4:]}"

def get_ai_status() -> Dict[str, Any]:
    prov = (settings.AI_PROVIDER or "gemini").lower().strip()
    if prov == "gemini" and settings.GEMINI_API_KEY:
        return {
            "success": True,
            "configured": True,
            "provider": "Gemini",
            "model": settings.GEMINI_MODEL or "gemini-3.6-flash"
        }
    if prov == "agentrouter" and settings.AGENTROUTER_API_KEY:
        return {
            "success": True,
            "configured": True,
            "provider": "AgentRouter",
            "model": settings.AGENTROUTER_MODEL or "deepseek-v4-flash"
        }
    configured = bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_MODEL)
    return {
        "success": True,
        "configured": configured,
        "provider": "OpenRouter",
        "model": settings.OPENROUTER_MODEL or "not-configured"
    }

async def generate_guidance(
    message: str,
    service_id: Optional[str] = None,
    service_context: Optional[Dict[str, Any]] = None,
    application_context: Optional[Dict[str, Any]] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Generate AI guidance using unified capability-aware AI service with statutory guardrails.
    Supports Gemini Direct, OpenRouter, and AgentRouter providers.
    """
    has_gemini = bool(settings.GEMINI_API_KEY)
    has_agentrouter = bool(settings.AGENTROUTER_API_KEY)
    has_openrouter = bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_MODEL)

    if not has_gemini and not has_agentrouter and not has_openrouter:
        return {
            "success": False,
            "error": "AI service is not configured."
        }

    if not message or not message.strip():
        return {
            "success": False,
            "error": "Query message is required."
        }

    context_block = ""
    if service_context:
        raw_docs = service_context.get("requiredDocuments") or []
        if isinstance(raw_docs, list):
            docs = ", ".join([f"{d.get('name', '')} ({'Required' if d.get('required') else 'Optional'})" for d in raw_docs if isinstance(d, dict)])
        else:
            docs = "Standard proofs"

        raw_steps = service_context.get("applicationSteps") or []
        if isinstance(raw_steps, list):
            steps = " -> ".join([str(s) for s in raw_steps])
        else:
            steps = "Standard 9-step digital workflow"

        raw_elig = service_context.get("eligibility") or []
        if isinstance(raw_elig, list):
            elig = "; ".join([str(e) for e in raw_elig])
        else:
            elig = "Configured citizen criteria"

        context_block += f"""
SELECTED SERVICE CONTEXT:
- Service Name: {service_context.get('name') or service_id}
- Department: {service_context.get('department', 'State Administration')}
- Category: {service_context.get('category', 'Public Service')}
- Statutory Fee: {service_context.get('fee', 'Configured nominal fee')}
- Processing Time: {service_context.get('processingTime', 'Standard turnaround')}
- Required Proofs: {docs}
- Eligibility Criteria: {elig}
- Application Steps: {steps}
"""

    if application_context:
        raw_status = application_context.get("status", "")
        explanation = STATUS_EXPLANATIONS.get(raw_status, raw_status)
        remarks_line = f"- Officer Remarks: \"{application_context.get('remarks')}\"\n" if application_context.get("remarks") else ""
        context_block += f"""
CITIZEN'S ACTIVE APPLICATION CONTEXT:
- Application ID: {application_context.get('id', 'N/A')}
- Service: {application_context.get('service') or (service_context.get('name') if service_context else 'N/A')}
- Status: {raw_status} ({explanation})
{remarks_line}"""

    system_prompt = f"""You are GovEaseAI, an AI guidance assistant for a government service automation prototype.
Your role:
- Help citizens understand available government services (Trade License, Shop Registration, Business License, Building Permission, Factory Registration, Pollution Certificate).
- Explain configured service requirements, application steps, and required documents.
- Explain application statuses using official explanations (DRAFT: The application is still being prepared; SUBMITTED: The application has been submitted and is waiting for processing; AI_PROCESSING: The uploaded documents are being analyzed; OFFICER_REVIEW: An authorized officer is reviewing the application; CORRECTION_REQUIRED: The officer has requested changes or additional information; RESUBMITTED: The corrected application has been submitted again; APPROVED: The application has been approved by the authorized officer; REJECTED: The application was rejected; DIGITAL_APPROVAL: The approved application has a digital approval record available).
- Help citizens understand AI processing results and how to track applications.
- Always answer using the selected service context provided below.

Strict Guardrails:
- Do NOT claim to be a government officer.
- Do NOT approve or reject applications.
- Do NOT guarantee approval.
- Do NOT invent government requirements, statutory fees, or processing times.
- Do NOT provide unsupported legal advice.
- Do NOT claim that AI verification is legally authoritative.
- If information is not available in the provided service context: clearly state that the information is not available in the current prototype configuration and recommend checking the authorized department.
- Keep answers concise, clear, civil, and professional (2 to 4 sentences or brief bullet points).
{context_block}"""

    # Assemble windowed history (last 6 messages max)
    windowed_history = []
    if conversation_history and isinstance(conversation_history, list):
        for m in conversation_history[-6:]:
            sender = m.get("sender")
            text = str(m.get("text", "")).strip()
            if text:
                role = "user" if sender == "user" else "assistant"
                windowed_history.append({"role": role, "content": text[:1000]})

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(windowed_history)
    messages.append({"role": "user", "content": message.strip()[:1000]})

    # ── Execute via unified capability-aware AI service (Gemini -> OpenRouter -> AgentRouter) ──
    from app.services.ai.ai_service import get_ai_service
    ai_service = get_ai_service()

    res = await ai_service.ai_chat(
        system_prompt=system_prompt,
        user_message=message.strip()[:1000],
        conversation_history=windowed_history,
        temperature=0.2,
        max_tokens=600,
    )

    if res.get("success") and res.get("answer"):
        return {
            "success": True,
            "answer": res["answer"].strip(),
            "serviceId": service_id,
        }

    return {
        "success": False,
        "error": res.get("error") or "AI guidance is temporarily unavailable. Please try again.",
        "serviceId": service_id,
    }
