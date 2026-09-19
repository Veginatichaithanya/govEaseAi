"""
AgentRouter AI Provider for GovEaseAI.
Routes to agentrouter.org/v1 using deepseek-v4-flash with multimodal support.
Supports text guidance, streaming SSE, image, and PDF document analysis.
"""
import json
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.services.ai.base_provider import BaseAIProvider

logger = logging.getLogger("goveaseai.ai.agentrouter")

# Supported modalities for deepseek-v4-flash on AgentRouter
_SUPPORTED_MODALITIES = {"text", "image", "pdf"}

# AgentRouter requires valid client headers to avoid unauthorized_client_error
_CLIENT_HEADERS = {
    "User-Agent": "claude-cli/2.1.158 (external, sdk-cli)",
    "x-app": "cli",
    "HTTP-Referer": "https://goveaseai.local",
    "X-Title": "GovEaseAI Portal",
}


class AgentRouterProvider(BaseAIProvider):
    """Calls AgentRouter Chat Completions API with deepseek-v4-flash."""

    @property
    def provider_name(self) -> str:
        return "AgentRouter"

    def supports_modality(self, modality: str) -> bool:
        return modality in _SUPPORTED_MODALITIES

    def _auth_headers(self) -> Dict[str, str]:
        return {
            **_CLIENT_HEADERS,
            "Authorization": f"Bearer {settings.AGENTROUTER_API_KEY}",
            "Content-Type": "application/json",
        }

    async def _post_chat(
        self,
        model: str,
        messages: List[Dict],
        temperature: float,
        max_tokens: int,
    ) -> Dict[str, Any]:
        """Send a chat completion request to AgentRouter and return a normalized dict."""
        # For reasoning models (such as deepseek-v4-flash), allocate sufficient tokens
        # so reasoning_content does not exhaust token budget before content generation.
        effective_tokens = max(max_tokens, 1500)

        payload = {
            "model": model or settings.AGENTROUTER_MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": effective_tokens,
        }
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                resp = await client.post(
                    f"{settings.AGENTROUTER_BASE_URL}/chat/completions",
                    json=payload,
                    headers=self._auth_headers(),
                )

            if resp.status_code == 429:
                logger.warning("[AgentRouter] Rate limit hit (429)")
                return {"success": False, "error": "AI service is temporarily busy. Please try again."}

            if resp.status_code == 401:
                logger.error("[AgentRouter] Invalid API key or client rejection (401)")
                return {"success": False, "error": "AI service authentication failed."}

            if resp.status_code == 402:
                logger.warning("[AgentRouter] Budget pool exhausted (402)")
                return {"success": False, "error": "AI service budget pool quota reached."}

            if resp.status_code != 200:
                logger.warning(f"[AgentRouter] HTTP {resp.status_code}: {resp.text[:200]}")
                return {"success": False, "error": f"AI service temporarily unavailable (HTTP {resp.status_code})."}

            data = resp.json()
            msg = data.get("choices", [{}])[0].get("message", {})
            content = msg.get("content", "")
            reasoning = msg.get("reasoning_content", "")

            # If content is present, use it; otherwise fallback to reasoning text
            answer = content.strip() if content and content.strip() else (reasoning.strip() if reasoning else "")
            if not answer:
                return {"success": False, "error": "AI returned an empty response."}

            return {"success": True, "answer": answer}

        except httpx.TimeoutException:
            logger.warning("[AgentRouter] Request timed out")
            return {"success": False, "error": "AI request timed out. Please try again."}
        except Exception:
            logger.exception("[AgentRouter] Unexpected error")
            return {"success": False, "error": "AI service temporarily unavailable."}

    # ── Public Interface ─────────────────────────────────────────────────────

    async def generate_text(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        messages = [{"role": "system", "content": system_prompt}]
        if conversation_history:
            for m in conversation_history[-6:]:
                role = "user" if m.get("sender") == "user" or m.get("role") == "user" else "assistant"
                text = str(m.get("text") or m.get("content", "")).strip()[:1000]
                if text:
                    messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": user_message.strip()[:2000]})

        return await self._post_chat(
            model=settings.AGENTROUTER_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    async def stream_text(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ):
        messages = [{"role": "system", "content": system_prompt}]
        if conversation_history:
            for m in conversation_history[-6:]:
                role = "user" if m.get("sender") == "user" or m.get("role") == "user" else "assistant"
                text = str(m.get("text") or m.get("content", "")).strip()[:1000]
                if text:
                    messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": user_message.strip()[:2000]})

        effective_tokens = max(max_tokens, 1500)
        payload = {
            "model": settings.AGENTROUTER_MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": effective_tokens,
            "stream": True,
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream(
                    "POST",
                    f"{settings.AGENTROUTER_BASE_URL}/chat/completions",
                    json=payload,
                    headers=self._auth_headers(),
                ) as response:
                    if response.status_code != 200:
                        yield f"AI service temporarily unavailable (HTTP {response.status_code})."
                        return

                    streamed_content = False
                    reasoning_buffer = []

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                data = json.loads(data_str)
                                delta = data.get("choices", [{}])[0].get("delta", {})
                                chunk = delta.get("content", "")
                                r_chunk = delta.get("reasoning_content", "")
                                if r_chunk:
                                    reasoning_buffer.append(r_chunk)
                                if chunk:
                                    streamed_content = True
                                    yield chunk
                            except Exception:
                                continue

                    # If no content tokens were emitted, yield reasoning buffer as fallback
                    if not streamed_content and reasoning_buffer:
                        yield "".join(reasoning_buffer)

        except Exception:
            logger.exception("[AgentRouter] stream_text error")
            yield "AI service temporarily unavailable. Please retry."

    async def analyze_image(
        self,
        image_base64: str,
        mime_type: str,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        sys_msg = system_prompt or (
            "You are GovEaseAI's document analysis system. "
            "Analyze this government document image accurately. "
            "Extract visible text, identify the document type, and answer the user's question. "
            "Do not invent information not visible in the image."
        )
        user_content = [
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{image_base64}"},
            },
            {"type": "text", "text": prompt},
        ]
        messages = [
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": user_content},
        ]
        return await self._post_chat(
            model=settings.AGENTROUTER_VISION_MODEL or settings.AGENTROUTER_MODEL,
            messages=messages,
            temperature=0.1,
            max_tokens=2048,
        )

    async def analyze_document(
        self,
        file_base64: str,
        mime_type: str,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Analyze PDF or image document."""
        sys_msg = system_prompt or (
            "You are GovEaseAI's document analysis system for Indian government services. "
            "Analyze this government document accurately. "
            "Extract text, identify the document type, and answer the user's question. "
            "Return factual information only. Do not invent data."
        )
        if mime_type == "application/pdf":
            user_content = [
                {
                    "type": "file",
                    "file": {
                        "filename": "document.pdf",
                        "file_data": f"data:{mime_type};base64,{file_base64}",
                    },
                },
                {"type": "text", "text": prompt},
            ]
        else:
            user_content = [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime_type};base64,{file_base64}"},
                },
                {"type": "text", "text": prompt},
            ]

        messages = [
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": user_content},
        ]
        return await self._post_chat(
            model=settings.AGENTROUTER_DOCUMENT_MODEL or settings.AGENTROUTER_MODEL,
            messages=messages,
            temperature=0.05,
            max_tokens=3000,
        )

    async def check_health(self) -> Dict[str, Any]:
        configured = bool(settings.AGENTROUTER_API_KEY)
        model = settings.AGENTROUTER_MODEL or "deepseek-v4-flash"
        if not configured:
            return {
                "provider": "agentrouter",
                "configured": False,
                "reachable": False,
                "model": model,
            }
        try:
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 5,
                "temperature": 0.1,
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    f"{settings.AGENTROUTER_BASE_URL}/chat/completions",
                    json=payload,
                    headers=self._auth_headers(),
                )
            return {
                "provider": "agentrouter",
                "configured": True,
                "reachable": resp.status_code == 200,
                "model": model,
            }
        except Exception:
            return {
                "provider": "agentrouter",
                "configured": True,
                "reachable": False,
                "model": model,
            }

