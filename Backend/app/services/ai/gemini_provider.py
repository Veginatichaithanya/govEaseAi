"""
Gemini Direct API Provider for GovEaseAI.
Uses direct HTTP REST API calls with httpx for resilient model fallback and retry.
Supports text, streaming SSE, image, and PDF analysis without exposing API keys.
"""
import asyncio
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.services.ai.base_provider import BaseAIProvider

logger = logging.getLogger("goveaseai.ai.gemini")
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

# Supported modalities for Gemini Flash
_SUPPORTED_MODALITIES = {"text", "image", "pdf"}

# Prioritized fallback models for multimodal / text requests
_FALLBACK_GEMINI_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite-preview",
    "gemini-3-flash-preview",
]

# In-memory cooldown map for models whose daily/free-tier quota is exhausted
_QUOTA_SKIP_UNTIL: Dict[str, float] = {}


def _sanitize_msg(msg: str) -> str:
    """Redact API keys and bearer tokens from log/error strings."""
    if not msg:
        return ""
    msg = re.sub(r'([?&]key=)[^&\s"\']+', r'\1[REDACTED]', str(msg))
    msg = re.sub(r'(Bearer\s+)[a-zA-Z0-9_\-\.]+', r'\1[REDACTED]', msg)
    return msg


def _extract_text_from_parts(candidates: List[Dict[str, Any]]) -> str:
    """Extract concatenated non-thought text from Gemini response candidates."""
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts", [])
    return "".join(
        [p.get("text", "") for p in parts if p.get("text") and not p.get("thought")]
    ).strip()


class GeminiProvider(BaseAIProvider):
    """Calls Google Gemini API directly using httpx REST calls with resilient fallback."""

    def __init__(self):
        self._model_name = (settings.GEMINI_MODEL or "gemini-3.6-flash").strip()

    @property
    def provider_name(self) -> str:
        return "Gemini"

    def supports_modality(self, modality: str) -> bool:
        return modality in _SUPPORTED_MODALITIES

    def _candidate_models(self) -> List[str]:
        models: List[str] = []
        for m in [self._model_name] + _FALLBACK_GEMINI_MODELS:
            if m and m not in models:
                models.append(m)
        return models

    def _get_api_url(self, stream: bool = False, model: Optional[str] = None) -> str:
        target_model = model or self._model_name
        endpoint = "streamGenerateContent" if stream else "generateContent"
        alt_param = "&alt=sse" if stream else ""
        return f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:{endpoint}?key={settings.GEMINI_API_KEY}{alt_param}"

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
                },
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                for model in self._candidate_models()[:3]:
                    resp = await client.post(self._get_api_url(stream=False, model=model), json=payload)
                    if resp.status_code == 200:
                        return {
                            "provider": "gemini",
                            "configured": True,
                            "reachable": True,
                            "model": model,
                        }
            return {
                "provider": "gemini",
                "configured": True,
                "reachable": False,
                "model": self._model_name,
            }
        except Exception:
            return {
                "provider": "gemini",
                "configured": True,
                "reachable": False,
                "model": self._model_name,
            }

    async def _post_with_fallback(
        self,
        payload: Dict[str, Any],
        timeout_secs: float = 45.0,
        operation: str = "request",
    ) -> Dict[str, Any]:
        """Execute a Gemini generateContent request with transient retry and model fallback."""
        if not settings.GEMINI_API_KEY:
            return {"success": False, "error": "Gemini API is not configured."}

        last_error = "AI service is temporarily unavailable. Please try again."
        last_status = 0
        now = time.monotonic()

        all_candidates = self._candidate_models()
        active_candidates = [m for m in all_candidates if _QUOTA_SKIP_UNTIL.get(m, 0) <= now]
        if not active_candidates:
            active_candidates = all_candidates

        for model in active_candidates:
            for attempt in range(2):
                try:
                    async with httpx.AsyncClient(timeout=timeout_secs) as client:
                        resp = await client.post(
                            self._get_api_url(stream=False, model=model),
                            json=payload,
                        )

                    if resp.status_code == 200:
                        data = resp.json()
                        answer = _extract_text_from_parts(data.get("candidates", []))
                        if answer:
                            logger.info(f"[Gemini] {operation} succeeded with model={model}")
                            return {"success": True, "answer": answer}
                        logger.warning(f"[Gemini] {operation} returned empty candidates on {model}")
                        last_error = "Gemini returned an empty response."
                        break

                    last_status = resp.status_code
                    err_body = _sanitize_msg(resp.text[:250])
                    logger.warning(f"[Gemini] {operation} HTTP {resp.status_code} on {model}: {err_body}")

                    # Authentication errors won't resolve with another model
                    if resp.status_code in (401, 403):
                        return {
                            "success": False,
                            "error": "AI service authentication failed. Please contact the administrator.",
                        }

                    # Model deprecated / invalid argument for this model -> skip directly to fallback model
                    if resp.status_code in (404, 400):
                        last_error = f"Model {model} unavailable (HTTP {resp.status_code})."
                        break

                    # Quota exceeded (429): if daily/free-tier quota is exhausted, move straight to next model
                    if resp.status_code == 429:
                        lower_body = err_body.lower()
                        last_error = "AI service quota limit reached. Trying fallback model."
                        if "per day" in lower_body or "limit: 0" in lower_body or "exceeded your current quota" in lower_body:
                            _QUOTA_SKIP_UNTIL[model] = time.monotonic() + 900.0
                            break
                        if attempt == 0:
                            await asyncio.sleep(1.5)
                            continue
                        break

                    # Temporary overload / gateway error (503, 502, 504): 1 quick retry, then try next model
                    if resp.status_code in (503, 502, 504):
                        last_error = "AI service is experiencing high demand. Please try again."
                        if attempt == 0:
                            await asyncio.sleep(1.0)
                            continue
                        break

                    last_error = f"Gemini API returned status {resp.status_code}."
                    break

                except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as net_err:
                    logger.warning(
                        f"[Gemini] {operation} network/timeout on {model} (attempt {attempt + 1}): "
                        f"{_sanitize_msg(str(net_err))}"
                    )
                    last_error = "AI service request timed out. Please try again."
                    if attempt == 0:
                        await asyncio.sleep(1.0)
                        continue
                    break
                except Exception as ex:
                    logger.warning(
                        f"[Gemini] {operation} unexpected error on {model}: {_sanitize_msg(str(ex))}"
                    )
                    last_error = "AI service temporarily unavailable."
                    break

        if last_status == 429:
            return {"success": False, "error": "AI service rate/quota limit reached. Please wait a moment and try again."}
        return {"success": False, "error": last_error}

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
            },
        }

        return await self._post_with_fallback(payload, timeout_secs=30.0, operation="generate_text")

    async def stream_text(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ):
        if not settings.GEMINI_API_KEY:
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
            },
        }

        timeout = httpx.Timeout(connect=10.0, read=60.0, write=10.0, pool=10.0)
        for current_model in self._candidate_models():
            streamed = False
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    async with client.stream("POST", self._get_api_url(stream=True, model=current_model), json=payload) as response:
                        if response.status_code != 200:
                            logger.warning(f"[Gemini] stream_text returned HTTP {response.status_code} for {current_model}")
                            if response.status_code in (404, 400, 429, 503):
                                continue
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
                                            if p.get("text") and not p.get("thought"):
                                                streamed = True
                                                yield p["text"]
                                except Exception:
                                    continue
                if streamed:
                    return
            except Exception as e:
                logger.warning(f"[Gemini] stream_text error on {current_model}: {_sanitize_msg(str(e))}")
                if streamed:
                    return
                continue

    async def analyze_image(
        self,
        image_base64: str,
        mime_type: str,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
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
            },
        }

        return await self._post_with_fallback(payload, timeout_secs=25.0, operation="analyze_image")

    async def analyze_document(
        self,
        file_base64: str,
        mime_type: str,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
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
            },
        }

        return await self._post_with_fallback(payload, timeout_secs=35.0, operation="analyze_document")
