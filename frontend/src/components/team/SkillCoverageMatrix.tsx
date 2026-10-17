import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import type { TeamResult, Employee, Project } from '../../types/api';
import { CriticalBadge, LevelBadge } from '../common/Badge';

interface SkillCoverageMatrixProps {
  team: TeamResult;
  employees: Employee[];
  project: Project;
}

export const SkillCoverageMatrix: React.FC<SkillCoverageMatrixProps> = ({
  team,
  employees,
  project,
}) => {
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

  return (
    <div className="bg-navy-900 border border-slate-800/90 rounded-2xl p-6 shadow-card space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          Skill Coverage & Gap Audit
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 m-0">
          Cross-referencing mandate requirements against verified credentials of the assembled team roster.
        </p>
      </div>

      {/* 3 Categories: Covered, Partial, Critical Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Fully Covered Competencies */}
        <div className="bg-navy-950/70 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider m-0">
                  Fully Covered Skills
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                {team.covered_skills.length}
              </span>
            </div>

            <div className="space-y-2">
              {team.covered_skills.map((skillName) => {
                const req = project.required_skills.find(
                  (s) => s.name.toLowerCase() === skillName.toLowerCase()
                );
                const coveringMember = memberObjects.find((m) =>
                  m.skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())
                );
                const skillDetails = coveringMember?.skills.find(
                  (s) => s.name.toLowerCase() === skillName.toLowerCase()
                );

                return (
                  <div
                    key={skillName}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-100">{skillName}</span>
                      {req?.critical && <CriticalBadge label="Critical" />}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Covered by: <strong className="text-slate-200">{coveringMember?.name || 'Team'}</strong></span>
                      {skillDetails && <LevelBadge level={skillDetails.level} size="sm" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-emerald-400/80 pt-3 border-t border-emerald-500/10 mt-3 m-0">
            ✓ Meets or exceeds required proficiency threshold.
          </p>
        </div>

        {/* 2. Partially Covered Skills */}
        <div className="bg-navy-950/70 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider m-0">
                  Partially Covered
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                {team.partial_skills.length}
              </span>
            </div>

            {team.partial_skills.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No partial skill deficiencies detected.
              </div>
            ) : (
              <div className="space-y-2">
                {team.partial_skills.map((skillName) => {
                  const req = project.required_skills.find(
                    (s) => s.name.toLowerCase() === skillName.toLowerCase()
                  );
                  return (
                    <div
                      key={skillName}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-slate-100">{skillName}</span>
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                          Below Target Prof.
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 m-0">
                        Target requirement: {req?.min_level || 'intermediate'} ({req?.min_proficiency || 3}/5).
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-[11px] text-amber-400/80 pt-3 border-t border-amber-500/10 mt-3 m-0">
            ⚠ Present in team but may require senior mentoring or pair programming.
          </p>
        </div>

        {/* 3. Critical Uncovered Gaps */}
        <div className="bg-navy-950/70 border border-rose-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-rose-500/20">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider m-0">
                  Critical Gaps
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                {team.critical_gaps.length}
              </span>
            </div>

            {team.critical_gaps.length === 0 ? (
              <div className="text-center py-8 text-xs text-emerald-400 bg-emerald-950/30 rounded-xl border border-emerald-500/30 p-5">
                <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-emerald-400" />
                <span className="font-bold text-sm block text-emerald-300">Zero Critical Gaps</span>
                <span className="text-[11px] text-emerald-400/80 mt-1 block">
                  All critical competencies are satisfied by the recommended team composition.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {team.critical_gaps.map((skillName) => (
                  <div
                    key={skillName}
                    className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold">{skillName}</span>
                      <CriticalBadge label="Critical Risk" />
                    </div>
                    <p className="text-[11px] text-rose-300/90 m-0">
                      No candidate in the assembled team possesses this required competency.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-rose-400/80 pt-3 border-t border-rose-500/10 mt-3 m-0">
            ✕ High staffing risk: requires external contract support or scope adjustment.
          </p>
        </div>
      </div>
    </div>
  );
};
