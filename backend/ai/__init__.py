"""
SkillSync AI - AI and Profile Intelligence Module
-------------------------------------------------
Person 2 Responsibility:
- Resume & profile skill extraction
- Project requirement extraction
- Provider-independent interface
- Deterministic offline fallback engine
- Strict verbatim evidence verification
- Defense against prompt injection
"""

from backend.ai.interface import (
    BaseExtractionProvider,
    ExtractionService,
    get_extraction_service,
)
from backend.ai.fallback import DeterministicFallbackProvider

from backend.ai.prompt_templates import (
    EMPLOYEE_EXTRACTION_SYSTEM_PROMPT,
    EMPLOYEE_EXTRACTION_USER_PROMPT,
    PROJECT_EXTRACTION_SYSTEM_PROMPT,
    PROJECT_EXTRACTION_USER_PROMPT,
)

__all__ = [
    "BaseExtractionProvider",
    "ExtractionService",
    "get_extraction_service",
    "DeterministicFallbackProvider",
    "EMPLOYEE_EXTRACTION_SYSTEM_PROMPT",
    "EMPLOYEE_EXTRACTION_USER_PROMPT",
    "PROJECT_EXTRACTION_SYSTEM_PROMPT",
    "PROJECT_EXTRACTION_USER_PROMPT",
]
