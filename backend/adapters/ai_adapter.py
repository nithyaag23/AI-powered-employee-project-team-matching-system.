"""
SkillSync AI - AI Service Adapter for Gemma 4 E4B & Fallback Integration.

Acts as a clean, decoupled boundary between the AI extraction module
and the core backend.

Features:
- Connects to Gemma 4 E4B local/hosted model inference.
- Automatic deterministic rule-based fallback when offline or unconfigured.
- Preserves canonical Pydantic contracts (SkillEvidence, Project).
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
from backend.ai.config import config
from backend.ai.interface import ExtractionService
from backend.ai.gemma_provider import GemmaExtractionProvider
from backend.ai.fallback import DeterministicFallbackProvider

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
    "Go": ["go", "golang"],
    "PyTorch": ["pytorch", "torch"],
    "Machine Learning": ["machine learning", "ml", "deep learning", "nlp"],
    "Data Engineering": ["data engineering", "spark", "etl"],
    "CI/CD": ["ci/cd", "github actions", "argocd", "gitlab ci"],
    "Terraform": ["terraform", "iac"],
    "SQLAlchemy": ["sqlalchemy"],
    "CSS/Tailwind": ["tailwind", "css", "tailwind css"],
    "Next.js": ["next.js", "nextjs"],
}

# Singleton extraction service instance
_gemma_provider = GemmaExtractionProvider()
_extraction_service = ExtractionService(
    primary_provider=_gemma_provider,
    fallback_provider=DeterministicFallbackProvider(),
)


def rule_based_extract_skills(text: str) -> List[SkillEvidence]:
    """
    High-fidelity deterministic fallback skill extractor.
    Operates without internet or model credentials.
    """
    found_skills: List[SkillEvidence] = []
    text_lower = text.lower()

    for canonical_name, aliases in KNOWN_SKILLS_TAXONOMY.items():
        for alias in aliases:
            pattern = rf"\b{re.escape(alias)}\b"
            match = re.search(pattern, text_lower)
            if match:
                start = max(0, match.start() - 40)
                end = min(len(text), match.end() + 60)
                evidence_snippet = text[start:end].strip()

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
    Deterministic parser for project statement of work.
    """
    extracted_skills = rule_based_extract_skills(description)
    required_skills: List[RequiredSkill] = []

    for s in extracted_skills:
        is_critical = s.name in ["Python", "React", "Kubernetes", "Go", "PyTorch", "Machine Learning"]
        required_skills.append(
            RequiredSkill(
                name=s.name,
                min_level=s.level if s.level != SkillLevel.UNKNOWN else SkillLevel.INTERMEDIATE,
                weight=2.5 if is_critical else 1.5,
                critical=is_critical,
            )
        )

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


def extract_skills_from_text(
    profile_text: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Tuple[List[SkillEvidence], List[str]]:
    """
    Extracts skills using Gemma 4 E4B, falling back cleanly to deterministic extraction.
    """
    warnings: List[str] = []

    try:
        envelope = _extraction_service.extract_employee_profile_sync(profile_text)
        if envelope.data and envelope.data.skills:
            parsed_skills: List[SkillEvidence] = []
            for s in envelope.data.skills:
                # Map proficiency level
                lvl_str = str(s.proficiency).lower()
                lvl = SkillLevel.INTERMEDIATE
                if "adv" in lvl_str or "exp" in lvl_str:
                    lvl = SkillLevel.ADVANCED
                elif "beg" in lvl_str:
                    lvl = SkillLevel.BEGINNER

                ver_str = str(s.verification_status).lower()
                ver = VerificationStatus.VERIFIED if "ver" in ver_str else VerificationStatus.UNVERIFIED

                parsed_skills.append(
                    SkillEvidence(
                        name=s.name,
                        level=lvl,
                        evidence=s.evidence,
                        verification_status=ver,
                        confidence=s.confidence_score or 0.85,
                    )
                )
            if envelope.metadata.warnings:
                warnings.extend(envelope.metadata.warnings)
            return parsed_skills, warnings
    except Exception as exc:
        warnings.append(f"Gemma 4 E4B live inference bypassed ({exc}); used deterministic rule fallback.")

    skills = rule_based_extract_skills(profile_text)
    return skills, warnings


def analyze_project_text(
    description: str,
    name: Optional[str] = None,
    team_size: Optional[int] = None,
) -> Tuple[Project, List[str]]:
    """
    Parses project requirements statement using Gemma 4 E4B, falling back cleanly to deterministic rules.
    """
    warnings: List[str] = []

    try:
        envelope = _extraction_service.extract_project_requirements_sync(description)
        if envelope.data and envelope.data.required_skills:
            req_skills: List[RequiredSkill] = []
            for s in envelope.data.required_skills:
                lvl_str = str(s.minimum_proficiency).lower()
                lvl = SkillLevel.INTERMEDIATE
                if "adv" in lvl_str or "exp" in lvl_str:
                    lvl = SkillLevel.ADVANCED
                elif "beg" in lvl_str:
                    lvl = SkillLevel.BEGINNER

                req_skills.append(
                    RequiredSkill(
                        name=s.name,
                        min_level=lvl,
                        weight=float(s.weight) if s.weight else 2.0,
                        critical=bool(s.is_mandatory),
                    )
                )

            project_name = name or envelope.data.title or "Staffing Project Requirements"
            proj_id = f"PRJ-{abs(hash(description)) % 10000:04d}"

            final_team_size = team_size or envelope.data.target_team_size or 3
            if final_team_size < 1:
                final_team_size = 3

            proj = Project(
                id=proj_id,
                name=project_name,
                description=description,
                required_skills=req_skills,
                team_size=final_team_size,
                min_experience_years=3.0,
            )
            if envelope.metadata.warnings:
                warnings.extend(envelope.metadata.warnings)
            return proj, warnings
    except Exception as exc:
        warnings.append(f"Gemma 4 E4B live inference bypassed ({exc}); used deterministic rule fallback.")

    proj = rule_based_analyze_project(description, name, team_size)
    return proj, warnings
