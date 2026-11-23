"""
Lightweight document extractor for GovEaseAI.

Strategy (no torch / Ollama required):
  1. Extract raw text from the uploaded file:
       - PDF  → pypdf (pure-Python, already installed)
       - Image → Pillow (convert to base64, then send to Gemini Vision)
  2. Send the extracted text (or image) to the Gemini API for structured
     JSON extraction using the same prompt design as the reference
     OCR-Data-extractor-tool/inference.py.
  3. Return { "ocr_text": <str>, "parsed_json": <dict> } to the caller.

Falls back gracefully: if Gemini is unavailable the raw text is still
returned and an empty parsed_json is used so the upload never crashes.
"""

import base64
import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict

import httpx

logger = logging.getLogger("goveaseai.ocr")


# ---------------------------------------------------------------------------
# Text extraction helpers
# ---------------------------------------------------------------------------

def _extract_pdf_text(file_path: str) -> str:
    """Extract plain text from a PDF using pypdf (zero-dependency)."""
    try:
        import pypdf  # already in requirements
        reader = pypdf.PdfReader(file_path)
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)
        return "\n".join(pages).strip()
    except Exception as e:
        logger.warning(f"pypdf extraction failed: {e}")
        return ""


def _image_to_base64(file_path: str) -> tuple[str, str]:
    """Return (base64_string, mime_type) for an image file."""
    from PIL import Image
    import io
    suffix = Path(file_path).suffix.lower()
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}
    mime_type = mime_map.get(suffix, "image/png")
    with Image.open(file_path) as img:
        img = img.convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return b64, "image/png"


# ---------------------------------------------------------------------------
# LLM extraction via Gemini REST API (matches OCR tool's inference.py logic)
# ---------------------------------------------------------------------------

EXTRACTION_PROMPT = """
You are an expert document parser for Indian government service applications.

Analyze the document content and extract information in valid JSON with this exact structure:
{
  "entities": {
    "names": [],
    "emails": [],
    "phone_numbers": [],
    "dates": [],
    "organizations": [],
    "addresses": [],
    "amounts": []
  },
  "form_fields": {},
  "document_type": "",
  "summary": "",
  "full_text": ""
}

Rules:
- Extract all person names, company names, government entity names
- Extract all dates in any format found
- Extract all addresses (complete, including city/state/PIN if present)
- Extract all email addresses and phone numbers
- Extract all monetary amounts
- form_fields: extract key-value pairs like "Name: John Doe", "License No: TL-2024-001"
- document_type: guess the document type (e.g. "Trade License", "Aadhaar Card", "Invoice")
- summary: 1-2 sentence description of what this document is about
- full_text: the complete text content of the document
- Return ONLY valid JSON, no markdown fences, no explanations
"""


async def _call_gemini_text(text: str, api_key: str, model: str) -> dict:
    """Call Gemini with plain text and return parsed JSON."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [
                {"text": EXTRACTION_PROMPT},
                {"text": f"Document text:\n{text}"}
            ]
        }],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048}
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
    raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    # Strip markdown fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


async def _call_gemini_vision(b64_image: str, mime_type: str, api_key: str, model: str) -> dict:
    """Call Gemini Vision with an image and return parsed JSON."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [
                {"text": EXTRACTION_PROMPT},
                {"inline_data": {"mime_type": mime_type, "data": b64_image}}
            ]
        }],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048}
    }
    async with httpx.AsyncClient(timeout=90.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
    raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Public entry-point (called from documents.py)
# ---------------------------------------------------------------------------

async def extract_document_local(file_path: str, mime_type: str) -> Dict[str, Any]:
    """
    Extract text from file, then call Gemini for structured JSON parsing.
    Returns {"ocr_text": str, "parsed_json": dict}.
    Always succeeds — errors are logged and an empty structure is returned.
    """
    suffix = Path(file_path).suffix.lower()
    is_image = suffix in {".jpg", ".jpeg", ".png"}
    is_pdf = suffix == ".pdf"

    api_key = os.getenv("GEMINI_API_KEY", "")
    model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-latest")

    ocr_text = ""
    parsed_json: dict = {}

    try:
        # ── Step 1: extract raw text ────────────────────────────────────────
        if is_pdf:
            ocr_text = _extract_pdf_text(file_path)
        elif is_image:
            # For images we'll send directly to Gemini Vision; store a note
            ocr_text = "[Image file — text extracted via Gemini Vision]"

        # ── Step 2: call Gemini for structured extraction ───────────────────
        if not api_key or api_key.lower() in {"", "dummy", "your-gemini-api-key"}:
            # No valid key — return raw text only
            logger.warning("GEMINI_API_KEY not configured; skipping LLM extraction.")
            parsed_json = {
                "entities": {"names": [], "emails": [], "phone_numbers": [],
                              "dates": [], "organizations": [], "addresses": [], "amounts": []},
                "form_fields": {},
                "document_type": "Unknown",
                "summary": "Gemini API key not configured. Raw text extracted only.",
                "full_text": ocr_text
            }
            return {"ocr_text": ocr_text, "parsed_json": parsed_json}

        if is_image:
            b64, img_mime = _image_to_base64(file_path)
            parsed_json = await _call_gemini_vision(b64, img_mime, api_key, model)
            # Also capture full_text from parsed result
            ocr_text = parsed_json.get("full_text", "[Image — see parsed_json]")
        elif ocr_text:
            parsed_json = await _call_gemini_text(ocr_text, api_key, model)
        else:
            parsed_json = {
                "entities": {}, "form_fields": {}, "document_type": "Unknown",
                "summary": "No text could be extracted from this file.",
                "full_text": ""
            }

        logger.info(f"Document extracted successfully: {Path(file_path).name}")

    except json.JSONDecodeError as e:
        logger.warning(f"Gemini returned invalid JSON for {file_path}: {e}")
        parsed_json = {"raw_response": "Could not parse Gemini response as JSON",
                       "full_text": ocr_text}
    except Exception as e:
        logger.exception(f"Document extraction failed for {file_path}: {e}")
        parsed_json = {"error": str(e), "full_text": ocr_text}

    return {"ocr_text": ocr_text, "parsed_json": parsed_json}


# ---------------------------------------------------------------------------
# Keep OCRProvider class for backwards compatibility (documents.py imports it)
# ---------------------------------------------------------------------------

class OCRProvider:
    """Wrapper kept for import compatibility. Uses local extraction."""

    def __init__(self):
        pass

    async def extract_document(self, file_path: str, mime_type: str) -> Dict[str, Any]:
        return await extract_document_local(file_path, mime_type)
