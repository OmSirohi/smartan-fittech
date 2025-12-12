import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ScanLine, Database, Settings, Menu, X, Terminal, FileCode } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import DataView from './components/DataView';
import BackupControl from './components/BackupControl';
import Deliverables from './components/Deliverables';
import { AppView, PoseData, ImageData, SystemLog } from './types';

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Simulated Database State (In-Memory)
  const [poses, setPoses] = useState<PoseData[]>([]);
  const [images, setImages] = useState<ImageData[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  // Initialize with a welcome log
  useEffect(() => {
    addLog({
      level: 'INFO',
      module: 'API',
      message: 'System initialized. Node.js backend simulator ready.'
    });
  }, []);

  const addLog = (log: Omit<SystemLog, 'id' | 'timestamp'>) => {
    const newLog: SystemLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...log
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleDataCaptured = (newPose: PoseData, newImage: ImageData) => {
    setPoses(prev => [...prev, newPose]);
    setImages(prev => [...prev, newImage]);
  };

  const SidebarItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
        currentView === view
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-gray-900 border-r border-gray-800 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PoseMaster</h1>
            <p className="text-xs text-gray-500">Backend Simulator</p>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <SidebarItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem view={AppView.SCANNER} icon={ScanLine} label="Extraction API" />
          <SidebarItem view={AppView.DATABASE} icon={Database} label="Data Explorer" />
          <SidebarItem view={AppView.SETTINGS} icon={Settings} label="Backup & Jobs" />
          <SidebarItem view={AppView.DELIVERABLES} icon={FileCode} label="Code Deliverables" />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
            <p className="mb-1 font-semibold text-gray-300">Environment:</p>
            <p>Node.js v18.16.0</p>
            <p>Postgres 15.3</p>
            <p>MongoDB 6.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
          <button 
            className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full border border-gray-700">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-gray-300">System Online</span>
            </div>
            {!process.env.API_KEY && (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 rounded-full border border-red-800">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-xs font-medium text-red-200">No API Key Detected</span>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto h-full">
            {currentView === AppView.DASHBOARD && (
              <Dashboard poses={poses} images={images} logs={logs} lastBackup={lastBackup} />
            )}
            {currentView === AppView.SCANNER && (
              <Scanner onDataCaptured={handleDataCaptured} addLog={addLog} />
            )}
            {currentView === AppView.DATABASE && (
              <DataView poses={poses} images={images} />
            )}
            {currentView === AppView.SETTINGS && (
              <BackupControl 
                poses={poses} 
                images={images} 
                addLog={addLog} 
                onBackupComplete={(time) => setLastBackup(time)} 
              />
            )}
            {currentView === AppView.DELIVERABLES && (
              <Deliverables />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;