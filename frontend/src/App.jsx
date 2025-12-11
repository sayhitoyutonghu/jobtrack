import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Settings,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  LoaderCircle,
  ShieldCheck,
  RefreshCcw,
  Inbox,
  Layout
} from 'lucide-react';
import Dashboard from './Dashboard.jsx';
import JobTrackBoard from './components/JobTrackBoard';
import ScanLogs from './components/ScanLogs';
import { authApi, gmailApi } from './api/client.js';
import './App.css';

const JobEmailCategorizationApp = () => {
  const [view, setView] = useState('board'); // 'board', 'labels', 'scanlogs'
  const [labels, setLabels] = useState([]);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [labelsError, setLabelsError] = useState(null);

  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState(null);

  const [autoScanStatus, setAutoScanStatus] = useState({ running: false });
  const [autoScanLoading, setAutoScanLoading] = useState(false);
  const [autoScanError, setAutoScanError] = useState(null);

  const [authStatus, setAuthStatus] = useState({ authenticated: false, sessionId: null });
  const [authLoading, setAuthLoading] = useState(false);

  // Custom label creation state
  const [showCreateLabelForm, setShowCreateLabelForm] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: '', description: '', color: '#4a86e8', icon: '📋' });
  const [createLabelLoading, setCreateLabelLoading] = useState(false);
  const [createLabelError, setCreateLabelError] = useState(null);

  // AI analysis state
  const [emailContent, setEmailContent] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const [query, setQuery] = useState('is:unread');
  const [queryOption, setQueryOption] = useState('is:unread');
  const [maxResults, setMaxResults] = useState(25);

  useEffect(() => {
    // Check if we have a session parameter from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('session');

    if (sessionFromUrl) {
      localStorage.setItem('session_id', sessionFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    loadAuthStatus();
    // loadAutoScanStatus(); // Commented out to prevent errors if backend doesn't support it yet
  }, []);

  const loadAuthStatus = async () => {
    try {
      setAuthLoading(true);
      // Try to check status, if 404/error, assume not authenticated or handle gracefully
      try {
        const status = await authApi.checkStatus();
        setAuthStatus(status);
        if (status.authenticated && status.sessionId) {
          localStorage.setItem('session_id', status.sessionId);
        }
      } catch (e) {
        console.warn("Auth check failed (backend might not support it yet):", e);
        // For now, if we are in local dev with python, we might want to fake it or just show unauthenticated
        // setAuthStatus({ authenticated: true, sessionId: 'dev-session' }); // Uncomment to force auth for testing
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthStatus({ authenticated: false, sessionId: null });
    } finally {
      setAuthLoading(false);
    }
  };

  const loadLabels = async () => {
    if (!authStatus.authenticated) return;
    try {
      setLabelsLoading(true);
      const response = await gmailApi.getLabels();
      if (response.success) {
        setLabels(response.labels);
        setLabelsError(null);
      } else {
        setLabels(response.labels || []);
        setLabelsError(response.error || 'Unable to load label configuration');
      }
    } catch (error) {
      console.error('Failed to load labels:', error);
      setLabels([]);
      setLabelsError('Unable to load label configuration');
    } finally {
      setLabelsLoading(false);
    }
  };

  const handleLabelToggleUpdate = useCallback((labelId, enabled) => {
    setLabels((prev) =>
      prev.map((label) =>
        label.id === labelId ? { ...label, enabled } : label
      )
    );
  }, []);

  const handleLogin = () => {
    authApi.login();
  };

  const handleLogout = () => {
    localStorage.removeItem('session_id');
    setAuthStatus({ authenticated: false, sessionId: null });
  };

  return (
    <div className="app-shell flex w-screen h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-6 border-b border-zinc-100">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-mono rounded-sm">#</span>
            JobTrack
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Gmail Job Tracking Control Center</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setView('board')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${view === 'board' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            <Layout size={18} />
            <span>Board View</span>
          </button>
          <button
            onClick={() => { setView('labels'); loadLabels(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${view === 'labels' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            <Inbox size={18} />
            <span>Label Management</span>
          </button>
          <button
            onClick={() => setView('scanlogs')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${view === 'scanlogs' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            <RefreshCcw size={18} />
            <span>Scan Logs</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-100">
          {authStatus.authenticated ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium truncate">Connected</p>
                <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">Logout</button>
              </div>
            </div>
          ) : (
            <button onClick={handleLogin} className="w-full py-2 border border-zinc-300 rounded-md text-xs font-medium hover:bg-zinc-50">
              Sign in with Google
            </button>
          )}
          {!authStatus.authenticated && (
            <div className="mt-4 px-1">
              <p className="text-xs text-zinc-400 text-center leading-relaxed">
                Currently in Private Beta. <br />
                Sign in restricted to approved testers.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full h-full overflow-hidden bg-zinc-50 relative">
        <div className={view === 'board' ? 'h-full w-full' : 'hidden'}>
          <JobTrackBoard />
        </div>

        <div className={view === 'labels' ? 'p-8 max-w-5xl mx-auto h-full overflow-y-auto' : 'hidden'}>
          <Dashboard
            labels={labels}
            loading={labelsLoading}
            onRefresh={loadLabels}
            onToggleUpdate={handleLabelToggleUpdate}
          />
        </div>

        <div className={view === 'scanlogs' ? 'h-full w-full' : 'hidden'}>
          <ScanLogs />
        </div>
      </main>
    </div>
  );
};

export default JobEmailCategorizationApp;