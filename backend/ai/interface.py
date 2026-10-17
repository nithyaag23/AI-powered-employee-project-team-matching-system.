"""
Provider-independent extraction interface and orchestration service.
Ensures seamless switching between live LLM providers and the deterministic fallback.
Operates fully offline when no live provider is configured.
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Optional
from backend.ai.config import config
from backend.ai.fallback import DeterministicFallbackProvider
from backend.ai.schemas import (
    EmployeeExtractionEnvelope,
    ProjectExtractionEnvelope,
)

logger = logging.getLogger("skillsync.ai")


class BaseExtractionProvider(ABC):
    """Abstract interface that all extraction adapters must implement."""

    @abstractmethod
    async def extract_employee_profile(self, text: str) -> EmployeeExtractionEnvelope:
        pass

    @abstractmethod
    async def extract_project_requirements(self, text: str) -> ProjectExtractionEnvelope:
        pass


class ExtractionService:
    """
    High-level extraction orchestration service for SkillSync AI.
    Handles provider lifecycle, automatic fallback upon failure, and metrics tracking.
    """

    def __init__(
        self,
        primary_provider: Optional[BaseExtractionProvider] = None,
        fallback_provider: Optional[DeterministicFallbackProvider] = None,
    ):
        self.fallback = fallback_provider or DeterministicFallbackProvider()
        self.primary = primary_provider

    async def extract_employee_profile(self, text: str) -> EmployeeExtractionEnvelope:
        """
        Extracts employee profile from resume/text.
        Attempts primary provider first; falls back immediately on failure or if unconfigured.
        """
        if self.primary and not config.force_fallback:
            try:
                return await self.primary.extract_employee_profile(text)
            except Exception as exc:
                logger.warning(
                    f"Primary AI provider failed ({type(exc).__name__}: {exc}). Switching to deterministic fallback."
                )
                fallback_result = self.fallback.extract_employee_profile(text)
                fallback_result.metadata.warnings.append(
                    f"Primary provider failed ({type(exc).__name__}: {exc}). Extracted via fallback."
                )
                return fallback_result

        # Run via deterministic fallback directly
        return self.fallback.extract_employee_profile(text)

    async def extract_project_requirements(self, text: str) -> ProjectExtractionEnvelope:
        """
        Extracts project requirements from project scope text.
        Attempts primary provider first; falls back immediately on failure or if unconfigured.
        """
        if self.primary and not config.force_fallback:
            try:
                return await self.primary.extract_project_requirements(text)
            except Exception as exc:
                logger.warning(
                    f"Primary AI provider failed ({type(exc).__name__}: {exc}). Switching to deterministic fallback."
                )
                fallback_result = self.fallback.extract_project_requirements(text)
                fallback_result.metadata.warnings.append(
                    f"Primary provider failed ({type(exc).__name__}: {exc}). Extracted via fallback."
                )
                return fallback_result

        # Run via deterministic fallback directly
        return self.fallback.extract_project_requirements(text)

    def extract_employee_profile_sync(self, text: str) -> EmployeeExtractionEnvelope:
        """Synchronous wrapper for non-async callers or tests."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                return self.fallback.extract_employee_profile(text)
            return loop.run_until_complete(self.extract_employee_profile(text))
        except RuntimeError:
            return asyncio.run(self.extract_employee_profile(text))

    def extract_project_requirements_sync(self, text: str) -> ProjectExtractionEnvelope:
        """Synchronous wrapper for non-async callers or tests."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                return self.fallback.extract_project_requirements(text)
            return loop.run_until_complete(self.extract_project_requirements(text))
        except RuntimeError:
            return asyncio.run(self.extract_project_requirements(text))


# Singleton helper
_default_service: Optional[ExtractionService] = None


def get_extraction_service(
    primary_provider: Optional[BaseExtractionProvider] = None,
    fallback_provider: Optional[DeterministicFallbackProvider] = None,
) -> ExtractionService:
    global _default_service
    if _default_service is None or primary_provider is not None:
        _default_service = ExtractionService(
            primary_provider=primary_provider,
            fallback_provider=fallback_provider,
        )
    return _default_service
