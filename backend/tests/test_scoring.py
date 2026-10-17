"""
Unit tests for deterministic scoring engine and missing data handling.
"""

import pytest

from backend.matching.scoring import (
    calculate_skill_capability,
    compute_availability_fit,
    compute_experience_fit,
    compute_interest_fit,
    compute_skill_fit,
    score_employee_match,
)
from backend.schemas.models import (
    Employee,
    Project,
    RequiredSkill,
    SkillEvidence,
    SkillLevel,
    VerificationStatus,
)


@pytest.fixture
def sample_project():
    return Project(
        id="PRJ-TEST",
        name="Test Project",
        description="A Python and FastAPI web service with PostgreSQL database.",
        required_skills=[
            RequiredSkill(name="Python", min_level=SkillLevel.INTERMEDIATE, weight=2.0, critical=True),
            RequiredSkill(name="FastAPI", min_level=SkillLevel.INTERMEDIATE, weight=1.5, critical=False),
            RequiredSkill(name="PostgreSQL", min_level=SkillLevel.INTERMEDIATE, weight=1.0, critical=False),
        ],
        team_size=2,
        min_experience_years=4.0,
    )


def test_score_bounds_and_determinism(sample_project):
    employee = Employee(
        id="EMP-T1",
        name="Test Candidate",
        skills=[
            SkillEvidence(name="Python", level=SkillLevel.ADVANCED, verification_status=VerificationStatus.VERIFIED),
            SkillEvidence(name="FastAPI", level=SkillLevel.INTERMEDIATE, verification_status=VerificationStatus.VERIFIED),
        ],
        experience_years=5.0,
        availability=1.0,
        interests=["Python", "Web APIs"],
    )

    match1 = score_employee_match(employee, sample_project)
    match2 = score_employee_match(employee, sample_project)

    # Determinism check
    assert match1.overall_score == match2.overall_score
    assert match1.component_scores.skill_fit == match2.component_scores.skill_fit

    # Score bounds check
    assert 0.0 <= match1.overall_score <= 100.0
    assert 0.0 <= match1.component_scores.skill_fit <= 1.0
    assert 0.0 <= match1.component_scores.experience_fit <= 1.0
    assert 0.0 <= match1.component_scores.availability_fit <= 1.0
    assert 0.0 <= match1.component_scores.interest_fit <= 1.0


def test_missing_experience_weight_renormalization(sample_project):
    """
    When experience_years is missing (None), ExperienceFit (0.20 weight) is omitted,
    and remaining weights (0.55 + 0.15 + 0.10 = 0.80) are renormalized.
    """
    emp_with_missing_exp = Employee(
        id="EMP-NO-EXP",
        name="No Experience Record",
        skills=[
            SkillEvidence(name="Python", level=SkillLevel.INTERMEDIATE),
        ],
        experience_years=None,  # Missing!
        availability=1.0,
        interests=["Python"],
    )

    match = score_employee_match(emp_with_missing_exp, sample_project)

    # Must contain warning disclosing missing data and renormalization
    assert any("experience_years is missing" in w for w in match.warnings)

    # Check calculation manually:
    # SkillFit for Python (weight 2.0 / 4.5): Python cap = min(1.0, 0.8/0.8) = 1.0
    # Weighted skill fit = 2.0 / 4.5 = 0.4444
    # Avail = 1.0
    # Interest = ~0.70
    # Renormalized weights:
    # Skill: 0.55 / 0.80 = 0.6875
    # Avail: 0.15 / 0.80 = 0.1875
    # Interest: 0.10 / 0.80 = 0.1250
    # Overall score should reflect renormalized ratio * 100
    expected_ratio = (
        0.6875 * match.component_scores.skill_fit
        + 0.1875 * match.component_scores.availability_fit
        + 0.1250 * match.component_scores.interest_fit
    )
    expected_score = round(expected_ratio * 100.0, 2)
    assert abs(match.overall_score - expected_score) <= 0.05


def test_missing_skills_scored_zero_not_omitted(sample_project):
    """If an employee has no skills, SkillFit must be 0.0 (not omitted as perfect)."""
    emp_no_skills = Employee(
        id="EMP-NO-SKILLS",
        name="No Skills Candidate",
        skills=[],
        experience_years=5.0,
        availability=1.0,
        interests=["Python"],
    )

    match = score_employee_match(emp_no_skills, sample_project)
    assert match.component_scores.skill_fit == 0.0
    assert any("no recorded skills" in w for w in match.warnings)


def test_verification_status_bonus():
    req = RequiredSkill(name="Python", min_level=SkillLevel.INTERMEDIATE)

    unverified_skill = SkillEvidence(
        name="Python", level=SkillLevel.INTERMEDIATE, verification_status=VerificationStatus.UNVERIFIED
    )
    verified_skill = SkillEvidence(
        name="Python", level=SkillLevel.INTERMEDIATE, verification_status=VerificationStatus.VERIFIED
    )

    unverified_cap = calculate_skill_capability(unverified_skill, req)
    verified_cap = calculate_skill_capability(verified_skill, req)

    # Verified skill must score strictly higher due to the verification incentive
    assert verified_cap > unverified_cap


def test_availability_normalization():
    # Pass 40 hours -> should normalize to 1.0
    e1 = Employee(id="E1", name="Full-time", availability=40.0)
    assert e1.availability == 1.0

    # Pass 20 hours -> should normalize to 0.5
    e2 = Employee(id="E2", name="Part-time", availability=20.0)
    assert e2.availability == 0.5

    # Pass 80% -> should normalize to 0.8
    e3 = Employee(id="E3", name="Percentage", availability=80.0)
    assert e3.availability == 0.8
