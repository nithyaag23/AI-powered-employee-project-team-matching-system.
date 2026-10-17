"""
Integration tests for FastAPI application and API routes.
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "app_version" in data


def test_demo_endpoint():
    response = client.get("/api/demo")
    assert response.status_code == 200
    data = response.json()
    assert "projects" in data
    assert "employees" in data
    assert len(data["projects"]) >= 2
    assert len(data["employees"]) >= 5


def test_skills_extract_endpoint():
    payload = {
        "profile_text": "Senior Software Architect with 8 years of Python, FastAPI, and Kubernetes experience."
    }
    response = client.post("/api/skills/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "skills" in data
    assert data["extracted_count"] >= 2
    skill_names = [s["name"] for s in data["skills"]]
    assert "Python" in skill_names
    assert "FastAPI" in skill_names


def test_projects_analyze_endpoint():
    payload = {
        "name": "Cloud Portal",
        "description": "Staffing a team to build a React and Python cloud management portal with Kubernetes.",
        "team_size": 3,
    }
    response = client.post("/api/projects/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "project" in data
    proj = data["project"]
    assert proj["name"] == "Cloud Portal"
    assert proj["team_size"] == 3
    assert len(proj["required_skills"]) >= 2


def test_matches_endpoint():
    payload = {
        "project_id": "PRJ-101"
    }
    response = client.post("/api/matches", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == "PRJ-101"
    assert "matches" in data
    assert len(data["matches"]) > 0
    # First match should have valid score
    top_match = data["matches"][0]
    assert 0.0 <= top_match["overall_score"] <= 100.0
    assert "component_scores" in top_match


def test_teams_optimize_endpoint():
    payload = {
        "project_id": "PRJ-101"
    }
    response = client.post("/api/teams/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "members" in data
    assert data["team_size"] == 3
    assert data["is_feasible"] is True
    assert 0.0 <= data["weighted_coverage_pct"] <= 100.0
    assert "covered_skills" in data


def test_teams_compare_endpoint():
    payload = {
        "project_id": "PRJ-101"
    }
    response = client.post("/api/teams/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "optimized" in data
    assert "deltas" in data
    assert "evaluation_notes" in data
    assert len(data["evaluation_notes"]) > 0


def test_simulate_swap_endpoint():
    payload = {
        "project_id": "PRJ-101",
        "current_team_ids": ["EMP-001", "EMP-002", "EMP-006"],
        "remove_employee_id": "EMP-002",
        "add_employee_id": "EMP-005",
    }
    response = client.post("/api/simulate/swap", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert "before" in data
    assert "after" in data
    assert "deltas" in data
    assert len(data["impact_summary"]) > 0


def test_error_handling_not_found():
    response = client.post("/api/matches", json={"project_id": "PRJ-DOES-NOT-EXIST"})
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert "detail" in data
    assert data["status_code"] == 404


def test_defensive_string_skill_coercion():
    """Verify that passing plain strings for skills is automatically coerced to SkillEvidence."""
    payload = {
        "project": {
            "id": "PRJ-CUSTOM",
            "name": "Custom Dynamic Project",
            "description": "Testing dynamic string skills",
            "required_skills": ["Python", "FastAPI"],  # Plain strings!
            "team_size": 2,
        },
        "candidate_pool": [
            {
                "id": "EMP-STR-1",
                "name": "String Skills Candidate",
                "skills": ["Python", "FastAPI"],  # Plain strings!
                "experience_years": 4.0,
                "availability": 1.0,
                "interests": ["Python"],
            }
        ],
    }
    response = client.post("/api/matches", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["matches"]) == 1
    assert data["matches"][0]["overall_score"] > 0.0


def test_invalid_input_validation_error():
    """Verify FastAPI returns 422 Unprocessable Entity when required fields are missing."""
    # missing profile_text
    response = client.post("/api/skills/extract", json={})
    assert response.status_code == 422

