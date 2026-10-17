import React, { useState } from 'react';
import { Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { Project } from '../../types/api';
import { LevelBadge, CriticalBadge } from '../common/Badge';

interface ProjectRequirementsViewProps {
  project: Project;
}

export const ProjectRequirementsView: React.FC<ProjectRequirementsViewProps> = ({ project }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const criticalCount = project.required_skills.filter((s) => s.critical).length;
  const totalWeight = project.required_skills.reduce((sum, s) => sum + s.weight, 0);

  return (
    <div className="bg-navy-900 border border-slate-800/90 rounded-2xl p-5 shadow-card overflow-hidden">
      {/* Header with Title & Collapse Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
              Staffing Mandate Specs
            </span>
            <span className="text-[10px] font-mono text-slate-500">ID: {project.id}</span>
          </div>
          <h2 className="text-base font-bold text-slate-100 truncate m-0">{project.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5 m-0 line-clamp-1 max-w-3xl leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Quick constraints pills & Collapse Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850/80 border border-slate-800 text-xs">
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">Team Size:</span>
            <strong className="font-mono text-slate-100">{project.team_size}</strong>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850/80 border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Timeline:</span>
            <span className="text-slate-200 font-medium truncate max-w-[120px]">
              {project.availability_window || 'Immediate'}
            </span>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand details' : 'Collapse details'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Requirements Table */}
      {!isCollapsed && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 animate-in fade-in duration-200">
          <div className="rounded-xl border border-slate-800/80 overflow-hidden bg-navy-950/60">
            {/* Table Header */}
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center justify-between">
              <span>
                Required Competencies ({project.required_skills.length} skills • {criticalCount} critical)
              </span>
              <span className="font-mono text-slate-400">Weight Sum: {totalWeight.toFixed(1)}x</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-800/60">
              {project.required_skills.map((skill) => (
                <div
                  key={skill.name}
                  className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-850/40 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-slate-200">{skill.name}</span>
                    {skill.critical ? (
                      <CriticalBadge label="Critical Requirement" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">Standard</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-slate-500 text-[11px]">Min Level:</span>
                      <LevelBadge level={skill.min_level || 'intermediate'} size="sm" />
                      {skill.min_proficiency && (
                        <span className="font-mono text-slate-400 text-[11px]">({skill.min_proficiency}/5)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                      <span className="text-slate-500">Weight:</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-850 text-slate-200 font-bold border border-slate-700/60">
                        {skill.weight.toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
