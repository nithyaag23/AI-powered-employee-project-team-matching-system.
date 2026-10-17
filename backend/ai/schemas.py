"""
Schema Bridge for SkillSync AI AI Module
-----------------------------------------
Attempts to import canonical shared schemas owned by Person 3 from `backend.schemas.shared`.
If Person 3 has not yet added them to the shared repository, falls back cleanly to the
internal provisional schemas in `backend.ai.provisional_schemas`.

This guarantees that:
1. Person 2's AI module does not independently create or overwrite `backend/schemas/shared.py`.
2. As soon as Person 3 merges `backend/schemas/shared.py`, the AI module seamlessly binds to it.
"""

import logging

logger = logging.getLogger("skillsync.ai.schemas")

try:
    # Attempt import of Person 3's canonical shared schemas
    from backend.schemas.shared import (  # type: ignore
        VerificationStatus,
        ProficiencyLevel,
        SkillCategory,
        ExtractedSkill,
        EmployeeProfile,
        ProjectSkillRequirement,
        ProjectRequirement,
        ExtractionMetadata,
        EmployeeExtractionEnvelope,
        ProjectExtractionEnvelope,
    )
    USING_CANONICAL_SCHEMAS = True
    logger.info("Loaded canonical shared schemas from backend.schemas.shared (Person 3).")
except ImportError:
    # Fallback to internal provisional schemas
    from backend.ai.provisional_schemas import (
        VerificationStatus,
        ProficiencyLevel,
        SkillCategory,
        ExtractedSkill,
        EmployeeProfile,
        ProjectSkillRequirement,
        ProjectRequirement,
        ExtractionMetadata,
        EmployeeExtractionEnvelope,
        ProjectExtractionEnvelope,
    )
    USING_CANONICAL_SCHEMAS = False
    logger.info("Using internal provisional schemas from backend.ai.provisional_schemas.")

__all__ = [
    "VerificationStatus",
    "ProficiencyLevel",
    "SkillCategory",
    "ExtractedSkill",
    "EmployeeProfile",
    "ProjectSkillRequirement",
    "ProjectRequirement",
    "ExtractionMetadata",
    "EmployeeExtractionEnvelope",
    "ProjectExtractionEnvelope",
    "USING_CANONICAL_SCHEMAS",
]
