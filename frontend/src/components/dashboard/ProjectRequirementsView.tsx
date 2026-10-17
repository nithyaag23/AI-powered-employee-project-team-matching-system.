import React from 'react';
import { Users, Calendar } from 'lucide-react';
import type { Project } from '../../types/api';
import { LevelBadge, CriticalBadge } from '../common/Badge';

interface ProjectRequirementsViewProps {
  project: Project;
}

export const ProjectRequirementsView: React.FC<ProjectRequirementsViewProps> = ({ project }) => {
  const criticalCount = project.required_skills.filter((s) => s.critical).length;
  const totalWeight = project.required_skills.reduce((sum, s) => sum + s.weight, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              Staffing Mandate Requirements
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              ID: {project.id}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 m-0">{project.name}</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Constraint badges */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-850 border border-slate-700/80 rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Team Size</span>
            </div>
            <span className="text-base font-bold text-slate-100 font-mono">
              {project.team_size} Members
            </span>
          </div>

          <div className="bg-slate-850 border border-slate-700/80 rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Availability Window</span>
            </div>
            <span className="text-xs font-semibold text-slate-200 block truncate max-w-[140px]">
              {project.availability_window || 'Immediate Staffing'}
            </span>
          </div>
        </div>
      </div>

      {/* Required Skills Table / Grid */}
      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            Required Competencies ({project.required_skills.length} skills total • {criticalCount} marked critical)
          </span>
          <span>Sum of Importance Weights: {totalWeight.toFixed(1)}</span>
        </div>

        <div className="divide-y divide-slate-800/80 bg-slate-900/60">
          {project.required_skills.map((skill) => (
            <div
              key={skill.name}
              className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-850/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-100">{skill.name}</span>
                {skill.critical && <CriticalBadge label="Critical Requirement" />}
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>Min Proficiency:</span>
                  <LevelBadge level={skill.min_level || 'intermediate'} />
                  {skill.min_proficiency && (
                    <span className="font-mono text-slate-300">({skill.min_proficiency}/5)</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>Weight:</span>
                  <span className="font-mono font-semibold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {skill.weight.toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
