import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCode,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'verified' | 'warnings'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'experience' | 'availability'>('score');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSkillModal, setSelectedSkillModal] = useState<{
    candidateName: string;
    candidateRole?: string;
    skill: SkillEvidence;
  } | null>(null);

  // Helper to normalize 0.0-1.0 and 0-100 score representations cleanly
  const toPct = (val?: number): number => {
    if (val === undefined || val === null || isNaN(val)) return 0;
    return Math.round(val <= 1.0 ? val * 100 : val);
  };

  // Summary Metrics calculated from actual data
  const summaryMetrics = useMemo(() => {
    if (!matches || matches.length === 0) {
      return { total: 0, criticalMet: 0, topScore: 0, avgScore: 0 };
    }
    const total = matches.length;
    const criticalMet = matches.filter((m) => toPct(m.component_scores.skill_fit) >= 70).length;
    const topScore = Math.max(...matches.map((m) => m.overall_score));
    const avgScore = matches.reduce((sum, m) => sum + m.overall_score, 0) / total;

    return { total, criticalMet, topScore, avgScore };
  }, [matches]);

  // Search, Filter, and Sort logic
  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const emp = item.employee;
        const nameMatch = emp?.name.toLowerCase().includes(q) || false;
        const roleMatch = emp?.role_title?.toLowerCase().includes(q) || false;
        const skillMatch = emp?.skills.some((s) => s.name.toLowerCase().includes(q)) || false;
        return nameMatch || roleMatch || skillMatch;
      });
    }

    // Filter type
    if (filterType === 'verified') {
      result = result.filter((item) =>
        item.employee?.skills.some((s) => s.verification_status === 'verified')
      );
    } else if (filterType === 'warnings') {
      result = result.filter((item) => item.warnings.length > 0);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'score') return b.overall_score - a.overall_score;
      if (sortBy === 'experience') {
        const expA = a.employee?.experience_years ?? 0;
        const expB = b.employee?.experience_years ?? 0;
        return expB - expA;
      }
      if (sortBy === 'availability') {
        const availA = a.employee?.availability ?? 0;
        const availB = b.employee?.availability ?? 0;
        return availB - availA;
      }
      return 0;
    });

    return result;
  }, [matches, searchQuery, filterType, sortBy]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-12 text-center shadow-card">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-700 border-t-teal-400 mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">Evaluating Candidate Matches...</h3>
        <p className="text-xs text-slate-500 mt-1">
          Running deterministic scoring formula against verified profile artifacts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Header & Scoring Formula Explanation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
            <Users className="w-5 h-5 text-teal-400" />
            Ranked Candidate Suitability
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 m-0 max-w-2xl leading-relaxed">
            Deterministic formula:{' '}
            <span className="font-mono text-teal-300">
              100 × (0.55 SkillFit + 0.20 ExpFit + 0.15 AvailFit + 0.10 InterestFit)
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono">
          <span>Formula Weights Locked</span>
          <span>•</span>
          <span className="text-teal-400">Zero Protected Traits</span>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Candidates Evaluated</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
              {summaryMetrics.total}
            </span>
            <span className="text-xs text-slate-500">Profiles Scanned</span>
          </div>
        </div>

        <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Strong Skill Alignment</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-teal-400 tabular-nums">
              {summaryMetrics.criticalMet}
            </span>
            <span className="text-xs text-slate-500">Candidates ≥ 70% Skill</span>
          </div>
        </div>

        <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Top Match Index</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {summaryMetrics.topScore.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">Highest Individual</span>
          </div>
        </div>

        <div className="bg-navy-900 border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Pool Average Match</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-300 tabular-nums">
              {summaryMetrics.avgScore.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">Mean Score</span>
          </div>
        </div>
      </div>

      {/* 3. Search, Filter, and Sort Controls Bar */}
      <div className="bg-navy-900 border border-slate-800/90 rounded-2xl p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, role, or skill (e.g. Python, Fullstack)..."
              className="w-full bg-navy-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold'
                  : 'bg-slate-850/80 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              All ({matches.length})
            </button>
            <button
              onClick={() => setFilterType('verified')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'verified'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold'
                  : 'bg-slate-850/80 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Verified Only
            </button>
            <button
              onClick={() => setFilterType('warnings')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'warnings'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'bg-slate-850/80 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Has Warnings
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'experience' | 'availability')}
              className="bg-navy-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/60"
            >
              <option value="score">Match Score (High to Low)</option>
              <option value="experience">Experience (Years)</option>
              <option value="availability">Availability (%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Candidate Ranking Table */}
      {filteredMatches.length === 0 ? (
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-12 text-center shadow-card">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No Candidates Match Query</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search keywords or resetting the verification filter.
          </p>
        </div>
      ) : (
        <div className="bg-navy-900 border border-slate-800/90 rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-navy-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-3 px-4 w-14 text-center">Rank</th>
                  <th className="py-3 px-4">Candidate & Background</th>
                  <th className="py-3 px-4 w-44">Match Index</th>
                  <th className="py-3 px-4 w-52">Score Components</th>
                  <th className="py-3 px-4 w-28 text-center">Availability</th>
                  <th className="py-3 px-4">Extracted Evidence Snippets</th>
                  <th className="py-3 px-4 w-16 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredMatches.map((item, index) => {
                  const rank = index + 1;
                  const emp = item.employee;
                  const isExpanded = expandedId === item.employee_id;
                  const hasWarnings = item.warnings.length > 0;

                  return (
                    <React.Fragment key={item.employee_id}>
                      <tr
                        className={`hover:bg-slate-850/50 transition-colors ${
                          isExpanded ? 'bg-slate-850/30' : ''
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-mono text-xs font-bold ${
                              rank === 1
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                : rank === 2
                                ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                                : rank === 3
                                ? 'bg-amber-700/20 text-amber-400 border border-amber-700/40'
                                : 'bg-slate-850 text-slate-400 border border-slate-800'
                            }`}
                          >
                            #{rank}
                          </span>
                        </td>

                        {/* Candidate Name & Role */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-teal-400 shrink-0">
                              {emp?.name.charAt(0) || 'E'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-100 text-sm truncate flex items-center gap-2">
                                <span>{emp?.name || item.employee_id}</span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {item.employee_id}
                                </span>
                              </div>
                              <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5 truncate">
                                <span>{emp?.role_title || 'Software Engineer'}</span>
                                <span className="text-slate-600">•</span>
                                <span className="font-mono text-slate-300">
                                  {emp?.experience_years ?? 4} yrs exp
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Overall Score */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-mono font-bold text-base text-slate-100 tabular-nums">
                              {item.overall_score.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-teal-400 font-mono">Verified Match</span>
                          </div>
                          <ScoreBar value={item.overall_score} size="sm" showValue={false} />
                        </td>

                        {/* Component Score Mini Breakdown */}
                        <td className="py-3 px-4 font-mono text-[10px]">
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 bg-navy-950/60 p-2 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Skill (55%):</span>
                              <strong className="text-teal-300 tabular-nums">
                                {toPct(item.component_scores.skill_fit)}%
                              </strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Exp (20%):</span>
                              <strong className="text-slate-200 tabular-nums">
                                {toPct(item.component_scores.experience_fit)}%
                              </strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Avail (15%):</span>
                              <strong className="text-indigo-300 tabular-nums">
                                {toPct(item.component_scores.availability_fit)}%
                              </strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Interest (10%):</span>
                              <strong className="text-slate-300 tabular-nums">
                                {toPct(item.component_scores.interest_fit)}%
                              </strong>
                            </div>
                          </div>
                        </td>

                        {/* Availability */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold ${
                              (emp?.availability ?? 1) >= 0.9
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                : (emp?.availability ?? 1) >= 0.7
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            <Clock className="w-3 h-3 shrink-0" />
                            {Math.round((emp?.availability ?? 1) * 100)}%
                          </span>
                        </td>

                        {/* Evidence Pills */}
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
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border transition-colors ${
                                  skill.verification_status === 'verified'
                                    ? 'bg-slate-850/80 hover:bg-slate-800 text-slate-200 border-slate-700/70'
                                    : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-500/30'
                                }`}
                                title="Click to inspect verbatim source evidence snippet"
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
                              <span className="text-[10px] font-mono text-slate-500">
                                +{emp.skills.length - 3}
                              </span>
                            )}
                          </div>

                          {hasWarnings && (
                            <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-1.5">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[200px]">{item.warnings[0]}</span>
                            </div>
                          )}
                        </td>

                        {/* Details Expand Toggle */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => toggleExpand(item.employee_id)}
                            className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
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

                      {/* Expanded Drawer Details */}
                      {isExpanded && (
                        <tr className="bg-navy-950/90 border-b border-slate-800">
                          <td colSpan={7} className="p-5 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left Column: Scoring Reasons */}
                              <div className="bg-navy-900 border border-slate-800 rounded-xl p-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-2.5 flex items-center gap-1.5 m-0">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Algorithmic Matching Rationales
                                </h4>
                                <ul className="space-y-1.5 text-xs text-slate-300 p-0 m-0 list-none">
                                  {item.reasons.map((r, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-teal-400 mt-0.5">•</span>
                                      <span>{r}</span>
                                    </li>
                                  ))}
                                </ul>

                                {hasWarnings && (
                                  <div className="mt-3.5 pt-3 border-t border-slate-800">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1.5 m-0">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      Profile Transparency Warnings
                                    </h4>
                                    <ul className="space-y-1 text-xs text-amber-300/90 p-0 m-0 list-none">
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

                              {/* Right Column: Full Skills & Evidences List */}
                              <div className="bg-navy-900 border border-slate-800 rounded-xl p-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5 m-0">
                                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                                  All Extracted Profile Skills (Click to Inspect)
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
                                      className="cursor-pointer p-2.5 rounded-lg bg-navy-950 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-200">{s.name}</span>
                                        <LevelBadge level={s.level} size="sm" />
                                        <VerificationBadge status={s.verification_status} size="sm" showIcon={false} />
                                      </div>
                                      <span className="text-[11px] text-teal-400 hover:underline flex items-center gap-1">
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
        </div>
      )}

      {/* Ground-Truth Evidence Modal */}
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
