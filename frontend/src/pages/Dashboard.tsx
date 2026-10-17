import React, { useState, useEffect } from 'react';
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
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

interface DashboardProps {
  activeTab: 'candidates' | 'team' | 'comparison' | 'simulator';
}

export const Dashboard: React.FC<DashboardProps> = ({ activeTab }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');

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
          if (bundleRes.data.projects.length > 0) {
            setSelectedProjectId(bundleRes.data.projects[0].id);
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
  useEffect(() => {
    if (!selectedProjectId) return;

    let isMounted = true;

    async function loadProjectAnalysis() {
      setIsLoadingAnalysis(true);
      setErrorMessage(null);

      try {
        const [matchesRes, teamRes, compRes] = await Promise.all([
          apiService.getProjectMatches(selectedProjectId),
          apiService.getOptimizedTeam(selectedProjectId),
          apiService.compareBaseline(selectedProjectId),
        ]);

        if (isMounted) {
          setMatches(matchesRes.data);
          setRecommendedTeam(teamRes.data);
          setComparison(compRes.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'Failed to compute matches and team recommendation for project'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingAnalysis(false);
        }
      }
    }

    loadProjectAnalysis();

    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  if (isLoadingBundle) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingState message="Loading synthetic employees and demo staffing mandates..." />
      </main>
    );
  }

  if (errorMessage && projects.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorState
          title="Demo Data Initialization Error"
          message={errorMessage}
          onRetry={() => window.location.reload()}
        />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Project Selector Always Accessible */}
      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => setSelectedProjectId(id)}
      />

      {/* 2. Project Mandate Specification */}
      {selectedProject && <ProjectRequirementsView project={selectedProject} />}

      {/* 3. Dynamic Tab Content */}
      {isLoadingAnalysis ? (
        <LoadingState message="Calculating candidate match scores and running team optimizer..." />
      ) : (
        <>
          {/* TAB 1: Ranked Candidates & Evidence */}
          {activeTab === 'candidates' && (
            <section className="space-y-6">
              <CandidateTable matches={matches} />
            </section>
          )}

          {/* TAB 2: Recommended Team & Coverage */}
          {activeTab === 'team' && recommendedTeam && selectedProject && (
            <section className="space-y-6">
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
            </section>
          )}

          {/* TAB 3: Baseline vs Optimizer Comparison */}
          {activeTab === 'comparison' && comparison && (
            <section className="space-y-6">
              <BaselineComparison comparison={comparison} employees={employees} />
            </section>
          )}

          {/* TAB 4: What-If Swap Simulator */}
          {activeTab === 'simulator' && recommendedTeam && selectedProject && (
            <section className="space-y-6">
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
            </section>
          )}
        </>
      )}
    </main>
  );
};
