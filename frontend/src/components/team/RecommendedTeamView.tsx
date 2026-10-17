import React from 'react';
import {
  CheckCircle,
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
  // Resolve member IDs to Employee objects
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
      {/* Top Banner: Metrics Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                Recommended Assembly
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                All Constraints Satisfied (0 Violations)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                {team.constraint_violations.length} Advisory Note
              </span>
            )}
          </div>
        </div>

        {/* 4 Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Weighted Coverage */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Weighted Skill Coverage</span>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {team.weighted_coverage_pct.toFixed(1)}%
              </span>
            </div>
            <ScoreBar value={team.weighted_coverage_pct} size="sm" showValue={false} colorScheme="emerald" />
          </div>

          {/* Critical Gaps */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Critical Skill Gaps</span>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className={`text-2xl font-bold font-mono ${
                  team.critical_gaps.length === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {team.critical_gaps.length}
              </span>
              <span className="text-xs text-slate-500">Uncovered Gaps</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {team.critical_gaps.length === 0
                ? 'Zero missing critical requirements'
                : `Missing: ${team.critical_gaps.join(', ')}`}
            </div>
          </div>

          {/* Mean Team Fit */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Mean Member Fit</span>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold font-mono text-indigo-400">
                {team.team_fit_score.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500">Avg Candidate Score</span>
            </div>
            <ScoreBar value={team.team_fit_score} size="sm" showValue={false} colorScheme="indigo" />
          </div>

          {/* Covered Competencies */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Covered Competencies</span>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold font-mono text-teal-400">
                {team.covered_skills.length} / {project.required_skills.length}
              </span>
              <span className="text-xs text-slate-500">Skills Met</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {team.covered_skills.join(', ')}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Members Roster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {memberObjects.map((member, idx) => {
          // Identify which project skills this member covers
          const coveredByMember = member.skills.filter((s) =>
            project.required_skills.some(
              (req) => req.name.toLowerCase() === s.name.toLowerCase()
            )
          );

          return (
            <div
              key={member.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center justify-center font-bold text-sm">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 m-0">{member.name}</h3>
                      <p className="text-xs text-slate-400 m-0">{member.role_title}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Slot #{idx + 1}
                  </span>
                </div>

                {/* Experience & Availability */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{member.experience_years} Years Exp</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{Math.round(member.availability * 100)}% Available</span>
                  </div>
                </div>

                {/* Contributed Skills */}
                <div className="mb-3">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Key Contributed Competencies:
                  </span>
                  <div className="space-y-1.5">
                    {coveredByMember.map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between text-xs bg-slate-850 p-1.5 rounded border border-slate-800"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-200">{s.name}</span>
                          <LevelBadge level={s.level} />
                        </div>
                        <VerificationBadge status={s.verification_status} showIcon={false} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Complementarity Tag */}
              <div className="border-t border-slate-800 pt-3 mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  Complementary role: {member.role_title?.toLowerCase() || 'specialist'} coverage.
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
