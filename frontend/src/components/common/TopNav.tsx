import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  FolderGit2,
  ShieldCheck,
  CheckCircle2,
  Database,
  ChevronDown,
  Users,
  Layers,
  Scale,
  ArrowLeftRight,
  Check,
} from 'lucide-react';
import type { Project, HealthResponse } from '../../types/api';
import type { TabKey } from './Sidebar';

interface TopNavProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenMobileSidebar: () => void;
  health: HealthResponse | null;
  dataSource: 'live-backend' | 'mock-fixture';
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  candidatesCount?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onOpenMobileSidebar,
  health,
  dataSource,
  activeTab,
  onSelectTab,
  candidatesCount,
}) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const isLive = dataSource === 'live-backend' && health?.status === 'healthy';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    {
      id: 'candidates' as TabKey,
      label: 'Candidate Rankings',
      shortLabel: 'Rankings',
      icon: Users,
      badge: candidatesCount ? `${candidatesCount}` : undefined,
    },
    {
      id: 'team' as TabKey,
      label: 'Team Builder',
      shortLabel: 'Team',
      icon: Layers,
      badge: 'Optimal',
    },
    {
      id: 'comparison' as TabKey,
      label: 'Baseline vs Optimizer',
      shortLabel: 'Benchmark',
      icon: Scale,
    },
    {
      id: 'simulator' as TabKey,
      label: 'What-If Simulator',
      shortLabel: 'Simulator',
      icon: ArrowLeftRight,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-navy-900/90 backdrop-blur-md border-b border-slate-800/80 shadow-sm">
      {/* Upper Row: Brand, Project Selector, Status Pills */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger & Active project picker */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Interactive Project Selector Dropdown Pill */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
              aria-expanded={isProjectDropdownOpen}
              aria-haspopup="listbox"
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-left group ${
                isProjectDropdownOpen
                  ? 'bg-slate-800 border-teal-500/60 ring-2 ring-teal-500/20'
                  : 'bg-slate-850/90 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
                <FolderGit2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 leading-none">
                  Active Staffing Mandate
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-bold text-slate-100 truncate max-w-[180px] sm:max-w-xs">
                    {currentProject?.name || 'Select Project'}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 border border-slate-700/80">
                    {currentProject?.id}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isProjectDropdownOpen ? 'rotate-180 text-teal-400' : ''
                }`}
              />
            </button>

            {/* Click-Toggled Dropdown Menu */}
            {isProjectDropdownOpen && (
              <div
                role="listbox"
                className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-navy-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 card-gradient animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                  <span>Switch Staffing Mandate</span>
                  <span className="font-mono text-teal-400">{projects.length} Mandates</span>
                </div>

                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {projects.map((proj) => {
                    const isSelected = proj.id === selectedProjectId;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onSelectProject(proj.id);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-teal-500/15 text-teal-200 font-semibold border border-teal-500/40 shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-100 truncate">{proj.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                              {proj.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 m-0 mb-1.5">
                            {proj.description}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                            <span>Team: {proj.team_size} members</span>
                            <span>•</span>
                            <span className="text-teal-400">{proj.availability_window || 'Immediate'}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-400 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1 bg-navy-950/80 p-1 rounded-xl border border-slate-800/80"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all font-medium ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-teal-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.shortLabel}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      isActive
                        ? 'bg-teal-950 text-teal-300 border border-teal-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Status and Ethical AI Disclaimer */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Ethical AI Advisory Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-850/60 border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Explainable AI</span>
          </div>

          {/* Live / Mock Mode Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
              isLive
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/30 text-amber-300'
            }`}
          >
            {isLive ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="hidden sm:inline font-mono">{isLive ? 'FastAPI 200 OK' : 'Mock Mode'}</span>
          </div>
        </div>
      </div>

      {/* Sub-header Navigation Tabs Bar (Visible on mobile & tablet) */}
      <div className="md:hidden border-t border-slate-800/80 px-4 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-navy-950/70">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all font-medium ${
                isActive
                  ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-teal-400' : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1 rounded font-semibold ${
                    isActive
                      ? 'bg-teal-950 text-teal-300 border border-teal-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
