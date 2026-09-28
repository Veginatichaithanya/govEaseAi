import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PORT: int = 5000
    DATABASE_URL: str = "postgresql+psycopg://postgres:Naga%401432@localhost:5432/goveaseai"

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
    GEMINI_MODEL: str = "gemini-3.6-flash"                     # native Gemini model name

    # ── AI Provider Selection ────────────────────────────────────────────────────
    # "agentrouter" = use AgentRouter (with OpenRouter/Gemini fallback)
    # "openrouter"  = use OpenRouter (with AgentRouter/Gemini fallback)
    # "gemini"      = use Gemini directly (with AgentRouter/OpenRouter fallback)
    AI_PROVIDER: str = "agentrouter"

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
