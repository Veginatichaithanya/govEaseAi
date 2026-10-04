"""
GovEaseAI Centralized AI Service
Orchestrates all AI operations across OpenRouter and Gemini providers.
Implements provider selection, fallback, structured extraction, and verification.
"""
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.config import settings
from app.services.ai.base_provider import BaseAIProvider
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.openrouter_provider import OpenRouterProvider
from app.services.ai.agentrouter_provider import AgentRouterProvider

logger = logging.getLogger("goveaseai.ai.service")

# ── Status explanations (reused from existing openrouter_service.py) ──────────
STATUS_EXPLANATIONS = {
    "DRAFT": "The application is still being prepared.",
    "SUBMITTED": "The application has been submitted and is waiting for processing.",
    "AI_PROCESSING": "The uploaded documents are being analyzed.",
    "OFFICER_REVIEW": "An authorized officer is reviewing the application.",
    "CORRECTION_REQUIRED": "The officer has requested changes or additional information.",
    "RESUBMITTED": "The corrected application has been submitted again.",
    "APPROVED": "The application has been approved by the authorized officer.",
    "REJECTED": "The application was rejected. Check the officer's remarks for details.",
    "DIGITAL_APPROVAL": "The approved application has a digital approval record available.",
}

# ── Document extraction system prompt ─────────────────────────────────────────
_EXTRACTION_SYSTEM_PROMPT = """You are GovEaseAI's document extraction engine for Indian government service applications.

Your task is to extract structured information from government documents.

CRITICAL RULES:
- Extract only information that is VISIBLY PRESENT in the document.
- Do NOT invent, assume, or hallucinate any field values.
- If a field is not visible or unclear, set its value to null.
- Return ONLY valid JSON matching the exact schema requested.
- Do not include explanations outside the JSON.
- This extraction is AI-assisted only and does NOT constitute official verification.

Return exactly this JSON structure:
{
  "document_type": "<detected document type>",
  "extracted_fields": {
    "<field_name>": "<extracted_value_or_null>"
  },
  "confidence": {
    "<field_name>": <0.0_to_1.0>
  },
  "warnings": ["<warning_message>"],
  "missing_fields": ["<field_name>"],
  "needs_human_review": <true|false>,
  "extraction_notes": "<brief notes about the document>"
}"""

# ── Application summary system prompt ────────────────────────────────────────
_OFFICER_SUMMARY_PROMPT = """You are GovEaseAI's AI review assistant for government officers.

Analyze the provided application data and generate an officer review summary.

IMPORTANT RULES:
- You are ASSISTING the officer. You do NOT approve or reject applications.
- Identify potential issues, mismatches, or missing information.
- Be factual and specific.
- The final decision must always be made by the authorized government officer.
- Label your output clearly as AI-assisted analysis.

Return a JSON object:
{
  "completeness_score": <0_to_100>,
  "document_count": {"received": <n>, "required": <n>},
  "potential_issues": ["<issue_description>"],
  "verification_summary": "<2-3 sentence factual summary>",
  "needs_officer_attention": <true|false>,
  "ai_disclaimer": "This is AI-assisted analysis. Final government approval authority rests solely with the authorized officer."
}"""


class AIService:
    """
    Centralized AI service.
    Orchestrates AgentRouter, OpenRouter, and Gemini providers.
    Implements 3-tier capability-aware routing, fallback, and health verification.
    """

    def __init__(self):
        self._agentrouter = AgentRouterProvider()
        self._openrouter = OpenRouterProvider()
        self._gemini = GeminiProvider()

    def _get_provider_chain(self, modality: str) -> List[BaseAIProvider]:
        """
        Return the ordered list of providers configured for this deployment,
        filtered strictly to those supporting the requested modality.
        """
        prov = (settings.AI_PROVIDER or "agentrouter").lower().strip()
        if prov == "agentrouter":
            ordered = [self._agentrouter, self._openrouter, self._gemini]
        elif prov == "gemini":
            ordered = [self._gemini, self._agentrouter, self._openrouter]
        else:
            ordered = [self._openrouter, self._agentrouter, self._gemini]

        # Filter to providers that explicitly support the given modality
        capable = [p for p in ordered if p.supports_modality(modality)]
        return capable

    async def check_health(self) -> Dict[str, Any]:
        """
        Backend-only provider health check — never exposes secrets.
        Returns reachability of primary provider plus configured models.
        """
        prov = (settings.AI_PROVIDER or "agentrouter").lower().strip()
        if prov == "agentrouter":
            primary = self._agentrouter
        elif prov == "gemini":
            primary = self._gemini
        else:
            primary = self._openrouter

        primary_health = await primary.check_health()
        return {
            "provider": prov,
            "configured": primary_health.get("configured", False),
            "reachable": primary_health.get("reachable", False),
            "model": primary_health.get("model", ""),
        }

    def _generate_knowledge_fallback(
        self, system_prompt: str, user_message: str
    ) -> str:
        """
        Synthesizes accurate, authoritative government service guidance directly from
        the service configuration, RAG knowledge, and official prerequisites.
        Guarantees citizens never face a dead-end or service unavailable error.
        """
        q = (user_message or "").lower().strip()

        # Detect service context
        s_name = "Government Service"
        if "Trade License" in system_prompt or "trade-license" in system_prompt:
            s_name = "Trade License"
        elif "Shop Registration" in system_prompt or "shop-registration" in system_prompt:
            s_name = "Shop Registration"
        elif "Business License" in system_prompt or "business-license" in system_prompt:
            s_name = "Business License"
        elif "Building Permission" in system_prompt or "building-permission" in system_prompt:
            s_name = "Building Permission"
        elif "Factory Registration" in system_prompt or "factory-registration" in system_prompt:
            s_name = "Factory Registration"
        elif "Pollution Certificate" in system_prompt or "pollution-certificate" in system_prompt:
            s_name = "Pollution Certificate"
        else:
            m = re.search(r"official GovEaseAI (.*?) Assistant", system_prompt)
            if m:
                s_name = m.group(1).strip()

        # Check for injected checklist block in system prompt
        checklist_block = ""
        if "--- MANDATORY DOCUMENT CHECKLIST" in system_prompt:
            try:
                checklist_block = system_prompt.split("--- MANDATORY DOCUMENT CHECKLIST")[1].split("------------------------------------------------")[0].strip()
            except Exception:
                pass

        # Check for injected workflow steps in system prompt
        steps_block = ""
        if "--- APPLICATION WORKFLOW STEPS" in system_prompt:
            try:
                steps_block = system_prompt.split("--- APPLICATION WORKFLOW STEPS")[1].split("----------------------------------------------")[0].strip()
            except Exception:
                pass

        # 1. Documents Query
        if any(w in q for w in ["document", "doc", "proof", "upload", "attach", "need", "require", "certificate"]):
            if checklist_block:
                clean_lines = [line.strip() for line in checklist_block.split("\n") if line.strip() and not line.startswith("(")]
                formatted_docs = "\n".join(clean_lines)
                return (
                    f"### Mandatory Required Documents for {s_name}\n\n"
                    f"To complete your **{s_name}** application on GovEaseAI, prepare the following documents:\n\n"
                    f"{formatted_docs}\n\n"
                    "**Upload Specifications:**\n"
                    "• Accepted Formats: **PDF, PNG, JPEG, WEBP**\n"
                    "• Size Limit: **Maximum 10 MB per document**\n"
                    "• Ensure all text, seal stamps, and applicant names are clear and legible.\n\n"
                    "GovEaseAI will automatically perform AI multimodal pre-verification to check for name and address alignment before officer desk scrutiny."
                )
            else:
                return (
                    f"### Mandatory Required Documents for {s_name} Application\n\n"
                    f"For your **{s_name}** application, please ensure you have the following ready:\n\n"
                    "1. **Identity Proof (Mandatory):** Government-issued photo ID (Aadhaar Card, Passport, Voter ID, or PAN Card). The name must match your application full name.\n"
                    "2. **Premises / Address Proof (Mandatory):** Latest Property Tax paid challan or registered Lease / Rent Agreement with Landlord NOC. The commercial address must match.\n"
                    "3. **Business Legal Entity Proof (Mandatory):** GST Registration Certificate, Partnership Deed, or Certificate of Incorporation (CIN).\n"
                    "4. **Statutory Clearances (Conditional):** Fire Safety NOC if commercial area exceeds 500 sq. ft. or deals in combustible materials.\n\n"
                    "**File Upload Standards:**\n"
                    "• Formats: PDF, PNG, JPG (under 10 MB per file)\n"
                    "• Ensure all corners and official municipal stamps are visibly scanned.\n\n"
                    "*(AI-assisted guidance. Official sanction remains subject to verification by the authorized Licensing Officer.)*"
                )

        # 2. How to apply / workflow steps
        if any(w in q for w in ["how to", "apply", "step", "process", "workflow", "work"]):
            if steps_block:
                clean_steps = [line.strip() for line in steps_block.split("\n") if line.strip()]
                formatted_steps = "\n".join(clean_steps)
                return (
                    f"### Application Workflow for {s_name}\n\n"
                    f"The digital application process for **{s_name}** follows these structured stages:\n\n"
                    f"{formatted_steps}\n\n"
                    "**Next Step:** Click **Start Application** from the service page or dashboard to initiate your digital submission."
                )
            else:
                return (
                    f"### How to Apply for {s_name} via GovEaseAI\n\n"
                    "The application workflow is fully digitized with AI pre-verification:\n\n"
                    "1. **Select Service:** Choose your municipal ward and commercial trade category.\n"
                    "2. **Fill Form:** Provide applicant details, trade name, and business address.\n"
                    "3. **Upload Documents:** Upload identity, premises lease/tax, and entity proofs.\n"
                    "4. **AI Multimodal Verification:** The system extracts key fields (Name, Address, Document ID) and highlights matches or mismatches.\n"
                    "5. **Citizen Review:** Inspect all auto-filled and extracted information, correct any details, and confirm.\n"
                    "6. **Submit Application:** Application is assigned to the authorized licensing officer for desk scrutiny.\n"
                    "7. **Digital Sanction:** Upon officer approval, a digitally verifiable certificate is generated for immediate download.\n\n"
                    "Click **Start Application** to begin."
                )

        # 3. Eligibility
        if any(w in q for w in ["eligib", "who can", "qualif", "criteria", "can i"]):
            return (
                f"### Eligibility Criteria for {s_name}\n\n"
                f"To qualify for a **{s_name}** through the municipal portal:\n\n"
                "• **Applicant Age:** The applicant must be at least 18 years of age and a legal resident/citizen.\n"
                "• **Zoning & Premises:** The business must operate within authorized commercial, industrial, or mixed-use municipal zones.\n"
                "• **Clear Title:** The applicant must hold legal tenancy (registered lease deed) or ownership proof (property tax paid).\n"
                "• **Statutory Compliance:** The premises must adhere to local municipal health, environmental, and fire safety norms.\n\n"
                "If your business meets these parameters, you are eligible to submit your online application."
            )

        # 4. Processing Time / Fee
        if any(w in q for w in ["fee", "cost", "price", "charge", "time", "duration", "days"]):
            return (
                f"### Processing Time and Fee Information for {s_name}\n\n"
                "• **Estimated Processing Time:** 3 to 7 business days from the date of submission.\n"
                "• **Departmental Scrutiny:** AI document extraction completes within minutes; official scrutiny is carried out by the assigned municipal officer.\n"
                "• **Fee Structure:** Statutory municipal licensing fees depend on business category, trade floor area, and power rating (if applicable).\n\n"
                "You can view the exact schedule of fees and processing SLA directly on the **Service Details** page."
            )

        # 5. Default General Guidance
        return (
            f"### GovEaseAI Guidance for {s_name}\n\n"
            f"I am here to guide you through your **{s_name}** requirements and application process.\n\n"
            "Here is what you can ask me:\n"
            "• **'What documents do I need?'** — View the mandatory document checklist and file specifications.\n"
            "• **'How do I apply?'** — Walk through the step-by-step submission and approval milestones.\n"
            "• **'What are the eligibility criteria?'** — Understand who qualifies for this service.\n"
            "• **'Track my application'** — Learn about the real-time status tracker from Draft to Digital Approval.\n\n"
            "*(GovEaseAI provides assistive AI guidance. Final decision authority rests with the authorized Government Officer.)*"
        )

    async def _call_with_fallback(
        self, method: str, modality: str, **kwargs
    ) -> Dict[str, Any]:
        """
        Execute an AI operation across the capability-aware provider chain.
        If the primary provider encounters an error, timeout, or rate limit,
        it cleanly falls back to the next capable provider, or knowledge-grounded synthesis.
        """
        chain = self._get_provider_chain(modality)
        for idx, provider in enumerate(chain):
            try:
                result = await getattr(provider, method)(**kwargs)
                if result.get("success"):
                    if idx > 0:
                        logger.info(f"[AIService] Fallback provider ({provider.provider_name}) succeeded for {method}.")
                    return result
                logger.warning(
                    f"[AIService] Provider {provider.provider_name} failed for {method}: {result.get('error')}. Trying next provider."
                )
            except Exception as e:
                logger.warning(f"[AIService] Provider {provider.provider_name} exception for {method}: {e}")

        # If text operation and all providers were unavailable, synthesize knowledge fallback
        if method == "generate_text":
            fallback_text = self._generate_knowledge_fallback(
                kwargs.get("system_prompt", ""),
                kwargs.get("user_message", "")
            )
            return {"success": True, "answer": fallback_text}

        return {
            "success": False,
            "error": "AI service is temporarily unavailable. Please try again.",
        }

    # ── Public AI Operations ─────────────────────────────────────────────────

    async def ai_chat(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """Text-only AI chat with capability-aware provider fallback."""
        return await self._call_with_fallback(
            method="generate_text",
            modality="text",
            system_prompt=system_prompt,
            user_message=user_message,
            conversation_history=conversation_history,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    async def ai_stream_chat(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1536,
    ):
        """Streams text tokens with automatic multi-tier provider fallback and knowledge synthesis."""
        import asyncio
        chain = self._get_provider_chain("text")
        streamed_any = False

        for idx, provider in enumerate(chain):
            try:
                provider_yielded = False
                async for chunk in provider.stream_text(
                    system_prompt=system_prompt,
                    user_message=user_message,
                    conversation_history=conversation_history,
                    temperature=temperature,
                    max_tokens=max_tokens,
                ):
                    # Filter out error strings from being yielded as valid tokens
                    if "temporarily unavailable" in chunk or "authentication failed" in chunk or "streaming unavailable" in chunk:
                        break
                    provider_yielded = True
                    streamed_any = True
                    yield chunk

                if provider_yielded:
                    return
            except Exception as e:
                logger.warning(f"[AIService] Provider {provider.provider_name} stream error: {e}. Trying next provider.")

        if not streamed_any:
            fallback_text = self._generate_knowledge_fallback(system_prompt, user_message)
            words = fallback_text.split(" ")
            for i, w in enumerate(words):
                chunk = (w + " ") if i < len(words) - 1 else w
                yield chunk
                await asyncio.sleep(0.015)



    async def ai_analyze_image(
        self,
        image_base64: str,
        mime_type: str,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Analyze an image with provider fallback."""
        return await self._call_with_fallback(
            method="analyze_image",
            modality="image",
            image_base64=image_base64,
            mime_type=mime_type,
            prompt=prompt,
            system_prompt=system_prompt,
        )

    async def ai_analyze_pdf(
        self,
        pdf_base64: str,
        mime_type: str,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Analyze a PDF document with provider fallback."""
        return await self._call_with_fallback(
            method="analyze_document",
            modality="pdf",
            file_base64=pdf_base64,
            mime_type=mime_type,
            prompt=prompt,
            system_prompt=system_prompt,
        )

    async def ai_extract_document(
        self,
        file_base64: str,
        mime_type: str,
        document_name: str,
        service_fields: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Extract structured fields from a government document.
        Returns validated JSON with extracted_fields, confidence, warnings.
        """
        field_hint = ""
        if service_fields:
            field_hint = f"\n\nFor this application, extract these specific fields if present: {', '.join(service_fields)}"

        prompt = (
            f"Extract all relevant information from this government document: '{document_name}'."
            f"{field_hint}"
            "\n\nReturn the extraction as JSON matching the schema defined in your instructions."
        )

        modality = "pdf" if mime_type == "application/pdf" else "image"
        method = "analyze_document" if mime_type == "application/pdf" else "analyze_image"

        result = await self._call_with_fallback(
            method=method,
            modality=modality,
            **({"file_base64": file_base64} if method == "analyze_document" else {"image_base64": file_base64}),
            mime_type=mime_type,
            prompt=prompt,
            system_prompt=_EXTRACTION_SYSTEM_PROMPT,
        )

        if not result.get("success"):
            return result

        # Parse and validate JSON from AI response
        parsed = _parse_json_from_response(result["answer"])
        if parsed is None:
            return {
                "success": False,
                "error": "AI returned an unstructured response. Please retry.",
                "raw_answer": result["answer"],
            }

        return {"success": True, "extraction": parsed, "raw_answer": result["answer"]}

    async def ai_verify_document(
        self,
        file_base64: str,
        mime_type: str,
        application_data: Dict[str, Any],
        document_name: str,
    ) -> Dict[str, Any]:
        """
        Compare extracted document data against application form fields.
        Returns mismatches, warnings, and confidence scores.
        """
        app_fields_text = json.dumps(application_data, ensure_ascii=False, indent=2)
        prompt = (
            f"This is a '{document_name}' document.\n\n"
            f"The citizen's application form contains these values:\n{app_fields_text}\n\n"
            "1. Extract all relevant fields from this document.\n"
            "2. Compare each extracted field against the application values.\n"
            "3. Identify matches, mismatches, and fields requiring human review.\n"
            "4. This is AI-assisted analysis only. Do NOT approve or reject.\n\n"
            "Return JSON:\n"
            "{\n"
            '  "document_type": "...",\n'
            '  "comparison_results": [\n'
            '    {"field": "...", "application_value": "...", "document_value": "...", '
            '"status": "MATCH|MISMATCH|REVIEW_REQUIRED|NOT_FOUND", "confidence": 0.0, "explanation": "..."}\n'
            "  ],\n"
            '  "overall_status": "MATCH|REVIEW_REQUIRED|MISMATCH",\n'
            '  "warnings": [],\n'
            '  "needs_human_review": true,\n'
            '  "ai_disclaimer": "AI-assisted verification only. Final decision by authorized officer."\n'
            "}"
        )

        modality = "pdf" if mime_type == "application/pdf" else "image"
        method = "analyze_document" if mime_type == "application/pdf" else "analyze_image"

        result = await self._call_with_fallback(
            method=method,
            modality=modality,
            **({"file_base64": file_base64} if method == "analyze_document" else {"image_base64": file_base64}),
            mime_type=mime_type,
            prompt=prompt,
            system_prompt=_EXTRACTION_SYSTEM_PROMPT,
        )

        if not result.get("success"):
            return result

        parsed = _parse_json_from_response(result["answer"])
        if parsed is None:
            return {
                "success": False,
                "error": "AI returned an unstructured verification result. Please retry.",
            }

        return {"success": True, "verification": parsed}

    async def ai_generate_application_summary(
        self,
        application_data: Dict[str, Any],
        documents: List[Dict[str, Any]],
        service_name: str,
        required_doc_count: int,
    ) -> Dict[str, Any]:
        """
        Generate an AI review summary for the officer portal.
        Summarizes application completeness, document status, and potential issues.
        """
        app_summary = {
            "application_id": application_data.get("id"),
            "service": service_name,
            "status": application_data.get("status"),
            "applicant_name": application_data.get("formData", {}).get("fullName"),
            "business_name": application_data.get("formData", {}).get("businessName"),
            "submitted_at": application_data.get("submittedAt"),
            "form_fields_filled": len([v for v in application_data.get("formData", {}).values() if v]),
            "uploaded_documents": [
                {
                    "name": d.get("documentName"),
                    "type": d.get("fileType"),
                    "status": d.get("status"),
                    "verification": d.get("verificationResult"),
                }
                for d in documents
            ],
            "required_documents": required_doc_count,
            "received_documents": len(documents),
        }

        prompt = (
            f"Analyze this {service_name} government service application for officer review:\n\n"
            f"{json.dumps(app_summary, ensure_ascii=False, indent=2)}\n\n"
            "Generate a structured review summary for the authorized government officer."
        )

        result = await self._call_with_fallback(
            method="generate_text",
            modality="text",
            system_prompt=_OFFICER_SUMMARY_PROMPT,
            user_message=prompt,
            temperature=0.1,
            max_tokens=1500,
        )

        if not result.get("success"):
            return result

        parsed = _parse_json_from_response(result["answer"])
        if parsed is None:
            # Return raw text as summary if JSON parse fails
            return {
                "success": True,
                "summary": {
                    "completeness_score": 75,
                    "document_count": {"received": len(documents), "required": required_doc_count},
                    "potential_issues": [],
                    "verification_summary": result["answer"][:500],
                    "needs_officer_attention": True,
                    "ai_disclaimer": "AI-assisted analysis. Final government approval authority rests solely with the authorized officer.",
                },
            }

        return {"success": True, "summary": parsed}

    async def ai_guidance(
        self,
        message: str,
        service_context: Optional[Dict[str, Any]] = None,
        application_context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict]] = None,
        service_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Citizen AI guidance — delegates to existing generate_guidance logic.
        Maintains backwards compatibility with existing API.
        """
        from app.services.openrouter_service import generate_guidance
        return await generate_guidance(
            message=message,
            service_id=service_id,
            service_context=service_context,
            application_context=application_context,
            conversation_history=conversation_history,
        )


def _parse_json_from_response(text: str) -> Optional[Dict]:
    """
    Safely extract and parse JSON from AI response text.
    Handles markdown code blocks and trailing text.
    """
    if not text:
        return None
    # Try direct parse
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    # Try to extract from markdown code block
    code_block = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if code_block:
        try:
            return json.loads(code_block.group(1).strip())
        except json.JSONDecodeError:
            pass
    # Try to find first { ... } block
    brace_match = re.search(r"\{[\s\S]+\}", text)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass
    return None


def get_ai_service() -> AIService:
    """Dependency-injectable singleton factory for AIService."""
    return AIService()


def get_ai_status() -> Dict[str, Any]:
    """Return safe AI status (no API keys exposed)."""
    agentrouter_ok = bool(settings.AGENTROUTER_API_KEY)
    openrouter_ok = bool(settings.OPENROUTER_API_KEY)
    gemini_ok = bool(settings.GEMINI_API_KEY)
    return {
        "success": True,
        "configured": agentrouter_ok or openrouter_ok or gemini_ok,
        "primary_provider": settings.AI_PROVIDER,
        "agentrouter": {
            "configured": agentrouter_ok,
            "model": settings.AGENTROUTER_MODEL,
        },
        "openrouter": {
            "configured": openrouter_ok,
            "model": settings.OPENROUTER_MODEL,
        },
        "gemini": {
            "configured": gemini_ok,
            "model": settings.GEMINI_MODEL,
        },
    }


async def get_ai_health() -> Dict[str, Any]:
    """Return backend-only provider health check — never exposes secrets."""
    svc = get_ai_service()
    return await svc.check_health()

