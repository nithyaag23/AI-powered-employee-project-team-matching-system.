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
from backend.ai.config import config
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
    MatchResult,
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
        # Seamless alias support for Person 1 frontend mock IDs (proj-1 -> PRJ-101)
        alias_map = {
            "proj-1": "PRJ-101",
            "proj-2": "PRJ-102",
            "proj-3": "PRJ-103",
        }
        if project_id.lower() in alias_map:
            aliased = get_seed_project_by_id(alias_map[project_id.lower()])
            if aliased is not None:
                return aliased
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
    return HealthResponse(
        status="ok",
        app_version="1.0.0",
        backend_version="1.0.0",
        ai_service_available=True,
        model_name=config.model_name,
        message=f"Connected to live FastAPI backend with {config.model_name}.",
    )




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


# ==============================================================================
# Person 1 (Frontend) Convenience Aliases
# ==============================================================================

@router.get("/projects", response_model=List[Project], summary="Get All Projects")
def get_all_projects() -> List[Project]:
    return get_seed_projects()


@router.get("/employees", response_model=List[Employee], summary="Get All Employees")
def get_all_employees() -> List[Employee]:
    return get_seed_employees()


@router.get(
    "/projects/{project_id}/matches",
    response_model=List[MatchResult],
    summary="Get Matches For Project (Frontend Direct Array)",
)
def get_project_matches_direct(project_id: str) -> List[MatchResult]:
    project = resolve_project(project_id, None)
    pool = get_seed_employees()
    matches = rank_candidates_for_project(pool, project)
    return matches


@router.post(
    "/projects/{project_id}/recommend-team",
    response_model=TeamResult,
    summary="Recommend Team For Project (Frontend Path)",
)
def recommend_team_direct(project_id: str) -> TeamResult:
    project = resolve_project(project_id, None)
    pool = get_seed_employees()
    return select_optimized_team(candidates=pool, project=project)


@router.post(
    "/projects/{project_id}/compare",
    response_model=ComparisonResult,
    summary="Compare Baseline vs Optimizer (Frontend Path)",
)
def compare_teams_direct(project_id: str) -> ComparisonResult:
    project = resolve_project(project_id, None)
    pool = get_seed_employees()
    res = compare_baseline_and_optimizer(candidates=pool, project=project)
    res.project_id = project_id
    return res


@router.post(
    "/projects/{project_id}/simulate",
    response_model=SwapSimulationResult,
    summary="Simulate Swap For Project (Frontend Path)",
)
def simulate_swap_direct(project_id: str, req: SwapSimulationRequest) -> SwapSimulationResult:
    project = resolve_project(project_id, None)
    pool = resolve_candidate_pool(req.candidate_pool)
    return simulate_member_swap(
        current_team_ids=req.current_team_ids,
        remove_employee_id=req.remove_employee_id,
        add_employee_id=req.add_employee_id,
        project=project,
        candidate_pool=pool,
    )


