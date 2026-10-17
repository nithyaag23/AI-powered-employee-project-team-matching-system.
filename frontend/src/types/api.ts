/**
 * SkillSync AI - Shared API Contract Types
 * Strict typed definitions aligned with Person 1 Assignment & Team Specifications
 */

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'unknown';

export type VerificationStatus = 'verified' | 'unverified' | 'unknown';

export interface SkillEvidence {
  name: string;
  level: SkillLevel;
  evidence: string;
  verification_status: VerificationStatus;
  confidence: number | null; // 0.0 to 1.0 or null
  source_location?: string;
  proficiency?: number; // 1-5 scale if available
}

export interface Employee {
  id: string;
  name: string;
  skills: SkillEvidence[];
  experience_years: number;
  availability: number; // e.g. 1.0 = 100%, 0.8 = 80% (or hours per week)
  interests: string[];
  role_title?: string;
  avatar_url?: string;
}

export interface RequiredSkill {
  name: string;
  min_level?: SkillLevel;
  min_proficiency?: number; // 1 to 5
  weight: number; // importance weight, e.g. 1.0 to 3.0
  critical: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  required_skills: RequiredSkill[];
  team_size: number;
  availability_window?: string;
  status?: 'active' | 'planning' | 'staffing';
}

export interface ComponentScores {
  skill_fit: number; // 0 to 1 or 0 to 100
  experience_fit: number;
  availability_fit: number;
  interest_fit: number;
  [key: string]: number;
}

export interface MatchResult {
  employee_id: string;
  overall_score: number; // 0 - 100
  component_scores: ComponentScores;
  reasons: string[];
  warnings: string[];
  // Joined or denormalized employee for display convenience
  employee?: Employee;
}

export interface TeamResult {
  members: string[] | Employee[];
  weighted_coverage_pct: number; // 0 - 100
  covered_skills: string[];
  partial_skills: string[];
  critical_gaps: string[];
  team_fit_score: number; // 0 - 100
  constraint_violations: string[];
  objective_value: number;
  algorithm_used?: string;
}

export interface TeamComparisonMetrics {
  weighted_coverage_pct: number;
  critical_gaps: number;
  partial_gaps?: number;
  team_fit_score: number;
  constraint_violations: number;
}

export interface TeamComparisonDeltas {
  coverage_pct_delta: number;
  critical_gaps_delta: number;
  team_fit_delta: number;
  constraint_violations_delta: number;
  [key: string]: number;
}

export interface ComparisonResult {
  baseline: TeamResult;
  optimized: TeamResult;
  deltas: TeamComparisonDeltas;
  evaluation_notes: string[];
  project_id: string;
}

export interface SwapSimulationRequest {
  project_id: string;
  current_team: string[];
  remove_employee_id: string;
  add_employee_id: string;
}

export interface SwapSimulationResult {
  previous_team: TeamResult;
  new_team: TeamResult;
  deltas: TeamComparisonDeltas;
  evaluation_notes: string[];
  swap_summary: {
    removed: string;
    added: string;
    net_coverage_change: number;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'offline';
  backend_version?: string;
  ai_service_available: boolean;
  model_name?: string;
  message?: string;
}

export interface DemoBundle {
  projects: Project[];
  employees: Employee[];
}

export interface ProjectAnalysisRequest {
  name: string;
  description: string;
  team_size?: number;
}

export interface ProjectAnalysisResponse {
  project: Project;
  warnings: string[];
}
