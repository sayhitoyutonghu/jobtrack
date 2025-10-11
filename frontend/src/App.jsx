import React, { useEffect, useMemo, useState } from 'react';
import {
  Settings,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  LoaderCircle,
  ShieldCheck,
  RefreshCcw,
  Inbox
} from 'lucide-react';
import DashboardView from './Dashboard.jsx';
import { authApi, gmailApi } from './api/client.js';
import './App.css';

const JobEmailCategorizationApp = () => {
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

  const [query, setQuery] = useState('is:unread');
  const [maxResults, setMaxResults] = useState(25);

  useEffect(() => {
    loadAuthStatus();
    loadLabels();
    loadAutoScanStatus();
  }, []);

  const loadAuthStatus = async () => {
    try {
      setAuthLoading(true);
      const status = await authApi.checkStatus();
      setAuthStatus(status);
      if (status.authenticated && status.sessionId) {
        localStorage.setItem('session_id', status.sessionId);
      }
      
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthStatus({ authenticated: false, sessionId: null });
    } finally {
      setAuthLoading(false);
    }
  };

  const loadLabels = async () => {
    try {
      setLabelsLoading(true);
      const response = await gmailApi.getLabels();
      if (response.success) {
        setLabels(response.labels);
        setLabelsError(null);
      } else {
        setLabelsError(response.error || 'Unable to load label configuration');
      }
    } catch (error) {
      console.error('Failed to load labels:', error);
      setLabelsError('Unable to load label configuration');
    } finally {
      setLabelsLoading(false);
    }
  };

  const loadAutoScanStatus = async () => {
    try {
      const response = await gmailApi.getAutoScanStatus();
      if (response.success) {
        setAutoScanStatus(response);
        setAutoScanError(null);
      } else {
        setAutoScanError(response.error || 'Unable to fetch auto-scan status');
      }
    } catch (error) {
      console.error('Failed to get auto scan status:', error);
      setAutoScanError('Unable to fetch auto-scan status');
    }
  };

  const handleLogin = () => {
    authApi.login();
  };

  const handleLogout = () => {
    localStorage.removeItem('session_id');
    setAuthStatus({ authenticated: false, sessionId: null });
  };

  const handleSetupLabels = async () => {
    try {
      setScanLoading(true);
      const response = await gmailApi.setupLabels();
      if (!response.success) {
        throw new Error(response.error || '创建标签失败');
      }
      await loadLabels();
      setScanResult({ message: 'Created or updated JobTrack labels in Gmail', results: response.results });
      setScanError(null);
    } catch (error) {
      console.error('Failed to setup labels:', error);
      setScanError(error.message);
    } finally {
      setScanLoading(false);
    }
  };

  const handleScanEmails = async () => {
    try {
      setScanLoading(true);
      const response = await gmailApi.scanEmails({ query, maxResults });
      if (!response.success) {
        throw new Error(response.error || 'Scan failed');
      }
      setScanResult(response);
      setScanError(null);
    } catch (error) {
      console.error('Failed to scan emails:', error);
      setScanError(error.message);
    } finally {
      setScanLoading(false);
    }
  };

  const handleStartAutoScan = async () => {
    try {
      setAutoScanLoading(true);
      const response = await gmailApi.startAutoScan({ query, maxResults });
      if (!response.success) {
        throw new Error(response.error || 'Unable to start auto scan');
      }
      await loadAutoScanStatus();
    } catch (error) {
      console.error('Failed to start auto scan:', error);
      setAutoScanError(error.message);
    } finally {
      setAutoScanLoading(false);
    }
  };

  const handleStopAutoScan = async () => {
    try {
      setAutoScanLoading(true);
      const response = await gmailApi.stopAutoScan();
      if (!response.success) {
        throw new Error(response.error || 'Unable to stop auto scan');
      }
      await loadAutoScanStatus();
      setAutoScanError(null);
    } catch (error) {
      console.error('Failed to stop auto scan:', error);
      setAutoScanError(error.message);
    } finally {
      setAutoScanLoading(false);
    }
  };

  const authBanner = useMemo(() => {
    if (authLoading) {
      return (
        <div className="app-banner info">
          <LoaderCircle className="spin" size={18} />
          <span>Checking Google authentication…</span>
        </div>
      );
    }

    if (authStatus.authenticated) {
      return (
        <div className="app-banner success">
          <div className="banner-icon">
            <ShieldCheck size={18} />
          </div>
          <div className="banner-copy">
            <span className="banner-title">Connected to Gmail</span>
            <span className="banner-meta">Session ID: {authStatus.sessionId}</span>
          </div>
          <div className="banner-actions">
            <button className="app-link" onClick={loadAuthStatus}>Refresh</button>
            <button className="app-link" onClick={handleLogout}>Clear Local Session</button>
          </div>
        </div>
      );
    }

    return (
      <div className="app-banner warning">
        <div className="banner-icon">
          <AlertCircle size={18} />
        </div>
        <div className="banner-copy">
          <span className="banner-title">Google sign-in required</span>
          <span className="banner-meta">Connect Gmail to enable label automation</span>
        </div>
        <div className="banner-actions">
          <button className="app-link" onClick={handleLogin}>Sign in with Google</button>
        </div>
      </div>
    );
  }, [authLoading, authStatus]);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__header">
          <h1>JobTrack</h1>
          <p className="app-sidebar__subtitle">Gmail Job Tracking Control Center</p>
        </div>

        <nav className="app-sidebar__nav">
          <button className="app-sidebar__nav-item active">
            <Settings size={18} />
            <span>Overview</span>
          </button>
          <button className="app-sidebar__nav-item" onClick={loadLabels}>
            <Inbox size={18} />
            <span>Label Panel</span>
          </button>
          <button className="app-sidebar__nav-item" onClick={loadAutoScanStatus}>
            <RefreshCcw size={18} />
            <span>Auto Scan</span>
          </button>
        </nav>

        <div className="app-sidebar__tip">
          <p className="app-sidebar__tip-title">⚡ Tip</p>
          <p>Connect Google to create Gmail labels and start organizing automatically.</p>
        </div>
      </aside>

      <main className="app-main">
        {authBanner}

        <section className="card">
          <header className="card__header">
            <div>
              <h2>Gmail Label Management</h2>
              <p>Sign in first, then create Gmail labels before running a scan.</p>
            </div>
            <div className="card__cta-group">
              <button
                className="btn primary"
                onClick={handleSetupLabels}
                disabled={!authStatus.authenticated || scanLoading}
              >
                <Settings size={16} /> Create / Update Labels
              </button>
              <button
                className="btn"
                onClick={loadLabels}
                disabled={labelsLoading}
              >
                <RefreshCcw size={16} /> Refresh List
              </button>
            </div>
          </header>

          {labelsError && (
            <div className="card__alert error">
              <AlertCircle size={16} />
              <span>{labelsError}</span>
            </div>
          )}

          <DashboardView
            labels={labels}
            loading={labelsLoading}
            onRefresh={loadLabels}
          />
        </section>

        <section className="card">
          <header className="card__header">
            <div>
              <h2>Manual Email Scan</h2>
              <p>Fetch the latest Gmail messages and classify them using rules and AI.</p>
            </div>
            <div className="card__cta-group">
              <button
                className="btn primary"
                onClick={handleScanEmails}
                disabled={!authStatus.authenticated || scanLoading}
              >
                <LoaderCircle className={scanLoading ? 'spin' : ''} size={16} />
                {scanLoading ? 'Scanning…' : 'Scan Now'}
              </button>
            </div>
          </header>

          {!authStatus.authenticated && (
            <div className="card__alert warning">
              <AlertCircle size={16} />
              <span>Please sign in with Google before scanning Gmail.</span>
            </div>
          )}

          <div className="form-grid">
            <label className="form-field">
              <span>Gmail search query</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="is:unread label:inbox"
              />
            </label>
            <label className="form-field">
              <span>Max messages</span>
              <input
                type="number"
                min={1}
                max={200}
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value) || 1)}
              />
            </label>
          </div>

          {scanError && (
            <div className="card__alert error">
              <AlertCircle size={16} />
              <span>{scanError}</span>
            </div>
          )}

          {scanResult && (
            <div className="scan-result">
              <header>
                <h3>Scan Results</h3>
                <button className="app-link" onClick={handleScanEmails}>
                  <RefreshCcw size={14} /> Run again
                </button>
              </header>
              <p className="scan-result__summary">
                Total {scanResult.stats?.total ?? 0} · Classified {scanResult.stats?.processed ?? 0} · Skipped {scanResult.stats?.skipped ?? 0}.
              </p>
              <div className="scan-result__list">
                {(scanResult.results || []).map((item) => (
                  <div key={item.id} className="scan-result__item">
                    <div className="scan-result__badge">
                      {item.label ? item.label : 'Skipped'}
                    </div>
                    <div className="scan-result__content">
                      <p className="scan-result__subject">{item.subject || '(No subject)'}</p>
                      <p className="scan-result__meta">
                        {item.skipped ? `Reason: ${item.skipped}` : `Confidence: ${item.confidence}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <header className="card__header">
            <div>
              <h2>Automatic Scan</h2>
              <p>Periodically scan Gmail on the server and tag messages automatically.</p>
            </div>
            <div className="card__cta-group">
              {autoScanStatus.running ? (
                <button
                  className="btn danger"
                  onClick={handleStopAutoScan}
                  disabled={!authStatus.authenticated || autoScanLoading}
                >
                  <PauseCircle size={16} /> Stop Auto Scan
                </button>
              ) : (
                <button
                  className="btn primary"
                  onClick={handleStartAutoScan}
                  disabled={!authStatus.authenticated || autoScanLoading}
                >
                  <PlayCircle size={16} /> Start Auto Scan
                </button>
              )}
            </div>
          </header>

          {autoScanError && (
            <div className="card__alert error">
              <AlertCircle size={16} />
              <span>{autoScanError}</span>
            </div>
          )}

          <dl className="auto-scan-status">
            <div>
              <dt>Status</dt>
              <dd>{autoScanStatus.running ? 'Running' : 'Stopped'}</dd>
            </div>
            <div>
              <dt>Current query</dt>
              <dd>{autoScanStatus.query || query}</dd>
            </div>
            <div>
              <dt>Messages per run</dt>
              <dd>{autoScanStatus.maxResults || maxResults}</dd>
            </div>
            <div>
              <dt>Scan interval</dt>
              <dd>{autoScanStatus.intervalMs ? `${autoScanStatus.intervalMs / 1000}s` : '60s default'}</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
};

export default JobEmailCategorizationApp;