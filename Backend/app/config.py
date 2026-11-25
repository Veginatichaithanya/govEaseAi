import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv
    load_dotenv(str(BACKEND_DIR / ".env"), override=True)
except Exception:
    pass

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PORT: int = 8001
    # Default to PostgreSQL; for local development you can override via .env.
    # Or use SQLite for a simple out‑of‑the‑box setup.
    DATABASE_URL: str = "sqlite:///./dev.db"

    # ── AgentRouter ─────────────────────────────────────────────────────────────
    AGENTROUTER_API_KEY: str = ""
    AGENTROUTER_BASE_URL: str = "https://co.agentrouter.org/v1"
    AGENTROUTER_MODEL: str = "deepseek-v4-flash"               # primary active model
    AGENTROUTER_VISION_MODEL: str = "deepseek-v4-flash"        # multimodal vision model
    AGENTROUTER_DOCUMENT_MODEL: str = "deepseek-v4-flash"      # document model

    # ── OpenRouter ──────────────────────────────────────────────────────────────
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "google/gemini-2.5-flash"          # text chat
    OPENROUTER_VISION_MODEL: str = "google/gemini-2.5-flash"   # image analysis
    OPENROUTER_DOCUMENT_MODEL: str = "google/gemini-2.5-flash" # PDF / document
    OPENROUTER_AUDIO_MODEL: str = "google/gemini-2.5-flash"    # audio (if supported)
    OPENROUTER_VIDEO_MODEL: str = ""                           # empty = not enabled

    # ── Gemini Direct API ────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-latest"                  # native Gemini model name

    # "gemini"      = use Gemini directly (with OpenRouter/AgentRouter fallback)
    # "openrouter"  = use OpenRouter (with Gemini/AgentRouter fallback)
    # "agentrouter" = use AgentRouter (with Gemini/OpenRouter fallback)
    AI_PROVIDER: str = "gemini"

    # ── AI Analysis Limits ───────────────────────────────────────────────────────
    AI_MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024   # 10 MB
    AI_MAX_ATTACHMENTS: int = 3

    # ── JWT ──────────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "goveaseai-super-secret-jwt-key-2026-final-year-project"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # ── SMTP Email (Gmail) ───────────────────────────────────────────────────────
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "GovEaseAI Portal"
    FRONTEND_URL: str = "http://localhost:5173"

settings = Settings()

# Validate that the selected AI provider has a corresponding API key configured.
def _validate_ai_provider():
    provider = settings.AI_PROVIDER.lower().strip()
    # Map provider to its required key attribute name in Settings
    key_map = {
        "gemini": "GEMINI_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
        "agentrouter": "AGENTROUTER_API_KEY",
    }
    required_key = key_map.get(provider)
    if required_key:
        api_key = getattr(settings, required_key, "")
        if not api_key:
            import logging
            logging.getLogger("goveaseai.config").warning(
                f"AI provider '{provider}' is selected but '{required_key}' is not set. "
                "Document OCR will run in fallback mode until configured."
            )
    else:
        import logging
        logging.getLogger("goveaseai.config").warning(
            f"Unsupported AI_PROVIDER value '{provider}'. Expected one of: gemini, openrouter, agentrouter."
        )

# Run validation at import time
_validate_ai_provider()

