"""
SkillSync AI - Canonical Shared Data Contracts and Pydantic Schemas.
This module is the single source of truth for Person 1 (Frontend), Person 2 (AI Extraction),
and Person 3 (Backend & Optimization).

Do not rename fields or modify shapes without consensus across all three team members.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ==============================================================================
# Canonical Enums
# ==============================================================================

class SkillLevel(str, Enum):
    """Normalized proficiency levels for employee skills and requirements."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    UNKNOWN = "unknown"

    @classmethod
    def numeric_weight(cls, level: Union[SkillLevel, str]) -> float:
        """Map categorical skill level to a deterministic continuous score (0.0 - 1.0)."""
        val = level.value if isinstance(level, SkillLevel) else str(level).lower()
        mapping = {
            cls.BEGINNER.value: 0.50,
            cls.INTERMEDIATE.value: 0.80,
            cls.ADVANCED.value: 1.00,
            cls.UNKNOWN.value: 0.35,
        }
        return mapping.get(val, 0.35)


class VerificationStatus(str, Enum):
    """Verification provenance for extracted/self-reported skills."""
    VERIFIED = "verified"
    UNVERIFIED = "unverified"
    UNKNOWN = "unknown"


# ==============================================================================
# Domain Entities: Skills, Employees, Projects
# ==============================================================================

class SkillEvidence(BaseModel):
    """
    Detailed evidence supporting a candidate's skill possession.
    Compatible with AI extraction output and deterministic evaluation.
    """
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    name: str = Field(..., description="Canonical lowercase/normalized skill name, e.g., 'python'")
    level: SkillLevel = Field(
        default=SkillLevel.UNKNOWN,
        description="Proficiency level: beginner, intermediate, advanced, unknown"
    )
    evidence: Optional[str] = Field(
        default=None,
        description="Verifiable source text snippet, project description, or credential"
    )
    verification_status: VerificationStatus = Field(
        default=VerificationStatus.UNKNOWN,
        description="Status: verified, unverified, unknown"
    )
    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Model extraction confidence score (0.0 to 1.0). Null if uncalibrated."
    )

    @field_validator("name", mode="before")
    @classmethod
    def clean_skill_name(cls, v: Any) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("Skill name must be a non-empty string.")
        return v.strip()

    @field_validator("level", mode="before")
    @classmethod
    def parse_skill_level(cls, v: Any) -> SkillLevel:
        if isinstance(v, SkillLevel):
            return v
        if isinstance(v, str):
            val = v.strip().lower()
            for member in SkillLevel:
                if member.value == val:
                    return member
        return SkillLevel.UNKNOWN

    @field_validator("verification_status", mode="before")
    @classmethod
    def parse_verification(cls, v: Any) -> VerificationStatus:
        if isinstance(v, VerificationStatus):
            return v
        if isinstance(v, str):
            val = v.strip().lower()
            for member in VerificationStatus:
                if member.value == val:
                    return member
        return VerificationStatus.UNKNOWN


class RequiredSkill(BaseModel):
    """
    A skill required by a project, including relative weight and criticality flag.
    """
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    name: str = Field(..., description="Skill name, e.g. 'FastAPI'")
    min_level: SkillLevel = Field(
        default=SkillLevel.INTERMEDIATE,
        description="Minimum acceptable proficiency level for full coverage"
    )
    weight: float = Field(
        default=1.0,
        ge=0.01,
        description="Relative business priority weight (normalized during coverage calculation)"
    )
    critical: bool = Field(
        default=False,
        description="If True, missing this skill flags a critical gap warning"
    )

    @field_validator("name", mode="before")
    @classmethod
    def clean_name(cls, v: Any) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("Required skill name cannot be empty.")
        return v.strip()


class Employee(BaseModel):
    """
    Canonical profile of an employee/candidate available for assignment.
    """
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str = Field(..., description="Unique employee identifier (e.g., 'EMP-001')")
    name: str = Field(..., description="Full legal or display name")
    title: Optional[str] = Field(default=None, description="Professional title or role")
    skills: List[SkillEvidence] = Field(
        default_factory=list,
        description="List of skills possessed by the employee"
    )
    experience_years: Optional[float] = Field(
        default=None,
        ge=0.0,
        description="Total relevant industry experience in years"
    )
    availability: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Availability fraction (0.0 = completely unavailable, 1.0 = 100% available)"
    )
    interests: List[str] = Field(
        default_factory=list,
        description="Domain or technical interests (e.g. ['Machine Learning', 'Fintech'])"
    )

    @field_validator("availability", mode="before")
    @classmethod
    def normalize_availability(cls, v: Any) -> float:
        """Defensive validator: convert percentages (e.g. 100) or hours (e.g. 40) into 0.0-1.0 fraction."""
        if v is None:
            return 0.0
        try:
            val = float(v)
        except (ValueError, TypeError):
            return 0.0
        if val > 1.0:
            if val <= 40.0:  # weekly hours assumption
                return max(0.0, min(1.0, round(val / 40.0, 4)))
            if val <= 100.0:  # percentage assumption
                return max(0.0, min(1.0, round(val / 100.0, 4)))
            return 1.0
        return max(0.0, min(1.0, val))

    @field_validator("skills", mode="before")
    @classmethod
    def coerce_skills_list(cls, v: Any) -> List[Any]:
        """Support passing string list ['Python', 'SQL'] by converting to SkillEvidence objects."""
        if isinstance(v, list):
            coerced = []
            for item in v:
                if isinstance(item, str):
                    coerced.append(SkillEvidence(name=item, level=SkillLevel.UNKNOWN))
                else:
                    coerced.append(item)
            return coerced
        return []


class Project(BaseModel):
    """
    Project staffing requirements and metadata.
    """
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str = Field(..., description="Unique project identifier (e.g., 'PRJ-101')")
    name: str = Field(..., description="Project title")
    description: str = Field(..., description="Detailed scope and context of the project")
    required_skills: List[RequiredSkill] = Field(
        default_factory=list,
        description="Required technical or functional skills"
    )
    team_size: int = Field(
        default=3,
        ge=1,
        description="Target number of team members required"
    )
    availability_window: Optional[str] = Field(
        default=None,
        description="Target delivery timeline, e.g., 'Q3 2026' or 'immediate'"
    )
    min_experience_years: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        description="Minimum baseline experience expectation"
    )

    @field_validator("required_skills", mode="before")
    @classmethod
    def coerce_required_skills(cls, v: Any) -> List[Any]:
        """Support passing plain string list by converting to RequiredSkill objects with default weight 1.0."""
        if isinstance(v, list):
            coerced = []
            for item in v:
                if isinstance(item, str):
                    coerced.append(RequiredSkill(name=item, weight=1.0, min_level=SkillLevel.INTERMEDIATE))
                else:
                    coerced.append(item)
            return coerced
        return []


# ==============================================================================
# Matching & Scoring Contracts
# ==============================================================================

class ComponentScores(BaseModel):
    """Normalized (0.0 to 1.0) component breakdown for individual employee-project fit."""
    skill_fit: float = Field(..., ge=0.0, le=1.0, description="Match between candidate skills and project requirements")
    experience_fit: float = Field(..., ge=0.0, le=1.0, description="Match against project experience expectations")
    availability_fit: float = Field(..., ge=0.0, le=1.0, description="Candidate availability relative to assignment needs")
    interest_fit: float = Field(..., ge=0.0, le=1.0, description="Semantic/keyword overlap between candidate interests and project")


class MatchResult(BaseModel):
    """Deterministic individual match evaluation for one employee against a project."""
    model_config = ConfigDict(extra="ignore")

    employee_id: str
    employee_name: str
    overall_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Composite score 0-100 calculated using agreed formula"
    )
    component_scores: ComponentScores
    reasons: List[str] = Field(
        default_factory=list,
        description="Human-readable justification for the computed score"
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Disclosures such as missing experience data or weight renormalization"
    )


# ==============================================================================
# Team Optimization & Baseline Contracts
# ==============================================================================

class TeamResult(BaseModel):
    """
    Standardized evaluation output for a staffed team, whether produced by
    the optimizer, the baseline heuristic, or a manual configuration.
    """
    model_config = ConfigDict(extra="ignore")

    members: List[Employee] = Field(default_factory=list, description="Assigned employee profiles")
    team_size: int = Field(..., description="Actual count of members in this team")
    weighted_coverage_pct: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Percentage of project skill weights satisfied by the team"
    )
    covered_skills: List[str] = Field(
        default_factory=list,
        description="Skills satisfying threshold (team capability >= 0.80)"
    )
    partial_skills: List[str] = Field(
        default_factory=list,
        description="Skills partially satisfied (0.25 <= team capability < 0.80)"
    )
    critical_gaps: List[str] = Field(
        default_factory=list,
        description="Required skills marked critical that are uncovered or partial"
    )
    team_fit_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Mean overall match score across all team members"
    )
    redundancy_score: float = Field(
        default=0.0,
        ge=0.0,
        description="Quantified skill overlap metric (lower indicates higher role diversity)"
    )
    constraint_violations: List[str] = Field(
        default_factory=list,
        description="Hard constraints that could not be satisfied (e.g. pool exhausted)"
    )
    objective_value: float = Field(
        default=0.0,
        description="Internal optimizer objective value: 1000*Cov + 10*Fit - Redundancy"
    )
    is_feasible: bool = Field(
        default=True,
        description="False if hard constraints (size, availability) were violated"
    )
    warnings: List[str] = Field(default_factory=list)


class ComparisonDeltas(BaseModel):
    """Exact arithmetic differences: (optimized - baseline). Positive values indicate optimizer advantage."""
    weighted_coverage_pct_delta: float = Field(..., description="Coverage difference (+ means optimizer covered more)")
    team_fit_score_delta: float = Field(..., description="Average fit score difference")
    critical_gaps_reduced: int = Field(..., description="Baseline critical gaps minus optimizer critical gaps")
    covered_skills_count_delta: int = Field(..., description="Difference in count of fully covered skills")


class ComparisonResult(BaseModel):
    """Side-by-side comparison between top-N baseline and combinatorial team optimizer."""
    baseline: TeamResult
    optimized: TeamResult
    deltas: ComparisonDeltas
    evaluation_notes: List[str] = Field(
        default_factory=list,
        description="Analytical breakdown explaining why the teams diverge or tie"
    )


# ==============================================================================
# API Request & Response Models
# ==============================================================================

class HealthResponse(BaseModel):
    status: str = "ok"
    app_version: str = "1.0.0"


class DemoDataResponse(BaseModel):
    projects: List[Project]
    employees: List[Employee]


class MatchRequest(BaseModel):
    project_id: Optional[str] = Field(default=None, description="Lookup ID in seed data if project not supplied")
    project: Optional[Project] = Field(default=None, description="Explicit project object")
    candidate_pool: Optional[List[Employee]] = Field(default=None, description="Pool of candidates; defaults to seed pool")


class MatchResponse(BaseModel):
    project_id: str
    matches: List[MatchResult]
    total_candidates: int
    eligible_candidates: int


class TeamOptimizeRequest(BaseModel):
    project_id: Optional[str] = None
    project: Optional[Project] = None
    candidate_pool: Optional[List[Employee]] = None
    eligible_employee_ids: Optional[List[str]] = Field(
        default=None,
        description="Optional filter whitelist of employee IDs to consider"
    )
    team_size_override: Optional[int] = Field(default=None, ge=1)


class TeamCompareRequest(BaseModel):
    project_id: Optional[str] = None
    project: Optional[Project] = None
    candidate_pool: Optional[List[Employee]] = None
    team_size_override: Optional[int] = Field(default=None, ge=1)


class SwapSimulationRequest(BaseModel):
    project_id: Optional[str] = None
    project: Optional[Project] = None
    current_team_ids: List[str] = Field(..., min_length=1, description="Current member IDs")
    remove_employee_id: str = Field(..., description="Employee ID to be removed")
    add_employee_id: str = Field(..., description="Employee ID to be added")
    candidate_pool: Optional[List[Employee]] = None


class SwapSimulationResult(BaseModel):
    valid: bool = Field(..., description="True if swap is feasible and both candidates valid")
    before: TeamResult
    after: TeamResult
    deltas: ComparisonDeltas
    impact_summary: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class SkillExtractionRequest(BaseModel):
    profile_text: str = Field(..., min_length=1, description="Unstructured resume or profile text")
    metadata: Optional[Dict[str, Any]] = None


class SkillExtractionResponse(BaseModel):
    skills: List[SkillEvidence]
    extracted_count: int
    warnings: List[str] = Field(default_factory=list)


class ProjectAnalysisRequest(BaseModel):
    description: str = Field(..., min_length=1, description="Unstructured project statement of work")
    name: Optional[str] = None
    team_size: Optional[int] = Field(default=3, ge=1)


class ProjectAnalysisResponse(BaseModel):
    project: Project
    warnings: List[str] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Short error name")
    detail: str = Field(..., description="Detailed message describing the problem and resolution")
    error_code: str = Field(..., description="Standard application error code")
    status_code: int = Field(..., description="HTTP status code")
