import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  ShieldCheck,
  RefreshCcw,
  Inbox,
  Layout
} from 'lucide-react';
import Dashboard from './Dashboard.jsx';
import JobTrackBoard from './components/JobTrackBoard';
import ScanLogs from './components/ScanLogs';
import PrivacyPolicy from './components/PrivacyPolicy';
import { authApi, gmailApi } from './api/client.js';
import { ScanProvider } from './contexts/ScanContext';
import logo from './assets/logo.png';
import './App.css';

const MainApp = () => {
  const [view, setView] = useState('board'); // 'board', 'labels', 'scanlogs'
  const [labels, setLabels] = useState([]);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [labelsError, setLabelsError] = useState(null);

  const [authStatus, setAuthStatus] = useState({ authenticated: false, sessionId: null });
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Check if we have a session parameter from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('session');

    if (sessionFromUrl) {
      localStorage.setItem('session_id', sessionFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    loadAuthStatus();
  }, []);

  const loadAuthStatus = async () => {
    try {
      setAuthLoading(true);
      try {
        const status = await authApi.checkStatus();
        setAuthStatus(status);
        if (status.authenticated && status.sessionId) {
          localStorage.setItem('session_id', status.sessionId);
        }
      } catch (e) {
        console.warn("Auth check failed (backend might not support it yet):", e);
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
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
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
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <p className="text-xs text-zinc-500 mb-1">For access to the private beta, please contact:</p>
                <a href="mailto:sayhitoyutonghu@gmail.com" className="block text-xs font-bold text-black hover:underline mb-2">
                  sayhitoyutonghu@gmail.com
                </a>
                <p className="text-xs text-zinc-500">
                  Or reach out on <a href="https://www.linkedin.com/in/yutong-hu-351133219/" target="_blank" rel="noopener noreferrer" className="font-bold text-black hover:underline">LinkedIn</a>
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full h-full overflow-hidden bg-zinc-50 relative">
        <div className={view === 'board' ? 'h-full w-full' : 'hidden'}>
          <JobTrackBoard isAuthenticated={authStatus.authenticated} />
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <ScanProvider>
            <MainApp />
          </ScanProvider>
        } />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  );
}

export default App;