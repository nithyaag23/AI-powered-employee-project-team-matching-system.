import React from 'react';
import { FolderX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  message = 'No matching records were found for the selected criteria.',
}) => {
  return (
    <div className="bg-navy-900 border border-slate-800/90 rounded-2xl p-10 text-center shadow-card">
      <FolderX className="w-10 h-10 text-slate-600 mx-auto mb-2.5" />
      <h3 className="text-sm font-semibold text-slate-200 m-0">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto m-0 leading-relaxed">{message}</p>
    </div>
  );
};
