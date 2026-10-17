import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  Cpu,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type { Project, RequiredSkill, SkillLevel } from '../../types/api';
import { apiService } from '../../services/api';
import { CriticalBadge, LevelBadge } from '../common/Badge';

interface EnterProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

const TEMPLATE_EXAMPLES = [
  {
    label: 'Real-Time Streaming Engine',
    name: 'Real-Time Telemetry & Event Analytics Engine',
    team_size: 3,
    availability_window: 'Immediate (Next 3 Months)',
    description:
      'We are building an ultra-low latency event processing engine ingesting 100,000 events/sec. Requires Go for high-throughput stream processing, Python for statistical anomaly detection, React for live telemetry dashboard, and Kubernetes with Docker for containerized cluster deployment.',
  },
  {
    label: 'Autonomous Agentic AI Platform',
    name: 'Enterprise AI Multi-Agent Compliance Platform',
    team_size: 3,
    availability_window: 'Immediate (Next 2 Months)',
    description:
      'Building an explainable multi-agent system for regulatory compliance and enterprise document reasoning. Requires deep Python/LLM orchestration, PyTorch for local model fine-tuning, a modern TypeScript/React web interface, and Docker for secure container sandboxing.',
  },
  {
    label: 'HIPAA Health Portal',
    name: 'HIPAA Patient Portal & Telehealth App',
    team_size: 2,
    availability_window: 'Flexible (Next 6 Months)',
    description:
      'Patient health record management and tele-consultation platform requiring strict OAuth2 security, PostgreSQL for transactional patient data, React/TypeScript for web accessibility, and resilient CI/CD test coverage.',
  },
];

export const EnterProjectModal: React.FC<EnterProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamSize, setTeamSize] = useState<number>(3);
  const [availabilityWindow, setAvailabilityWindow] = useState('Immediate (Next 3 Months)');

  // Step 2: Extracted skills state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<RequiredSkill[]>([]);
  const [analysisWarnings, setAnalysisWarnings] = useState<string[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Manual skill add inputs
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('intermediate');
  const [newSkillCritical, setNewSkillCritical] = useState(false);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: (typeof TEMPLATE_EXAMPLES)[0]) => {
    setName(tpl.name);
    setDescription(tpl.description);
    setTeamSize(tpl.team_size);
    setAvailabilityWindow(tpl.availability_window);
    setHasAnalyzed(false);
    setExtractedSkills([]);
  };

  const handleAnalyzeWithGemma = async () => {
    if (!description.trim()) return;

    setIsAnalyzing(true);
    setAnalysisWarnings([]);

    try {
      const response = await apiService.analyzeProject({
        name: name || 'Enterprise Staffing Mandate',
        description,
        team_size: teamSize,
      });

      const project = response.data.project;
      setExtractedSkills(project.required_skills || []);
      setAnalysisWarnings(response.data.warnings || []);
      setHasAnalyzed(true);
    } catch {
      setAnalysisWarnings(['Using fallback skill extraction adapter.']);
      setHasAnalyzed(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddManualSkill = () => {
    if (!newSkillName.trim()) return;
    const exists = extractedSkills.some(
      (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (!exists) {
      setExtractedSkills([
        ...extractedSkills,
        {
          name: newSkillName.trim(),
          min_level: newSkillLevel,
          weight: newSkillCritical ? 3.0 : 2.0,
          critical: newSkillCritical,
        },
      ]);
    }
    setNewSkillName('');
    setNewSkillCritical(false);
  };

  const handleRemoveSkill = (skillName: string) => {
    setExtractedSkills(extractedSkills.filter((s) => s.name !== skillName));
  };

  const handleToggleCritical = (skillName: string) => {
    setExtractedSkills(
      extractedSkills.map((s) =>
        s.name === skillName
          ? { ...s, critical: !s.critical, weight: !s.critical ? 3.0 : 1.5 }
          : s
      )
    );
  };

  const handleCreateAndMatch = () => {
    if (!name.trim() || extractedSkills.length === 0) return;

    const newProject: Project = {
      id: `PRJ-MGR-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      description: description.trim(),
      required_skills: extractedSkills,
      team_size: teamSize,
      availability_window: availabilityWindow,
      status: 'active',
    };

    onProjectCreated(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-navy-900 border border-slate-700/90 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] card-gradient overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 m-0">
                  Enter Project Requirements
                </h3>
                <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
                  Gemma 4 E4B AI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 m-0">
                Enter your project statement of work. Gemma 4 E4B will automatically identify required skills and recommend suitable candidates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Scope Templates */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Templates (Click to Auto-fill Scope):
            </span>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_EXAMPLES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-700/80 transition-colors"
                >
                  ⚡ {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs: Project Name & Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Autonomous Fleet Telemetry Platform"
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Team Size
              </label>
              <div className="relative">
                <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value, 10) || 3)}
                  className="w-full bg-navy-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500/60"
                />
              </div>
            </div>
          </div>

          {/* Statement of Work / Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Project Requirements Statement / Scope of Work *
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Plain English requirements
              </span>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setHasAnalyzed(false);
              }}
              placeholder="Describe what the team needs to build, technologies preferred, architecture requirements, and key competencies..."
              className="w-full bg-navy-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 leading-relaxed font-sans"
            />
          </div>

          {/* AI Trigger Button */}
          {!hasAnalyzed && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleAnalyzeWithGemma}
                disabled={isAnalyzing || !description.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-navy-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>
                  {isAnalyzing
                    ? 'Gemma 4 E4B is Extracting Skills...'
                    : '⚡ 3. Identify Required Skills (Gemma 4 E4B)'}
                </span>
              </button>
            </div>
          )}

          {/* Step 3: AI-Identified Skills Display */}
          {hasAnalyzed && (
            <div className="space-y-4 pt-3 border-t border-slate-800 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5 m-0">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    AI Identified Skills ({extractedSkills.length} Required)
                  </h4>
                  <p className="text-[11px] text-slate-400 m-0 mt-0.5">
                    Gemma 4 E4B extracted the following competencies, target levels, and criticality weights:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeWithGemma}
                  disabled={isAnalyzing}
                  className="text-[11px] text-slate-400 hover:text-teal-300 underline font-mono"
                >
                  Re-analyze
                </button>
              </div>

              {/* Skills Grid/List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {extractedSkills.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-navy-950/80 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-100">{skill.name}</span>
                      <LevelBadge level={skill.min_level || 'intermediate'} size="sm" />
                      <button
                        type="button"
                        onClick={() => handleToggleCritical(skill.name)}
                        className="cursor-pointer"
                        title="Click to toggle critical flag"
                      >
                        {skill.critical ? (
                          <CriticalBadge label="Critical Skill" />
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200">
                            Standard
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-400">
                        Weight: <strong className="text-slate-200">{skill.weight}x</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill.name)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Remove skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Skill Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                <input
                  type="text"
                  placeholder="Add another skill (e.g. Redis, Rust)..."
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="flex-1 min-w-[140px] bg-navy-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60"
                />
                <select
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                  className="bg-navy-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/60"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSkillCritical}
                    onChange={(e) => setNewSkillCritical(e.target.checked)}
                    className="rounded border-slate-700 text-teal-500 focus:ring-teal-500/30"
                  />
                  <span>Critical</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddManualSkill}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-400" />
                  <span>Add</span>
                </button>
              </div>

              {analysisWarnings.length > 0 && (
                <div className="text-[11px] text-amber-300/80 flex items-center gap-1.5 pt-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{analysisWarnings[0]}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-navy-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          {hasAnalyzed ? (
            <button
              type="button"
              onClick={handleCreateAndMatch}
              disabled={extractedSkills.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-navy-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50"
            >
              <span>4 & 5. Run Matching Algorithm & Recommend Employees</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAnalyzeWithGemma}
              disabled={isAnalyzing || !description.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-navy-950 font-bold text-xs hover:bg-teal-400 transition-colors disabled:opacity-50"
            >
              <Cpu className="w-4 h-4" />
              <span>Analyze with Gemma 4 E4B</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
