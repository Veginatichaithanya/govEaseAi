"""
OpenRouter AI Provider for GovEaseAI.
Routes to google/gemini-2.5-flash via OpenRouter Chat Completions API.
Supports text, image, and PDF analysis.
"""
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.services.ai.base_provider import BaseAIProvider

logger = logging.getLogger("goveaseai.ai.openrouter")

# Supported modalities for google/gemini-2.5-flash via OpenRouter
_SUPPORTED_MODALITIES = {"text", "image", "pdf"}

_COMMON_HEADERS = {
    "HTTP-Referer": "https://goveaseai.local",
    "X-Title": "GovEaseAI Portal",
}


class OpenRouterProvider(BaseAIProvider):
    """Calls OpenRouter Chat Completions API (proxied to Gemini 2.5 Flash)."""

    @property
    def provider_name(self) -> str:
        return "OpenRouter"

    def supports_modality(self, modality: str) -> bool:
        return modality in _SUPPORTED_MODALITIES

    # ── Private helpers ──────────────────────────────────────────────────────

    def _auth_headers(self) -> Dict[str, str]:
        return {
            **_COMMON_HEADERS,
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }

    async def _post_chat(
        self,
        model: str,
        messages: List[Dict],
        temperature: float,
        max_tokens: int,
    ) -> Dict[str, Any]:
        """Send a chat completion request and return a normalized result dict."""
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                    json=payload,
                    headers=self._auth_headers(),
                )

            if resp.status_code == 429:
                logger.warning("[OpenRouter] Rate limit hit (429)")
                return {"success": False, "error": "AI service is temporarily busy. Please try again."}

            if resp.status_code == 401:
                logger.error("[OpenRouter] Invalid API key (401)")
                return {"success": False, "error": "AI service authentication failed."}

            if resp.status_code != 200:
                logger.warning(f"[OpenRouter] HTTP {resp.status_code}")
                return {"success": False, "error": "AI service temporarily unavailable. Please retry."}

            data = resp.json()
            answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not answer:
                return {"success": False, "error": "AI returned an empty response."}

            return {"success": True, "answer": answer.strip()}

        except httpx.TimeoutException:
            logger.warning("[OpenRouter] Request timed out")
            return {"success": False, "error": "AI request timed out. Please try again."}
        except Exception:
            logger.exception("[OpenRouter] Unexpected error")
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
                role = "user" if m.get("sender") == "user" else "assistant"
                text = str(m.get("text", "")).strip()[:1000]
                if text:
                    messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": user_message.strip()[:2000]})

        return await self._post_chat(
            model=settings.OPENROUTER_MODEL,
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

        if not settings.OPENROUTER_API_KEY:
            return

        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        try:
            timeout = httpx.Timeout(connect=10.0, read=60.0, write=10.0, pool=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream(
                    "POST",
                    f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                    json=payload,
                    headers=self._auth_headers(),
                ) as response:
                    if response.status_code != 200:
                        logger.warning(f"[OpenRouter] stream_text HTTP {response.status_code}")
                        return
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                import json
                                data = json.loads(data_str)
                                chunk = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if chunk:
                                    yield chunk
                            except Exception:
                                continue
        except Exception as e:
            logger.warning(f"[OpenRouter] stream_text error: {e}")
            return


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
            model=settings.OPENROUTER_VISION_MODEL,
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
        """Analyze PDF or document using file content type."""
        sys_msg = system_prompt or (
            "You are GovEaseAI's document analysis system for Indian government services. "
            "Analyze this government document accurately. "
            "Extract text, identify the document type, and answer the user's question. "
            "Return factual information only. Do not invent data."
        )
        # For PDFs, use file type in content
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
            # Treat as image for image-based documents
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
            model=settings.OPENROUTER_DOCUMENT_MODEL,
            messages=messages,
            temperature=0.05,
            max_tokens=3000,
        )

    async def check_health(self) -> Dict[str, Any]:
        configured = bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_MODEL)
        model = settings.OPENROUTER_MODEL or "google/gemini-2.5-flash"
        if not configured:
            return {
                "provider": "openrouter",
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
                    f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                    json=payload,
                    headers=self._auth_headers(),
                )
            return {
                "provider": "openrouter",
                "configured": True,
                "reachable": resp.status_code == 200,
                "model": model,
            }
        except Exception:
            return {
                "provider": "openrouter",
                "configured": True,
                "reachable": False,
                "model": model,
            }

