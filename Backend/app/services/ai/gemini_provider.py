"""
Gemini Direct API Provider for GovEaseAI.
Uses direct HTTP REST API calls with httpx for resilient fallback.
Supports gemini-3.6-flash / gemini-2.5-flash with text, streaming SSE, image, and PDF analysis.
"""
import json
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.services.ai.base_provider import BaseAIProvider

logger = logging.getLogger("goveaseai.ai.gemini")

# Supported modalities for Gemini Flash
_SUPPORTED_MODALITIES = {"text", "image", "pdf"}


class GeminiProvider(BaseAIProvider):
    """Calls Google Gemini API directly using httpx REST calls."""

    def __init__(self):
        self._model_name = settings.GEMINI_MODEL or "gemini-3.6-flash"

    @property
    def provider_name(self) -> str:
        return "Gemini"

    def supports_modality(self, modality: str) -> bool:
        return modality in _SUPPORTED_MODALITIES

    def _get_api_url(self, stream: bool = False) -> str:
        endpoint = "streamGenerateContent?alt=sse" if stream else "generateContent"
        return f"https://generativelanguage.googleapis.com/v1beta/models/{self._model_name}:{endpoint}?key={settings.GEMINI_API_KEY}"

    async def check_health(self) -> Dict[str, Any]:
        configured = bool(settings.GEMINI_API_KEY)
        if not configured:
            return {
                "provider": "gemini",
                "configured": False,
                "reachable": False,
                "model": self._model_name,
            }
        try:
            payload = {
                "contents": [{"parts": [{"text": "ping"}]}],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 50,
                    "thinkingConfig": {"thinkingBudget": 0},
                },
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(self._get_api_url(stream=False), json=payload)
            return {
                "provider": "gemini",
                "configured": True,
                "reachable": resp.status_code == 200,
                "model": self._model_name,
            }
        except Exception:
            return {
                "provider": "gemini",
                "configured": True,
                "reachable": False,
                "model": self._model_name,
            }

    async def generate_text(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        if not settings.GEMINI_API_KEY:
            return {"success": False, "error": "Gemini API is not configured."}

        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTIONS:\n{system_prompt}"}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will follow all instructions and guardrails strictly."}]})

        if conversation_history:
            for m in conversation_history[-6:]:
                role = "user" if m.get("sender") == "user" or m.get("role") == "user" else "model"
                text = str(m.get("text") or m.get("content", "")).strip()[:1000]
                if text:
                    contents.append({"role": role, "parts": [{"text": text}]})

        contents.append({"role": "user", "parts": [{"text": user_message.strip()[:2000]}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max(max_tokens, 500),
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(self._get_api_url(stream=False), json=payload)

            if resp.status_code != 200:
                logger.warning(f"[Gemini] HTTP {resp.status_code}: {resp.text[:150]}")
                return {"success": False, "error": f"Gemini API returned status {resp.status_code}."}

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return {"success": False, "error": "Gemini returned no response."}

            parts = candidates[0].get("content", {}).get("parts", [])
            answer = "".join([p.get("text", "") for p in parts if p.get("text")]).strip()
            if not answer:
                return {"success": False, "error": "Gemini returned empty text."}

            return {"success": True, "answer": answer}

        except Exception as e:
            logger.exception(f"[Gemini] generate_text failed: {e}")
            return {"success": False, "error": "Gemini service temporarily unavailable."}

    async def stream_text(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ):
        if not settings.GEMINI_API_KEY:
            yield "Gemini API is not configured."
            return

        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTIONS:\n{system_prompt}"}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will follow instructions."}]})

        if conversation_history:
            for m in conversation_history[-6:]:
                role = "user" if m.get("sender") == "user" or m.get("role") == "user" else "model"
                text = str(m.get("text") or m.get("content", "")).strip()[:1000]
                if text:
                    contents.append({"role": role, "parts": [{"text": text}]})

        contents.append({"role": "user", "parts": [{"text": user_message.strip()[:2000]}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max(max_tokens, 500),
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream("POST", self._get_api_url(stream=True), json=payload) as response:
                    if response.status_code != 200:
                        yield f"Gemini streaming unavailable (HTTP {response.status_code})."
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk_json = json.loads(data_str)
                                candidates = chunk_json.get("candidates", [])
                                if candidates:
                                    parts = candidates[0].get("content", {}).get("parts", [])
                                    for p in parts:
                                        if "text" in p:
                                            yield p["text"]
                            except Exception:
                                continue
        except Exception as e:
            logger.exception(f"[Gemini] stream_text failed: {e}")
            yield "Gemini streaming temporarily unavailable."

    async def analyze_image(
        self,
        image_base64: str,
        mime_type: str,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not settings.GEMINI_API_KEY:
            return {"success": False, "error": "Gemini API is not configured."}

        sys_text = system_prompt or (
            "You are GovEaseAI's document analysis system. "
            "Analyze this government document image. Extract visible text and answer accurately. "
            "Do not invent information."
        )

        payload = {
            "contents": [{
                "parts": [
                    {"text": sys_text},
                    {"inline_data": {"mime_type": mime_type, "data": image_base64}},
                    {"text": prompt},
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 2048,
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }

        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                resp = await client.post(self._get_api_url(stream=False), json=payload)

            if resp.status_code != 200:
                logger.warning(f"[Gemini] analyze_image HTTP {resp.status_code}: {resp.text[:150]}")
                return {"success": False, "error": f"Gemini image analysis returned status {resp.status_code}."}

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return {"success": False, "error": "Gemini returned no image analysis response."}

            parts = candidates[0].get("content", {}).get("parts", [])
            answer = "".join([p.get("text", "") for p in parts if p.get("text")]).strip()
            return {"success": True, "answer": answer or "Analysis completed."}

        except Exception as e:
            logger.exception(f"[Gemini] analyze_image failed: {e}")
            return {"success": False, "error": "Gemini image analysis temporarily unavailable."}

    async def analyze_document(
        self,
        file_base64: str,
        mime_type: str,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not settings.GEMINI_API_KEY:
            return {"success": False, "error": "Gemini API is not configured."}

        sys_text = system_prompt or (
            "You are GovEaseAI's document analysis system for Indian government services. "
            "Analyze this government document accurately. Extract visible text and return factual information only."
        )

        payload = {
            "contents": [{
                "parts": [
                    {"text": sys_text},
                    {"inline_data": {"mime_type": mime_type, "data": file_base64}},
                    {"text": prompt},
                ]
            }],
            "generationConfig": {
                "temperature": 0.05,
                "maxOutputTokens": 3000,
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(self._get_api_url(stream=False), json=payload)

            if resp.status_code != 200:
                logger.warning(f"[Gemini] analyze_document HTTP {resp.status_code}: {resp.text[:150]}")
                return {"success": False, "error": f"Gemini document analysis returned status {resp.status_code}."}

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return {"success": False, "error": "Gemini returned no document analysis response."}

            parts = candidates[0].get("content", {}).get("parts", [])
            answer = "".join([p.get("text", "") for p in parts if p.get("text")]).strip()
            return {"success": True, "answer": answer or "Document analysis completed."}

        except Exception as e:
            logger.exception(f"[Gemini] analyze_document failed: {e}")
            return {"success": False, "error": "Gemini document analysis temporarily unavailable."}
