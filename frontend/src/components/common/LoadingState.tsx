import React from 'react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Calculating candidate match scores and running team optimizer...',
  subMessage = 'Evaluating candidate profile ground-truth evidence and computing deterministic fit scores.',
}) => {
  return (
    <div className="bg-navy-900 border border-slate-800/90 rounded-2xl p-12 text-center shadow-card">
      <div className="inline-flex relative mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-teal-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full bg-teal-400/20 animate-pulse" />
        </div>
      </div>
      <h3 className="text-sm font-semibold text-slate-200 m-0">{message}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto m-0">
        {subMessage}
      </p>
    </div>
  );
};
