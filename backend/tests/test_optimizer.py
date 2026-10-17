"""
Unit tests for team optimizer, constraint validation, baseline comparison, and swap simulation.
"""

import pytest

from backend.data.loader import get_seed_employees, get_seed_projects
from backend.optimizer.metrics import (
    COVERED_THRESHOLD,
    PARTIAL_THRESHOLD,
    evaluate_team_metrics,
)
from backend.optimizer.team_optimizer import (
    compare_baseline_and_optimizer,
    filter_eligible_candidates,
    select_baseline_team,
    select_optimized_team,
    simulate_member_swap,
)
from backend.schemas.models import (
    Employee,
    Project,
    RequiredSkill,
    SkillEvidence,
    SkillLevel,
)


@pytest.fixture
def seed_data():
    return get_seed_projects(), get_seed_employees()


def test_hard_constraint_infeasible_team_size(seed_data):
    """When pool contains fewer eligible candidates than requested team size, report violation."""
    projects, employees = seed_data
    proj = projects[0]

    # Only pass 1 candidate when project requires 3
    limited_pool = employees[:1]
    res = select_optimized_team(limited_pool, proj, target_team_size=3)

    assert not res.is_feasible
    assert any("does not match requested size" in v for v in res.constraint_violations)


def test_hard_constraint_unavailable_candidates_excluded(seed_data):
    """Candidates with availability <= 0.0 must be excluded from eligible pool."""
    _, employees = seed_data
    # Hannah Abbott has availability 0.0
    hannah = next(e for e in employees if e.id == "EMP-008")
    assert hannah.availability == 0.0

    eligible = filter_eligible_candidates(employees)
    assert hannah not in eligible
    assert all(e.availability > 0.0 for e in eligible)


def test_hard_constraint_duplicate_ids_flagged(seed_data):
    """If same employee is assigned twice, evaluation must flag violation and mark infeasible."""
    projects, employees = seed_data
    proj = projects[0]
    alice = employees[0]

    # Duplicate team: [Alice, Alice, Alice]
    duplicate_team = [alice, alice, alice]
    res = evaluate_team_metrics(duplicate_team, proj, target_team_size=3)

    assert not res.is_feasible
    assert any("Duplicate candidate" in v for v in res.constraint_violations)


def test_complementary_team_beats_baseline_on_coverage(seed_data):
    """
    On Project 1 (Cloud Native), top individuals overlap heavily on backend (Python/Postgres),
    leaving Kubernetes critical gap. Optimizer selects complementary members and achieves 100% coverage.
    """
    projects, employees = seed_data
    p1 = projects[0]  # PRJ-101

    comparison = compare_baseline_and_optimizer(employees, p1)

    # Optimizer must have higher or equal weighted coverage
    assert comparison.optimized.weighted_coverage_pct > comparison.baseline.weighted_coverage_pct
    assert comparison.deltas.weighted_coverage_pct_delta > 0

    # Optimizer must eliminate the Kubernetes critical gap that baseline suffered
    assert "Kubernetes" in comparison.baseline.critical_gaps
    assert "Kubernetes" not in comparison.optimized.critical_gaps
    assert comparison.deltas.critical_gaps_reduced >= 1

    # Measured delta arithmetic consistency check
    expected_delta = round(comparison.optimized.weighted_coverage_pct - comparison.baseline.weighted_coverage_pct, 2)
    assert comparison.deltas.weighted_coverage_pct_delta == expected_delta


def test_baseline_ties_or_wins_on_pure_backend_project(seed_data):
    """
    On Project 2 (Backend Core), backend-heavy top individuals already fully cover all skills.
    Baseline and optimizer must achieve equal 100% coverage without hardcoded biases.
    """
    projects, employees = seed_data
    p2 = projects[1]  # PRJ-102

    comparison = compare_baseline_and_optimizer(employees, p2)

    assert comparison.baseline.weighted_coverage_pct == 100.0
    assert comparison.optimized.weighted_coverage_pct == 100.0
    assert comparison.deltas.weighted_coverage_pct_delta == 0.0
    assert comparison.deltas.critical_gaps_reduced == 0


def test_swap_simulation_recalculates_metrics(seed_data):
    """
    Test what-if swap: substituting a member recalculates true coverage and deltas.
    """
    projects, employees = seed_data
    p1 = projects[0]

    # Baseline team on p1: Fiona (EMP-006), Alice (EMP-001), Bob (EMP-002)
    current_team_ids = ["EMP-006", "EMP-001", "EMP-002"]

    # Swap out Bob (EMP-002) for Evan Wright (EMP-005, DevOps/Kubernetes)
    res = simulate_member_swap(
        current_team_ids=current_team_ids,
        remove_employee_id="EMP-002",
        add_employee_id="EMP-005",
        project=p1,
        candidate_pool=employees,
    )

    assert res.valid
    # Evan brings Kubernetes, resolving the critical gap
    assert "Kubernetes" in res.before.critical_gaps
    assert "Kubernetes" not in res.after.critical_gaps
    assert res.deltas.critical_gaps_reduced == 1
    assert res.deltas.weighted_coverage_pct_delta > 0
    assert any("Evan Wright" in s for s in res.impact_summary)


def test_swap_simulation_invalid_remove_id(seed_data):
    """Attempting to remove a member not on the current team must return valid=False."""
    projects, employees = seed_data
    p1 = projects[0]

    res = simulate_member_swap(
        current_team_ids=["EMP-001", "EMP-002"],
        remove_employee_id="EMP-999",  # Not on team!
        add_employee_id="EMP-004",
        project=p1,
        candidate_pool=employees,
    )

    assert not res.valid
    assert any("Invalid swap" in s for s in res.impact_summary)
