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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-lg">
      <FolderX className="w-10 h-10 text-slate-500 mx-auto mb-2" />
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>
    </div>
  );
};
