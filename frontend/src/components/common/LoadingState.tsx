import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Analyzing project requirements and running combinatorial optimizer...',
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-lg">
      <div className="inline-flex relative mb-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 animate-pulse" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-slate-200">{message}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
        Evaluating candidate profile ground-truth evidence and computing deterministic fit scores.
      </p>
    </div>
  );
};
