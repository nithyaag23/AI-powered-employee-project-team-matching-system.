import { useState, useEffect, useCallback } from 'react';
import type { HealthResponse, Project } from './types/api';
import { apiService } from './services/api';
import { Sidebar, type TabKey } from './components/common/Sidebar';
import { TopNav } from './components/common/TopNav';
import { Dashboard } from './pages/Dashboard';
import { ShieldCheck, Info } from 'lucide-react';

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [dataSource, setDataSource] = useState<'live-backend' | 'mock-fixture'>('mock-fixture');
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabKey>('candidates');

  // Shared project & candidates state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');
  const [candidatesCount, setCandidatesCount] = useState<number>(8);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Responsive sidebar state
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

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

  // Initial load of projects for TopNav sync
  useEffect(() => {
    async function loadProjects() {
      try {
        const bundle = await apiService.getDemoBundle();
        setProjects(bundle.data.projects);
        if (bundle.data.projects.length > 0) {
          setSelectedProjectId(bundle.data.projects[0].id);
        }
      } catch {
        // Fallback handles gracefully
      }
    }
    loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex font-sans selection:bg-teal-500/25 selection:text-teal-200">
      {/* Left Application Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        health={health}
        dataSource={dataSource}
        isCheckingHealth={isCheckingHealth}
        onRefreshHealth={checkBackendHealth}
        candidatesCount={candidatesCount}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Compact Top Bar */}
        <TopNav
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => setSelectedProjectId(id)}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          health={health}
          dataSource={dataSource}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          candidatesCount={candidatesCount}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        {/* Dashboard Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          <Dashboard
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            selectedProjectId={selectedProjectId}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onProjectsLoaded={(loadedProjects) => setProjects(loadedProjects)}
            onCandidatesCountChange={(count) => setCandidatesCount(count)}
            isCreateModalOpen={isCreateModalOpen}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onCloseCreateModal={() => setIsCreateModalOpen(false)}
          />
        </div>

        {/* Subtle SaaS Footer */}
        <footer className="border-t border-slate-800/80 bg-navy-900/60 py-4 px-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-400">SkillSync AI</span>
              <span>•</span>
              <span>Finite Loop OSS Fest 2026</span>
              <span>•</span>
              <span className="text-teal-400 font-mono">v1.0.0</span>
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                Evidence-Grounded Extraction
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                Advisory Decision Support Only
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
