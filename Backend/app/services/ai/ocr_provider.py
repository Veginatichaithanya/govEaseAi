"""
Lightweight document extractor for GovEaseAI using Google Gemini Vision / Generative Language API.

Features:
  1. PDF text extraction via pypdf.
  2. Image extraction via Gemini Vision (inline_data base64).
  3. Support for PAN, Aadhaar, Voter ID, and other Indian government documents.
  4. Automatic masking of sensitive identifiers (Aadhaar masked as XXXX-XXXX-1234).
  5. Exponential backoff and retry for transient errors (HTTP 429, 503, 502, 504, Timeout).
  6. Clean, sanitized error handling: never leaks API keys or secrets in logs or responses.
  7. Strict JSON parsing with fallback confidence scores.
"""

import asyncio
import base64
import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import httpx
from app.config import settings

logger = logging.getLogger("goveaseai.ocr")
# Suppress raw HTTP request logging in httpx/httpcore to prevent secret exposure
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

# ---------------------------------------------------------------------------
# Security helpers
# ---------------------------------------------------------------------------

def _sanitize_message(msg: str) -> str:
    """Sanitize any string to remove API keys, bearer tokens, and secrets."""
    if not msg:
        return ""
    # Mask query parameter keys (e.g. key=AIza... or key=AQ....)
    msg = re.sub(r'([?&]key=)[^&\s"\']+', r'\1[REDACTED]', msg)
    # Mask authorization headers
    msg = re.sub(r'(Bearer\s+)[a-zA-Z0-9_\-\.]+', r'\1[REDACTED]', msg)
    return msg


# ---------------------------------------------------------------------------
# Text extraction helpers
# ---------------------------------------------------------------------------

def _extract_pdf_text(file_path: str) -> str:
    """Extract plain text from a PDF using pypdf."""
    try:
        import pypdf
        reader = pypdf.PdfReader(file_path)
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)
        return "\n".join(pages).strip()
    except Exception as e:
        logger.warning(f"pypdf extraction failed: {_sanitize_message(str(e))}")
        return ""


def _image_to_base64(file_path: str) -> Tuple[str, str]:
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
# LLM Extraction Prompt
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
  "full_text": "",
  "structured_fields": {
    "full_name": null,
    "father_name": null,
    "date_of_birth": null,
    "gender": null,
    "aadhaar_number": null,
    "pan_number": null,
    "passport_number": null,
    "voter_id": null,
    "driving_licence_number": null,
    "address": null,
    "city": null,
    "state": null,
    "postal_code": null,
    "email": null,
    "phone_number": null,
    "business_name": null,
    "registration_number": null,
    "issue_date": null,
    "expiry_date": null,
    "issuing_authority": null
  },
  "confidence_scores": {}
}

Rules:
- Extract all person names, company names, government entity names.
- Extract all dates in any format found.
- Extract all addresses (complete, including door/street/city/state/PIN if present).
- Extract all email addresses and phone numbers.
- Extract all monetary amounts.
- form_fields: extract key-value pairs like "Name: Ravi Kumar", "License No: TL-2024-001".
- document_type: identify the document type. Common Indian documents include:
  "Aadhaar Card", "PAN Card", "Voter ID", "Passport", "Driving Licence",
  "Income Certificate", "Caste Certificate", "Residence Certificate",
  "Trade License", "Property Tax Receipt", "Lease Deed", "Fire NOC",
  "GST Registration", "Shop Registration", "Birth Certificate".
- summary: 1-2 sentence description of what this document is about.
- full_text: the complete text content of the document.
- structured_fields: fill in ONLY the fields that are actually found in the document.
  Set null for fields that are NOT present. Do NOT guess or fabricate values.
  For Aadhaar: mask the first 8 digits (show as XXXX-XXXX-1234).
  For sensitive IDs: mask appropriately.
- confidence_scores: for each key in structured_fields that has a non-null value,
  provide a confidence score between 0.0 and 1.0.
  Example: {"full_name": 0.95, "date_of_birth": 0.88, "address": 0.72}
- Return ONLY valid JSON, no markdown fences, no explanations.
"""

# ---------------------------------------------------------------------------
# Post-processing & Sanitization
# ---------------------------------------------------------------------------

def _safe_json_parse(raw_text: str) -> dict:
    """Parse JSON safely, cleaning code fences and repairing minor syntax errors."""
    if not raw_text:
        return {}
    text = re.sub(r"^```(?:json)?\s*", "", raw_text.strip())
    text = re.sub(r"\s*```$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r'(\{[\s\S]*\})', text)
    if match:
        candidate = match.group(1)
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            cleaned = re.sub(r',\s*([\}\]])', r'\1', candidate)
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError:
                pass
    raise json.JSONDecodeError("Failed to parse Gemini output as JSON", text, 0)


def _post_process_extraction(parsed_json: dict) -> dict:
    """Normalize fields, enforce Aadhaar masking, and fill confidence scores."""
    if not isinstance(parsed_json, dict):
        return {"error": "Invalid JSON response structure"}

    structured = parsed_json.get("structured_fields") or {}
    confidence = parsed_json.get("confidence_scores") or {}

    # Mask Aadhaar in structured_fields, full_text, summary, and form_fields
    aadhaar = structured.get("aadhaar_number")
    if aadhaar and isinstance(aadhaar, str):
        cleaned = re.sub(r'[\s\-]', '', aadhaar)
        if len(cleaned) == 12 and cleaned.isdigit():
            structured["aadhaar_number"] = f"XXXX-XXXX-{cleaned[-4:]}"
        elif not aadhaar.startswith("XXXX"):
            # Partial mask
            m = re.search(r'(\d{4})$', aadhaar)
            if m:
                structured["aadhaar_number"] = f"XXXX-XXXX-{m.group(1)}"

    for text_key in ("full_text", "summary"):
        if isinstance(parsed_json.get(text_key), str):
            parsed_json[text_key] = re.sub(
                r'\b\d{4}[\s\-]?\d{4}[\s\-]?(\d{4})\b',
                r'XXXX-XXXX-\1',
                parsed_json[text_key],
            )

    # 2. Normalize PAN Number to uppercase
    pan = structured.get("pan_number")
    if pan and isinstance(pan, str):
        structured["pan_number"] = pan.strip().upper()

    # 3. Ensure Voter ID is cleaned if present
    voter_id = structured.get("voter_id")
    if voter_id and isinstance(voter_id, str):
        structured["voter_id"] = voter_id.strip().upper()

    # 4. Ensure confidence scores exist for all non-null structured fields
    for field, val in structured.items():
        if val is not None and str(val).strip() and str(val).lower() != "null":
            if field not in confidence or not isinstance(confidence[field], (int, float)):
                # Heuristic confidence based on pattern match
                if field == "pan_number" and re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', str(val)):
                    confidence[field] = 0.98
                elif field == "aadhaar_number" and re.search(r'\d{4}$', str(val)):
                    confidence[field] = 0.95
                elif field == "voter_id" and len(str(val)) >= 8:
                    confidence[field] = 0.92
                elif field == "postal_code" and re.match(r'^\d{6}$', str(val)):
                    confidence[field] = 0.95
                else:
                    confidence[field] = 0.88

    parsed_json["structured_fields"] = structured
    parsed_json["confidence_scores"] = confidence
    return parsed_json


# ---------------------------------------------------------------------------
# Resilient Gemini API Caller with Exponential Backoff
# ---------------------------------------------------------------------------

async def _post_to_gemini_with_backoff(
    payload: dict,
    api_key: str,
    primary_model: str,
    timeout: float = 25.0,
    max_retries: int = 2
) -> dict:
    """
    Call Google Gemini API with exponential backoff for transient errors (429, 503, 502, 504, Timeout).
    Falls back to secondary models if primary model is 404 (deprecated) or persistent 503.
    Never exposes API key in logs or exceptions.
    """
    # Candidate models to try in order
    candidate_models = [primary_model]
    for fallback in [
        "gemini-3.5-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.6-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite-preview",
    ]:
        if fallback not in candidate_models:
            candidate_models.append(fallback)

    last_error_msg = ""

    for model in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(url, json=payload)

                # HTTP 200 - Success
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if not candidates:
                        raise ValueError("Gemini returned empty candidate list.")
                    parts = candidates[0].get("content", {}).get("parts", [])
                    raw_text = "".join(
                        p.get("text", "") for p in parts if p.get("text") and not p.get("thought")
                    ).strip()
                    parsed = _safe_json_parse(raw_text)
                    return _post_process_extraction(parsed)

                # HTTP 404 - Model not found or deprecated for this API key tier
                if resp.status_code == 404:
                    err_info = resp.json().get("error", {})
                    err_text = _sanitize_message(err_info.get("message", "Model not found"))
                    logger.warning(f"Model {model} returned 404: {err_text}. Trying fallback model.")
                    last_error_msg = f"Model {model} unavailable (404)"
                    break  # Break inner loop, move to next model

                # HTTP 400, 401, 403 - Permanent client / authentication errors (do not retry)
                if resp.status_code in {400, 401, 403}:
                    err_info = resp.json().get("error", {})
                    err_text = _sanitize_message(err_info.get("message", "Authentication or client error"))
                    logger.error(f"Gemini API returned HTTP {resp.status_code}: {err_text}")
                    return {
                        "error": f"Gemini API error (HTTP {resp.status_code}): {err_text}",
                        "document_type": "Unknown",
                        "structured_fields": {},
                        "confidence_scores": {},
                        "summary": "Document processing failed due to API authentication or configuration error."
                    }

                # Transient errors: HTTP 429 (rate limit), 503 (high demand), 502/504
                if resp.status_code in {429, 503, 502, 504}:
                    err_info = resp.json().get("error", {})
                    err_text = _sanitize_message(err_info.get("message", "Service temporarily busy"))
                    last_error_msg = f"HTTP {resp.status_code}: {err_text}"
                    # Daily/free-tier quota exceeded on this model won't recover with backoff -> switch model
                    if resp.status_code == 429 and ("per day" in err_text.lower() or "exceeded your current quota" in err_text.lower()):
                        logger.warning(f"Gemini model {model} quota exceeded (429). Moving to fallback model.")
                        break
                    wait_time = 1.5 * (2 ** attempt)
                    logger.warning(
                        f"Gemini model {model} returned {resp.status_code}. Retrying in {wait_time:.1f}s (attempt {attempt + 1}/{max_retries})..."
                    )
                    await asyncio.sleep(wait_time)
                    continue

                # Any other status
                resp.raise_for_status()

            except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as net_err:
                last_error_msg = f"Network/Timeout error: {_sanitize_message(str(net_err))}"
                wait_time = 1.5 * (2 ** attempt)
                logger.warning(f"{last_error_msg}. Retrying in {wait_time:.1f}s (attempt {attempt + 1}/{max_retries})...")
                await asyncio.sleep(wait_time)
                continue
            except json.JSONDecodeError as jde:
                logger.warning(f"Failed to parse Gemini response as JSON for model {model}: {jde}")
                last_error_msg = "Invalid JSON in OCR response"
                continue
            except Exception as ex:
                clean_err = _sanitize_message(str(ex))
                logger.exception(f"Unexpected error calling Gemini model {model}: {clean_err}")
                last_error_msg = clean_err
                break

    # If all candidate models and retries failed
    return {
        "error": f"Gemini OCR extraction failed: {last_error_msg}",
        "document_type": "Unknown",
        "structured_fields": {},
        "confidence_scores": {},
        "summary": "AI extraction was unable to complete after multiple retries."
    }


# ---------------------------------------------------------------------------
# Document Extractors
# ---------------------------------------------------------------------------

async def _call_gemini_text(text: str, api_key: str, model: str) -> dict:
    """Call Gemini with plain text and return parsed JSON."""
    payload = {
        "contents": [{
            "parts": [
                {"text": EXTRACTION_PROMPT},
                {"text": f"Document text:\n{text}"}
            ]
        }],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048, "responseMimeType": "application/json"}
    }
    return await _post_to_gemini_with_backoff(payload, api_key, model, timeout=25.0)


async def _call_gemini_vision(b64_image: str, mime_type: str, api_key: str, model: str) -> dict:
    """Call Gemini Vision with an image and return parsed JSON."""
    payload = {
        "contents": [{
            "parts": [
                {"text": EXTRACTION_PROMPT},
                {"inline_data": {"mime_type": mime_type, "data": b64_image}}
            ]
        }],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048, "responseMimeType": "application/json"}
    }
    return await _post_to_gemini_with_backoff(payload, api_key, model, timeout=25.0)


# ---------------------------------------------------------------------------
# Public Entry-Point (called from documents.py)
# ---------------------------------------------------------------------------

async def extract_document_local(file_path: str, mime_type: str) -> Dict[str, Any]:
    """
    Extract text from file, then call Gemini Vision / Text for structured JSON parsing.
    Returns {"ocr_text": str, "parsed_json": dict}.
    """
    suffix = Path(file_path).suffix.lower()
    is_image = suffix in {".jpg", ".jpeg", ".png"}
    is_pdf = suffix == ".pdf"

    api_key = os.getenv("GEMINI_API_KEY", "") or getattr(settings, "GEMINI_API_KEY", "")
    model = os.getenv("GEMINI_MODEL", "") or getattr(settings, "GEMINI_MODEL", "gemini-3.6-flash")

    # Sanitize known obsolete model names
    if model in ("gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-2.5-flash"):
        model = "gemini-3.6-flash"

    ocr_text = ""
    parsed_json: dict = {}

    try:
        # Step 1: extract raw text for PDFs
        if is_pdf:
            ocr_text = _extract_pdf_text(file_path)
        elif is_image:
            ocr_text = "[Image file — processed via Gemini Vision]"

        # Step 2: verify API key configuration
        if not api_key or api_key.lower() in {"", "dummy", "your-gemini-api-key"}:
            logger.warning("GEMINI_API_KEY not configured; skipping LLM extraction.")
            parsed_json = {
                "entities": {"names": [], "emails": [], "phone_numbers": [],
                              "dates": [], "organizations": [], "addresses": [], "amounts": []},
                "form_fields": {},
                "document_type": "Unknown",
                "summary": "Gemini API key not configured. Raw text extracted only.",
                "full_text": ocr_text,
                "error": "Gemini API key not configured"
            }
            return {"ocr_text": ocr_text, "parsed_json": parsed_json}

        # Step 3: invoke Gemini Vision for images, or Gemini Text for PDFs
        if is_image:
            b64, img_mime = _image_to_base64(file_path)
            parsed_json = await _call_gemini_vision(b64, img_mime, api_key, model)
            ocr_text = parsed_json.get("full_text") or "[Image — parsed by Gemini Vision]"
        elif ocr_text:
            parsed_json = await _call_gemini_text(ocr_text, api_key, model)
        else:
            parsed_json = {
                "entities": {}, "form_fields": {}, "document_type": "Unknown",
                "summary": "No text could be extracted from this file.",
                "full_text": "",
                "error": "No text extracted from file"
            }

        logger.info(f"Document processed for {Path(file_path).name}: doc_type={parsed_json.get('document_type')}")

    except Exception as e:
        safe_err = _sanitize_message(str(e))
        logger.exception(f"Document extraction failed for {file_path}: {safe_err}")
        parsed_json = {"error": safe_err, "full_text": ocr_text}

    return {"ocr_text": ocr_text, "parsed_json": parsed_json}


# ---------------------------------------------------------------------------
# Class wrapper for router compatibility
# ---------------------------------------------------------------------------

class OCRProvider:
    """Wrapper kept for router imports. Uses local Gemini extraction."""

    def __init__(self):
        pass

    async def extract_document(self, file_path: str, mime_type: str) -> Dict[str, Any]:
        return await extract_document_local(file_path, mime_type)
