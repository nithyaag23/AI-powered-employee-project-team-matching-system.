"""
SkillSync AI - Deterministic Matching & Scoring Engine.
Implements the canonical formula:
Overall match = 100 * (0.55 * SkillFit + 0.20 * ExperienceFit + 0.15 * AvailabilityFit + 0.10 * InterestFit)

Strictly adheres to the Missing Data Policy:
- Missing fields are NEVER silently treated as 1.0 (perfect score).
- When data is missing, weights are dynamically renormalized and transparent disclosures
  are appended to the warnings array.
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional, Set, Tuple

from backend.schemas.models import (
    ComponentScores,
    Employee,
    MatchResult,
    Project,
    RequiredSkill,
    SkillEvidence,
    SkillLevel,
    VerificationStatus,
)


def normalize_token(text: str) -> str:
    """Normalize a skill or interest token for matching."""
    return re.sub(r"[^a-z0-9]", "", text.strip().lower())


def calculate_skill_capability(cand_skill: SkillEvidence, required: RequiredSkill) -> float:
    """
    Evaluates individual capability score [0.0, 1.0] for a single skill.
    Accounts for skill level, verification provenance, and extraction confidence.
    """
    cand_weight = SkillLevel.numeric_weight(cand_skill.level)
    req_weight = SkillLevel.numeric_weight(required.min_level)

    # Base level ratio capped at 1.0
    base_ratio = min(1.0, cand_weight / req_weight) if req_weight > 0 else 1.0

    # Verification status: verified claims earn full credit (1.0).
    # Unverified claims earn 0.85 (scaled by confidence if available).
    # Unknown provenance earns 0.75.
    if cand_skill.verification_status == VerificationStatus.VERIFIED:
        multiplier = 1.00
    elif cand_skill.verification_status == VerificationStatus.UNVERIFIED:
        conf = cand_skill.confidence if cand_skill.confidence is not None else 0.90
        multiplier = 0.85 * (0.80 + 0.20 * conf)
    else:
        multiplier = 0.75

    effective = min(1.0, base_ratio * multiplier)
    return round(effective, 4)


def compute_skill_fit(
    employee: Employee, project: Project
) -> Tuple[Optional[float], List[str], List[str]]:
    """
    Computes SkillFit component score (0.0 to 1.0).
    Returns (skill_fit, reasons, warnings).
    Returns None if project requires no skills (triggers weight renormalization).
    """
    reasons: List[str] = []
    warnings: List[str] = []

    if not project.required_skills:
        warnings.append("Project specifies no required skills; SkillFit omitted.")
        return None, reasons, warnings

    if not employee.skills:
        warnings.append("Candidate has no recorded skills; SkillFit scored 0.0.")
        return 0.0, reasons, warnings

    # Map candidate skills by normalized name
    cand_skill_map: Dict[str, SkillEvidence] = {
        normalize_token(s.name): s for s in employee.skills
    }

    total_weight = sum(r.weight for r in project.required_skills)
    if total_weight <= 0:
        total_weight = float(len(project.required_skills))

    weighted_points = 0.0
    matched_skills = []
    missing_critical = []

    for req in project.required_skills:
        req_token = normalize_token(req.name)
        if req_token in cand_skill_map:
            cand_skill = cand_skill_map[req_token]
            cap = calculate_skill_capability(cand_skill, req)
            weighted_points += cap * req.weight
            matched_skills.append(f"{cand_skill.name} ({cand_skill.level.value}, cap={cap:.2f})")
        else:
            if req.critical:
                missing_critical.append(req.name)

    skill_fit = min(1.0, max(0.0, weighted_points / total_weight))

    if matched_skills:
        reasons.append(f"Demonstrates proficiency in: {', '.join(matched_skills[:4])}")
    if missing_critical:
        warnings.append(f"Lacks critical required skills: {', '.join(missing_critical)}")

    return round(skill_fit, 4), reasons, warnings


def compute_experience_fit(
    employee: Employee, project: Project
) -> Tuple[Optional[float], List[str], List[str]]:
    """
    Computes ExperienceFit component score (0.0 to 1.0).
    Returns None if experience_years is missing (triggers weight renormalization).
    """
    reasons: List[str] = []
    warnings: List[str] = []

    if employee.experience_years is None:
        warnings.append("experience_years is missing; ExperienceFit omitted and remaining weights renormalized.")
        return None, reasons, warnings

    target_exp = project.min_experience_years if (project.min_experience_years and project.min_experience_years > 0) else 1.0
    cand_exp = max(0.0, employee.experience_years)

    fit = min(1.0, cand_exp / target_exp)
    if cand_exp >= target_exp:
        reasons.append(f"{cand_exp:.1f} years experience satisfies required {target_exp:.1f} years")
    else:
        reasons.append(f"{cand_exp:.1f} years experience below preferred {target_exp:.1f} years")

    return round(fit, 4), reasons, warnings


def compute_availability_fit(
    employee: Employee, project: Project
) -> Tuple[float, List[str], List[str]]:
    """
    Computes AvailabilityFit component score (0.0 to 1.0).
    """
    reasons: List[str] = []
    warnings: List[str] = []

    avail = max(0.0, min(1.0, employee.availability))
    if avail >= 0.8:
        reasons.append(f"High availability ({avail*100:.0f}%) aligns with staffing needs")
    elif avail > 0.0:
        reasons.append(f"Partial availability ({avail*100:.0f}%)")
    else:
        warnings.append("Employee has 0.0 availability (ineligible/unavailable)")

    return round(avail, 4), reasons, warnings


def compute_interest_fit(
    employee: Employee, project: Project
) -> Tuple[float, List[str], List[str]]:
    """
    Computes InterestFit component score (0.0 to 1.0).
    Evaluates keyword and domain alignment between candidate interests and project scope.
    """
    reasons: List[str] = []
    warnings: List[str] = []

    if not employee.interests:
        reasons.append("No specific interests listed (scored 0.0)")
        return 0.0, reasons, warnings

    project_text = f"{project.name} {project.description} " + " ".join(r.name for r in project.required_skills)
    project_tokens = set(re.findall(r"\b[a-z0-9]{3,}\b", project_text.lower()))

    matched_interests = []
    for interest in employee.interests:
        interest_tokens = set(re.findall(r"\b[a-z0-9]{3,}\b", interest.lower()))
        if interest_tokens and (interest_tokens & project_tokens):
            matched_interests.append(interest)

    if not matched_interests:
        return 0.15, ["Minimal domain interest overlap detected"], warnings

    match_count = len(matched_interests)
    score = min(1.0, 0.40 + 0.30 * match_count)
    reasons.append(f"Domain interests align with project: {', '.join(matched_interests[:3])}")
    return round(score, 4), reasons, warnings


def score_employee_match(employee: Employee, project: Project) -> MatchResult:
    """
    Calculates the canonical composite match score for one employee against a project.
    Applies formula: 100 * (0.55 * Skill + 0.20 * Exp + 0.15 * Avail + 0.10 * Interest)
    with rigorous weight renormalization whenever data is legitimately missing.
    """
    all_reasons: List[str] = []
    all_warnings: List[str] = []

    # Default canonical weights
    base_weights = {
        "skill": 0.55,
        "experience": 0.20,
        "availability": 0.15,
        "interest": 0.10,
    }

    skill_fit, s_reasons, s_warnings = compute_skill_fit(employee, project)
    exp_fit, e_reasons, e_warnings = compute_experience_fit(employee, project)
    avail_fit, a_reasons, a_warnings = compute_availability_fit(employee, project)
    interest_fit, i_reasons, i_warnings = compute_interest_fit(employee, project)

    all_reasons.extend(s_reasons + e_reasons + a_reasons + i_reasons)
    all_warnings.extend(s_warnings + e_warnings + a_warnings + i_warnings)

    # Dynamic Weight Renormalization for missing components
    active_weights: Dict[str, float] = {}
    component_values: Dict[str, float] = {}

    if skill_fit is not None:
        active_weights["skill"] = base_weights["skill"]
        component_values["skill"] = skill_fit
    else:
        component_values["skill"] = 0.0

    if exp_fit is not None:
        active_weights["experience"] = base_weights["experience"]
        component_values["experience"] = exp_fit
    else:
        component_values["experience"] = 0.0

    active_weights["availability"] = base_weights["availability"]
    component_values["availability"] = avail_fit

    active_weights["interest"] = base_weights["interest"]
    component_values["interest"] = interest_fit

    # Renormalize active weights so sum == 1.0
    weight_sum = sum(active_weights.values())
    overall_ratio = 0.0
    for k, w in active_weights.items():
        renorm_weight = w / weight_sum
        overall_ratio += renorm_weight * component_values[k]

    overall_score = round(max(0.0, min(100.0, overall_ratio * 100.0)), 2)

    components = ComponentScores(
        skill_fit=component_values["skill"],
        experience_fit=component_values["experience"],
        availability_fit=component_values["availability"],
        interest_fit=component_values["interest"],
    )

    return MatchResult(
        employee_id=employee.id,
        employee_name=employee.name,
        overall_score=overall_score,
        component_scores=components,
        reasons=all_reasons,
        warnings=all_warnings,
    )


def rank_candidates_for_project(
    candidates: List[Employee], project: Project
) -> List[MatchResult]:
    """Scores and ranks all candidates descending by overall match score."""
    results = [score_employee_match(c, project) for c in candidates]
    results.sort(key=lambda m: m.overall_score, reverse=True)
    return results
