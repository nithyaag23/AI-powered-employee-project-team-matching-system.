import React from 'react';

interface ScoreBarProps {
  value: number; // 0 - 100
  label?: string;
  subLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  colorScheme?: 'auto' | 'emerald' | 'indigo' | 'amber' | 'rose';
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  value,
  label,
  subLabel,
  size = 'md',
  showValue = true,
  colorScheme = 'auto',
}) => {
  const clampedValue = Math.min(100, Math.max(0, Math.round(value * 10) / 10));

  const getAutoColor = (val: number) => {
    if (val >= 85) return 'bg-emerald-500 shadow-emerald-500/20';
    if (val >= 70) return 'bg-teal-500 shadow-teal-500/20';
    if (val >= 50) return 'bg-amber-500 shadow-amber-500/20';
    return 'bg-rose-500 shadow-rose-500/20';
  };

  const getTextColor = (val: number) => {
    if (val >= 85) return 'text-emerald-400';
    if (val >= 70) return 'text-teal-400';
    if (val >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  let barColorClass = getAutoColor(clampedValue);
  let textColorClass = getTextColor(clampedValue);

  if (colorScheme === 'emerald') {
    barColorClass = 'bg-emerald-500';
    textColorClass = 'text-emerald-400';
  } else if (colorScheme === 'indigo') {
    barColorClass = 'bg-indigo-500';
    textColorClass = 'text-indigo-400';
  } else if (colorScheme === 'amber') {
    barColorClass = 'bg-amber-500';
    textColorClass = 'text-amber-400';
  } else if (colorScheme === 'rose') {
    barColorClass = 'bg-rose-500';
    textColorClass = 'text-rose-400';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs mb-1">
          <div className="flex items-center gap-1.5">
            {label && <span className="font-medium text-slate-300">{label}</span>}
            {subLabel && <span className="text-slate-500 text-[11px]">({subLabel})</span>}
          </div>
          {showValue && (
            <span className={`font-mono font-semibold ${textColorClass}`}>
              {clampedValue}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 ${heightClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColorClass}`}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};
