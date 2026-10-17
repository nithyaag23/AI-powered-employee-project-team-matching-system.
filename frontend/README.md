# SkillSync AI — Frontend & Experience Module

**Module Owner:** Person 1 (Frontend Developer)  
**Hackathon:** Finite Loop OSS Fest 2026 — 3-Person Parallel Build Plan  
**Branch:** `feature/frontend`

SkillSync AI is an explainable workforce decision-support platform that matches candidates to projects, evaluates ground-truth skill evidence extracted by open-weight AI, and computes optimal complementary teams using combinatorial optimization.

---

## 🚀 Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS (Dark workforce-analytics visual theme)
- **Icons:** Lucide React
- **Architecture:** Decoupled typed API service layer with automatic mock fallback

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js:** v18+ (verified on Node v24.21.0)
- **npm:** v9+ (verified on npm 11.19.0)

### 2. Environment Configuration
Copy `.env.example` to `.env` (or configure inline):
```bash
# Backend API Base URL (FastAPI)
VITE_API_BASE_URL=http://localhost:8000

# When true, automatically falls back to seeded synthetic fixtures if backend is offline
VITE_ENABLE_MOCK_FALLBACK=true

# Force mock mode completely (true/false)
VITE_FORCE_MOCK=false
```

### 3. Installation & Run
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The application will launch at **`http://localhost:5173`**.

### 4. Production Build & Verification
```bash
# Type check and build bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🔌 API Integration & Dual-Mode Operation

The frontend features a robust typed service layer (`src/services/api.ts`) that guarantees zero-blocking parallel development:

1. **Mock Mode (`VITE_FORCE_MOCK=true` or Backend Offline)**:
   - Uses 15 synthetic employee profiles and 3 realistic project mandates (`src/mocks/demoData.ts`).
   - Every skill has verbatim quoted evidence, source artifacts, and verification status (`verified`, `unverified`, or `unknown`).
   - Ground-truth baseline vs optimizer trade-offs are accurately measured without fabricated numbers.
   - The UI displays a distinct **`Mock Fixture Mode`** badge with details.

2. **Live Backend Mode (`VITE_API_BASE_URL=http://localhost:8000`)**:
   - Integrates directly with Person 3's FastAPI backend.
   - Pings `GET /api/health` to confirm backend readiness and open-weight AI adapter availability.
   - Queries endpoints:
     - `GET /api/health` — Readiness & AI model status
     - `GET /api/demo` or `/api/projects` + `/api/employees` — Seed data bundle
     - `GET /api/projects/{id}/matches` (or `POST /api/matches`) — Candidate rankings
     - `POST /api/projects/{id}/recommend-team` (or `POST /api/teams/optimize`) — Team recommendation
     - `POST /api/projects/{id}/compare` (or `POST /api/teams/compare`) — Side-by-side benchmark
     - `POST /api/projects/{id}/simulate` (or `POST /api/simulate/swap`) — What-if sensitivity swap

---

## 🖥️ Screen & Demo Walkthrough (< 2 Minutes)

| Step | Screen / View | What Judges See |
|---|---|---|
| **00:00–00:20** | **Project Mandate Selector** | 3 seeded project mandates with target team size, availability window, and required competencies. User selects *Enterprise AI Agentic Workflow Platform*. |
| **00:20–00:50** | **Ranked Candidate Matches** | Table ordered by overall match score with component breakdown (Skill 55%, Exp 20%, Avail 15%, Interest 10%). Manager clicks **Inspect Snippet** to view verbatim commit history and provenance. |
| **00:50–01:20** | **Recommended Team & Coverage Matrix** | 3-member optimal complementary roster (Dr. Elena Rostova, Marcus Chen, Devon Vance). Full breakdown of Covered Skills (93.5%), Partial Skills (1), and Critical Gaps (0). |
| **01:20–01:45** | **Baseline vs Optimizer Benchmark** | Direct side-by-side comparison of Naive Top-3 Baseline vs Optimizer. Proves that Top-3 baseline suffers from redundant AI skills leaving TypeScript unstaffed (1 critical gap, 65.2% coverage), while Optimizer achieves 93.5% coverage and 0 critical gaps. |
| **01:45–02:00** | **What-If Swap Simulator** | Manager replaces Marcus Chen with Aisha Al-Mansoor or Sarah Jenkins without page reload. Real-time deltas show coverage impact and availability constraint advisories. |

---

## ✅ Smoke Test & Quality Checklist

- [x] Application compiles cleanly with `tsc -b && vite build` (zero type errors).
- [x] Works in full standalone mock mode when backend is offline.
- [x] Displays clear visual indicators distinguishing Mock fixtures vs Live backend.
- [x] Verbatim evidence quotes inspectable via modal with confidence ratings.
- [x] Unverified or self-reported skills trigger explicit transparency warnings.
- [x] Baseline vs Optimizer demonstrates actual measured trade-offs without hardcoded gains.
- [x] What-If member replacement recalculates before/after deltas and constraint status.
- [x] Ethical AI guardrails respected: zero protected traits, advisory suitability scores only.
