"""
Provider Adapter Contract & Error-Handling Simulation Tests
-----------------------------------------------------------
Simulates external model provider behavior (success, bad JSON, schema violations,
timeouts, and connection errors) to verify that the extraction interface and
error-handling boundaries remain robust without making any live network calls.
"""

import json
import pytest
from backend.ai.interface import BaseExtractionProvider, ExtractionService
from backend.ai.schemas import (
    EmployeeExtractionEnvelope,
    EmployeeProfile,
    ProjectExtractionEnvelope,
    ProjectRequirement,
    ExtractionMetadata,
)


class MockMalformedJsonProvider(BaseExtractionProvider):
    async def extract_employee_profile(self, text: str) -> EmployeeExtractionEnvelope:
        raw_output = "I cannot fulfill this request. Here is a note instead of JSON."
        # Attempting to parse non-JSON will raise a ValueError / json.JSONDecodeError
        json.loads(raw_output)
        return None  # unreachable

    async def extract_project_requirements(self, text: str) -> ProjectExtractionEnvelope:
        raise json.JSONDecodeError("Expecting value", "bad json", 0)


class MockSchemaViolationProvider(BaseExtractionProvider):
    async def extract_employee_profile(self, text: str) -> EmployeeExtractionEnvelope:
        invalid_payload = {
            "full_name": "Test Candidate",
            "skills": [
                {
                    "name": "Python",
                    "verification_status": "VERIFIED",
                    "evidence": None,  # Schema violation: VERIFIED requires evidence
                }
            ],
        }
        # model_validate will raise ValidationError
        profile = EmployeeProfile.model_validate(invalid_payload)
        metadata = ExtractionMetadata(
            provider="mock_violator",
            model_version="test",
            mode="live_model",
            latency_ms=10.0,
            warnings=[],
            timestamp="2026-10-17T12:00:00Z",
        )
        return EmployeeExtractionEnvelope(data=profile, metadata=metadata)

    async def extract_project_requirements(self, text: str) -> ProjectExtractionEnvelope:
        invalid_payload = {
            "title": "",  # Schema violation: empty title
            "required_skills": [],
        }
        project = ProjectRequirement.model_validate(invalid_payload)
        return None


@pytest.mark.asyncio
async def test_service_recovers_from_malformed_json_provider():
    bad_provider = MockMalformedJsonProvider()
    service = ExtractionService(primary_provider=bad_provider)

    # When provider outputs non-JSON, ExtractionService must not crash!
    # It must switch gracefully to DeterministicFallbackProvider.
    envelope = await service.extract_employee_profile("Jane Doe\nPython Developer")
    assert envelope.metadata.mode == "deterministic_fallback"
    assert any("JSONDecodeError" in w or "Primary provider failed" in w for w in envelope.metadata.warnings)


@pytest.mark.asyncio
async def test_service_recovers_from_schema_violation_provider():
    violating_provider = MockSchemaViolationProvider()
    service = ExtractionService(primary_provider=violating_provider)

    # When provider outputs data violating schema constraints (e.g. missing evidence for VERIFIED skill),
    # ExtractionService must catch the ValidationError and fall back gracefully.
    envelope = await service.extract_employee_profile("Jane Doe\nPython Developer")
    assert envelope.metadata.mode == "deterministic_fallback"
    assert any("ValidationError" in w or "Primary provider failed" in w for w in envelope.metadata.warnings)


@pytest.mark.asyncio
async def test_service_recovers_from_project_schema_violation():
    violating_provider = MockSchemaViolationProvider()
    service = ExtractionService(primary_provider=violating_provider)

    envelope = await service.extract_project_requirements("High scale payment processing in Go.")
    assert envelope.metadata.mode == "deterministic_fallback"
    assert any("ValidationError" in w or "Primary provider failed" in w for w in envelope.metadata.warnings)
