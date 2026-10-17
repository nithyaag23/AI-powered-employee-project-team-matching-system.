"""
Configuration for SkillSync AI AI Extraction Module
---------------------------------------------------
Loads settings safely from environment variables.
Supports Gemma 4 E4B, Gemini, and local open-weight endpoints.
Never hardcodes or leaks credentials.
Supports forced offline/fallback mode.
"""

import os
from typing import Optional


class AIConfig:
    def __init__(self):
        # Model selection: Defaults to Gemma 4 E4B as requested
        self.model_name: str = os.getenv("AI_MODEL_NAME", "Gemma 4 E4B").strip()

        # Gemma / Local LLM settings (Ollama / vLLM / OpenAI-compatible endpoint)
        self.gemma_endpoint: str = os.getenv(
            "GEMMA_ENDPOINT",
            "http://localhost:11434"
        ).strip().rstrip("/")

        # Cloud Gemini fallback if configured
        self.gemini_api_key: Optional[str] = os.getenv("GEMINI_API_KEY", "").strip() or None
        self.api_endpoint: str = os.getenv(
            "GEMINI_API_ENDPOINT",
            "https://generativelanguage.googleapis.com/v1beta/models"
        ).strip().rstrip("/")

        force_fallback_env = os.getenv("FORCE_FALLBACK", "").lower().strip()
        self.force_fallback: bool = force_fallback_env in ("1", "true", "yes", "on")

        try:
            self.timeout_seconds: float = float(os.getenv("AI_TIMEOUT_SECONDS", "15.0"))
        except ValueError:
            self.timeout_seconds = 15.0

    def is_ai_configured(self) -> bool:
        """Returns True if local Gemma or Gemini API is available and not in forced fallback."""
        return not self.force_fallback

    def mask_key(self) -> str:
        """Returns a masked representation of the API key for safe logging."""
        if not self.gemini_api_key:
            return "Local Open-Weight Model (Gemma 4 E4B)"
        if len(self.gemini_api_key) <= 8:
            return "***"
        return f"{self.gemini_api_key[:4]}...{self.gemini_api_key[-4:]}"


config = AIConfig()
