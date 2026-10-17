import React, { useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, FileCode, Sparkles, MapPin } from 'lucide-react';
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
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !skill) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl bg-navy-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden card-gradient"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-teal-400">
                Ground-Truth Evidence Inspector
              </span>
              <VerificationBadge status={skill.verification_status} size="sm" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 m-0">
              {skill.name}
              <LevelBadge level={skill.level} size="sm" />
            </h3>
            <p className="text-xs text-slate-400 mt-1 m-0">
              Candidate: <span className="text-slate-200 font-semibold">{candidateName}</span>
              {candidateRole && <span className="text-slate-500"> • {candidateRole}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4">
          {/* Evidence Quote Block */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <FileCode className="w-3.5 h-3.5 text-teal-400" />
              <span>Extracted Source Snippet</span>
            </label>
            <div className="bg-navy-950/90 border border-slate-800 rounded-xl p-4 font-sans text-xs text-slate-200 leading-relaxed border-l-4 border-l-teal-500 shadow-inner">
              <p className="m-0 italic">"{skill.evidence}"</p>
            </div>
          </div>

          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-850/70 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium">Source Artifact:</span>
              </div>
              <span className="font-mono text-slate-200 break-words text-[11px]">
                {skill.source_location || 'Technical Evaluation / Resume'}
              </span>
            </div>

            <div className="bg-slate-850/70 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium">Model Extraction Confidence:</span>
              </div>
              <span className="font-mono text-slate-200 font-bold text-sm">
                {skill.confidence !== null ? `${Math.round(skill.confidence * 100)}%` : 'N/A (Unverified)'}
              </span>
            </div>
          </div>

          {/* Verification Status Explainer */}
          {skill.verification_status === 'verified' ? (
            <div className="flex items-start gap-3 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold m-0">Verified Technical Evidence</p>
                <p className="text-emerald-400/80 mt-0.5 m-0 text-[11px]">
                  Direct code commits, architecture documentation, or verified credentials validate this skill.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold m-0">Unverified / Self-Reported Claim</p>
                <p className="text-amber-400/80 mt-0.5 m-0 text-[11px]">
                  This skill was self-reported without verified technical artifact evidence. It carries reduced weight in candidate suitability ranking.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
