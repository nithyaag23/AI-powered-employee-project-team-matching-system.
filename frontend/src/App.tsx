import { useState, useEffect, useCallback } from 'react';
import type { HealthResponse } from './types/api';
import { apiService } from './services/api';
import { Header } from './components/common/Header';
import { Dashboard } from './pages/Dashboard';
import { ShieldCheck, Info } from 'lucide-react';

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [dataSource, setDataSource] = useState<'live-backend' | 'mock-fixture'>('mock-fixture');
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'candidates' | 'team' | 'comparison' | 'simulator'>('candidates');

  const checkBackendHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const result = await apiService.checkHealth();
      setHealth(result);
      setDataSource(apiService.getActiveSource());
    } catch {
      setHealth({
        status: 'offline',
        ai_service_available: false,
        message: 'Could not reach backend. Running in mock fixture mode.',
      });
      setDataSource('mock-fixture');
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header & Navigation */}
      <Header
        health={health}
        dataSource={dataSource}
        isCheckingHealth={isCheckingHealth}
        onRefreshHealth={checkBackendHealth}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        <Dashboard activeTab={activeTab} />
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">SkillSync AI</span>
            <span>•</span>
            <span>Finite Loop OSS Fest 2026</span>
            <span>•</span>
            <span>3-Person Coordinated Build</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Evidence-Backed Explainability
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              Advisory Match Indicators
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
