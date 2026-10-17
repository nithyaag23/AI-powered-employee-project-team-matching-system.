"""
Edge Case and Malformed Input Tests for SkillSync AI AI Extraction Module
------------------------------------------------------------------------
Tests edge cases including:
1. Empty or whitespace-only documents.
2. Malformed JSON payloads and schema rejections.
3. Unverified skills claiming evidence (must reset evidence to None).
4. Unicode, special characters, and non-ASCII inputs.
5. Large inputs within context boundaries.
"""

import pytest
from pydantic import ValidationError
from backend.ai.fallback import DeterministicFallbackProvider
from backend.ai.schemas import (
    EmployeeProfile,
    ExtractedSkill,
    VerificationStatus,
    ProficiencyLevel,
    EmployeeExtractionEnvelope,
)


def test_empty_resume_handling():
    provider = DeterministicFallbackProvider()
    envelope = provider.extract_employee_profile("")
    assert envelope.metadata.mode == "deterministic_fallback"
    assert envelope.data.full_name is None
    assert len(envelope.data.skills) == 0
    assert envelope.data.total_years_experience is None


def test_whitespace_only_resume_handling():
    provider = DeterministicFallbackProvider()
    envelope = provider.extract_employee_profile("   \n\n\t   ")
    assert envelope.metadata.mode == "deterministic_fallback"
    assert envelope.data.full_name is None
    assert len(envelope.data.skills) == 0


def test_malformed_json_rejection():
    # Attempting to load malformed dictionaries into EmployeeProfile must raise ValidationError
    malformed_payload = {
        "full_name": "Test User",
        "skills": [
            {
                "name": "Python",
                "verification_status": "VERIFIED",
                "evidence": None,  # Missing evidence for VERIFIED
            }
        ],
    }
    with pytest.raises(ValidationError):
        EmployeeProfile.model_validate(malformed_payload)


def test_unverified_skill_clears_spurious_evidence():
    payload = {
        "full_name": "Self Reporter",
        "skills": [
            {
                "name": "Rust",
                "verification_status": "UNVERIFIED",
                "evidence": "I claim to be the creator of Rust.",
            }
        ],
    }
    profile = EmployeeProfile.model_validate(payload)
    # The schema validator resets evidence to None for UNVERIFIED skills
    assert profile.skills[0].verification_status == VerificationStatus.UNVERIFIED
    assert profile.skills[0].evidence is None


def test_unicode_and_special_characters():
    resume_with_unicode = """
    Renée Müller-Lüdenscheidt
    Lead AI Engineer
    Experience:
    - Développé des microservices avec Python et FastAPI pour l'analyse sémantique.
    - Conçu des schémas PostgreSQL avec prise en charge d'emojis 🚀 et d'accents.
    """
    provider = DeterministicFallbackProvider()
    envelope = provider.extract_employee_profile(resume_with_unicode)

    assert envelope.data.full_name is not None
    assert "Renée" in envelope.data.full_name
    skills_by_name = {s.name: s for s in envelope.data.skills}
    assert "Python" in skills_by_name
    assert skills_by_name["Python"].verification_status == VerificationStatus.VERIFIED
