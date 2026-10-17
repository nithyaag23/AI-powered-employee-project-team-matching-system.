import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Layers,
  Scale,
  ArrowLeftRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type {
  Project,
  Employee,
  MatchResult,
  TeamResult,
  ComparisonResult,
} from '../types/api';
import { apiService } from '../services/api';
import { ProjectSelector } from '../components/dashboard/ProjectSelector';
import { ProjectRequirementsView } from '../components/dashboard/ProjectRequirementsView';
import { CandidateTable } from '../components/candidates/CandidateTable';
import { RecommendedTeamView } from '../components/team/RecommendedTeamView';
import { SkillCoverageMatrix } from '../components/team/SkillCoverageMatrix';
import { BaselineComparison } from '../components/comparison/BaselineComparison';
import { WhatIfSimulator } from '../components/simulator/WhatIfSimulator';
import { EnterProjectModal } from '../components/dashboard/EnterProjectModal';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import type { TabKey } from '../components/common/Sidebar';

interface DashboardProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onProjectsLoaded?: (projects: Project[]) => void;
  onCandidatesCountChange?: (count: number) => void;
  isCreateModalOpen?: boolean;
  onOpenCreateModal?: () => void;
  onCloseCreateModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activeTab,
  onSelectTab,
  selectedProjectId,
  onSelectProject,
  onProjectsLoaded,
  onCandidatesCountChange,
  isCreateModalOpen = false,
  onOpenCreateModal,
  onCloseCreateModal,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [recommendedTeam, setRecommendedTeam] = useState<TeamResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const [isLoadingBundle, setIsLoadingBundle] = useState<boolean>(true);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initial Load of projects & employees
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setIsLoadingBundle(true);
      setErrorMessage(null);
      try {
        const bundleRes = await apiService.getDemoBundle();
        if (isMounted) {
          setProjects(bundleRes.data.projects);
          setEmployees(bundleRes.data.employees);
          onProjectsLoaded?.(bundleRes.data.projects);

          if (!selectedProjectId && bundleRes.data.projects.length > 0) {
            onSelectProject(bundleRes.data.projects[0].id);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Failed to load initial projects and employees'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingBundle(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load matches, recommended team, and comparison whenever selectedProjectId changes
  const loadProjectAnalysis = useCallback(async (projId: string, customProj?: Project) => {
    if (!projId) return;

    setIsLoadingAnalysis(true);
    setErrorMessage(null);

    const projectToUse =
      customProj ||
      projectsRef.current.find(
        (p) => p.id === projId || p.id.toLowerCase() === projId.toLowerCase()
      );

    try {
      const [matchesRes, teamRes, compRes] = await Promise.all([
        apiService.getProjectMatches(projId, projectToUse),
        apiService.getOptimizedTeam(projId, projectToUse),
        apiService.compareBaseline(projId, projectToUse),
      ]);

      setMatches(matchesRes.data);
      onCandidatesCountChange?.(matchesRes.data.length);
      setRecommendedTeam(teamRes.data);
      setComparison(compRes.data);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to compute matches and team recommendation for project'
      );
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [onCandidatesCountChange]);

  const handleProjectCreated = (newProject: Project) => {
    const updated = [newProject, ...projectsRef.current];
    setProjects(updated);
    projectsRef.current = updated;
    onProjectsLoaded?.(updated);
    onSelectProject(newProject.id);
    loadProjectAnalysis(newProject.id, newProject);
    onSelectTab('candidates');
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectAnalysis(selectedProjectId);
    }
  }, [selectedProjectId, loadProjectAnalysis]);

  // Robust project lookup
  const selectedProject =
    projects.find(
      (p) =>
        p.id === selectedProjectId ||
        p.id.toLowerCase() === selectedProjectId?.toLowerCase()
    ) || projects[0];

  const inPageNavItems = [
    {
      id: 'candidates' as TabKey,
      label: '1. Candidate Rankings',
      shortLabel: 'Rankings',
      icon: Users,
      badge: matches.length > 0 ? `${matches.length} Evaluated` : undefined,
    },
    {
      id: 'team' as TabKey,
      label: '2. Team Builder',
      shortLabel: 'Team Builder',
      icon: Layers,
      badge: 'Optimal',
      badgeColor: 'emerald',
    },
    {
      id: 'comparison' as TabKey,
      label: '3. Baseline vs Optimizer',
      shortLabel: 'Benchmark',
      icon: Scale,
    },
    {
      id: 'simulator' as TabKey,
      label: '4. What-If Simulator',
      shortLabel: 'Simulator',
      icon: ArrowLeftRight,
    },
  ];

  if (isLoadingBundle) {
    return (
      <div className="py-8">
        <LoadingState message="Loading synthetic employees and demo staffing mandates..." />
      </div>
    );
  }

  if (errorMessage && projects.length === 0) {
    return (
      <div className="py-8">
        <ErrorState
          title="Demo Data Initialization Error"
          message={errorMessage}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Project Selector Always Accessible */}
      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={onSelectProject}
        onOpenCreateModal={onOpenCreateModal}
      />

      {/* 2. Project Mandate Specification */}
      {selectedProject && <ProjectRequirementsView project={selectedProject} />}

      {/* 3. In-Page Tab Navigation Strip */}
      <div className="bg-navy-900 border border-slate-800/90 rounded-2xl p-2 shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {inPageNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all font-semibold ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-teal-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold ${
                        item.badgeColor === 'emerald'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Refresh Status Button */}
          <button
            type="button"
            onClick={() => loadProjectAnalysis(selectedProjectId)}
            disabled={isLoadingAnalysis}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800 transition-colors disabled:opacity-50"
            title="Recalculate project analysis"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoadingAnalysis ? 'animate-spin text-teal-400' : ''
              }`}
            />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Advisory Error Notice if any API analysis failed */}
      {errorMessage && (
        <div className="bg-amber-950/50 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs text-amber-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMessage} (Displaying offline fallback analysis)</span>
          </div>
          <button
            type="button"
            onClick={() => loadProjectAnalysis(selectedProjectId)}
            className="px-3 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-100 border border-amber-500/40 font-medium transition-colors shrink-0"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* 4. Dynamic Tab Content with Guaranteed Fallbacks */}
      {isLoadingAnalysis ? (
        <LoadingState message="Calculating candidate match scores and running combinatorial team optimizer..." />
      ) : (
        <>
          {/* TAB 1: Ranked Candidates & Evidence */}
          {activeTab === 'candidates' && (
            <section className="space-y-6 animate-in fade-in duration-200">
              <CandidateTable matches={matches} />
            </section>
          )}

          {/* TAB 2: Recommended Team & Coverage */}
          {activeTab === 'team' && (
            <section className="space-y-6 animate-in fade-in duration-200">
              {recommendedTeam && selectedProject ? (
                <>
                  <RecommendedTeamView
                    team={recommendedTeam}
                    employees={employees}
                    project={selectedProject}
                  />
                  <SkillCoverageMatrix
                    team={recommendedTeam}
                    employees={employees}
                    project={selectedProject}
                  />
                </>
              ) : (
                <div className="bg-navy-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <Layers className="w-8 h-8 text-teal-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-100 m-0">Team Recommendation Pending</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Computing complementary team roster for {selectedProject?.name || 'project'}.
                  </p>
                  <button
                    type="button"
                    onClick={() => loadProjectAnalysis(selectedProjectId)}
                    className="px-4 py-2 rounded-xl bg-teal-500 text-navy-950 font-bold text-xs hover:bg-teal-400 transition-colors"
                  >
                    Generate Optimal Team
                  </button>
                </div>
              )}
            </section>
          )}

          {/* TAB 3: Baseline vs Optimizer Comparison */}
          {activeTab === 'comparison' && (
            <section className="space-y-6 animate-in fade-in duration-200">
              {comparison ? (
                <BaselineComparison comparison={comparison} employees={employees} />
              ) : (
                <div className="bg-navy-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <Scale className="w-8 h-8 text-indigo-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-100 m-0">Benchmark Data Pending</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Comparing Naive Top-N Baseline against Combinatorial Coverage Optimizer.
                  </p>
                  <button
                    type="button"
                    onClick={() => loadProjectAnalysis(selectedProjectId)}
                    className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-400 transition-colors"
                  >
                    Run Benchmark
                  </button>
                </div>
              )}
            </section>
          )}

          {/* TAB 4: What-If Swap Simulator */}
          {activeTab === 'simulator' && (
            <section className="space-y-6 animate-in fade-in duration-200">
              {recommendedTeam && selectedProject ? (
                <>
                  <WhatIfSimulator
                    currentTeam={recommendedTeam}
                    allEmployees={employees}
                    project={selectedProject}
                    onApplySwapToTeam={(updated) => setRecommendedTeam(updated)}
                  />
                  {/* Also show live updated coverage matrix below simulator */}
                  <SkillCoverageMatrix
                    team={recommendedTeam}
                    employees={employees}
                    project={selectedProject}
                  />
                </>
              ) : (
                <div className="bg-navy-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <ArrowLeftRight className="w-8 h-8 text-teal-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-100 m-0">Simulator Ready</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Load the active team configuration to test candidate substitutions and measure real-time coverage delta.
                  </p>
                  <button
                    type="button"
                    onClick={() => loadProjectAnalysis(selectedProjectId)}
                    className="px-4 py-2 rounded-xl bg-teal-500 text-navy-950 font-bold text-xs hover:bg-teal-400 transition-colors"
                  >
                    Initialize Simulator
                  </button>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Modal: Enter Project Requirements with Gemma 4 E4B AI */}
      <EnterProjectModal
        isOpen={isCreateModalOpen}
        onClose={onCloseCreateModal || (() => {})}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};
