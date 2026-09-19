"""
Abstract base class for GovEaseAI AI providers.
All providers must implement these methods.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseAIProvider(ABC):
    """
    Abstract interface for AI providers (OpenRouter, Gemini, etc.).
    Ensures consistent behavior regardless of underlying provider.
    """

    @abstractmethod
    async def generate_text(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """
        Generate a text response.
        Returns: {"success": bool, "answer": str | None, "error": str | None}
        """

    @abstractmethod
    async def stream_text(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ):
        """
        Async generator that streams text tokens.
        """


    @abstractmethod
    async def analyze_image(
        self,
        image_base64: str,
        mime_type: str,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze an image and respond to a prompt.
        Returns: {"success": bool, "answer": str | None, "error": str | None}
        """

    @abstractmethod
    async def analyze_document(
        self,
        file_base64: str,
        mime_type: str,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze a document (PDF or image).
        Returns: {"success": bool, "answer": str | None, "error": str | None}
        """

    @abstractmethod
    def supports_modality(self, modality: str) -> bool:
        """
        Check if this provider/model supports a given modality.
        Modalities: "text", "image", "pdf", "audio", "video"
        """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name for logging."""
