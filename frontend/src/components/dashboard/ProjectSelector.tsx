import { FolderGit2, Users, Calendar, CheckCircle2, Flame } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 m-0">
            <FolderGit2 className="w-4 h-4 text-teal-400" />
            Active Staffing Mandates
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Select an enterprise staffing project to calculate candidate matches and generate complementary teams.
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
          {projects.length} Mandates Loaded
        </span>
      </div>

      {/* 3 Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const isSelected = proj.id === selectedProjectId;

          return (
            <div
              key={proj.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectProject(proj.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectProject(proj.id);
                }
              }}
              className={`relative cursor-pointer rounded-2xl p-5 border transition-all duration-200 text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                isSelected
                  ? 'bg-navy-900 border-teal-500/80 shadow-glow-teal ring-1 ring-teal-500/30'
                  : 'bg-navy-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-navy-900/90'
              }`}
            >
              <div>
                {/* Header Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                      isSelected
                        ? 'bg-teal-950/80 text-teal-300 border-teal-500/30'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    {proj.status || 'Active'}
                  </span>

                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-teal-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Selected
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">Click to Select</span>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors leading-snug mb-1.5 m-0">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 m-0">
                  {proj.description}
                </p>
              </div>

              <div>
                {/* Meta details */}
                <div className="flex items-center gap-3 text-xs text-slate-300 mb-3.5 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target: <strong className="font-mono text-slate-100">{proj.team_size}</strong></span>
                  </div>
                  {proj.availability_window && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-400">{proj.availability_window}</span>
                    </div>
                  )}
                </div>

                {/* Skills chips */}
                <div className="flex flex-wrap gap-1.5">
                  {proj.required_skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill.name}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium flex items-center gap-1 ${
                        skill.critical
                          ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700/50'
                      }`}
                    >
                      {skill.critical && <Flame className="w-2.5 h-2.5 text-rose-400 shrink-0" />}
                      <span>{skill.name}</span>
                    </span>
                  ))}
                  {proj.required_skills.length > 3 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800/70 text-slate-400 border border-slate-700/50">
                      +{proj.required_skills.length - 3}
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
