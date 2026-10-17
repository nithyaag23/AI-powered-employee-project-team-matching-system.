"""
Configuration for SkillSync AI AI Extraction Module
---------------------------------------------------
Loads settings safely from environment variables.
Never hardcodes or leaks credentials.
Supports forced offline/fallback mode.
"""

import os
from typing import Optional


class AIConfig:
    def __init__(self):
        self.gemini_api_key: Optional[str] = os.getenv("GEMINI_API_KEY", "").strip() or None
        self.model_name: str = os.getenv("AI_MODEL_NAME", "gemini-1.5-flash").strip()
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

    def is_gemini_configured(self) -> bool:
        """Returns True only if an API key is present and fallback is not forced."""
        return bool(self.gemini_api_key) and not self.force_fallback

    def mask_key(self) -> str:
        """Returns a masked representation of the API key for safe logging."""
        if not self.gemini_api_key:
            return "None (Unconfigured)"
        if len(self.gemini_api_key) <= 8:
            return "***"
        return f"{self.gemini_api_key[:4]}...{self.gemini_api_key[-4:]}"


config = AIConfig()
