"""
PROVISIONAL AI MODULE SCHEMAS
-----------------------------
Owned temporarily by Person 2 for internal extraction modeling until Person 3 introduces
the canonical shared schemas in `backend.schemas.shared`.

DO NOT treat these as finalized team-wide contracts. When Person 3 commits the shared schemas,
the AI module imports in `backend/ai/schemas.py` will point to `backend.schemas.shared` seamlessly.

Strict Security & Architectural Rules Enforced:
1. No protected characteristics: Age, gender, race, nationality, religion, disability, marital status are excluded.
2. Verified skills require non-empty verbatim evidence quoted from source text.
3. Unverified or unknown skills must have evidence set to None.
4. AI extracts and structures data; it NEVER computes match scores or selects teams.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"       # Skill directly supported by text evidence (projects, roles, metrics)
    UNVERIFIED = "UNVERIFIED"   # Skill claimed in a buzzword list without project/work evidence
    INFERRED = "INFERRED"       # Inferred from strong context (e.g., PyTorch implies Python)
    UNKNOWN = "UNKNOWN"         # Evidence ambiguous or unverified


class ProficiencyLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


class SkillCategory(str, Enum):
    TECHNICAL = "TECHNICAL"
    FRAMEWORK_OR_TOOL = "FRAMEWORK_OR_TOOL"
    DATABASE = "DATABASE"
    DEVOPS_CLOUD = "DEVOPS_CLOUD"
    SOFT_SKILL = "SOFT_SKILL"
    DOMAIN_KNOWLEDGE = "DOMAIN_KNOWLEDGE"


class ExtractedSkill(BaseModel):
    name: str = Field(..., description="Canonical or normalized skill name (e.g., 'Python', 'PostgreSQL')")
    category: SkillCategory = Field(default=SkillCategory.TECHNICAL, description="Classification of the skill")
    proficiency: ProficiencyLevel = Field(default=ProficiencyLevel.INTERMEDIATE, description="Assessed or claimed level")
    years_of_experience: Optional[float] = Field(default=None, ge=0.0, le=50.0, description="Estimated years of experience if indicated")
    verification_status: VerificationStatus = Field(
        default=VerificationStatus.UNKNOWN,
        description="Whether verifiable evidence exists in the source text"
    )
    evidence: Optional[str] = Field(
        default=None,
        description="Direct quote or sentence from the input text demonstrating application of this skill. Must be None if UNVERIFIED or UNKNOWN."
    )
    confidence_score: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="AI confidence score for this extraction"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Skill name cannot be empty.")
        return cleaned

    @model_validator(mode="after")
    def validate_evidence_consistency(self) -> "ExtractedSkill":
        # Rule: VERIFIED skills MUST have non-empty evidence
        if self.verification_status == VerificationStatus.VERIFIED:
            if not self.evidence or not self.evidence.strip():
                raise ValueError(
                    f"Skill '{self.name}' marked as VERIFIED but has missing or empty evidence quote."
                )
        # Rule: UNVERIFIED or UNKNOWN skills must have evidence set to None
        elif self.verification_status in (VerificationStatus.UNVERIFIED, VerificationStatus.UNKNOWN):
            if self.evidence is not None and not self.evidence.strip():
                self.evidence = None
            elif self.evidence is not None and self.evidence.strip():
                # Unverified claims should not provide verified evidence quotes
                self.evidence = None
        return self


class EmployeeProfile(BaseModel):
    id: Optional[str] = Field(default=None, description="Optional employee UUID or identifier")
    full_name: Optional[str] = Field(default=None, description="Candidate name if provided in resume header")
    current_title: Optional[str] = Field(default=None, description="Current or recent job title")
    total_years_experience: Optional[float] = Field(default=None, ge=0.0, le=50.0, description="Total professional experience in years")
    skills: List[ExtractedSkill] = Field(default_factory=list, description="Extracted skills with evidence and verification states")
    certifications: List[str] = Field(default_factory=list, description="Verified or listed certifications")
    summary: Optional[str] = Field(default=None, description="Brief professional profile summary")

    @model_validator(mode="after")
    def guard_protected_characteristics(self) -> "EmployeeProfile":
        if self.summary:
            import re
            scrub_patterns = [
                r"\b\d{1,2}\s*[- ]year[- ]old\b",
                r"\b(male|female|non-binary)\b",
                r"\b(married|single|divorced|widowed|father\s+of|mother\s+of)\b",
                r"\b(christian|muslim|hindu|jewish|buddhist|sikh|atheist)\b",
            ]
            for pat in scrub_patterns:
                self.summary = re.sub(pat, "[REDACTED]", self.summary, flags=re.IGNORECASE)
        return self


class ProjectSkillRequirement(BaseModel):
    name: str = Field(..., description="Canonical skill name")
    minimum_proficiency: ProficiencyLevel = Field(default=ProficiencyLevel.INTERMEDIATE)
    is_mandatory: bool = Field(default=True, description="True if mandatory; False if preferred/nice-to-have")
    weight: float = Field(default=1.0, ge=0.1, le=5.0, description="Importance weight for matching")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Required skill name cannot be empty.")
        return cleaned


class ProjectRequirement(BaseModel):
    id: Optional[str] = Field(default=None, description="Project ID")
    title: str = Field(..., description="Project title")
    description: str = Field(..., description="Project overview and scope")
    domain: Optional[str] = Field(default=None, description="Industry or technical domain (e.g., FinTech, Healthcare)")
    target_team_size: Optional[int] = Field(default=None, ge=1, le=50, description="Desired team size")
    required_skills: List[ProjectSkillRequirement] = Field(default_factory=list, description="Mandatory and preferred skills")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Project title cannot be empty.")
        return cleaned


class ExtractionMetadata(BaseModel):
    provider: str = Field(..., description="Provider name (e.g., 'gemini', 'deterministic_fallback')")
    model_version: str = Field(..., description="Model version or fallback identifier")
    mode: str = Field(..., description="'live_model' or 'deterministic_fallback'")
    latency_ms: float = Field(..., ge=0.0, description="Extraction duration in milliseconds")
    warnings: List[str] = Field(default_factory=list, description="Warnings, e.g., missing evidence, fallback triggered")
    timestamp: str = Field(..., description="ISO 8601 timestamp of extraction")


class EmployeeExtractionEnvelope(BaseModel):
    data: EmployeeProfile
    metadata: ExtractionMetadata


class ProjectExtractionEnvelope(BaseModel):
    data: ProjectRequirement
    metadata: ExtractionMetadata
