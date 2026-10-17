import React from 'react';

interface ScoreBarProps {
  value: number; // 0 - 100
  label?: string;
  subLabel?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showValue?: boolean;
  colorScheme?: 'auto' | 'teal' | 'emerald' | 'indigo' | 'amber' | 'rose';
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
    if (val >= 85) return 'from-emerald-500 to-teal-400';
    if (val >= 70) return 'from-teal-500 to-cyan-400';
    if (val >= 50) return 'from-amber-500 to-yellow-400';
    return 'from-rose-500 to-red-400';
  };

  const getTextColor = (val: number) => {
    if (val >= 85) return 'text-emerald-400';
    if (val >= 70) return 'text-teal-400';
    if (val >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  let gradientColor = getAutoColor(clampedValue);
  let textColorClass = getTextColor(clampedValue);

  if (colorScheme === 'teal') {
    gradientColor = 'from-teal-500 to-cyan-400';
    textColorClass = 'text-teal-400';
  } else if (colorScheme === 'emerald') {
    gradientColor = 'from-emerald-500 to-teal-400';
    textColorClass = 'text-emerald-400';
  } else if (colorScheme === 'indigo') {
    gradientColor = 'from-indigo-500 to-blue-400';
    textColorClass = 'text-indigo-400';
  } else if (colorScheme === 'amber') {
    gradientColor = 'from-amber-500 to-yellow-400';
    textColorClass = 'text-amber-400';
  } else if (colorScheme === 'rose') {
    gradientColor = 'from-rose-500 to-red-400';
    textColorClass = 'text-rose-400';
  }

  const heightClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            {label && <span className="font-medium text-slate-300">{label}</span>}
            {subLabel && <span className="text-slate-500 text-[11px] font-mono">({subLabel})</span>}
          </div>
          {showValue && (
            <span className={`font-mono font-semibold tabular-nums text-xs ${textColorClass}`}>
              {clampedValue.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 ${heightClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${gradientColor}`}
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
