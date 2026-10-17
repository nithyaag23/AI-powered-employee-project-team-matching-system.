import { useState } from 'react';
import {
  ArrowLeftRight,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  UserMinus,
  UserPlus,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import type {
  TeamResult,
  Employee,
  Project,
  SwapSimulationResult,
} from '../../types/api';
import { apiService } from '../../services/api';

interface WhatIfSimulatorProps {
  currentTeam: TeamResult;
  allEmployees: Employee[];
  project: Project;
  onApplySwapToTeam?: (updatedTeam: TeamResult) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  currentTeam,
  allEmployees,
  project,
  onApplySwapToTeam,
}) => {
  const currentMemberIds = currentTeam.members.map((m) =>
    typeof m === 'string' ? m : m.id
  );

  const teamMembers = currentMemberIds.map(
    (id) =>
      allEmployees.find((e) => e.id === id) || {
        id,
        name: `Employee ${id}`,
        skills: [],
        experience_years: 4,
        availability: 1.0,
        interests: [],
      }
  );

  const availableReplacements = allEmployees.filter(
    (e) => !currentMemberIds.includes(e.id)
  );

  const [selectedRemoveId, setSelectedRemoveId] = useState<string>(
    teamMembers[1]?.id || teamMembers[0]?.id || ''
  );
  const [selectedAddId, setSelectedAddId] = useState<string>(
    availableReplacements[0]?.id || ''
  );

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SwapSimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleRunSimulation = async () => {
    if (!selectedRemoveId || !selectedAddId) return;

    setIsSimulating(true);
    setSimulationError(null);
    setAppliedSuccess(false);

    try {
      const response = await apiService.simulateSwap({
        project_id: project.id,
        current_team: currentMemberIds,
        remove_employee_id: selectedRemoveId,
        add_employee_id: selectedAddId,
      });

      setSimulationResult(response.data);
    } catch (err: unknown) {
      setSimulationError(
        err instanceof Error ? err.message : 'Failed to simulate team member swap'
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplySwap = (updatedTeam: TeamResult) => {
    if (onApplySwapToTeam) {
      onApplySwapToTeam(updatedTeam);
      setAppliedSuccess(true);
    }
  };

  const removedEmployee = teamMembers.find((e) => e.id === selectedRemoveId);
  const addedEmployee = availableReplacements.find((e) => e.id === selectedAddId);

  return (
    <div className="bg-navy-900 border border-slate-800/90 rounded-2xl p-6 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
              Interactive Sensitivity Analysis
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-850 text-slate-300 border border-slate-700/60 font-mono">
              Zero Page Reload
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 m-0 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-teal-400" />
            What-If Team Member Swap Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 m-0 max-w-2xl leading-relaxed">
            Test alternative staffing compositions by swapping a recommended member with another candidate to assess
            the real-time impact on skill coverage, critical gaps, and constraints.
          </p>
        </div>
      </div>

      {/* Swap Controls Form Card */}
      <div className="bg-navy-950/90 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          {/* Member to Remove */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <UserMinus className="w-3.5 h-3.5 text-rose-400" />
              <span>Current Member to Remove:</span>
            </label>
            <select
              value={selectedRemoveId}
              onChange={(e) => setSelectedRemoveId(e.target.value)}
              className="w-full bg-navy-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500/80 transition-colors"
            >
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role_title || 'Engineer'}) — {m.experience_years} yrs exp, {Math.round(m.availability * 100)}% avail
                </option>
              ))}
            </select>
          </div>

          {/* Swap Indicator Icon */}
          <div className="flex justify-center items-center pt-4 md:pt-0">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/70 flex items-center justify-center text-teal-400 shadow-sm">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>

          {/* Candidate to Add */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-teal-400" />
              <span>Candidate to Add in Replacement:</span>
            </label>
            <select
              value={selectedAddId}
              onChange={(e) => setSelectedAddId(e.target.value)}
              className="w-full bg-navy-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500/80 transition-colors"
            >
              {availableReplacements.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.role_title || 'Specialist'}) — {e.experience_years} yrs exp, {Math.round(e.availability * 100)}% avail
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Proposed substitution:</span>
            <span className="font-semibold text-rose-300">{removedEmployee?.name}</span>
            <span>&rarr;</span>
            <span className="font-semibold text-teal-300">{addedEmployee?.name}</span>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating || !selectedRemoveId || !selectedAddId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-glow-teal transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Recalculating...' : 'Simulate Member Swap'}
          </button>
        </div>
      </div>

      {simulationError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{simulationError}</span>
        </div>
      )}

      {/* Simulation Result Comparison Card */}
      {simulationResult && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 m-0">
              Simulation Outcome & Metric Changes
            </h4>
            {appliedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Swap Applied to Active Roster
              </span>
            )}
          </div>

          {/* Delta Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Coverage Delta */}
            <div className="bg-navy-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Coverage Change</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-slate-100 tabular-nums">
                  {simulationResult.new_team.weighted_coverage_pct.toFixed(1)}%
                </span>
                <span
                  className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                    simulationResult.deltas.coverage_pct_delta > 0
                      ? 'text-teal-400'
                      : simulationResult.deltas.coverage_pct_delta < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {simulationResult.deltas.coverage_pct_delta > 0 && <TrendingUp className="w-3 h-3" />}
                  {simulationResult.deltas.coverage_pct_delta < 0 && <TrendingDown className="w-3 h-3" />}
                  {simulationResult.deltas.coverage_pct_delta > 0
                    ? `+${simulationResult.deltas.coverage_pct_delta.toFixed(1)}%`
                    : `${simulationResult.deltas.coverage_pct_delta.toFixed(1)}%`}
                </span>
              </div>
            </div>

            {/* Critical Gaps Delta */}
            <div className="bg-navy-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Critical Skill Gaps</span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xl font-bold font-mono tabular-nums ${
                    simulationResult.new_team.critical_gaps.length === 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {simulationResult.new_team.critical_gaps.length} Gaps
                </span>
                <span className="text-xs font-mono text-slate-400">
                  ({simulationResult.deltas.critical_gaps_delta >= 0 ? `+${simulationResult.deltas.critical_gaps_delta}` : simulationResult.deltas.critical_gaps_delta})
                </span>
              </div>
            </div>

            {/* Team Fit Delta */}
            <div className="bg-navy-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Mean Team Fit</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-indigo-300 tabular-nums">
                  {simulationResult.new_team.team_fit_score.toFixed(1)}%
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    simulationResult.deltas.team_fit_delta >= 0
                      ? 'text-teal-400'
                      : 'text-amber-400'
                  }`}
                >
                  {simulationResult.deltas.team_fit_delta >= 0
                    ? `+${simulationResult.deltas.team_fit_delta.toFixed(1)}%`
                    : `${simulationResult.deltas.team_fit_delta.toFixed(1)}%`}
                </span>
              </div>
            </div>

            {/* Constraint Status */}
            <div className="bg-navy-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Hard Constraints</span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xl font-bold font-mono ${
                    simulationResult.new_team.constraint_violations.length === 0
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {simulationResult.new_team.constraint_violations.length === 0
                    ? '0 Violations'
                    : `${simulationResult.new_team.constraint_violations.length} Advisory`}
                </span>
              </div>
            </div>
          </div>

          {/* Evaluative Notes from Backend */}
          <div className="bg-navy-950 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
            <h5 className="font-semibold text-slate-200 flex items-center gap-1.5 m-0">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Swap Evaluation Notes:
            </h5>
            {simulationResult.evaluation_notes.map((note: string, idx: number) => (
              <p key={idx} className="text-slate-300 leading-relaxed m-0">
                • {note}
              </p>
            ))}

            {simulationResult.new_team.constraint_violations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-amber-300 font-medium">
                ⚠ Constraint Alert: {simulationResult.new_team.constraint_violations.join('; ')}
              </div>
            )}

            {onApplySwapToTeam && !appliedSuccess && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => handleApplySwap(simulationResult.new_team)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors shadow-glow-teal"
                >
                  Apply This Swap to Recommended Team
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
