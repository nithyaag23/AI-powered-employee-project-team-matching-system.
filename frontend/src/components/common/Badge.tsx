import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, Flame, ShieldCheck } from 'lucide-react';
import type { SkillLevel, VerificationStatus } from '../../types/api';

interface StatusBadgeProps {
  status: VerificationStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const VerificationBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'sm',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  switch (status) {
    case 'verified':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 ${sizeClasses}`}
        >
          {showIcon && <CheckCircle2 className={`${iconSize} text-emerald-400 shrink-0`} />}
          <span>Verified</span>
        </span>
      );
    case 'unverified':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-amber-950/70 text-amber-300 border border-amber-500/30 ${sizeClasses}`}
        >
          {showIcon && <AlertTriangle className={`${iconSize} text-amber-400 shrink-0`} />}
          <span>Unverified</span>
        </span>
      );
    case 'unknown':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 ${sizeClasses}`}
        >
          {showIcon && <HelpCircle className={`${iconSize} text-slate-400 shrink-0`} />}
          <span>Unknown</span>
        </span>
      );
  }
};

interface LevelBadgeProps {
  level: SkillLevel;
  size?: 'sm' | 'md';
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'sm' }) => {
  const styles: Record<SkillLevel, string> = {
    advanced: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
    intermediate: 'bg-blue-950/60 text-blue-300 border-blue-500/30',
    beginner: 'bg-teal-950/60 text-teal-300 border-teal-500/30',
    unknown: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
  };

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-block rounded font-mono font-medium uppercase tracking-wider border ${
        styles[level] || styles.unknown
      } ${sizeClasses}`}
    >
      {level}
    </span>
  );
};

export const CriticalBadge: React.FC<{ label?: string }> = ({ label = 'Critical' }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/40">
    <Flame className="w-3 h-3 text-rose-400 shrink-0" />
    <span>{label}</span>
  </span>
);

export const TrustBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-850 text-slate-300 border border-slate-700">
    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
    <span>Evidence-Backed</span>
  </span>
);
