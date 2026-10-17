"""
Seed data loader for SkillSync AI.
Loads synthetic employees and projects from backend/data/seed.json.
Guarantees deterministic, reproducible demonstration capability without an external database.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from backend.schemas.models import Employee, Project

_DATA_FILE = Path(__file__).parent / "seed.json"

_CACHED_PROJECTS: Optional[List[Project]] = None
_CACHED_EMPLOYEES: Optional[List[Employee]] = None
_PROJECT_INDEX: Optional[Dict[str, Project]] = None
_EMPLOYEE_INDEX: Optional[Dict[str, Employee]] = None


def load_seed_data(force_reload: bool = False) -> Tuple[List[Project], List[Employee]]:
    """Loads and validates seed projects and employees."""
    global _CACHED_PROJECTS, _CACHED_EMPLOYEES, _PROJECT_INDEX, _EMPLOYEE_INDEX

    if not force_reload and _CACHED_PROJECTS is not None and _CACHED_EMPLOYEES is not None:
        return _CACHED_PROJECTS, _CACHED_EMPLOYEES

    if not _DATA_FILE.exists():
        raise FileNotFoundError(f"Seed data file not found at {_DATA_FILE}")

    with open(_DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    projects = [Project.model_validate(p) for p in data.get("projects", [])]
    employees = [Employee.model_validate(e) for e in data.get("employees", [])]

    _CACHED_PROJECTS = projects
    _CACHED_EMPLOYEES = employees
    _PROJECT_INDEX = {p.id: p for p in projects}
    _EMPLOYEE_INDEX = {e.id: e for e in employees}

    return _CACHED_PROJECTS, _CACHED_EMPLOYEES


def get_seed_projects() -> List[Project]:
    projects, _ = load_seed_data()
    return projects


def get_seed_employees() -> List[Employee]:
    _, employees = load_seed_data()
    return employees


def get_seed_project_by_id(project_id: str) -> Optional[Project]:
    load_seed_data()
    assert _PROJECT_INDEX is not None
    return _PROJECT_INDEX.get(project_id)


def get_seed_employee_by_id(employee_id: str) -> Optional[Employee]:
    load_seed_data()
    assert _EMPLOYEE_INDEX is not None
    return _EMPLOYEE_INDEX.get(employee_id)
