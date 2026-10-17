import type {
  Project,
  Employee,
  MatchResult,
  TeamResult,
  ComparisonResult,
  SwapSimulationRequest,
  SwapSimulationResult,
  HealthResponse,
  DemoBundle,
  ProjectAnalysisRequest,
  ProjectAnalysisResponse,
} from '../types/api';

import {
  MOCK_PROJECTS,
  MOCK_EMPLOYEES,
  MOCK_PROJECT_1_MATCHES,
  MOCK_PROJECT_1_COMPARISON,
  MOCK_SWAP_SIMULATION_DATA,
} from '../mocks/demoData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const FORCE_MOCK = import.meta.env.VITE_FORCE_MOCK === 'true';
const ENABLE_MOCK_FALLBACK = import.meta.env.VITE_ENABLE_MOCK_FALLBACK !== 'false';

export interface ApiResponse<T> {
  data: T;
  source: 'live-backend' | 'mock-fixture';
  error?: string;
}

class ApiService {
  private baseUrl: string;
  private isBackendHealthy: boolean = false;
  private activeSource: 'live-backend' | 'mock-fixture' = 'mock-fixture';

  constructor() {
    this.baseUrl = BASE_URL.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getActiveSource(): 'live-backend' | 'mock-fixture' {
    return this.activeSource;
  }

  public isUsingMocks(): boolean {
    return this.activeSource === 'mock-fixture';
  }

  /**
   * Health Check: GET /api/health
   */
  async checkHealth(): Promise<HealthResponse> {
    if (FORCE_MOCK) {
      this.activeSource = 'mock-fixture';
      return {
        status: 'healthy',
        ai_service_available: true,
        model_name: 'Mock Seeded Fixture Provider (Offline Mode)',
        message: 'Running in forced mock mode for rapid UI testing.',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const json = await response.json();
        this.isBackendHealthy = true;
        this.activeSource = 'live-backend';
        return {
          status: json.status || 'healthy',
          backend_version: json.backend_version || '1.0.0',
          ai_service_available: json.ai_service_available ?? true,
          model_name: json.model_name || 'Open-Weight Model Adapter',
          message: json.message || 'Connected to live FastAPI backend.',
        };
      }
      throw new Error(`Health check returned status ${response.status}`);
    } catch (err: unknown) {
      this.isBackendHealthy = false;
      this.activeSource = 'mock-fixture';
      return {
        status: 'offline',
        ai_service_available: false,
        model_name: 'None (Backend Offline)',
        message: err instanceof Error ? err.message : 'Unable to connect to backend',
      };
    }
  }

  /**
   * Get Demo Bundle or Seed Data: GET /api/demo or GET /api/projects + /api/employees
   */
  async getDemoBundle(): Promise<ApiResponse<DemoBundle>> {
    if (!FORCE_MOCK && this.isBackendHealthy) {
      try {
        const res = await fetch(`${this.baseUrl}/api/demo`);
        if (res.ok) {
          const data = await res.json();
          this.activeSource = 'live-backend';
          return { data, source: 'live-backend' };
        }
      } catch (e) {
        if (!ENABLE_MOCK_FALLBACK) throw e;
      }
    }

    this.activeSource = 'mock-fixture';
    return {
      data: {
        projects: MOCK_PROJECTS,
        employees: MOCK_EMPLOYEES,
      },
      source: 'mock-fixture',
    };
  }

  /**
   * Get all projects: GET /api/projects
   */
  async getProjects(): Promise<ApiResponse<Project[]>> {
    if (!FORCE_MOCK && this.isBackendHealthy) {
      try {
        const res = await fetch(`${this.baseUrl}/api/projects`);
        if (res.ok) {
          const data = await res.json();
          this.activeSource = 'live-backend';
          return { data, source: 'live-backend' };
        }
      } catch (e) {
        if (!ENABLE_MOCK_FALLBACK) throw e;
      }
    }

    return {
      data: MOCK_PROJECTS,
      source: 'mock-fixture',
    };
  }

  /**
   * Get all employees: GET /api/employees
   */
  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    if (!FORCE_MOCK && this.isBackendHealthy) {
      try {
        const res = await fetch(`${this.baseUrl}/api/employees`);
        if (res.ok) {
          const data = await res.json();
          this.activeSource = 'live-backend';
          return { data, source: 'live-backend' };
        }
      } catch (e) {
        if (!ENABLE_MOCK_FALLBACK) throw e;
      }
    }

    return {
      data: MOCK_EMPLOYEES,
      source: 'mock-fixture',
    };
  }

  /**
   * Analyze Project Requirements Statement with AI (Gemma 4 E4B):
   * Calls POST /api/projects/analyze
   */
  async analyzeProject(req: ProjectAnalysisRequest): Promise<ApiResponse<ProjectAnalysisResponse>> {
    if (!FORCE_MOCK && this.isBackendHealthy) {
      try {
        const res = await fetch(`${this.baseUrl}/api/projects/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
        if (res.ok) {
          const data: ProjectAnalysisResponse = await res.json();
          this.activeSource = 'live-backend';
          return { data, source: 'live-backend' };
        }
      } catch (e) {
        if (!ENABLE_MOCK_FALLBACK) throw e;
      }
    }

    // High-fidelity fallback analyzer
    this.activeSource = 'mock-fixture';
    const textLower = `${req.name} ${req.description}`.toLowerCase();
    const extractedSkills = [];

    const tax: Record<string, { critical: boolean; weight: number }> = {
      Python: { critical: true, weight: 3.0 },
      Go: { critical: true, weight: 3.0 },
      React: { critical: false, weight: 2.0 },
      TypeScript: { critical: false, weight: 2.5 },
      Docker: { critical: false, weight: 1.5 },
      Kubernetes: { critical: true, weight: 2.5 },
      PostgreSQL: { critical: false, weight: 2.0 },
      PyTorch: { critical: true, weight: 3.0 },
      Redis: { critical: false, weight: 1.5 },
      FastAPI: { critical: false, weight: 2.0 },
      'CI/CD': { critical: false, weight: 1.5 },
      Terraform: { critical: false, weight: 1.5 },
    };

    for (const [skillName, meta] of Object.entries(tax)) {
      if (textLower.includes(skillName.toLowerCase())) {
        extractedSkills.push({
          name: skillName,
          min_level: 'intermediate' as const,
          weight: meta.weight,
          critical: meta.critical,
        });
      }
    }

    if (extractedSkills.length === 0) {
      extractedSkills.push(
        { name: 'Python', min_level: 'intermediate' as const, weight: 2.5, critical: true },
        { name: 'Docker', min_level: 'intermediate' as const, weight: 1.5, critical: false }
      );
    }

    const customProject: Project = {
      id: `PRJ-MGR-${Date.now().toString().slice(-4)}`,
      name: req.name || 'Custom Staffing Mandate',
      description: req.description,
      required_skills: extractedSkills,
      team_size: req.team_size || 3,
      availability_window: 'Immediate (Next 3 Months)',
      status: 'staffing',
    };

    return {
      data: {
        project: customProject,
        warnings: ['Analyzed using deterministic rule fallback (Gemma 4 E4B adapter).'],
      },
      source: 'mock-fixture',
    };
  }

  /**
   * Get candidate rankings for a project:
   * Supports GET /api/projects/{id}/matches or POST /api/matches
   */
  async getProjectMatches(projectId: string, customProject?: Project): Promise<ApiResponse<MatchResult[]>> {
    if (!FORCE_MOCK && this.isBackendHealthy) {
      try {
        let res: Response;
        if (customProject) {
          res = await fetch(`${this.baseUrl}/api/matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: customProject }),
          });
        } else {
          res = await fetch(`${this.baseUrl}/api/projects/${projectId}/matches`);
          if (!res.ok) {
            res = await fetch(`${this.baseUrl}/api/matches`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ project_id: projectId }),
            });
          }
        if (res.ok) {
          const resJson = await res.json();
          const list: MatchResult[] = Array.isArray(resJson)
            ? resJson
            : resJson.matches || [];
          // Ensure employees are mapped if backend sends IDs
          const enriched = list.map((item) => {
            if (!item.employee) {
              item.employee = MOCK_EMPLOYEES.find((e) => e.id === item.employee_id);
            }
            return item;
          });
          this.activeSource = 'live-backend';
          return { data: enriched, source: 'live-backend' };
        }
      } catch (e) {
        if (!ENABLE_MOCK_FALLBACK) throw e;
      }
    }

    // Mock data handling
    this.activeSource = 'mock-fixture';
    if (!customProject && (projectId === 'proj-1' || projectId === 'PRJ-101')) {
      return { data: MOCK_PROJECT_1_MATCHES, source: 'mock-fixture' };
    }

    // Dynamic mock fallback for other projects
    const fallbackMatches: MatchResult[] = MOCK_EMPLOYEES.slice(0, 8).map((emp, idx) => ({
      employee_id: emp.id,
      overall_score: Math.max(50, 92 - idx * 4.5),
      component_scores: {
        skill_fit: Math.max(50, 90 - idx * 5),
        experience_fit: Math.min(100, emp.experience_years * 11),
        availability_fit: emp.availability * 100,
        interest_fit: 85,
      },
      reasons: [
        `Relevance in core profile skills (${emp.skills.slice(0, 2).map((s) => s.name).join(', ')}).`,
        `Availability: ${Math.round(emp.availability * 100)}%.`,
      ],
      warnings: emp.skills.some((s) => s.verification_status !== 'verified')
        ? ['Profile contains one or more unverified or self-reported skills.']
        : [],
      employee: emp,
    }));

    return { data: fallbackMatches, source: 'mock-fixture' };
  }

  /**
   * Get team optimization recommendation:
   * Supports POST /api/projects/{id}/recommend-team or POST /api/teams/optimize
   */
  async getOptimizedTeam(projectId: string, customProject?: Project): Promise<ApiResponse<TeamResult>> {
    if (!FORCE_MOCK && this.isBackendHealthy) {
      try {
        let res: Response;
        if (customProject) {
          res = await fetch(`${this.baseUrl}/api/teams/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: customProject }),
          });
        } else {
          res = await fetch(`${this.baseUrl}/api/projects/${projectId}/recommend-team`, {
            method: 'POST',
          });
          if (!res.ok) {
            res = await fetch(`${this.baseUrl}/api/teams/optimize`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ project_id: projectId }),
            });
          }
        }
        if (res.ok) {
          const data = await res.json();
          this.activeSource = 'live-backend';
          return { data, source: 'live-backend' };
        }
      } catch (e) {
        if (!ENABLE_MOCK_FALLBACK) throw e;
      }
    }

    this.activeSource = 'mock-fixture';
    return {
      data: MOCK_PROJECT_1_COMPARISON.optimized,
      source: 'mock-fixture',
    };
  }

  /**
   * Compare Baseline vs Optimized Team:
   * Supports POST /api/projects/{id}/compare or POST /api/teams/compare
   */
  async compareBaseline(projectId: string, customProject?: Project): Promise<ApiResponse<ComparisonResult>> {
    if (!FORCE_MOCK && this.isBackendHealthy) {
      try {
        let res: Response;
        if (customProject) {
          res = await fetch(`${this.baseUrl}/api/teams/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: customProject }),
          });
        } else {
          res = await fetch(`${this.baseUrl}/api/projects/${projectId}/compare`, {
            method: 'POST',
          });
          if (!res.ok) {
            res = await fetch(`${this.baseUrl}/api/teams/compare`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ project_id: projectId }),
            });
          }
        }
        if (res.ok) {
          const data = await res.json();
          this.activeSource = 'live-backend';
          return { data, source: 'live-backend' };
        }
      } catch (e) {
        if (!ENABLE_MOCK_FALLBACK) throw e;
      }
    }

    this.activeSource = 'mock-fixture';
    return {
      data: MOCK_PROJECT_1_COMPARISON,
      source: 'mock-fixture',
    };
  }

  /**
   * Simulate a member swap:
   * Supports POST /api/projects/{id}/simulate or POST /api/simulate/swap
   */
  async simulateSwap(req: SwapSimulationRequest): Promise<ApiResponse<SwapSimulationResult>> {
    if (!FORCE_MOCK && this.isBackendHealthy) {
      try {
        let res = await fetch(`${this.baseUrl}/api/projects/${req.project_id}/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
        if (!res.ok) {
          res = await fetch(`${this.baseUrl}/api/simulate/swap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req),
          });
        }
        if (res.ok) {
          const data = await res.json();
          this.activeSource = 'live-backend';
          return { data, source: 'live-backend' };
        }
      } catch (e) {
        if (!ENABLE_MOCK_FALLBACK) throw e;
      }
    }

    // Mock swap calculation
    this.activeSource = 'mock-fixture';
    const key = `${req.remove_employee_id}->${req.add_employee_id}`;
    if (MOCK_SWAP_SIMULATION_DATA[key]) {
      return {
        data: MOCK_SWAP_SIMULATION_DATA[key],
        source: 'mock-fixture',
      };
    }

    // Dynamic mock calculation for arbitrary swap
    const removedEmp = MOCK_EMPLOYEES.find((e) => e.id === req.remove_employee_id);
    const addedEmp = MOCK_EMPLOYEES.find((e) => e.id === req.add_employee_id);

    const baseTeam = MOCK_PROJECT_1_COMPARISON.optimized;
    const newMembers = baseTeam.members
      .map((m) => (typeof m === 'string' ? m : m.id))
      .filter((id) => id !== req.remove_employee_id)
      .concat(req.add_employee_id);

    const newFitScore = Math.round(
      (baseTeam.team_fit_score + (addedEmp ? addedEmp.experience_years * 5 : 0) - (removedEmp ? removedEmp.experience_years * 5 : 0)) * 10
    ) / 10;

    const dynamicResult: SwapSimulationResult = {
      previous_team: baseTeam,
      new_team: {
        ...baseTeam,
        members: newMembers,
        team_fit_score: Math.min(100, Math.max(50, newFitScore)),
        constraint_violations:
          addedEmp && addedEmp.availability < 0.8
            ? [`Availability advisory: ${addedEmp.name} has ${Math.round(addedEmp.availability * 100)}% availability.`]
            : [],
      },
      deltas: {
        coverage_pct_delta: 0,
        critical_gaps_delta: 0,
        team_fit_delta: Math.round((newFitScore - baseTeam.team_fit_score) * 10) / 10,
        constraint_violations_delta: addedEmp && addedEmp.availability < 0.8 ? 1 : 0,
      },
      evaluation_notes: [
        `Replaced ${removedEmp?.name || req.remove_employee_id} with ${addedEmp?.name || req.add_employee_id}.`,
        'Recalculated team fit score and hard availability constraint status.',
      ],
      swap_summary: {
        removed: removedEmp?.name || req.remove_employee_id,
        added: addedEmp?.name || req.add_employee_id,
        net_coverage_change: 0,
      },
    };

    return {
      data: dynamicResult,
      source: 'mock-fixture',
    };
  }
}

export const apiService = new ApiService();
