import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  PauseCircle, 
  Clock, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  RefreshCcw,
  Zap
} from 'lucide-react';
import { gmailApi } from './api/client.js';

const AutoScanDashboard = () => {
  const [autoScanStatus, setAutoScanStatus] = useState({ running: false });
  const [autoScanHistory, setAutoScanHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [runNowLoading, setRunNowLoading] = useState(false);
  const [runNowResult, setRunNowResult] = useState(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await gmailApi.getAutoScanStatus();
      if (response.success) {
        setAutoScanStatus(response);
        setError(null);
      } else {
        setError(response.error || 'Unable to fetch auto-scan status');
      }
    } catch (err) {
      console.error('Failed to get auto scan status:', err);
      setError('Unable to fetch auto-scan status');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await gmailApi.getAutoScanHistory();
      if (response.success) {
        setAutoScanHistory(response.history);
      }
    } catch (err) {
      console.error('Failed to get auto scan history:', err);
    }
  };

  const handleStartAutoScan = async () => {
    try {
      setLoading(true);
      const response = await gmailApi.startAutoScan({
        query: 'in:anywhere newer_than:2d',
        maxResults: 20
      });
      if (response.success) {
        await loadStatus();
        setError(null);
      } else {
        setError(response.error || 'Unable to start auto scan');
      }
    } catch (err) {
      console.error('Failed to start auto scan:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStopAutoScan = async () => {
    try {
      setLoading(true);
      const response = await gmailApi.stopAutoScan();
      if (response.success) {
        await loadStatus();
        setError(null);
      } else {
        setError(response.error || 'Unable to stop auto scan');
      }
    } catch (err) {
      console.error('Failed to stop auto scan:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunNow = async () => {
    try {
      setRunNowLoading(true);
      const response = await gmailApi.runNowAutoScan({
        query: 'in:anywhere newer_than:2d',
        maxResults: 10
      });
      if (response.success) {
        setRunNowResult(response);
        await loadHistory();
        setError(null);
      } else {
        setError(response.error || 'Unable to run immediate scan');
      }
    } catch (err) {
      console.error('Failed to run immediate scan:', err);
      setError(err.message);
    } finally {
      setRunNowLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    loadHistory();
  }, []);

  return (
    <div className="auto-scan-dashboard">
      <div className="dashboard-header">
        <h2>
          <Activity className="icon" />
          Auto-Scan Dashboard
        </h2>
        <p className="dashboard-subtitle">
          Monitor and control automatic email scanning
        </p>
      </div>

      {error && (
        <div className="dashboard-alert error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="auto-scan-controls">
        <div className="control-group">
          <button
            className={`btn ${autoScanStatus.running ? 'btn-danger' : 'btn-primary'}`}
            onClick={autoScanStatus.running ? handleStopAutoScan : handleStartAutoScan}
            disabled={loading}
          >
            {autoScanStatus.running ? (
              <>
                <PauseCircle size={16} />
                Stop Auto-Scan
              </>
            ) : (
              <>
                <PlayCircle size={16} />
                Start Auto-Scan
              </>
            )}
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={handleRunNow}
            disabled={runNowLoading}
          >
            <Zap size={16} />
            {runNowLoading ? 'Running...' : 'Run Now'}
          </button>

          <button
            className="btn btn-outline"
            onClick={loadStatus}
            disabled={loading}
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="auto-scan-status-grid">
        <div className="status-card">
          <div className="status-header">
            <Clock size={20} />
            <h3>Status</h3>
          </div>
          <div className={`status-value ${autoScanStatus.running ? 'running' : 'stopped'}`}>
            {autoScanStatus.running ? '🟢 Running' : '🔴 Stopped'}
          </div>
        </div>

        <div className="status-card">
          <div className="status-header">
            <Activity size={20} />
            <h3>Interval</h3>
          </div>
          <div className="status-value">
            {autoScanStatus.intervalMs ? 
              `${Math.round(autoScanStatus.intervalMs / 1000 / 60)} minutes` : 
              '5 minutes'
            }
          </div>
        </div>

        <div className="status-card">
          <div className="status-header">
            <CheckCircle size={20} />
            <h3>Query</h3>
          </div>
          <div className="status-value">
            {autoScanStatus.query || 'in:anywhere newer_than:2d'}
          </div>
        </div>

        <div className="status-card">
          <div className="status-header">
            <RefreshCcw size={20} />
            <h3>Max Results</h3>
          </div>
          <div className="status-value">
            {autoScanStatus.maxResults || 20}
          </div>
        </div>
      </div>

      {autoScanStatus.startTime && (
        <div className="auto-scan-details">
          <h3>Session Details</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Started:</span>
              <span className="detail-value">
                {new Date(autoScanStatus.startTime).toLocaleString()}
              </span>
            </div>
            {autoScanStatus.errorCount > 0 && (
              <div className="detail-item error">
                <span className="detail-label">Errors:</span>
                <span className="detail-value">
                  {autoScanStatus.errorCount}/{autoScanStatus.maxRetries}
                </span>
              </div>
            )}
            {autoScanStatus.lastScan && (
              <div className="detail-item">
                <span className="detail-label">Last Scan:</span>
                <span className="detail-value">
                  {new Date(autoScanStatus.lastScan.timestamp).toLocaleString()}
                  <br />
                  <small>
                    {autoScanStatus.lastScan.processed} processed, {autoScanStatus.lastScan.errors} errors
                  </small>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {runNowResult && (
        <div className="run-now-results">
          <div className="results-header">
            <h3>Immediate Scan Results</h3>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => setRunNowResult(null)}
            >
              Clear
            </button>
          </div>
          <div className="results-summary">
            Found {runNowResult.messagesFound} messages · Processed {runNowResult.processed}
          </div>
          {runNowResult.results && runNowResult.results.length > 0 && (
            <div className="results-list">
              {runNowResult.results.slice(0, 5).map((item) => (
                <div key={item.id} className="result-item">
                  <div className="result-badge">
                    {item.label}
                  </div>
                  <div className="result-content">
                    <div className="result-subject">{item.subject || '(No subject)'}</div>
                    <div className="result-meta">
                      Confidence: {item.confidence}
                    </div>
                  </div>
                </div>
              ))}
              {runNowResult.results.length > 5 && (
                <div className="result-more">
                  ... and {runNowResult.results.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoScanDashboard;

