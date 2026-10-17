# SkillSync AI — Backend, Matching, Optimization & Integration

Core deterministic backend, canonical schemas, match scoring engine, team optimizer, baseline comparison, and AI integration adapter for **SkillSync AI**.

Built as part of the **Finite Loop OSS Fest 3-Person Parallel Build Plan**.

---

## Architecture & Ownership Boundaries

| Module | Owner | Purpose |
| :--- | :--- | :--- |
| `backend/schemas/` | **Person 3** | Single source of truth for canonical Pydantic v2 schemas across all 3 modules |
| `backend/matching/` | **Person 3** | Deterministic individual candidate-project match scoring with explicit weight renormalization |
| `backend/optimizer/` | **Person 3** | Combinatorial team selection, skill coverage metrics, Top-N baseline, swap simulation |
| `backend/adapters/` | **Person 3** | Thin decoupled adapter integrating Person 2's AI module with rule-based fallback |
| `backend/api/` | **Person 3** | High-performance FastAPI routes with CORS and standardized error formats |
| `backend/data/` | **Person 3** | Deterministic synthetic seed dataset (`seed.json`) enabling zero-credential demo runs |
| `backend/tests/` | **Person 3** | Automated pytest suite testing scoring, constraints, optimization, and API contracts |
| `docs/API_CONTRACT.md` | **Person 3** | Canonical shared API specification locked across frontend, AI, and backend |

---

## Quickstart & Local Setup

### 1. Requirements
- Python 3.10+ (Tested on Python 3.14)
- Packages: `fastapi`, `uvicorn`, `pydantic`, `pytest`, `httpx`

Install dependencies:
```bash
python -m pip install -r requirements.txt
```

### 2. Run Backend Server
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger documentation will be available at:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 3. Run Test Suite
```bash
python -m pytest backend/tests -v
```

---

## Canonical Scoring Formula
$$\text{Overall Match} = 100 \times (0.55 \times \text{SkillFit} + 0.20 \times \text{ExperienceFit} + 0.15 \times \text{AvailabilityFit} + 0.10 \times \text{InterestFit})$$

### Missing Data Policy
1. Missing information is **never** silently treated as 1.0 (perfect score).
2. If `experience_years` is missing, `ExperienceFit` is omitted and the active weights ($0.55 + 0.15 + 0.10 = 0.80$) are dynamically renormalized with a disclosure warning in `warnings`.
3. If an employee has no skills, $\text{SkillFit} = 0.0$.
4. Unavailable candidates (`availability <= 0.0`) are excluded from staffing eligibility.

---

## Baseline vs. Optimizer Comparison
- **Top-N Baseline:** Greedily picks the top $N$ individually ranked candidates by `overall_score`.
- **Combinatorial Optimizer:** Maximizes weighted required skill coverage:
  $$\text{Objective} = 1000 \times \text{WeightedCoverage} + 10 \times \text{TeamFit} - 2 \times \text{Redundancy}$$
- **Equal Footing Evaluation:** Both teams are passed to the identical `evaluate_team_metrics()` function. All comparison deltas are calculated directly from real outputs.

