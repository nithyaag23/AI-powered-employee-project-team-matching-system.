"""
SkillSync AI - FastAPI API Route Handlers.
Exposes all canonical endpoints specified in docs/API_CONTRACT.md.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status

from backend.adapters.ai_adapter import (
    analyze_project_text,
    extract_skills_from_text,
)
from backend.data.loader import (
    get_seed_employee_by_id,
    get_seed_employees,
    get_seed_project_by_id,
    get_seed_projects,
)
from backend.matching.scoring import rank_candidates_for_project
from backend.optimizer.team_optimizer import (
    compare_baseline_and_optimizer,
    filter_eligible_candidates,
    select_optimized_team,
    simulate_member_swap,
)
from backend.schemas.models import (
    ComparisonResult,
    DemoDataResponse,
    Employee,
    HealthResponse,
    MatchRequest,
    MatchResponse,
    Project,
    ProjectAnalysisRequest,
    ProjectAnalysisResponse,
    SkillExtractionRequest,
    SkillExtractionResponse,
    SwapSimulationRequest,
    SwapSimulationResult,
    TeamCompareRequest,
    TeamOptimizeRequest,
    TeamResult,
)

router = APIRouter(prefix="/api", tags=["SkillSync AI Core"])


# ==============================================================================
# Helper Functions
# ==============================================================================

def resolve_project(project_id: Optional[str], project: Optional[Project]) -> Project:
    """Resolves project either from payload or seed dataset."""
    if project is not None:
        return project
    if project_id:
        seed_proj = get_seed_project_by_id(project_id)
        if seed_proj is not None:
            return seed_proj
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found in seed dataset.",
        )
    # Default to first seed project
    projects = get_seed_projects()
    if projects:
        return projects[0]
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="No project specified and seed dataset has no projects.",
    )


def resolve_candidate_pool(candidates: Optional[List[Employee]]) -> List[Employee]:
    """Resolves candidate pool either from payload or seed dataset."""
    if candidates is not None and len(candidates) > 0:
        return candidates
    return get_seed_employees()


# ==============================================================================
# Endpoints
# ==============================================================================

@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
def get_health() -> HealthResponse:
    """Returns application status and version."""
    return HealthResponse(status="ok", app_version="1.0.0")


@router.get("/demo", response_model=DemoDataResponse, summary="Get Synthetic Demo Dataset")
def get_demo_data() -> DemoDataResponse:
    """Returns deterministic synthetic projects and employee profiles for offline demoing."""
    projects = get_seed_projects()
    employees = get_seed_employees()
    return DemoDataResponse(projects=projects, employees=employees)


@router.post(
    "/skills/extract",
    response_model=SkillExtractionResponse,
    summary="Extract Skills From Text (AI / Rule Fallback)",
)
def extract_skills(req: SkillExtractionRequest) -> SkillExtractionResponse:
    """Extracts skills and proficiency levels from raw candidate resume/profile text."""
    skills, warnings = extract_skills_from_text(req.profile_text, req.metadata)
    return SkillExtractionResponse(
        skills=skills,
        extracted_count=len(skills),
        warnings=warnings,
    )


@router.post(
    "/projects/analyze",
    response_model=ProjectAnalysisResponse,
    summary="Analyze Project Requirements Statement",
)
def analyze_project(req: ProjectAnalysisRequest) -> ProjectAnalysisResponse:
    """Parses project statement of work into structured requirements and required skills."""
    project, warnings = analyze_project_text(
        description=req.description,
        name=req.name,
        team_size=req.team_size,
    )
    return ProjectAnalysisResponse(project=project, warnings=warnings)


@router.post(
    "/matches",
    response_model=MatchResponse,
    summary="Calculate Individual Candidate Matches",
)
def get_matches(req: MatchRequest) -> MatchResponse:
    """Evaluates and ranks all candidates against the specified project."""
    project = resolve_project(req.project_id, req.project)
    pool = resolve_candidate_pool(req.candidate_pool)

    ranked_matches = rank_candidates_for_project(pool, project)
    eligible = filter_eligible_candidates(pool)

    return MatchResponse(
        project_id=project.id,
        matches=ranked_matches,
        total_candidates=len(pool),
        eligible_candidates=len(eligible),
    )


@router.post(
    "/teams/optimize",
    response_model=TeamResult,
    summary="Optimize Team Selection for Project",
)
def optimize_team(req: TeamOptimizeRequest) -> TeamResult:
    """Selects an optimal team maximizing weighted skill coverage and minimizing gaps."""
    project = resolve_project(req.project_id, req.project)
    pool = resolve_candidate_pool(req.candidate_pool)

    team = select_optimized_team(
        candidates=pool,
        project=project,
        target_team_size=req.team_size_override,
        eligible_ids=req.eligible_employee_ids,
    )
    return team


@router.post(
    "/teams/compare",
    response_model=ComparisonResult,
    summary="Compare Baseline vs. Optimizer",
)
def compare_teams(req: TeamCompareRequest) -> ComparisonResult:
    """Executes Baseline and Optimizer side-by-side using identical metrics."""
    project = resolve_project(req.project_id, req.project)
    pool = resolve_candidate_pool(req.candidate_pool)

    comparison = compare_baseline_and_optimizer(
        candidates=pool,
        project=project,
        target_team_size=req.team_size_override,
    )
    return comparison


@router.post(
    "/simulate/swap",
    response_model=SwapSimulationResult,
    summary="Simulate Hypothetical Member Swap",
)
def simulate_swap(req: SwapSimulationRequest) -> SwapSimulationResult:
    """Evaluates substituting one team member with another, fully recalculating metrics."""
    project = resolve_project(req.project_id, req.project)
    pool = resolve_candidate_pool(req.candidate_pool)

    result = simulate_member_swap(
        current_team_ids=req.current_team_ids,
        remove_employee_id=req.remove_employee_id,
        add_employee_id=req.add_employee_id,
        project=project,
        candidate_pool=pool,
    )
    return result
