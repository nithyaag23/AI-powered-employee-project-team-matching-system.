"""
SkillSync AI - Team Optimization and Baseline Comparison Engine.

Provides:
- Combinatorial and heuristic team selection prioritizing weighted skill coverage.
- Greedy Top-N individual-score baseline under identical constraints.
- Real-time arithmetic baseline vs. optimizer comparison.
- What-if member swap simulation with full metric recalculation.
"""

from __future__ import annotations

import itertools
from typing import Dict, List, Optional, Set, Tuple

from backend.matching.scoring import rank_candidates_for_project, score_employee_match
from backend.optimizer.metrics import (
    compute_comparison_deltas,
    evaluate_team_metrics,
)
from backend.schemas.models import (
    ComparisonResult,
    Employee,
    Project,
    SwapSimulationResult,
    TeamResult,
)


def filter_eligible_candidates(
    candidates: List[Employee],
    eligible_ids: Optional[List[str]] = None,
) -> List[Employee]:
    """
    Enforces hard candidate eligibility:
    1. Availability must be > 0.0 (excludes completely unavailable candidates).
    2. Must be in eligible_ids whitelist if specified.
    """
    whitelist = set(eligible_ids) if eligible_ids is not None else None

    eligible: List[Employee] = []
    for c in candidates:
        if c.availability <= 0.0:
            continue
        if whitelist is not None and c.id not in whitelist:
            continue
        eligible.append(c)

    return eligible


def select_baseline_team(
    candidates: List[Employee],
    project: Project,
    target_team_size: Optional[int] = None,
) -> TeamResult:
    """
    Top-N Baseline Heuristic:
    Ranks all eligible candidates by individual overall match score, then selects
    the highest-scoring N individuals regardless of skill complementarity.
    """
    k = target_team_size if target_team_size is not None else project.team_size
    eligible = filter_eligible_candidates(candidates)

    if len(eligible) < k:
        # Feasibility violation: cannot form requested team size
        return evaluate_team_metrics(eligible, project, target_team_size=k)

    ranked_matches = rank_candidates_for_project(eligible, project)
    cand_by_id = {c.id: c for c in eligible}

    top_n_members = [cand_by_id[m.employee_id] for m in ranked_matches[:k]]
    return evaluate_team_metrics(top_n_members, project, target_team_size=k)


def select_optimized_team(
    candidates: List[Employee],
    project: Project,
    target_team_size: Optional[int] = None,
    eligible_ids: Optional[List[str]] = None,
) -> TeamResult:
    """
    Combinatorial Team Optimizer:
    Maximizes objective function:
    Objective = 1000 * WeightedCoverage + 10 * TeamFit - 2 * Redundancy

    Uses exact combination enumeration for pools <= 22 or greedy + local swap search for larger pools.
    """
    k = target_team_size if target_team_size is not None else project.team_size
    eligible = filter_eligible_candidates(candidates, eligible_ids=eligible_ids)

    if len(eligible) < k:
        return evaluate_team_metrics(eligible, project, target_team_size=k)

    # If combinations are manageable, execute exhaustive exact search
    total_combinations = len(list(itertools.combinations(range(len(eligible)), k))) if len(eligible) <= 22 else 999999

    if total_combinations <= 25000:
        best_team: Optional[TeamResult] = None
        best_obj = float("-inf")

        for combo in itertools.combinations(eligible, k):
            res = evaluate_team_metrics(list(combo), project, target_team_size=k)
            if res.objective_value > best_obj:
                best_obj = res.objective_value
                best_team = res

        assert best_team is not None
        return best_team

    # Heuristic: Greedy seed based on complementary marginal skill gain + 1-swap local optimization
    current_team: List[Employee] = []
    pool = list(eligible)

    while len(current_team) < k and pool:
        best_cand: Optional[Employee] = None
        best_cand_obj = float("-inf")

        for cand in pool:
            candidate_team = current_team + [cand]
            res = evaluate_team_metrics(candidate_team, project, target_team_size=len(candidate_team))
            if res.objective_value > best_cand_obj:
                best_cand_obj = res.objective_value
                best_cand = cand

        assert best_cand is not None
        current_team.append(best_cand)
        pool.remove(best_cand)

    # Local 1-swap optimization pass
    improved = True
    current_eval = evaluate_team_metrics(current_team, project, target_team_size=k)

    while improved:
        improved = False
        for i, current_member in enumerate(current_team):
            for replacement in pool:
                swapped = list(current_team)
                swapped[i] = replacement
                swapped_eval = evaluate_team_metrics(swapped, project, target_team_size=k)
                if swapped_eval.objective_value > current_eval.objective_value + 0.01:
                    current_team = swapped
                    current_eval = swapped_eval
                    pool.remove(replacement)
                    pool.append(current_member)
                    improved = True
                    break
            if improved:
                break

    return current_eval


def compare_baseline_and_optimizer(
    candidates: List[Employee],
    project: Project,
    target_team_size: Optional[int] = None,
) -> ComparisonResult:
    """
    Executes both Baseline and Optimizer on identical inputs and constraints.
    Returns side-by-side results, exact computed deltas, and neutral analytical notes.
    """
    k = target_team_size if target_team_size is not None else project.team_size

    baseline = select_baseline_team(candidates, project, target_team_size=k)
    optimized = select_optimized_team(candidates, project, target_team_size=k)
    deltas = compute_comparison_deltas(baseline, optimized)

    notes: List[str] = []

    # Explain coverage differential
    if deltas.weighted_coverage_pct_delta > 0:
        notes.append(
            f"Optimizer improved required skill coverage by +{deltas.weighted_coverage_pct_delta:.1f}% "
            f"({baseline.weighted_coverage_pct:.1f}% -> {optimized.weighted_coverage_pct:.1f}%)."
        )
    elif deltas.weighted_coverage_pct_delta == 0:
        notes.append(
            f"Baseline and Optimizer achieved identical skill coverage ({baseline.weighted_coverage_pct:.1f}%)."
        )
    else:
        notes.append(
            f"Baseline achieved +{abs(deltas.weighted_coverage_pct_delta):.1f}% higher coverage than optimizer."
        )

    # Explain critical gaps
    if deltas.critical_gaps_reduced > 0:
        resolved = set(baseline.critical_gaps) - set(optimized.critical_gaps)
        notes.append(
            f"Optimizer resolved {deltas.critical_gaps_reduced} critical gap(s): {', '.join(resolved)}."
        )
    elif len(optimized.critical_gaps) > 0:
        notes.append(
            f"Both configurations left {len(optimized.critical_gaps)} critical gap(s): {', '.join(optimized.critical_gaps)}."
        )
    else:
        notes.append("No critical skill gaps in optimized configuration.")

    # Explain fit trade-off
    if deltas.team_fit_score_delta < -0.5:
        notes.append(
            f"Optimizer accepted a slight trade-off in average individual score ({deltas.team_fit_score_delta:+.1f} pts) "
            "to secure complementary skill coverage for missing project roles."
        )
    elif deltas.team_fit_score_delta > 0.5:
        notes.append(
            f"Optimizer achieved both higher coverage and higher individual fit ({deltas.team_fit_score_delta:+.1f} pts)."
        )

    # Redundancy note
    if optimized.redundancy_score < baseline.redundancy_score:
        notes.append(
            f"Optimizer reduced unnecessary skill redundancy from {baseline.redundancy_score:.2f} to {optimized.redundancy_score:.2f}."
        )

    return ComparisonResult(
        baseline=baseline,
        optimized=optimized,
        deltas=deltas,
        evaluation_notes=notes,
    )


def simulate_member_swap(
    current_team_ids: List[str],
    remove_employee_id: str,
    add_employee_id: str,
    project: Project,
    candidate_pool: List[Employee],
) -> SwapSimulationResult:
    """
    Evaluates a candidate substitution on an existing team.
    Recalculates actual metrics from scratch (no shortcuts or manual score tweaks).
    """
    cand_by_id = {c.id: c for c in candidate_pool}
    warnings: List[str] = []
    impact_summary: List[str] = []

    # Validate IDs
    if remove_employee_id not in current_team_ids:
        return SwapSimulationResult(
            valid=False,
            before=evaluate_team_metrics([], project),
            after=evaluate_team_metrics([], project),
            deltas=compute_comparison_deltas(evaluate_team_metrics([], project), evaluate_team_metrics([], project)),
            impact_summary=["Invalid swap: remove_employee_id is not in the current team."],
            warnings=[f"Employee {remove_employee_id} not in current team {current_team_ids}."],
        )

    if add_employee_id not in cand_by_id:
        return SwapSimulationResult(
            valid=False,
            before=evaluate_team_metrics([], project),
            after=evaluate_team_metrics([], project),
            deltas=compute_comparison_deltas(evaluate_team_metrics([], project), evaluate_team_metrics([], project)),
            impact_summary=["Invalid swap: add_employee_id does not exist in candidate pool."],
            warnings=[f"Employee {add_employee_id} not found in candidate pool."],
        )

    add_cand = cand_by_id[add_employee_id]
    if add_cand.availability <= 0.0:
        warnings.append(f"Candidate {add_cand.name} has 0.0 availability.")

    # Assemble before team
    before_members = [cand_by_id[eid] for eid in current_team_ids if eid in cand_by_id]
    before_res = evaluate_team_metrics(before_members, project, target_team_size=len(current_team_ids))

    # Assemble after team
    after_ids = [eid for eid in current_team_ids if eid != remove_employee_id]
    after_ids.append(add_employee_id)
    after_members = [cand_by_id[eid] for eid in after_ids]
    after_res = evaluate_team_metrics(after_members, project, target_team_size=len(current_team_ids))

    deltas = compute_comparison_deltas(before_res, after_res)

    removed_name = cand_by_id.get(remove_employee_id, Employee(id=remove_employee_id, name=remove_employee_id)).name
    added_name = add_cand.name

    # Summarize impacts
    cov_change = deltas.weighted_coverage_pct_delta
    if cov_change > 0:
        impact_summary.append(f"Replacing {removed_name} with {added_name} increases weighted coverage by +{cov_change:.1f}%.")
    elif cov_change < 0:
        impact_summary.append(f"Replacing {removed_name} with {added_name} decreases weighted coverage by {cov_change:.1f}%.")
    else:
        impact_summary.append(f"Replacing {removed_name} with {added_name} leaves overall coverage unchanged ({before_res.weighted_coverage_pct:.1f}%).")

    # Critical gaps delta
    if deltas.critical_gaps_reduced > 0:
        resolved = set(before_res.critical_gaps) - set(after_res.critical_gaps)
        impact_summary.append(f"Resolves {deltas.critical_gaps_reduced} critical gap(s): {', '.join(resolved)}.")
    elif deltas.critical_gaps_reduced < 0:
        introduced = set(after_res.critical_gaps) - set(before_res.critical_gaps)
        impact_summary.append(f"Warning: Introduces {abs(deltas.critical_gaps_reduced)} new critical gap(s): {', '.join(introduced)}.")

    # Fit change
    impact_summary.append(f"Team average fit score shifts by {deltas.team_fit_score_delta:+.1f} points.")

    return SwapSimulationResult(
        valid=after_res.is_feasible,
        before=before_res,
        after=after_res,
        deltas=deltas,
        impact_summary=impact_summary,
        warnings=warnings + after_res.warnings,
    )

