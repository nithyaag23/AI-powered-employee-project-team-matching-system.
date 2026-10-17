"""
SkillSync AI - Team Metrics and Evaluation Engine.
Evaluates team staffing performance using canonical metrics:
- Weighted required-skill coverage percentage
- Covered skills (>= 0.80), partially covered (0.25 to 0.79), uncovered (< 0.25)
- Critical gap detection
- Team average fit score
- Quantified skill redundancy
- Hard constraint validation (size, uniqueness, availability)
"""

from __future__ import annotations

from typing import Dict, List, Optional, Set, Tuple

from backend.matching.scoring import (
    calculate_skill_capability,
    normalize_token,
    score_employee_match,
)
from backend.schemas.models import (
    ComparisonDeltas,
    Employee,
    Project,
    RequiredSkill,
    SkillEvidence,
    TeamResult,
)

# Canonical coverage thresholds (used consistently everywhere)
COVERED_THRESHOLD = 0.80
PARTIAL_THRESHOLD = 0.25


def calculate_team_skill_capabilities(
    members: List[Employee], project: Project
) -> Dict[str, Tuple[float, int]]:
    """
    Computes max capability and count of proficient members for each required skill.
    Returns: {required_skill_name: (max_capability, count_proficient_members)}
    """
    capabilities: Dict[str, Tuple[float, int]] = {}

    for req in project.required_skills:
        req_token = normalize_token(req.name)
        max_cap = 0.0
        proficient_count = 0

        for member in members:
            # Check member skills
            for s in member.skills:
                if normalize_token(s.name) == req_token:
                    cap = calculate_skill_capability(s, req)
                    if cap > max_cap:
                        max_cap = cap
                    if cap >= COVERED_THRESHOLD:
                        proficient_count += 1
                    break

        capabilities[req.name] = (round(max_cap, 4), proficient_count)

    return capabilities


def evaluate_team_metrics(
    members: List[Employee],
    project: Project,
    target_team_size: Optional[int] = None,
) -> TeamResult:
    """
    Single canonical evaluation function.
    Both baseline and optimizer pass through this exact function.
    """
    violations: List[str] = []
    warnings: List[str] = []

    expected_size = target_team_size if target_team_size is not None else project.team_size

    # Constraint 1: Team Size
    if len(members) != expected_size:
        violations.append(
            f"Team size {len(members)} does not match requested size {expected_size}."
        )

    # Constraint 2: Uniqueness of Member IDs
    seen_ids: Set[str] = set()
    for m in members:
        if m.id in seen_ids:
            violations.append(f"Duplicate candidate detected in team: {m.id} ({m.name}).")
        seen_ids.add(m.id)

    # Constraint 3: Availability
    for m in members:
        if m.availability <= 0.0:
            violations.append(f"Candidate {m.name} ({m.id}) is unavailable (availability={m.availability}).")

    # Compute skill coverage
    skill_caps = calculate_team_skill_capabilities(members, project)

    covered_skills: List[str] = []
    partial_skills: List[str] = []
    uncovered_skills: List[str] = []
    critical_gaps: List[str] = []

    total_req_weight = sum(r.weight for r in project.required_skills)
    weighted_achieved = 0.0
    total_excess_proficient = 0

    req_by_name = {r.name: r for r in project.required_skills}

    for req_name, (cap, prof_count) in skill_caps.items():
        req = req_by_name[req_name]
        weighted_achieved += req.weight * min(1.0, cap)

        if cap >= COVERED_THRESHOLD:
            covered_skills.append(req_name)
        elif cap >= PARTIAL_THRESHOLD:
            partial_skills.append(req_name)
        else:
            uncovered_skills.append(req_name)

        if req.critical and (cap < COVERED_THRESHOLD):
            critical_gaps.append(req_name)

        if prof_count > 1:
            total_excess_proficient += (prof_count - 1)

    if total_req_weight > 0:
        weighted_coverage_pct = round((weighted_achieved / total_req_weight) * 100.0, 2)
    else:
        weighted_coverage_pct = 100.0

    # Team Fit Score (average individual match score)
    if members:
        individual_scores = [score_employee_match(m, project).overall_score for m in members]
        team_fit_score = round(sum(individual_scores) / len(individual_scores), 2)
    else:
        team_fit_score = 0.0

    # Redundancy score
    num_reqs = max(1, len(project.required_skills))
    redundancy_score = round(total_excess_proficient / num_reqs, 2)

    # Objective Value calculation
    # Primary: weighted coverage (scale 0-100k)
    # Secondary: team fit (scale 0-10)
    # Penalty: redundancy
    objective_value = round(
        (1000.0 * weighted_coverage_pct) + (10.0 * (team_fit_score / 100.0)) - (2.0 * redundancy_score),
        2
    )

    is_feasible = len(violations) == 0

    if critical_gaps:
        warnings.append(f"Team leaves {len(critical_gaps)} critical skill(s) unmet: {', '.join(critical_gaps)}.")
    if partial_skills:
        warnings.append(f"{len(partial_skills)} skill(s) only partially covered: {', '.join(partial_skills)}.")

    return TeamResult(
        members=members,
        team_size=len(members),
        weighted_coverage_pct=weighted_coverage_pct,
        covered_skills=covered_skills,
        partial_skills=partial_skills,
        critical_gaps=critical_gaps,
        team_fit_score=team_fit_score,
        redundancy_score=redundancy_score,
        constraint_violations=violations,
        objective_value=objective_value,
        is_feasible=is_feasible,
        warnings=warnings,
    )


def compute_comparison_deltas(baseline: TeamResult, optimized: TeamResult) -> ComparisonDeltas:
    """
    Computes exact arithmetic deltas (optimized - baseline).
    Never hardcoded. Reflects real mathematical differences.
    """
    return ComparisonDeltas(
        weighted_coverage_pct_delta=round(optimized.weighted_coverage_pct - baseline.weighted_coverage_pct, 2),
        team_fit_score_delta=round(optimized.team_fit_score - baseline.team_fit_score, 2),
        critical_gaps_reduced=len(baseline.critical_gaps) - len(optimized.critical_gaps),
        covered_skills_count_delta=len(optimized.covered_skills) - len(baseline.covered_skills),
    )
