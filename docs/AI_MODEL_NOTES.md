# SkillSync AI â€” AI Model Architecture, Verification & Evaluation Notes
**Author**: Person 2 (AI and Profile Intelligence Developer)
**Branch**: `feature/ai-extraction`
**Date**: October 2026

---

## 1. Executive Summary & Module Scope
The **AI Extraction Module** in SkillSync AI is responsible for transforming unstructured natural language documents (resumes, employee profiles, project scopes) into validated, structured Pydantic models with explicit evidence trails.

### Strict Architectural Boundaries:
- **Separation of Concerns**: The AI module only extracts, classifies, and verifies evidence. It **never** computes final candidate match scores or selects optimal project teams. All matching algorithms and optimization are owned by **Person 3** (Deterministic Backend/Optimizer).
- **Zero Hallucination / Verifiable Evidence Policy**: No skill may claim `VERIFIED` status without verifiable verbatim evidence quoted from work experience or project bullets. Unsubstantiated skills in buzzword lists are explicitly marked `UNVERIFIED` with `evidence = None`.
- **Fair Hiring & Zero Demographic Bias**: Protected personal characteristics (age, date of birth, gender, race, nationality, religion, disability, marital status) are excluded from candidate profile models and extraction logic.
- **Untrusted Input Protection**: Input documents are treated as untrusted strings, wrapped in passive `<UNTRUSTED_DOCUMENT>` blocks, and sanitized against prompt injections and system override instructions.

---

## 2. Model & Provider Evaluation

### Primary Cloud Model Proposed: Google Gemini 1.5 Flash / 2.0 Flash
* **Model IDs**: `gemini-1.5-flash` (standard production), `gemini-2.0-flash` (next-gen fast inference).
* **Generation Speed & Latency**: Typical generation latency ~300msâ€“500ms; well within the 15-second interactive budget.
* **Structured Output Support**: Native support for `generationConfig.response_mime_type: "application/json"`.
* **Context Window**: 1,000,000 tokens (1M), allowing whole multi-page resumes and dense project scopes without truncation.

### Official API Quotas & Terms Verification:
* **Free Tier Quotas**:
  * **RPM (Requests Per Minute)**: 15
  * **TPM (Tokens Per Minute)**: 1,000,000
  * **RPD (Requests Per Day)**: 1,500
* **Data Governance & Privacy**:
  * On Google AI Studio **Free Tier**, prompt data and responses may be reviewed by human reviewers and used to improve Google products.
  * On Google AI Studio **Paid Tier** (or Vertex AI), data is **not** logged or used to train models.
* **API Key Security**: Loaded strictly from `GEMINI_API_KEY` in environment variables. Never hardcoded, committed to Git, or exposed to the frontend.

---

## 3. UNCONFIRMED Items & Verification Gaps

> [!WARNING] The following items cannot be fully verified without official event guidelines and must be treated as **UNCONFIRMED**:
1. **Hackathon Event Model Eligibility Rules (UNCONFIRMED)**:
   * Whether the hackathon organizers permit external proprietary cloud APIs (Google Gemini, OpenAI GPT-4o) or mandate strictly local/open-weight models (Llama 3, Mistral, Ollama) is **unconfirmed**.
2. **Network / Offline Evaluation Rules (UNCONFIRMED)**:
   * Whether the final judging environment guarantees reliable outbound internet connectivity is **unconfirmed**.
3. **Data Confidentiality Policy (UNCONFIRMED)**:
   * If judges test with confidential employee data, using Google AI Studio's Free Tier may violate data governance rules (due to Google's product improvement clause on free tier prompts).

### Fallback Guarantee:
Because of these unconfirmed items, the system **does not depend on any single provider**. SkillSync AI includes a zero-dependency, 100% offline `DeterministicFallbackProvider` that activates automatically whenever:
* `GEMINI_API_KEY` is omitted or unconfigured.
* `FORCE_FALLBACK=true` is set.
* Outbound network connectivity drops or timeouts occur.
* API quotas (`429 RESOURCE_EXHAUSTED`) are exceeded.

---

## 4. Provider Comparison Matrix

| Model / Provider | License / Terms | Free Tier / Availability | Offline Capable | Status & Eligibility Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Google Gemini 1.5 Flash** | Google Cloud Generative AI Terms | 15 RPM, 1M TPM, 1,500 RPD | No (Cloud API) | **Verified technical capabilities; Hackathon event eligibility UNCONFIRMED.** |
| **OpenAI GPT-4o-mini** | Commercial API Terms | Pay-as-you-go | No (Cloud API) | Requires paid credits. Data not trained on API inputs. |
| **Meta Llama 3 8B Instruct** | Llama 3 Community License | Free weights | Yes (via Ollama/vLLM) | Open-weight (custom license). Requires local GPU (8GB+ VRAM). |
| **SkillSync Deterministic Fallback** | Repository License | 100% Free, Built-in | **Yes (100% Offline)** | **Confirmed & Verified**: Zero latency, zero external calls, 100% uptime on any machine. |

---

## 5. Coordination with Teammates

### A. Person 3 (Deterministic Backend / Optimizer)
* **Schema Bridge (`backend/ai/schemas.py`)**:
  * Person 2 does **not** create or overwrite `backend/schemas/shared.py`.
  * Temporary internal models live in `backend/ai/provisional_schemas.py`.
  * When Person 3 introduces `backend/schemas/shared.py`, the AI module's bridge automatically imports the canonical schemas without breaking any code.
* **Provisional Schemas Defined**:
  * `VerificationStatus`: `VERIFIED`, `UNVERIFIED`, `INFERRED`, `UNKNOWN`
  * `ProficiencyLevel`: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`
  * `SkillCategory`: `TECHNICAL`, `FRAMEWORK_OR_TOOL`, `DATABASE`, `DEVOPS_CLOUD`, `SOFT_SKILL`, `DOMAIN_KNOWLEDGE`
  * `ExtractedSkill`: `name`, `category`, `proficiency`, `years_of_experience`, `verification_status`, `evidence`, `confidence_score`
  * `EmployeeProfile`: `id`, `full_name`, `current_title`, `total_years_experience`, `skills`, `certifications`, `summary`
  * `ProjectSkillRequirement`: `name`, `minimum_proficiency`, `is_mandatory`, `weight`
  * `ProjectRequirement`: `id`, `title`, `description`, `domain`, `target_team_size`, `required_skills`
  * `ExtractionMetadata`: `provider`, `model_version`, `mode`, `latency_ms`, `warnings`, `timestamp`
  * Envelopes: `EmployeeExtractionEnvelope`, `ProjectExtractionEnvelope`

### B. Person 1 (Frontend Developer)
Standardized JSON fixtures matching Person 1's UI components (Evidence Modal, Coverage Matrix, Badges) are provided in `fixtures/`:
1. `fixtures/sample_employee_extraction.json`: Full employee profile with verified quotes, unverified buzzwords, certifications, and metadata.
2. `fixtures/sample_project_extraction.json`: Project requirements with mandatory vs preferred weights.
3. `fixtures/sample_fallback_extraction.json`: Output returned under offline fallback mode.
4. `fixtures/sample_adversarial_extraction.json`: Output showing neutralized prompt injection attempts with logged warnings.

## 6. Prompt Defense & Security Guardrails
All input text is treated as untrusted:
1. **Instruction Neutralization**: Prompt injection directives (e.g., `ignore previous instructions`, `system override`) are detected by regex patterns and sanitized, logging an explicit audit warning.
2. **Evidence Cross-Checking**: The validator strictly enforces that any skill marked `VERIFIED` must contain non-empty verbatim evidence quoted from the source text.
3. **Protected Characteristic Exclusion**: Demographic fields (age, gender, ethnicity, disability, marital status) are absent from profile models to prevent bias during candidate matching.

---

## 7. Integration Guide for Person 3 (FastAPI Backend)
Person 3 can mount the AI extraction service directly into the FastAPI application with zero coupling to external AI SDKs:

```python
from fastapi import APIRouter, Body
from backend.ai import get_extraction_service
from backend.ai.schemas import (
    EmployeeExtractionEnvelope,
    ProjectExtractionEnvelope,
)

extraction_router = APIRouter(prefix="/api/extract", tags=["AI Extraction"])
extraction_service = get_extraction_service()


@extraction_router.post("/resume", response_model=EmployeeExtractionEnvelope)
async def extract_resume(resume_text: str = Body(..., media_type="text/plain")):
    """Extracts candidate skills, experience, and evidence with automatic offline fallback."""
    return await extraction_service.extract_employee_profile(resume_text)


@extraction_router.post("/project", response_model=ProjectExtractionEnvelope)
async def extract_project(project_text: str = Body(..., media_type="text/plain")):
    """Extracts project requirements, taxonomy weights, and team constraints."""
    return await extraction_service.extract_project_requirements(project_text)
```
