"""Adapters package for SkillSync AI."""
from backend.adapters.ai_adapter import (
    extract_skills_from_text,
    analyze_project_text,
    rule_based_extract_skills,
    rule_based_analyze_project,
)

__all__ = [
    "extract_skills_from_text",
    "analyze_project_text",
    "rule_based_extract_skills",
    "rule_based_analyze_project",
]
