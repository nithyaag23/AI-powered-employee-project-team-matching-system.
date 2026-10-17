import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, Flame } from 'lucide-react';
import type { SkillLevel, VerificationStatus } from '../../types/api';

interface StatusBadgeProps {
  status: VerificationStatus;
  showIcon?: boolean;
}

export const VerificationBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true }) => {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
          {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          Verified Source
        </span>
      );
    case 'unverified':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-800/80">
          {showIcon && <AlertTriangle className="w-3 h-3 text-amber-400" />}
          Unverified / Self-Reported
        </span>
      );
    case 'unknown':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
          {showIcon && <HelpCircle className="w-3 h-3 text-slate-400" />}
          Unknown / No Data
        </span>
      );
  }
};

interface LevelBadgeProps {
  level: SkillLevel;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level }) => {
  const styles: Record<SkillLevel, string> = {
    advanced: 'bg-purple-950/70 text-purple-300 border-purple-800/80',
    intermediate: 'bg-blue-950/70 text-blue-300 border-blue-800/80',
    beginner: 'bg-teal-950/70 text-teal-300 border-teal-800/80',
    unknown: 'bg-slate-800/80 text-slate-400 border-slate-700',
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${
        styles[level] || styles.unknown
      }`}
    >
      {level}
    </span>
  );
};

export const CriticalBadge: React.FC<{ label?: string }> = ({ label = 'Critical' }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-700">
    <Flame className="w-3 h-3 text-rose-400" />
    {label}
  </span>
);
