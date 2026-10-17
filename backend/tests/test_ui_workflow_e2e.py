"""
End-to-End Workflow Integration Test for SkillSync AI.
Validates the entire workflow of the 4 core dashboard views:
1. Candidate Rankings (Matching & Scoring)
2. Team Builder (Combinatorial Optimization)
3. Baseline vs Optimizer (Rigorous Comparative Benchmark)
4. What-If Simulator (Hypothetical Member Swap)
Across all 3 projects: PRJ-101 (proj-1), PRJ-102 (proj-2), PRJ-103 (proj-3).
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

PROJECT_IDS = ["PRJ-101", "PRJ-102", "PRJ-103", "proj-1", "proj-2", "proj-3"]


def test_e2e_health_and_demo_bundle():
    """Validates health check and demo bundle initialization."""
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "ok"

    demo_res = client.get("/api/demo")
    assert demo_res.status_code == 200
    demo_data = demo_res.json()
    assert len(demo_data["projects"]) >= 3
    assert len(demo_data["employees"]) >= 5


@pytest.mark.parametrize("project_id", PROJECT_IDS)
def test_e2e_view_1_candidate_rankings(project_id):
    """View 1: Validates candidate ranking endpoint for every project."""
    # Test via GET alias
    res_get = client.get(f"/api/projects/{project_id}/matches")
    assert res_get.status_code == 200
    matches_list = res_get.json()
    assert isinstance(matches_list, list)
    assert len(matches_list) > 0

    top_candidate = matches_list[0]
    assert "employee_id" in top_candidate
    assert "overall_score" in top_candidate
    assert 0.0 <= top_candidate["overall_score"] <= 100.0
    assert "component_scores" in top_candidate
    cs = top_candidate["component_scores"]
    assert 0.0 <= cs["skill_fit"] <= 1.0
    assert 0.0 <= cs["experience_fit"] <= 1.0
    assert 0.0 <= cs["availability_fit"] <= 1.0
    assert 0.0 <= cs["interest_fit"] <= 1.0

    # Test via POST canonical endpoint
    res_post = client.post("/api/matches", json={"project_id": project_id})
    assert res_post.status_code == 200
    post_data = res_post.json()
    assert len(post_data["matches"]) == len(matches_list)


@pytest.mark.parametrize("project_id", PROJECT_IDS)
def test_e2e_view_2_team_builder_optimization(project_id):
    """View 2: Validates combinatorial team optimization recommendation."""
    res = client.post(f"/api/projects/{project_id}/recommend-team")
    assert res.status_code == 200
    team = res.json()
    assert "members" in team
    assert len(team["members"]) >= 2
    assert "weighted_coverage_pct" in team
    assert 0.0 <= team["weighted_coverage_pct"] <= 100.0
    assert "covered_skills" in team
    assert "critical_gaps" in team
    assert team["is_feasible"] is True

    # Check member structure
    first_member = team["members"][0]
    assert "id" in first_member
    assert "name" in first_member
    assert "skills" in first_member


@pytest.mark.parametrize("project_id", PROJECT_IDS)
def test_e2e_view_3_baseline_vs_optimizer_comparison(project_id):
    """View 3: Validates fair side-by-side comparison benchmark."""
    res = client.post(f"/api/projects/{project_id}/compare")
    assert res.status_code == 200
    comp = res.json()
    assert "baseline" in comp
    assert "optimized" in comp
    assert "deltas" in comp
    assert "evaluation_notes" in comp

    baseline = comp["baseline"]
    optimized = comp["optimized"]
    deltas = comp["deltas"]

    # Optimizer should achieve at least equal or higher weighted skill coverage than naive baseline
    assert optimized["weighted_coverage_pct"] >= baseline["weighted_coverage_pct"]
    assert len(optimized["critical_gaps"]) <= len(baseline["critical_gaps"])
    assert "coverage_pct_delta" in deltas or "weighted_coverage_pct_delta" in deltas


def test_e2e_view_4_what_if_simulator_swap():
    """View 4: Validates What-If Simulator with actual member substitution."""
    # 1. Get optimized team for PRJ-101
    team_res = client.post("/api/projects/PRJ-101/recommend-team")
    assert team_res.status_code == 200
    team = team_res.json()
    member_ids = [m["id"] for m in team["members"]]
    assert len(member_ids) >= 3

    # Swap out member 2 for candidate EMP-004
    remove_id = member_ids[1]
    add_id = "EMP-004" if remove_id != "EMP-004" else "EMP-002"

    swap_payload = {
        "project_id": "PRJ-101",
        "current_team_ids": member_ids,
        "remove_employee_id": remove_id,
        "add_employee_id": add_id,
    }

    swap_res = client.post("/api/simulate/swap", json=swap_payload)
    assert swap_res.status_code == 200
    result = swap_res.json()
    assert result["valid"] is True
    assert "before" in result
    assert "after" in result
    assert "deltas" in result
    assert "impact_summary" in result
    assert len(result["impact_summary"]) > 0

    # Ensure member replacement is reflected in the after roster
    after_ids = [m["id"] for m in result["after"]["members"]]
    assert remove_id not in after_ids
    assert add_id in after_ids
