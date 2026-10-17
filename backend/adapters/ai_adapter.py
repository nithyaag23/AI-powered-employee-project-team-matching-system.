"""
SkillSync AI - AI Service Adapter for Person 2 Integration.

Acts as a clean, decoupled boundary between Person 2's AI extraction module
and the core backend.

Features:
- Deterministic rule-based fallback when Person 2's AI module is not yet installed
  or when API credentials (e.g. GEMINI_API_KEY) are absent.
- Preserves the canonical Pydantic contracts (SkillEvidence, Project).
- Seamless drop-in interface for Person 2's module once developed.
"""

from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional, Tuple

from backend.schemas.models import (
    Project,
    RequiredSkill,
    SkillEvidence,
    SkillExtractionResponse,
    SkillLevel,
    VerificationStatus,
)

# Known skill vocabulary for deterministic fallback extraction
KNOWN_SKILLS_TAXONOMY: Dict[str, List[str]] = {
    "Python": ["python", "python3", "py"],
    "FastAPI": ["fastapi", "fast api"],
    "React": ["react", "react.js", "reactjs"],
    "Kubernetes": ["kubernetes", "k8s"],
    "Docker": ["docker", "containerization"],
    "PostgreSQL": ["postgresql", "postgres", "psql"],
    "Redis": ["redis"],
    "TypeScript": ["typescript", "ts"],
    "Machine Learning": ["machine learning", "ml", "deep learning", "nlp"],
    "Data Engineering": ["data engineering", "spark", "etl"],
    "CI/CD": ["ci/cd", "github actions", "argocd", "gitlab ci"],
    "Terraform": ["terraform", "iac"],
    "SQLAlchemy": ["sqlalchemy"],
    "CSS/Tailwind": ["tailwind", "css", "tailwind css"],
    "Next.js": ["next.js", "nextjs"],
}


def rule_based_extract_skills(text: str) -> List[SkillEvidence]:
    """
    High-fidelity deterministic fallback skill extractor.
    Operates without internet or model credentials.
    """
    found_skills: List[SkillEvidence] = []
    text_lower = text.lower()

    for canonical_name, aliases in KNOWN_SKILLS_TAXONOMY.items():
        for alias in aliases:
            # Word boundary regex match
            pattern = rf"\b{re.escape(alias)}\b"
            match = re.search(pattern, text_lower)
            if match:
                # Extract surrounding sentence as evidence
                start = max(0, match.start() - 40)
                end = min(len(text), match.end() + 60)
                evidence_snippet = text[start:end].strip()

                # Infer level from keywords in context
                surrounding = text[max(0, match.start() - 100):min(len(text), match.end() + 100)].lower()
                level = SkillLevel.INTERMEDIATE
                if any(w in surrounding for w in ["senior", "lead", "architect", "expert", "advanced", "years"]):
                    level = SkillLevel.ADVANCED
                elif any(w in surrounding for w in ["junior", "basic", "familiar", "beginner", "learning"]):
                    level = SkillLevel.BEGINNER

                found_skills.append(
                    SkillEvidence(
                        name=canonical_name,
                        level=level,
                        evidence=evidence_snippet,
                        verification_status=VerificationStatus.UNVERIFIED,
                        confidence=0.88,
                    )
                )
                break

    return found_skills


def rule_based_analyze_project(
    description: str,
    name: Optional[str] = None,
    team_size: Optional[int] = None,
) -> Project:
    """
    Deterministic fallback parser for project statement of work.
    """
    extracted_skills = rule_based_extract_skills(description)
    required_skills: List[RequiredSkill] = []

    for s in extracted_skills:
        # Default critical to True for major technologies
        is_critical = s.name in ["Python", "React", "Kubernetes", "Machine Learning"]
        required_skills.append(
            RequiredSkill(
                name=s.name,
                min_level=s.level if s.level != SkillLevel.UNKNOWN else SkillLevel.INTERMEDIATE,
                weight=2.0 if is_critical else 1.5,
                critical=is_critical,
            )
        )

    # In case no known skills matched
    if not required_skills:
        required_skills.append(
            RequiredSkill(name="Python", min_level=SkillLevel.INTERMEDIATE, weight=1.0, critical=False)
        )

    project_name = name or "Staffing Project Requirements"
    project_id = f"PRJ-{abs(hash(description)) % 10000:04d}"

    return Project(
        id=project_id,
        name=project_name,
        description=description,
        required_skills=required_skills,
        team_size=team_size if team_size is not None and team_size >= 1 else 3,
        min_experience_years=3.0,
    )


# ==============================================================================
# Adapter Hooks: Calling Person 2's Module or Fallback
# ==============================================================================

def extract_skills_from_text(
    profile_text: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Tuple[List[SkillEvidence], List[str]]:
    """
    Adapter endpoint for skill extraction.
    Attempts to call Person 2's AI module if installed; falls back to rule-based engine.
    """
    warnings: List[str] = []

    # Attempt to import Person 2's AI extraction module if present in codebase
    try:
        from ai_module.extractor import extract_skills_ai  # Person 2 convention
        skills = extract_skills_ai(profile_text, metadata)
        return skills, warnings
    except ImportError:
        pass

    # Fallback to deterministic rule-based extractor
    warnings.append("AI extraction provider not configured; using deterministic rules engine.")
    skills = rule_based_extract_skills(profile_text)
    return skills, warnings


def analyze_project_text(
    description: str,
    name: Optional[str] = None,
    team_size: Optional[int] = None,
) -> Tuple[Project, List[str]]:
    """
    Adapter endpoint for project statement-of-work parsing.
    Attempts to call Person 2's AI module if installed; falls back to rule-based engine.
    """
    warnings: List[str] = []

    try:
        from ai_module.analyzer import analyze_project_ai  # Person 2 convention
        proj = analyze_project_ai(description, name, team_size)
        return proj, warnings
    except ImportError:
        pass

    warnings.append("AI project analyzer provider not configured; using deterministic rules engine.")
    proj = rule_based_analyze_project(description, name, team_size)
    return proj, warnings
