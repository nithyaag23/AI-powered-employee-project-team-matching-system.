"""
Unit tests for AI module provisional schemas and validation rules.
Verifies that:
1. Valid profiles and projects pass validation.
2. Verified skills require valid, non-empty evidence.
3. Unverified skills cannot claim evidence.
4. Confidence scores and weights adhere to range constraints.
5. Sample JSON fixtures in fixtures/ strictly validate against the schemas.
"""

import json
from pathlib import Path
import pytest
from pydantic import ValidationError

from backend.ai.schemas import (
    VerificationStatus,
    ProficiencyLevel,
    SkillCategory,
    ExtractedSkill,
    EmployeeProfile,
    ProjectSkillRequirement,
    ProjectRequirement,
    ExtractionMetadata,
    EmployeeExtractionEnvelope,
    ProjectExtractionEnvelope,
)


def test_valid_extracted_skill():
    skill = ExtractedSkill(
        name="Python",
        category=SkillCategory.TECHNICAL,
        proficiency=ProficiencyLevel.ADVANCED,
        years_of_experience=5.0,
        verification_status=VerificationStatus.VERIFIED,
        evidence="Built production FastAPI microservices handling 10k RPS.",
        confidence_score=0.95,
    )
    assert skill.name == "Python"
    assert skill.verification_status == VerificationStatus.VERIFIED
    assert skill.evidence is not None


def test_verified_skill_missing_evidence_fails():
    with pytest.raises(ValidationError) as exc_info:
        ExtractedSkill(
            name="Python",
            category=SkillCategory.TECHNICAL,
            proficiency=ProficiencyLevel.ADVANCED,
            verification_status=VerificationStatus.VERIFIED,
            evidence=None,  # Missing evidence for VERIFIED skill must fail
            confidence_score=0.90,
        )
    assert "missing or empty evidence" in str(exc_info.value)


def test_verified_skill_blank_evidence_fails():
    with pytest.raises(ValidationError) as exc_info:
        ExtractedSkill(
            name="Python",
            category=SkillCategory.TECHNICAL,
            proficiency=ProficiencyLevel.ADVANCED,
            verification_status=VerificationStatus.VERIFIED,
            evidence="   ",  # Blank whitespace evidence must fail
            confidence_score=0.90,
        )
    assert "missing or empty evidence" in str(exc_info.value)


def test_unverified_skill_clears_evidence():
    # If unverified, evidence is automatically stripped/reset to None
    skill = ExtractedSkill(
        name="Rust",
        category=SkillCategory.TECHNICAL,
        proficiency=ProficiencyLevel.INTERMEDIATE,
        verification_status=VerificationStatus.UNVERIFIED,
        evidence="Self-reported on resume buzzword list",
        confidence_score=0.50,
    )
    assert skill.verification_status == VerificationStatus.UNVERIFIED
    assert skill.evidence is None


def test_invalid_confidence_score_range():
    with pytest.raises(ValidationError):
        ExtractedSkill(
            name="Python",
            verification_status=VerificationStatus.UNKNOWN,
            confidence_score=1.5,  # Out of [0.0, 1.0]
        )

    with pytest.raises(ValidationError):
        ExtractedSkill(
            name="Python",
            verification_status=VerificationStatus.UNKNOWN,
            confidence_score=-0.2,  # Out of [0.0, 1.0]
        )


def test_project_skill_requirement_weight_range():
    valid = ProjectSkillRequirement(
        name="PyTorch",
        minimum_proficiency=ProficiencyLevel.ADVANCED,
        is_mandatory=True,
        weight=3.0,
    )
    assert valid.weight == 3.0

    with pytest.raises(ValidationError):
        ProjectSkillRequirement(
            name="PyTorch",
            weight=10.0,  # Max weight is 5.0
        )


def test_sample_fixtures_conform_to_schema():
    fixtures_dir = Path(__file__).resolve().parent.parent.parent / "fixtures"

    emp_file = fixtures_dir / "sample_employee_extraction.json"
    with open(emp_file, "r", encoding="utf-8") as f:
        emp_data = json.load(f)
    envelope = EmployeeExtractionEnvelope.model_validate(emp_data)
    assert envelope.data.full_name == "Dr. Elena Rostova"
    assert len(envelope.data.skills) == 5

    proj_file = fixtures_dir / "sample_project_extraction.json"
    with open(proj_file, "r", encoding="utf-8") as f:
        proj_data = json.load(f)
    proj_envelope = ProjectExtractionEnvelope.model_validate(proj_data)
    assert proj_envelope.data.title == "Enterprise AI Agentic Workflow Platform"
    assert len(proj_envelope.data.required_skills) == 6

    fallback_file = fixtures_dir / "sample_fallback_extraction.json"
    with open(fallback_file, "r", encoding="utf-8") as f:
        fallback_data = json.load(f)
    fb_envelope = EmployeeExtractionEnvelope.model_validate(fallback_data)
    assert fb_envelope.metadata.mode == "deterministic_fallback"

    adv_file = fixtures_dir / "sample_adversarial_extraction.json"
    with open(adv_file, "r", encoding="utf-8") as f:
        adv_data = json.load(f)
    adv_envelope = EmployeeExtractionEnvelope.model_validate(adv_data)
    assert len(adv_envelope.metadata.warnings) == 2
