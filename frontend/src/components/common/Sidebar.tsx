import React from 'react';
import {
  Users,
  Layers,
  Scale,
  ArrowLeftRight,
  Cpu,
  Sparkles,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { HealthResponse } from '../../types/api';

export type TabKey = 'candidates' | 'team' | 'comparison' | 'simulator';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  health: HealthResponse | null;
  dataSource: 'live-backend' | 'mock-fixture';
  isCheckingHealth: boolean;
  onRefreshHealth: () => void;
  candidatesCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  health,
  dataSource,
  isCheckingHealth,
  onRefreshHealth,
  candidatesCount,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapsed,
}) => {
  const isLive = dataSource === 'live-backend' && health?.status === 'healthy';

  const navItems = [
    {
      id: 'candidates' as TabKey,
      label: 'Candidate Rankings',
      shortLabel: 'Rankings',
      icon: Users,
      badge: candidatesCount ? `${candidatesCount}` : undefined,
      description: 'Match scores & evidence',
    },
    {
      id: 'team' as TabKey,
      label: 'Team Builder',
      shortLabel: 'Team',
      icon: Layers,
      badge: 'Optimal',
      badgeColor: 'emerald',
      description: 'Coverage & complement',
    },
    {
      id: 'comparison' as TabKey,
      label: 'Baseline vs Optimizer',
      shortLabel: 'Benchmark',
      icon: Scale,
      description: 'Fair side-by-side test',
    },
    {
      id: 'simulator' as TabKey,
      label: 'What-If Simulator',
      shortLabel: 'Simulator',
      icon: ArrowLeftRight,
      description: 'Interactive sensitivity',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-navy-900 border-r border-slate-800/90 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="text-sm font-bold tracking-tight text-white block truncate leading-tight">
                  SkillSync AI
                </span>
                <span className="text-[10px] text-teal-400 font-mono font-medium block truncate">
                  Enterprise Optimizer
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapsed}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-300 font-semibold border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="truncate">
                      <span className="text-xs block truncate leading-tight">{item.label}</span>
                      <span className="text-[10px] text-slate-500 block truncate leading-tight font-normal">
                        {item.description}
                      </span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-medium shrink-0 ml-1.5 ${
                          item.badgeColor === 'emerald'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* System & Health Status Area */}
        <div className="p-3 border-t border-slate-800/80 bg-navy-950/40">
          {!isCollapsed ? (
            <div className="space-y-2.5">
              {/* Connection Pill */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <span className="font-semibold text-slate-200 text-[11px]">
                      {isLive ? 'FastAPI Connected' : 'Mock Mode Active'}
                    </span>
                  </div>
                  <button
                    onClick={onRefreshHealth}
                    disabled={isCheckingHealth}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
                    title="Refresh connection status"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin text-teal-400' : ''}`} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 m-0 truncate">
                  {isLive ? 'http://localhost:8000' : 'Offline Seed Data'}
                </p>
              </div>

              {/* AI Engine Status */}
              <div className="px-2 py-1.5 rounded-lg bg-slate-850/50 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Open-Weight AI</span>
                </div>
                <span className="text-[10px] font-mono text-slate-300">
                  {health?.ai_service_available ? 'Ready' : 'Fallback'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`}
                title={isLive ? 'FastAPI Connected' : 'Mock Mode'}
              />
              <button
                onClick={onRefreshHealth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                title="Refresh Health"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin text-teal-400' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
