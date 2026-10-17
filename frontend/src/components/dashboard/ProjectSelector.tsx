import { FolderGit2, Users, Calendar, CheckCircle } from 'lucide-react';
import type { Project } from '../../types/api';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
            <FolderGit2 className="w-5 h-5 text-emerald-400" />
            Active Project Selection
          </h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Select a seeded staffing mandate to evaluate candidate rankings and run combinatorial team optimization.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
          {projects.length} Demo Projects Loaded
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const isSelected = proj.id === selectedProjectId;

          return (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className={`relative cursor-pointer rounded-xl p-4 border transition-all text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-850 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isSelected
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {proj.status || 'Active mandate'}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-100 leading-snug mb-1.5">{proj.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {proj.description}
                </p>
              </div>

              <div>
                {/* Meta details */}
                <div className="flex items-center gap-3 text-[11px] text-slate-300 mb-3 border-t border-slate-800/80 pt-2.5">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Team: <strong>{proj.team_size}</strong></span>
                  </div>
                  {proj.availability_window && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{proj.availability_window}</span>
                    </div>
                  )}
                </div>

                {/* Required Skills Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {proj.required_skills.slice(0, 4).map((s) => (
                    <span
                      key={s.name}
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        s.critical
                          ? 'bg-rose-950/50 text-rose-300 border-rose-900/80 font-medium'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700'
                      }`}
                    >
                      {s.name}
                      {s.critical && ' *'}
                    </span>
                  ))}
                  {proj.required_skills.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      +{proj.required_skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
