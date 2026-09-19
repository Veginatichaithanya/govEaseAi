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
    prov = settings.AI_PROVIDER.lower()
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
    Generate AI guidance using AgentRouter (or OpenRouter fallback) API with statutory guardrails.
    Preserves exact prompts and guardrails from GovEaseAI architecture.
    """
    prov = settings.AI_PROVIDER.lower()
    has_agentrouter = bool(prov == "agentrouter" and settings.AGENTROUTER_API_KEY)
    has_openrouter = bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_MODEL)

    if not has_agentrouter and not has_openrouter:
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

    # ── Attempt AgentRouter first if configured ──
    if has_agentrouter:
        ar_payload = {
            "model": settings.AGENTROUTER_MODEL or "deepseek-v4-flash",
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1500,
        }
        ar_headers = {
            "Authorization": f"Bearer {settings.AGENTROUTER_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "claude-cli/2.1.158 (external, sdk-cli)",
            "x-app": "cli",
            "HTTP-Referer": "https://goveaseai.local",
            "X-Title": "GovEaseAI Portal",
        }
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                ar_resp = await client.post(
                    f"{settings.AGENTROUTER_BASE_URL}/chat/completions",
                    json=ar_payload,
                    headers=ar_headers,
                )
            if ar_resp.status_code == 200:
                data = ar_resp.json()
                msg = data.get("choices", [{}])[0].get("message", {})
                content = msg.get("content", "")
                reasoning = msg.get("reasoning_content", "")
                raw_answer = content.strip() if content and content.strip() else (reasoning.strip() if reasoning else "")
                if raw_answer:
                    return {
                        "success": True,
                        "answer": raw_answer,
                        "serviceId": service_id,
                    }
            else:
                logger.warning(f"[AgentRouter] guidance HTTP {ar_resp.status_code}: {ar_resp.text[:150]}. Falling back to OpenRouter.")
        except Exception as e:
            logger.warning(f"[AgentRouter] guidance call failed: {e}. Falling back to OpenRouter.")

    # ── OpenRouter Fallback ──
    if not has_openrouter:
        return {
            "success": False,
            "error": "AI guidance is temporarily unavailable."
        }

    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 450
    }

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://goveaseai.local",
        "X-Title": "GovEaseAI Portal"
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(
                f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                json=payload,
                headers=headers
            )

        if resp.status_code == 429:
            logger.warning("[OpenRouter] Rate limit reached (429)")
            return {
                "success": False,
                "error": "AI service is temporarily busy. Please try again later."
            }

        if resp.status_code != 200:
            logger.warning(f"[OpenRouter] Status code {resp.status_code}: {resp.text}")
            return {
                "success": False,
                "error": "AI guidance is temporarily unavailable. Please try again."
            }

        data = resp.json()
        raw_answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not raw_answer:
            return {
                "success": False,
                "error": "AI guidance is temporarily unavailable."
            }

        return {
            "success": True,
            "answer": raw_answer.strip(),
            "serviceId": service_id
        }
    except httpx.TimeoutException:
        logger.warning("[OpenRouter] Request timed out")
        return {
            "success": False,
            "error": "AI guidance request timed out. Please try again."
        }
    except Exception as e:
        logger.exception("[OpenRouter] Unexpected error")
        return {
            "success": False,
            "error": "AI guidance is temporarily unavailable. Please try again."
        }
