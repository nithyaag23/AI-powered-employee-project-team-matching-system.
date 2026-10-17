# SkillSync AI — Canonical Shared API Contract & Schema Specification

**Document Version:** 1.0.0 (Contract Lock)  
**Owner:** Person 3 (Backend, Matching, Optimization & Integration)  
**Stakeholders:** Person 1 (Frontend UI), Person 2 (AI Extraction), Person 3 (Backend Core)  
**Status:** **LOCKED & CANONICAL** (Do not alter field names or response structures without cross-team approval).

---

## 1. Overview & System Principles

SkillSync AI integrates frontend workflows, AI-driven unstructured resume/project extraction, and a deterministic staffing optimizer. To enable parallel development without coupling or regressions:

1. **Deterministic Core:** Match scoring, skill coverage, team optimization, baseline ranking, and swap simulation are 100% deterministic, repeatable, and independent of AI model providers.
2. **Defensive Ingestion:** Pydantic validators accommodate string representations (e.g. `["Python", "FastAPI"]`) alongside fully structured objects, preventing schema validation failures during early integration.
3. **No Silent Perfect Scores:** Missing data is never treated as a 1.0 (100%) score. Missing values trigger explicit weight renormalization or a zero score, accompanied by explanatory disclosure warnings.
4. **Equal Footing Baseline:** The Top-$N$ individual-ranking baseline and the combinatorial team optimizer use identical candidate pools, identical constraints, and the identical metric evaluation function. Measured deltas are computed arithmetically—never hardcoded.

---

## 2. Canonical Enumerations & Field Value Mappings

### 2.1 `SkillLevel`
Proficiency level assigned to a candidate's skill or required by a project.
- `"beginner"` (continuous value: `0.50`)
- `"intermediate"` (continuous value: `0.80`)
- `"advanced"` (continuous value: `1.00`)
- `"unknown"` (continuous value: `0.35`)

### 2.2 `VerificationStatus`
Provenance of the skill claim:
- `"verified"`: Validated via assessment, verified credential, or repository proof.
- `"unverified"`: Self-reported on profile/resume.
- `"unknown"`: Unspecified origin.

---

## 3. Core Domain Entities

### 3.1 `SkillEvidence`
```json
{
  "name": "Python",
  "level": "advanced",
  "evidence": "8 years production experience architecting microservices; PyCon speaker",
  "verification_status": "verified",
  "confidence": 0.95
}
```

### 3.2 `RequiredSkill`
```json
{
  "name": "Python",
  "min_level": "intermediate",
  "weight": 2.0,
  "critical": true
}
```

### 3.3 `Employee`
```json
{
  "id": "EMP-001",
  "name": "Alice Chen",
  "title": "Principal Backend Architect",
  "skills": [
    {
      "name": "Python",
      "level": "advanced",
      "evidence": "8 years microservices",
      "verification_status": "verified",
      "confidence": 0.95
    },
    {
      "name": "FastAPI",
      "level": "advanced",
      "evidence": "Built high-throughput trading APIs",
      "verification_status": "verified",
      "confidence": 0.90
    },
    {
      "name": "PostgreSQL",
      "level": "advanced",
      "evidence": "Query optimization and partitioning",
      "verification_status": "verified",
      "confidence": 0.88
    }
  ],
  "experience_years": 8.5,
  "availability": 1.0,
  "interests": ["Distributed Systems", "Cloud Architecture", "Fintech"]
}
```
*Note on `availability`:* Normalized to float `0.0` (unavailable) to `1.0` (full-time). Defensive validators accept percentages (`100` -> `1.0`) or weekly hours (`40` -> `1.0`, `20` -> `0.5`).

### 3.4 `Project`
```json
{
  "id": "PRJ-101",
  "name": "NextGen Cloud-Native Platform",
  "description": "Fullstack enterprise platform requiring distributed backend, responsive UI, and Kubernetes deployment.",
  "required_skills": [
    {"name": "Python", "min_level": "advanced", "weight": 2.0, "critical": true},
    {"name": "FastAPI", "min_level": "intermediate", "weight": 1.5, "critical": false},
    {"name": "React", "min_level": "intermediate", "weight": 2.0, "critical": true},
    {"name": "Kubernetes", "min_level": "intermediate", "weight": 2.0, "critical": true},
    {"name": "PostgreSQL", "min_level": "intermediate", "weight": 1.5, "critical": false}
  ],
  "team_size": 3,
  "availability_window": "Q3 2026",
  "min_experience_years": 4.0
}
```

---

## 4. Scoring Formula & Missing Data Policy

### 4.1 Agreed Scoring Formula
For candidate $e$ and project $p$:
$$\text{Overall Match Score} = 100 \times \left(0.55 \times \text{SkillFit} + 0.20 \times \text{ExperienceFit} + 0.15 \times \text{AvailabilityFit} + 0.10 \times \text{InterestFit}\right)$$

Where each component is bounded in $[0.0, 1.0]$:
1. **$\text{SkillFit}$ ($0.55$ weight):**
   $$\text{SkillFit} = \frac{\sum_{j \in \text{RequiredSkills}} w_j \cdot \text{Capability}(e, s_j)}{\sum_{j \in \text{RequiredSkills}} w_j}$$
   Where $\text{Capability}(e, s_j) = \min\left(1.0, \frac{\text{LevelWeight}(e.s_j)}{\text{LevelWeight}(p.s_j)}\right)$. If skill is verified, a $+0.05$ bonus is added (capped at $1.0$). If unpossessed, capability is $0.0$.
2. **$\text{ExperienceFit}$ ($0.20$ weight):**
   $$\text{ExperienceFit} = \min\left(1.0, \frac{\max(0, e.\text{experience\_years})}{\max(1.0, p.\text{min\_experience\_years})}\right)$$
3. **$\text{AvailabilityFit}$ ($0.15$ weight):**
   $$\text{AvailabilityFit} = e.\text{availability}$$
4. **$\text{InterestFit}$ ($0.10$ weight):**
   Keyword and semantic overlap between candidate's `interests` and project's `description` + `name`.

### 4.2 Missing Data Policy (No Silent 1.0s)
1. **Missing Experience:** If `experience_years is None`, `ExperienceFit` is omitted. The remaining active weights ($0.55 + 0.15 + 0.10 = 0.80$) are renormalized:
   $$w_{\text{skill}}' = \frac{0.55}{0.80} = 0.6875, \quad w_{\text{avail}}' = \frac{0.15}{0.80} = 0.1875, \quad w_{\text{interest}}' = \frac{0.10}{0.80} = 0.1250$$
   A warning is added: `"experience_years is missing; ExperienceFit omitted and remaining weights renormalized."`
2. **Missing Skills / No Overlap:** Evaluated as $\text{SkillFit} = 0.0$. It is **not** omitted because the candidate genuinely has no matching skills.
3. **Project Has No Required Skills:** `SkillFit` is omitted; remaining weights renormalized; warning flagged.
4. **Missing Interests:** Evaluated as $\text{InterestFit} = 0.0$.

---

## 5. Team Skill Coverage, Hard Constraints & Optimization

### 5.1 Skill Coverage Status
For team $T = \{e_1, \dots, e_k\}$ and required skill $s_j$:
$$\text{TeamCapability}(T, s_j) = \max_{e \in T} \text{Capability}(e, s_j)$$

- **Covered:** $\text{TeamCapability}(T, s_j) \ge 0.80$ (at least one member satisfies or exceeds required competency).
- **Partially Covered:** $0.25 \le \text{TeamCapability}(T, s_j) < 0.80$ (junior or unverified coverage).
- **Uncovered / Missing:** $\text{TeamCapability}(T, s_j) < 0.25$.
- **Critical Gap:** Any skill with `critical == true` that is NOT fully covered ($\text{TeamCapability} < 0.80$).

### 5.2 Weighted Coverage Percentage
$$\text{Weighted Coverage \%} = 100 \times \frac{\sum_{j} w_j \cdot \min(1.0, \text{TeamCapability}(T, s_j))}{\sum_{j} w_j}$$

### 5.3 Hard Constraints
1. **Team Size:** Team must contain exactly $N$ members ($N = \text{project.team\_size}$). If candidate pool contains fewer than $N$ eligible candidates, `is_feasible = false` and violation is recorded.
2. **No Duplicates:** Candidate IDs must be strictly unique within the team.
3. **Availability:** Candidates with `availability <= 0.0` are excluded from selection.
4. **Whitelisted IDs:** If `eligible_employee_ids` is specified, only members of that list are eligible.

### 5.4 Team Optimization Objective
The optimizer maximizes:
$$\text{Objective} = 1000 \times \text{WeightedCoverage} + 10 \times \left(\frac{\text{TeamFit}}{100}\right) - 2 \times \text{RedundancyPenalty}$$
- $1000 \times \text{WeightedCoverage}$ guarantees skill coverage strictly dominates individual fit.
- $\text{TeamFit}$ acts as a secondary tie-breaker.
- Redundancy penalty disfavors stacking multiple senior members on the same skill when other required skills remain uncovered.

---

## 6. Baseline vs. Optimizer Evaluation Protocol

1. **Baseline Method:** Greedily picks the top $N$ individually ranked eligible candidates by `overall_score`.
2. **Optimizer Method:** Evaluates team combinations to maximize collective weighted coverage and eliminate critical gaps.
3. **Identical Metric Evaluation:** Both teams are passed to `evaluate_team_metrics(members, project)` which computes:
   - `weighted_coverage_pct`
   - `covered_skills`, `partial_skills`, `critical_gaps`
   - `team_fit_score`
   - `redundancy_score`
   - `constraint_violations`
4. **Calculated Deltas:**
   - `weighted_coverage_pct_delta = optimized.weighted_coverage_pct - baseline.weighted_coverage_pct`
   - `team_fit_score_delta = optimized.team_fit_score - baseline.team_fit_score`
   - `critical_gaps_reduced = len(baseline.critical_gaps) - len(optimized.critical_gaps)`
   - `covered_skills_count_delta = len(optimized.covered_skills) - len(baseline.covered_skills)`

---

## 7. API Endpoints Specification

### 7.1 `GET /api/health`
**Request:** None  
**Response (200 OK):**
```json
{
  "status": "ok",
  "app_version": "1.0.0"
}
```

---

### 7.2 `GET /api/demo`
**Request:** None  
**Response (200 OK):**
```json
{
  "projects": [
    {
      "id": "PRJ-101",
      "name": "Cloud Native Platform",
      "description": "Enterprise cloud platform requiring Python backend, React frontend, and Kubernetes orchestration.",
      "required_skills": [
        {"name": "Python", "min_level": "advanced", "weight": 2.0, "critical": true},
        {"name": "FastAPI", "min_level": "intermediate", "weight": 1.5, "critical": false},
        {"name": "React", "min_level": "intermediate", "weight": 2.0, "critical": true},
        {"name": "Kubernetes", "min_level": "intermediate", "weight": 2.0, "critical": true},
        {"name": "PostgreSQL", "min_level": "intermediate", "weight": 1.5, "critical": false}
      ],
      "team_size": 3,
      "availability_window": "Q3 2026",
      "min_experience_years": 4.0
    }
  ],
  "employees": [
    {
      "id": "EMP-001",
      "name": "Alice Chen",
      "title": "Principal Backend Architect",
      "skills": [
        {"name": "Python", "level": "advanced", "evidence": "8 yrs microservices", "verification_status": "verified", "confidence": 0.95},
        {"name": "FastAPI", "level": "advanced", "evidence": "Production APIs", "verification_status": "verified", "confidence": 0.92},
        {"name": "PostgreSQL", "level": "advanced", "evidence": "Partitioning & tuning", "verification_status": "verified", "confidence": 0.90}
      ],
      "experience_years": 8.0,
      "availability": 1.0,
      "interests": ["Distributed Systems", "Cloud Architecture"]
    }
  ]
}
```

---

### 7.3 `POST /api/skills/extract`
Extracts normalized skills and evidence from raw resume/profile text. Calls Person 2 AI module via thin adapter, with reliable rule-based fallback when AI credentials are absent.

**Request:**
```json
{
  "profile_text": "Senior Software Engineer with 7 years of Python, FastAPI, Docker, and Kubernetes deployment experience. Familiar with AWS cloud architectures."
}
```
**Response (200 OK):**
```json
{
  "skills": [
    {
      "name": "Python",
      "level": "advanced",
      "evidence": "Senior Software Engineer with 7 years of Python",
      "verification_status": "unverified",
      "confidence": 0.92
    },
    {
      "name": "FastAPI",
      "level": "intermediate",
      "evidence": "FastAPI, Docker, and Kubernetes deployment experience",
      "verification_status": "unverified",
      "confidence": 0.88
    },
    {
      "name": "Kubernetes",
      "level": "intermediate",
      "evidence": "Kubernetes deployment experience",
      "verification_status": "unverified",
      "confidence": 0.85
    }
  ],
  "extracted_count": 3,
  "warnings": []
}
```

---

### 7.4 `POST /api/projects/analyze`
Extracts structured project requirements, required skills, weights, and team size from a statement of work.

**Request:**
```json
{
  "description": "We need a team of 3 engineers to build a real-time analytics dashboard with React, FastAPI backend, and Kubernetes deployment.",
  "name": "Analytics Dashboard",
  "team_size": 3
}
```
**Response (200 OK):**
```json
{
  "project": {
    "id": "PRJ-GEN-01",
    "name": "Analytics Dashboard",
    "description": "We need a team of 3 engineers to build a real-time analytics dashboard with React, FastAPI backend, and Kubernetes deployment.",
    "required_skills": [
      {"name": "React", "min_level": "intermediate", "weight": 2.0, "critical": true},
      {"name": "FastAPI", "min_level": "intermediate", "weight": 1.5, "critical": false},
      {"name": "Kubernetes", "min_level": "intermediate", "weight": 2.0, "critical": true}
    ],
    "team_size": 3,
    "availability_window": null,
    "min_experience_years": 3.0
  },
  "warnings": []
}
```

---

### 7.5 `POST /api/matches`
Computes deterministic individual match scores for candidates against a project.

**Request:**
```json
{
  "project_id": "PRJ-101"
}
```
*Or with explicit objects:*
```json
{
  "project": { ... },
  "candidate_pool": [ ... ]
}
```
**Response (200 OK):**
```json
{
  "project_id": "PRJ-101",
  "matches": [
    {
      "employee_id": "EMP-001",
      "employee_name": "Alice Chen",
      "overall_score": 91.5,
      "component_scores": {
        "skill_fit": 0.87,
        "experience_fit": 1.0,
        "availability_fit": 1.0,
        "interest_fit": 0.80
      },
      "reasons": [
        "Advanced proficiency in Python, FastAPI, PostgreSQL",
        "8.0 years experience exceeds 4.0 year project baseline",
        "Full-time availability"
      ],
      "warnings": []
    }
  ],
  "total_candidates": 8,
  "eligible_candidates": 7
}
```

---

### 7.6 `POST /api/teams/optimize`
Selects an optimal team maximizing weighted skill coverage.

**Request:**
```json
{
  "project_id": "PRJ-101"
}
```
**Response (200 OK):**
```json
{
  "members": [
    {"id": "EMP-001", "name": "Alice Chen", ...},
    {"id": "EMP-004", "name": "Dana Vance", ...},
    {"id": "EMP-005", "name": "Evan Wright", ...}
  ],
  "team_size": 3,
  "weighted_coverage_pct": 100.0,
  "covered_skills": ["Python", "FastAPI", "React", "Kubernetes", "PostgreSQL"],
  "partial_skills": [],
  "critical_gaps": [],
  "team_fit_score": 83.2,
  "redundancy_score": 0.15,
  "constraint_violations": [],
  "objective_value": 100817.0,
  "is_feasible": true,
  "warnings": []
}
```

---

### 7.7 `POST /api/teams/compare`
Executes both the Top-$N$ baseline and the team optimizer on the same inputs and returns side-by-side metrics and calculated deltas.

**Request:**
```json
{
  "project_id": "PRJ-101"
}
```
**Response (200 OK):**
```json
{
  "baseline": {
    "members": [
      {"id": "EMP-001", "name": "Alice Chen"},
      {"id": "EMP-002", "name": "Bob Martinez"},
      {"id": "EMP-003", "name": "Charlie Davis"}
    ],
    "team_size": 3,
    "weighted_coverage_pct": 55.6,
    "covered_skills": ["Python", "FastAPI", "PostgreSQL"],
    "partial_skills": [],
    "critical_gaps": ["React", "Kubernetes"],
    "team_fit_score": 88.4,
    "redundancy_score": 0.85,
    "constraint_violations": [],
    "objective_value": 55685.0,
    "is_feasible": true,
    "warnings": []
  },
  "optimized": {
    "members": [
      {"id": "EMP-001", "name": "Alice Chen"},
      {"id": "EMP-004", "name": "Dana Vance"},
      {"id": "EMP-005", "name": "Evan Wright"}
    ],
    "team_size": 3,
    "weighted_coverage_pct": 100.0,
    "covered_skills": ["Python", "FastAPI", "React", "Kubernetes", "PostgreSQL"],
    "partial_skills": [],
    "critical_gaps": [],
    "team_fit_score": 83.2,
    "redundancy_score": 0.15,
    "constraint_violations": [],
    "objective_value": 100817.0,
    "is_feasible": true,
    "warnings": []
  },
  "deltas": {
    "weighted_coverage_pct_delta": 44.4,
    "team_fit_score_delta": -5.2,
    "critical_gaps_reduced": 2,
    "covered_skills_count_delta": 2
  },
  "evaluation_notes": [
    "Baseline selected 3 senior backend engineers with high individual fit scores, leaving React and Kubernetes uncovered (2 critical gaps).",
    "Optimizer prioritized skill complementarity: added Dana Vance (React) and Evan Wright (Kubernetes), achieving 100.0% coverage.",
    "Measured coverage increased by +44.4% and reduced critical gaps from 2 to 0."
  ]
}
```

---

### 7.8 `POST /api/simulate/swap`
Evaluates a hypothetical member substitution on an active team, validating eligibility and recalculating full metrics.

**Request:**
```json
{
  "project_id": "PRJ-101",
  "current_team_ids": ["EMP-001", "EMP-002", "EMP-003"],
  "remove_employee_id": "EMP-003",
  "add_employee_id": "EMP-004"
}
```
**Response (200 OK):**
```json
{
  "valid": true,
  "before": {
    "members": [...],
    "weighted_coverage_pct": 55.6,
    "critical_gaps": ["React", "Kubernetes"],
    ...
  },
  "after": {
    "members": [...],
    "weighted_coverage_pct": 77.8,
    "critical_gaps": ["Kubernetes"],
    ...
  },
  "deltas": {
    "weighted_coverage_pct_delta": 22.2,
    "team_fit_score_delta": -3.1,
    "critical_gaps_reduced": 1,
    "covered_skills_count_delta": 1
  },
  "impact_summary": [
    "Replacing Charlie Davis with Dana Vance resolved critical gap 'React'.",
    "Weighted coverage increased by +22.2% (55.6% -> 77.8%).",
    "Critical gap 'Kubernetes' remains uncovered."
  ],
  "warnings": []
}
```

---

### 7.9 Standard Error Response Format
All 4xx and 5xx responses conform to this shape:
```json
{
  "error": "ResourceNotFound",
  "detail": "Project with id 'PRJ-999' was not found in registered seed data.",
  "error_code": "ERR_PROJECT_NOT_FOUND",
  "status_code": 404
}
```

---

## 8. Integration Protocol for Person 1 (UI) and Person 2 (AI)

1. **For Person 1 (Frontend UI):**
   - Use the field names shown above. All IDs (`id`, `employee_id`, `project_id`) are strings.
   - All scores (`overall_score`, `weighted_coverage_pct`, `team_fit_score`) are numbers on a scale of `0` to `100`. Component scores (`skill_fit`, `experience_fit`, `availability_fit`, `interest_fit`) are fractions from `0.0` to `1.0`.
   - Seed data is immediately available via `GET /api/demo`.
2. **For Person 2 (AI Extraction):**
   - Provide your extraction function in `backend/adapters/ai_adapter.py` (or your dedicated module).
   - Expected return format: list of `SkillEvidence` objects or dictionaries matching:
     `{"name": str, "level": str, "evidence": Optional[str], "verification_status": str, "confidence": Optional[float]}`.
   - The backend includes deterministic regex/rule-based fallback when AI credentials (`GEMINI_API_KEY`, etc.) are absent.
