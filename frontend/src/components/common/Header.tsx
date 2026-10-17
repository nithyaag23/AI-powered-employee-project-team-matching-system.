import React from 'react';
import { Cpu, Database, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import type { HealthResponse } from '../../types/api';

interface HeaderProps {
  health: HealthResponse | null;
  dataSource: 'live-backend' | 'mock-fixture';
  isCheckingHealth: boolean;
  onRefreshHealth: () => void;
  activeTab: 'candidates' | 'team' | 'comparison' | 'simulator';
  onSelectTab: (tab: 'candidates' | 'team' | 'comparison' | 'simulator') => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  dataSource,
  isCheckingHealth,
  onRefreshHealth,
  activeTab,
  onSelectTab,
}) => {
  const isLive = dataSource === 'live-backend' && health?.status === 'healthy';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      {/* Top Advisory Bar */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            <strong>SkillSync AI Advisory Engine:</strong> Transparent algorithmic suitability indicators. Not an automated hiring decision.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-slate-500">
          <span>Zero protected traits</span>
          <span>•</span>
          <span>Deterministic backend scoring</span>
          <span>•</span>
          <span>Ground-truth evidence extraction</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white m-0">SkillSync AI</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                OSS FEST MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0">
              Evidence-backed skill extraction & combinatorial team optimizer
            </p>
          </div>
        </div>

        {/* Backend & Environment Status */}
        <div className="flex items-center gap-3 text-xs">
          {/* Data Source Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
              isLive
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
            }`}
          >
            {isLive ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Database className="w-3.5 h-3.5 text-amber-400" />
            )}
            <div className="leading-tight">
              <span className="font-semibold block">
                {isLive ? 'Live FastAPI Backend' : 'Mock Fixture Mode'}
              </span>
              <span className="text-[10px] opacity-80 block">
                {isLive ? 'Connected to http://localhost:8000' : 'Seeded synthetic demo data'}
              </span>
            </div>
          </div>

          {/* AI Extraction Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-800/60 border-slate-700 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <div className="leading-tight">
              <span className="font-semibold block text-[11px]">AI Extraction Adapter</span>
              <span className="text-[10px] text-slate-400 block">
                {health?.ai_service_available ? 'Structured schema active' : 'Synthetic fallback ready'}
              </span>
            </div>
          </div>

          {/* Health Re-check Button */}
          <button
            onClick={onRefreshHealth}
            disabled={isCheckingHealth}
            title="Refresh backend connection check"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isCheckingHealth ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto py-2">
          <button
            onClick={() => onSelectTab('candidates')}
            className={`whitespace-nowrap pb-2 pt-1 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all ${
              activeTab === 'candidates'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            1. Ranked Candidates & Evidence
          </button>
          <button
            onClick={() => onSelectTab('team')}
            className={`whitespace-nowrap pb-2 pt-1 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all ${
              activeTab === 'team'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            2. Recommended Team & Coverage
          </button>
          <button
            onClick={() => onSelectTab('comparison')}
            className={`whitespace-nowrap pb-2 pt-1 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all ${
              activeTab === 'comparison'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            3. Baseline vs Optimizer
          </button>
          <button
            onClick={() => onSelectTab('simulator')}
            className={`whitespace-nowrap pb-2 pt-1 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all ${
              activeTab === 'simulator'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            4. What-If Swap Simulator
          </button>
        </nav>
      </div>
    </header>
  );
};
