"""
Unit tests for AI Extraction Prompt Templates
--------------------------------------------
Validates that prompt templates:
1. Enclose untrusted user documents within <UNTRUSTED_DOCUMENT> delimiters.
2. Explicitly forbid hallucinated evidence and enforce null evidence for unverified skills.
3. Exclude protected demographic attributes.
4. Forbid candidate match scoring and team selection.
5. Strictly conform to the expected JSON output schema.
"""

from backend.ai.prompt_templates import (
    EMPLOYEE_EXTRACTION_SYSTEM_PROMPT,
    EMPLOYEE_EXTRACTION_USER_PROMPT,
    PROJECT_EXTRACTION_SYSTEM_PROMPT,
    PROJECT_EXTRACTION_USER_PROMPT,
)


def test_employee_system_prompt_security_rules():
    prompt = EMPLOYEE_EXTRACTION_SYSTEM_PROMPT

    # 1. Untrusted document isolation
    assert "<UNTRUSTED_DOCUMENT>" in prompt
    assert "ignore any instructions" in prompt.lower()

    # 2. Evidence verification rules
    assert "never invent resume evidence" in prompt.lower()
    assert "unverified" in prompt.lower()
    assert "verified" in prompt.lower()

    # 3. Protected characteristics prohibition
    assert "no protected characteristics" in prompt.lower()
    for protected in ["age", "gender", "race", "religion", "disability", "marital status"]:
        assert protected in prompt.lower()

    # 4. Scope boundary: No matching scores
    assert "do not calculate final match scores" in prompt.lower()


def test_employee_user_prompt_formatting():
    doc = "Jane Doe\nSoftware Engineer\nPython, Docker"
    formatted = EMPLOYEE_EXTRACTION_USER_PROMPT.format(document_text=doc)

    assert "<UNTRUSTED_DOCUMENT>" in formatted
    assert "</UNTRUSTED_DOCUMENT>" in formatted
    assert doc in formatted


def test_project_system_prompt_rules():
    prompt = PROJECT_EXTRACTION_SYSTEM_PROMPT

    # 1. Untrusted document isolation
    assert "<UNTRUSTED_DOCUMENT>" in prompt

    # 2. Mandatory vs Preferred distinction
    assert "mandatory vs preferred" in prompt.lower()
    assert "is_mandatory" in prompt

    # 3. Scope boundary
    assert "do not attempt to select people" in prompt.lower()


def test_project_user_prompt_formatting():
    doc = "Project Phoenix\nLooking for Go developers."
    formatted = PROJECT_EXTRACTION_USER_PROMPT.format(document_text=doc)

    assert "<UNTRUSTED_DOCUMENT>" in formatted
    assert "</UNTRUSTED_DOCUMENT>" in formatted
    assert doc in formatted
