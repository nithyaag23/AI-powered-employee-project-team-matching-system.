import React, { useState } from 'react';
import {
  Award,
  ChevronDown,
  ChevronUp,
  FileSearch,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { MatchResult, SkillEvidence } from '../../types/api';
import { ScoreBar } from '../common/ScoreBar';
import { VerificationBadge, LevelBadge } from '../common/Badge';
import { EvidenceModal } from '../common/EvidenceModal';

interface CandidateTableProps {
  matches: MatchResult[];
  isLoading?: boolean;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({ matches, isLoading }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSkillModal, setSelectedSkillModal] = useState<{
    candidateName: string;
    candidateRole?: string;
    skill: SkillEvidence;
  } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400 mb-3" />
        <p className="text-sm text-slate-300">Calculating deterministic candidate match scores...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-200">No Candidate Matches Found</h3>
        <p className="text-xs text-slate-400 mt-1">
          No employees met the minimum criteria or matching service returned empty.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Table Header Section */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
            <Award className="w-5 h-5 text-emerald-400" />
            Ranked Candidate Matches
          </h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Formula: 100 × (0.55 SkillFit + 0.20 ExperienceFit + 0.15 AvailabilityFit + 0.10 InterestFit)
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-700/80">
          Showing <strong>{matches.length}</strong> evaluated candidates
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4 w-12 text-center">Rank</th>
              <th className="py-3 px-4">Candidate & Role</th>
              <th className="py-3 px-4 w-48">Overall Match</th>
              <th className="py-3 px-4 w-52">Component Scores</th>
              <th className="py-3 px-4 w-28 text-center">Availability</th>
              <th className="py-3 px-4">Verification & Evidence</th>
              <th className="py-3 px-4 w-20 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {matches.map((item, index) => {
              const rank = index + 1;
              const emp = item.employee;
              const isExpanded = expandedId === item.employee_id;
              const hasWarnings = item.warnings.length > 0;

              return (
                <React.Fragment key={item.employee_id}>
                  <tr
                    className={`hover:bg-slate-850/60 transition-colors ${
                      isExpanded ? 'bg-slate-850/40' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-bold ${
                          rank === 1
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : rank === 2
                            ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                            : rank === 3
                            ? 'bg-amber-700/20 text-amber-400 border border-amber-700/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{rank}
                      </span>
                    </td>

                    {/* Candidate */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 text-sm">
                        {emp?.name || item.employee_id}
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                        <span>{emp?.role_title || 'Software Engineer'}</span>
                        <span>•</span>
                        <span>{emp?.experience_years ?? 4} yrs exp</span>
                      </div>
                    </td>

                    {/* Overall Score */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-100 font-mono text-sm">
                          {item.overall_score.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-400">Match Index</span>
                      </div>
                      <ScoreBar value={item.overall_score} size="md" showValue={false} />
                    </td>

                    {/* Component Scores Mini Bars */}
                    <td className="py-3 px-4">
                      <div className="space-y-1 font-mono text-[10px]">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Skill (55%):</span>
                          <span className="text-slate-200 font-medium">
                            {Math.round(item.component_scores.skill_fit)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Exp (20%):</span>
                          <span className="text-slate-200 font-medium">
                            {Math.round(item.component_scores.experience_fit)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Avail (15%):</span>
                          <span className="text-slate-200 font-medium">
                            {Math.round(item.component_scores.availability_fit)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Interest (10%):</span>
                          <span className="text-slate-200 font-medium">
                            {Math.round(item.component_scores.interest_fit)}%
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Availability */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
                          (emp?.availability ?? 1) >= 0.9
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : (emp?.availability ?? 1) >= 0.7
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {Math.round((emp?.availability ?? 1) * 100)}%
                      </span>
                    </td>

                    {/* Verification and Evidence Pill */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {emp?.skills.slice(0, 3).map((skill) => (
                          <button
                            key={skill.name}
                            onClick={() =>
                              setSelectedSkillModal({
                                candidateName: emp.name,
                                candidateRole: emp.role_title,
                                skill,
                              })
                            }
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
                              skill.verification_status === 'verified'
                                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                                : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/80'
                            }`}
                            title="Click to view verbatim extracted evidence"
                          >
                            <span>{skill.name}</span>
                            {skill.verification_status === 'verified' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            )}
                          </button>
                        ))}
                        {emp && emp.skills.length > 3 && (
                          <span className="text-[10px] text-slate-500">
                            +{emp.skills.length - 3}
                          </span>
                        )}
                      </div>

                      {hasWarnings && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {item.warnings[0]}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Expand Details Toggle */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleExpand(item.employee_id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        aria-label="Toggle candidate breakdown"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <tr className="bg-slate-950/80 border-b border-slate-800">
                      <td colSpan={7} className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left: Scoring Rationales */}
                          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Deterministic Matching Reasons
                            </h4>
                            <ul className="space-y-1.5 text-xs text-slate-300">
                              {item.reasons.map((r, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-emerald-400 mt-0.5">•</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>

                            {hasWarnings && (
                              <div className="mt-3 pt-3 border-t border-slate-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Profile Transparency Warnings
                                </h4>
                                <ul className="space-y-1 text-xs text-amber-300/90">
                                  {item.warnings.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span>⚠</span>
                                      <span>{w}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Right: Full Extracted Skills & Source Evidences */}
                          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                              <FileSearch className="w-3.5 h-3.5 text-indigo-400" />
                              All Extracted Skills & Evidence Snippets (Click to Inspect)
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {emp?.skills.map((s) => (
                                <div
                                  key={s.name}
                                  onClick={() =>
                                    setSelectedSkillModal({
                                      candidateName: emp.name,
                                      candidateRole: emp.role_title,
                                      skill: s,
                                    })
                                  }
                                  className="cursor-pointer p-2 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-200">{s.name}</span>
                                    <LevelBadge level={s.level} />
                                    <VerificationBadge status={s.verification_status} showIcon={false} />
                                  </div>
                                  <span className="text-[11px] text-emerald-400 hover:underline">
                                    Inspect Snippet &rarr;
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Evidence Modal Popover */}
      {selectedSkillModal && (
        <EvidenceModal
          isOpen={true}
          onClose={() => setSelectedSkillModal(null)}
          candidateName={selectedSkillModal.candidateName}
          candidateRole={selectedSkillModal.candidateRole}
          skill={selectedSkillModal.skill}
        />
      )}
    </div>
  );
};
