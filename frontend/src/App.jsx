import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  // autoScanHistory not used in this view
  const [runNowLoading, setRunNowLoading] = useState(false);
  const [runNowResult, setRunNowResult] = useState(null);

  const [authStatus, setAuthStatus] = useState({ authenticated: false, sessionId: null });
  const [authLoading, setAuthLoading] = useState(false);

  // query: actual Gmail query string sent to backend
  // queryOption: which dropdown option is selected ('is:unread'|'in:inbox'|'in:sent'|'custom')
  const [query, setQuery] = useState('is:unread');
  const [queryOption, setQueryOption] = useState('is:unread');
  const [maxResults, setMaxResults] = useState(25);

  useEffect(() => {
    // Check if we have a session parameter from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('session');
    
    if (sessionFromUrl) {
      // Save session ID to localStorage
      localStorage.setItem('session_id', sessionFromUrl);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    loadAuthStatus();
    loadLabels();
    loadAutoScanStatus();
    loadAutoScanHistory();
  }, []);

  // Keep dropdown selection in sync with any query value coming from server
  useEffect(() => {
    const mapToOption = (q) => {
      if (!q) return 'is:unread';
      const lower = q.toLowerCase();
      // If it mentions inbox, treat as inbox (support variations)
      if (lower.includes('in:inbox') || lower.includes('label:inbox')) return 'in:inbox';
      // If it mentions sent, treat as sent
      if (lower.includes('in:sent') || lower.includes('label:sent')) return 'in:sent';
      // If it's or contains is:unread and not other mailbox qualifiers, prefer unread
      if (lower.includes('is:unread') && !lower.includes('in:') && !lower.includes('label:')) return 'is:unread';
      // If query equals exactly is:unread
      if (lower.trim() === 'is:unread') return 'is:unread';
      return 'custom';
    };

    // If the server auto-scan status provides a query, prefer that
    if (autoScanStatus?.query) {
      setQuery(autoScanStatus.query);
      setQueryOption(mapToOption(autoScanStatus.query));
      return;
    }

    // Otherwise, keep option consistent with local query
    setQueryOption(mapToOption(query));
  }, [authStatus.authenticated, autoScanStatus, query]);

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

  const loadAutoScanHistory = async () => {
    try {
      const response = await gmailApi.getAutoScanHistory();
      if (response.success) {
        // history intentionally not stored in this view; kept for backward compatibility
      }
    } catch (error) {
      console.error('Failed to get auto scan history:', error);
    }
  };

  const handleLabelToggleUpdate = useCallback((labelId, enabled) => {
    setLabels((prev) =>
      prev.map((label) =>
        label.id === labelId ? { ...label, enabled } : label
      )
    );
    setLabelsError(null);
  }, []);

  useEffect(() => {
    if (labels.length > 0 && labelsError) {
      setLabelsError(null);
    }
  }, [labels, labelsError]);

  const handleLogin = () => {
    authApi.login();
  };

  const handleTestLogin = async () => {
    try {
      setAuthLoading(true);
      const response = await authApi.testLogin();
      if (response.success && response.sessionId) {
        localStorage.setItem('session_id', response.sessionId);
        setAuthStatus({ 
          authenticated: true, 
          sessionId: response.sessionId,
          testMode: true
        });
      }
    } catch (error) {
      console.error('Test login failed:', error);
    } finally {
      setAuthLoading(false);
    }
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

  const handleRunNowAutoScan = async () => {
    try {
      setRunNowLoading(true);
      const response = await gmailApi.runNowAutoScan({ query, maxResults });
      if (!response.success) {
        throw new Error(response.error || 'Unable to run immediate scan');
      }
      setRunNowResult(response);
      await loadAutoScanHistory();
      setAutoScanError(null);
    } catch (error) {
      console.error('Failed to run immediate scan:', error);
      setAutoScanError(error.message);
    } finally {
      setRunNowLoading(false);
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
            <span className="banner-title">
              {authStatus.testMode ? '🧪 Test Mode Active' : 'Connected to Gmail'}
            </span>
            <span className="banner-meta">Session ID: {authStatus.sessionId}</span>
          </div>
          <div className="banner-actions">
            <button className="app-link" onClick={loadAuthStatus}>Refresh</button>
            <button className="app-link" onClick={handleLogout}>Logout</button>
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
          <span className="banner-title">Authentication required</span>
          <span className="banner-meta">Sign in with Google or use test mode</span>
        </div>
        <div className="banner-actions">
          <button className="app-link" onClick={handleTestLogin}>🧪 Test Mode Login</button>
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

          {labelsError && labels.length === 0 && (
            <div className="card__alert error">
              <AlertCircle size={16} />
              <span>{labelsError}</span>
            </div>
          )}

          <DashboardView
            labels={labels}
            loading={labelsLoading}
            onRefresh={loadLabels}
            onToggleUpdate={handleLabelToggleUpdate}
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
              <select
                value={queryOption}
                onChange={(e) => {
                  const v = e.target.value;
                  setQueryOption(v);
                  if (v === 'custom') {
                    // start with empty custom query (user can type)
                    setQuery('');
                  } else if (v === 'is:unread') {
                    setQuery('is:unread');
                  } else if (v === 'in:inbox') {
                    setQuery('in:inbox');
                  } else {
                    setQuery(v);
                  }
                }}
              >
                <option value="is:unread">Unread (is:unread)</option>
                <option value="in:inbox">Inbox (in:inbox)</option>
                <option value="in:sent">Sent (in:sent)</option>
                <option value="custom">Custom...</option>
              </select>
              {queryOption === 'custom' && (
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter custom Gmail query"
                />
              )}
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
              <button
                className="btn"
                onClick={handleRunNowAutoScan}
                disabled={!authStatus.authenticated || runNowLoading}
              >
                <LoaderCircle className={runNowLoading ? 'spin' : ''} size={16} />
                {runNowLoading ? 'Running...' : 'Run Now'}
              </button>
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
              <dd className={autoScanStatus.running ? 'status-running' : 'status-stopped'}>
                {autoScanStatus.running ? '🟢 Running' : '🔴 Stopped'}
              </dd>
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
              <dd>{autoScanStatus.intervalMs ? `${Math.round(autoScanStatus.intervalMs / 1000 / 60)} minutes` : '5 minutes default'}</dd>
            </div>
            {autoScanStatus.startTime && (
              <div>
                <dt>Started</dt>
                <dd>{new Date(autoScanStatus.startTime).toLocaleString()}</dd>
              </div>
            )}
            {autoScanStatus.errorCount > 0 && (
              <div>
                <dt>Error count</dt>
                <dd className="status-error">{autoScanStatus.errorCount}/{autoScanStatus.maxRetries}</dd>
              </div>
            )}
            {autoScanStatus.lastScan && (
              <div>
                <dt>Last scan</dt>
                <dd>
                  {new Date(autoScanStatus.lastScan.timestamp).toLocaleString()} 
                  ({autoScanStatus.lastScan.processed} processed, {autoScanStatus.lastScan.errors} errors)
                </dd>
              </div>
            )}
          </dl>

          {runNowResult && (
            <div className="run-now-result">
              <header>
                <h3>Immediate Scan Results</h3>
                <button className="app-link" onClick={() => setRunNowResult(null)}>
                  <X size={14} /> Clear
                </button>
              </header>
              <p className="run-now-result__summary">
                Found {runNowResult.messagesFound} messages · Processed {runNowResult.processed}
              </p>
              {runNowResult.results && runNowResult.results.length > 0 && (
                <div className="run-now-result__list">
                  {runNowResult.results.slice(0, 5).map((item) => (
                    <div key={item.id} className="run-now-result__item">
                      <div className="run-now-result__badge">
                        {item.label}
                      </div>
                      <div className="run-now-result__content">
                        <p className="run-now-result__subject">{item.subject || '(No subject)'}</p>
                        <p className="run-now-result__meta">
                          Confidence: {item.confidence}
                        </p>
                      </div>
                    </div>
                  ))}
                  {runNowResult.results.length > 5 && (
                    <p className="run-now-result__more">
                      ... and {runNowResult.results.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default JobEmailCategorizationApp;