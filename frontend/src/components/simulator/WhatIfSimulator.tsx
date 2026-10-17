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
  // Resolve member IDs to Employee objects
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

  const handleRunSimulation = async () => {
    if (!selectedRemoveId || !selectedAddId) return;

    setIsSimulating(true);
    setSimulationError(null);

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

  const removedEmployee = teamMembers.find((e) => e.id === selectedRemoveId);
  const addedEmployee = availableReplacements.find((e) => e.id === selectedAddId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              Interactive Sensitivity Analysis
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Zero Page Reload
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 m-0 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
            What-If Team Member Swap Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 m-0 max-w-2xl leading-relaxed">
            Test alternative staffing compositions by swapping a recommended member with another candidate to assess
            the real-time impact on skill coverage, critical gaps, and constraints.
          </p>
        </div>
      </div>

      {/* Swap Controls Form */}
      <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          {/* Member to Remove */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <UserMinus className="w-3.5 h-3.5 text-rose-400" />
              <span>Current Member to Remove:</span>
            </label>
            <select
              value={selectedRemoveId}
              onChange={(e) => setSelectedRemoveId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role_title || 'Engineer'}) — {m.experience_years} yrs exp, {Math.round(m.availability * 100)}% avail
                </option>
              ))}
            </select>
          </div>

          {/* Swap Indicator */}
          <div className="flex justify-center items-center">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>

          {/* Candidate to Add */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Candidate to Add in Replacement:</span>
            </label>
            <select
              value={selectedAddId}
              onChange={(e) => setSelectedAddId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {availableReplacements.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.role_title || 'Specialist'}) — {e.experience_years} yrs exp, {Math.round(e.availability * 100)}% avail
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Evaluating swap:</span>
            <span className="font-semibold text-rose-300">{removedEmployee?.name}</span>
            <span>&rarr;</span>
            <span className="font-semibold text-emerald-300">{addedEmployee?.name}</span>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating || !selectedRemoveId || !selectedAddId}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Simulating Swap...' : 'Recalculate Metrics'}
          </button>
        </div>
      </div>

      {simulationError && (
        <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{simulationError}</span>
        </div>
      )}

      {/* Simulation Result Comparison */}
      {simulationResult && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Delta Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Coverage Delta */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Coverage Change</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-slate-100">
                  {simulationResult.new_team.weighted_coverage_pct.toFixed(1)}%
                </span>
                <span
                  className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                    simulationResult.deltas.coverage_pct_delta > 0
                      ? 'text-emerald-400'
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
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Critical Skill Gaps</span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xl font-bold font-mono ${
                    simulationResult.new_team.critical_gaps.length === 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {simulationResult.new_team.critical_gaps.length} Gaps
                </span>
                <span className="text-xs font-mono text-slate-400">
                  ({simulationResult.deltas.critical_gaps_delta >= 0 ? `+${simulationResult.deltas.critical_gaps_delta}` : simulationResult.deltas.critical_gaps_delta} delta)
                </span>
              </div>
            </div>

            {/* Team Fit Delta */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Mean Team Fit</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-indigo-300">
                  {simulationResult.new_team.team_fit_score.toFixed(1)}%
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    simulationResult.deltas.team_fit_delta >= 0
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {simulationResult.deltas.team_fit_delta >= 0
                    ? `+${simulationResult.deltas.team_fit_delta.toFixed(1)}%`
                    : `${simulationResult.deltas.team_fit_delta.toFixed(1)}%`}
                </span>
              </div>
            </div>

            {/* Constraint Violations */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
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
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Swap Evaluation Notes:
            </h4>
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

            {onApplySwapToTeam && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => onApplySwapToTeam(simulationResult.new_team)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-md shadow-emerald-900/30"
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
