import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Clock,
} from 'lucide-react';
import type { TeamResult, Employee, Project } from '../../types/api';
import { ScoreBar } from '../common/ScoreBar';
import { LevelBadge, VerificationBadge } from '../common/Badge';

interface RecommendedTeamViewProps {
  team: TeamResult;
  employees: Employee[];
  project: Project;
}

export const RecommendedTeamView: React.FC<RecommendedTeamViewProps> = ({
  team,
  employees,
  project,
}) => {
  // Resolve member objects
  const memberObjects: Employee[] = team.members.map((m) => {
    if (typeof m === 'string') {
      return (
        employees.find((e) => e.id === m) || {
          id: m,
          name: `Employee ${m}`,
          skills: [],
          experience_years: 5,
          availability: 1.0,
          interests: [],
        }
      );
    }
    return m;
  });

  const hasConstraintViolations = team.constraint_violations.length > 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Metric Summary Card */}
      <div className="bg-navy-900 border border-slate-800/90 rounded-2xl p-6 shadow-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
                Recommended Assembly
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-850 text-slate-300 border border-slate-700/60 font-mono">
                {team.algorithm_used || 'Combinatorial Coverage Optimizer'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 m-0">
              Optimal Complementary Team ({memberObjects.length} Members)
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Hard Constraints:</span>
            {!hasConstraintViolations ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>All Constraints Satisfied</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{team.constraint_violations.length} Advisory Flag</span>
              </span>
            )}
          </div>
        </div>

        {/* 4 Key Summary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Weighted Skill Coverage */}
          <div className="bg-navy-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Weighted Skill Coverage</span>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold font-mono text-teal-400 tabular-nums">
                {team.weighted_coverage_pct.toFixed(1)}%
              </span>
            </div>
            <ScoreBar value={team.weighted_coverage_pct} size="xs" showValue={false} colorScheme="teal" />
          </div>

          {/* Critical Gaps */}
          <div className="bg-navy-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Critical Skill Gaps</span>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className={`text-2xl font-bold font-mono tabular-nums ${
                  team.critical_gaps.length === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {team.critical_gaps.length}
              </span>
              <span className="text-xs text-slate-500">Uncovered</span>
            </div>
            <p className="text-[11px] text-slate-400 m-0 truncate">
              {team.critical_gaps.length === 0 ? 'Zero critical bottlenecks' : team.critical_gaps.join(', ')}
            </p>
          </div>

          {/* Mean Team Fit */}
          <div className="bg-navy-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Mean Member Fit</span>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold font-mono text-indigo-300 tabular-nums">
                {team.team_fit_score.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500">Avg Score</span>
            </div>
            <ScoreBar value={team.team_fit_score} size="xs" showValue={false} colorScheme="indigo" />
          </div>

          {/* Covered Competencies */}
          <div className="bg-navy-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Covered Competencies</span>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                {team.covered_skills.length} / {project.required_skills.length}
              </span>
              <span className="text-xs text-slate-500">Skills Met</span>
            </div>
            <p className="text-[11px] text-slate-400 m-0 truncate">
              {team.covered_skills.join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Assembled Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {memberObjects.map((member, idx) => {
          const coveredByMember = member.skills.filter((s) =>
            project.required_skills.some(
              (req) => req.name.toLowerCase() === s.name.toLowerCase()
            )
          );

          return (
            <div
              key={member.id}
              className="bg-navy-900 border border-slate-800/90 rounded-2xl p-5 shadow-card flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-100 truncate m-0">{member.name}</h3>
                      <p className="text-xs text-slate-400 truncate m-0">{member.role_title}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-850 text-slate-400 border border-slate-700/60 shrink-0">
                    Slot #{idx + 1}
                  </span>
                </div>

                {/* Experience & Availability Chips */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3.5 bg-navy-950/70 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Award className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="font-mono">{member.experience_years} Yrs Exp</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-mono">{Math.round(member.availability * 100)}% Avail</span>
                  </div>
                </div>

                {/* Contributed Competencies */}
                <div className="mb-3">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Contributed Competencies:
                  </span>
                  <div className="space-y-1.5">
                    {coveredByMember.map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between text-xs bg-slate-850/80 p-2 rounded-lg border border-slate-800"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-200">{s.name}</span>
                          <LevelBadge level={s.level} size="sm" />
                        </div>
                        <VerificationBadge status={s.verification_status} size="sm" showIcon={false} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Complementarity Footer Note */}
              <div className="border-t border-slate-800/80 pt-3 mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate">
                  Role fit: {member.role_title?.toLowerCase() || 'specialist'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
