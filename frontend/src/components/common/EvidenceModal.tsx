import React from 'react';
import { X, ShieldCheck, AlertCircle, FileText, Sparkles } from 'lucide-react';
import type { SkillEvidence } from '../../types/api';
import { VerificationBadge, LevelBadge } from './Badge';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateRole?: string;
  skill: SkillEvidence | null;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  candidateRole,
  skill,
}) => {
  if (!isOpen || !skill) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                Ground-Truth Skill Evidence
              </span>
              <VerificationBadge status={skill.verification_status} />
            </div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {skill.name}
              <LevelBadge level={skill.level} />
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Candidate: <span className="text-slate-200 font-medium">{candidateName}</span>
              {candidateRole && ` • ${candidateRole}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Close evidence modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Evidence Snippet */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Extracted Source Snippet</span>
            </div>
            <blockquote className="text-sm text-slate-200 italic border-l-2 border-emerald-500 pl-3 py-1 my-1">
              "{skill.evidence}"
            </blockquote>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/50 border border-slate-800 p-3 rounded-lg">
              <span className="text-slate-400 block mb-1">Source Artifact / Location:</span>
              <span className="font-mono text-slate-200 break-words">
                {skill.source_location || 'Employee Profile / Self-Assessment Text'}
              </span>
            </div>
            <div className="bg-slate-800/50 border border-slate-800 p-3 rounded-lg">
              <span className="text-slate-400 block mb-1">AI Extraction Confidence:</span>
              <div className="flex items-center gap-1.5 font-mono text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {skill.confidence !== null ? `${Math.round(skill.confidence * 100)}%` : 'N/A (Unverified / Unknown)'}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Advisory */}
          {skill.verification_status === 'verified' ? (
            <div className="flex items-start gap-2.5 bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-lg text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Verified against technical artifacts</p>
                <p className="text-emerald-400/80 mt-0.5">
                  This skill proficiency was cross-referenced with code repositories, commits, or audit reports.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 bg-amber-950/40 border border-amber-800/60 p-3 rounded-lg text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unverified / Self-Reported Skill Warning</p>
                <p className="text-amber-400/80 mt-0.5">
                  No direct code, pull request, or audit logs corroborate this claim. It is not given verified weight in
                  authoritative matching scores.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
