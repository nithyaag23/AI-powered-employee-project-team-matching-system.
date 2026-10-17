import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Service Unavailable or Request Error',
  message = 'An unexpected error occurred while communicating with the matching service.',
  onRetry,
}) => {
  return (
    <div className="bg-navy-900 border border-rose-500/30 rounded-2xl p-8 text-center shadow-card">
      <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-3.5">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-rose-200 m-0">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed m-0">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
