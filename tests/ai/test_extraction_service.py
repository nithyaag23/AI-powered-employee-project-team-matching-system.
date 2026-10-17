"""
Unit tests for ExtractionService orchestration and fallback resilience.
Tests provider lifecycle, error recovery, and offline fallback guarantees.
"""

import pytest
from unittest.mock import AsyncMock
from backend.ai.interface import (
    ExtractionService,
    BaseExtractionProvider,
)
from backend.ai.fallback import DeterministicFallbackProvider
from backend.ai.config import config
from backend.ai.schemas import (
    EmployeeExtractionEnvelope,
    EmployeeProfile,
    ProjectExtractionEnvelope,
    ProjectRequirement,
    ExtractionMetadata,
)

SAMPLE_RESUME = "Alice Chen\nSoftware Engineer\nExperience:\n- Developed REST APIs in Python."
SAMPLE_PROJECT = "Microservice Migration\nRequired skills:\n- Python backend developer."


class MockFailingPrimaryProvider(BaseExtractionProvider):
    async def extract_employee_profile(self, text: str) -> EmployeeExtractionEnvelope:
        raise ConnectionError("Remote API gateway timeout 504")

    async def extract_project_requirements(self, text: str) -> ProjectExtractionEnvelope:
        raise TimeoutError("Model endpoint did not respond within 15.0s")


class MockSuccessfulPrimaryProvider(BaseExtractionProvider):
    async def extract_employee_profile(self, text: str) -> EmployeeExtractionEnvelope:
        profile = EmployeeProfile(full_name="Primary Provider Alice", skills=[])
        metadata = ExtractionMetadata(
            provider="mock_primary",
            model_version="test-model",
            mode="live_model",
            latency_ms=100.0,
            warnings=[],
            timestamp="2026-10-17T12:00:00Z",
        )
        return EmployeeExtractionEnvelope(data=profile, metadata=metadata)

    async def extract_project_requirements(self, text: str) -> ProjectExtractionEnvelope:
        project = ProjectRequirement(title="Primary Project", description="Test", required_skills=[])
        metadata = ExtractionMetadata(
            provider="mock_primary",
            model_version="test-model",
            mode="live_model",
            latency_ms=100.0,
            warnings=[],
            timestamp="2026-10-17T12:00:00Z",
        )
        return ProjectExtractionEnvelope(data=project, metadata=metadata)


@pytest.mark.asyncio
async def test_offline_service_uses_fallback_automatically():
    # When no primary provider is supplied, service defaults to fallback
    service = ExtractionService(primary_provider=None)
    envelope = await service.extract_employee_profile(SAMPLE_RESUME)
    assert envelope.metadata.mode == "deterministic_fallback"
    assert envelope.metadata.provider == "deterministic_fallback"


@pytest.mark.asyncio
async def test_service_successful_primary_provider():
    primary = MockSuccessfulPrimaryProvider()
    service = ExtractionService(primary_provider=primary)
    envelope = await service.extract_employee_profile(SAMPLE_RESUME)
    assert envelope.metadata.mode == "live_model"
    assert envelope.metadata.provider == "mock_primary"
    assert envelope.data.full_name == "Primary Provider Alice"


@pytest.mark.asyncio
async def test_service_circuit_breaker_on_primary_failure():
    failing_primary = MockFailingPrimaryProvider()
    service = ExtractionService(primary_provider=failing_primary)

    # Calling extract_employee_profile should NOT raise ConnectionError;
    # it must gracefully fall back to DeterministicFallbackProvider!
    envelope = await service.extract_employee_profile(SAMPLE_RESUME)
    assert envelope.metadata.mode == "deterministic_fallback"
    assert len(envelope.metadata.warnings) > 0
    assert any("Primary provider failed" in w for w in envelope.metadata.warnings)


@pytest.mark.asyncio
async def test_service_circuit_breaker_on_project_extraction_failure():
    failing_primary = MockFailingPrimaryProvider()
    service = ExtractionService(primary_provider=failing_primary)

    envelope = await service.extract_project_requirements(SAMPLE_PROJECT)
    assert envelope.metadata.mode == "deterministic_fallback"
    assert any("TimeoutError" in w or "Primary provider failed" in w for w in envelope.metadata.warnings)


def test_sync_wrappers():
    service = ExtractionService(primary_provider=None)
    emp_res = service.extract_employee_profile_sync(SAMPLE_RESUME)
    assert emp_res.metadata.mode == "deterministic_fallback"

    proj_res = service.extract_project_requirements_sync(SAMPLE_PROJECT)
    assert proj_res.metadata.mode == "deterministic_fallback"
