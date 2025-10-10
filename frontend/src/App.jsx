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
        setLabelsError(response.error || '读取标签失败');
      }
    } catch (error) {
      console.error('Failed to load labels:', error);
      setLabelsError('读取标签失败');
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
        setAutoScanError(response.error || '读取自动扫描状态失败');
      }
    } catch (error) {
      console.error('Failed to get auto scan status:', error);
      setAutoScanError('读取自动扫描状态失败');
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
      setScanResult({ message: '已在 Gmail 中创建或更新 JobTrack 标签', results: response.results });
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
        throw new Error(response.error || '扫描失败');
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
        throw new Error(response.error || '启动自动扫描失败');
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
        throw new Error(response.error || '停止自动扫描失败');
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
          <span>正在验证登录状态…</span>
        </div>
      );
    }

    if (authStatus.authenticated) {
      return (
        <div className="app-banner success">
          <ShieldCheck size={18} />
          <span>已连接 Gmail，Session: {authStatus.sessionId}</span>
          <button className="app-link" onClick={loadAuthStatus}>刷新</button>
          <button className="app-link" onClick={handleLogout}>清除本地 Session</button>
        </div>
      );
    }

    return (
      <div className="app-banner warning">
        <AlertCircle size={18} />
        <span>尚未完成 Google 登录。</span>
        <button className="app-link" onClick={handleLogin}>登录 Google</button>
      </div>
    );
  }, [authLoading, authStatus]);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__header">
          <h1>JobTrack</h1>
          <p className="app-sidebar__subtitle">Gmail 求职标签控制中心</p>
        </div>

        <nav className="app-sidebar__nav">
          <button className="app-sidebar__nav-item active">
            <Settings size={18} />
            <span>控台总览</span>
          </button>
          <button className="app-sidebar__nav-item" onClick={loadLabels}>
            <Inbox size={18} />
            <span>标签面板</span>
          </button>
          <button className="app-sidebar__nav-item" onClick={loadAutoScanStatus}>
            <RefreshCcw size={18} />
            <span>自动扫描</span>
          </button>
        </nav>

        <div className="app-sidebar__tip">
          <p className="app-sidebar__tip-title">⚡ 提示</p>
          <p>完成 Google 登录后可直接创建 Gmail 标签并开始分类。</p>
        </div>
      </aside>

      <main className="app-main">
        {authBanner}

        <section className="card">
          <header className="card__header">
            <div>
              <h2>Gmail 标签管理</h2>
              <p>首次使用请先登录并创建 Gmail 标签，再进行扫描。</p>
            </div>
            <div className="card__cta-group">
              <button
                className="btn primary"
                onClick={handleSetupLabels}
                disabled={!authStatus.authenticated || scanLoading}
              >
                <Settings size={16} /> 创建 / 更新标签
              </button>
              <button
                className="btn"
                onClick={loadLabels}
                disabled={labelsLoading}
              >
                <RefreshCcw size={16} /> 刷新列表
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
              <h2>手动扫描邮箱</h2>
              <p>从 Gmail 获取最新邮件并根据规则/AI 分类。</p>
            </div>
            <div className="card__cta-group">
              <button
                className="btn primary"
                onClick={handleScanEmails}
                disabled={!authStatus.authenticated || scanLoading}
              >
                <LoaderCircle className={scanLoading ? 'spin' : ''} size={16} />
                {scanLoading ? '扫描中…' : '立即扫描'}
              </button>
            </div>
          </header>

          {!authStatus.authenticated && (
            <div className="card__alert warning">
              <AlertCircle size={16} />
              <span>需要先登录 Google 才能扫描 Gmail。</span>
            </div>
          )}

          <div className="form-grid">
            <label className="form-field">
              <span>Gmail 搜索语法 (query)</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="is:unread label:inbox"
              />
            </label>
            <label className="form-field">
              <span>最大邮件数量</span>
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
                <h3>扫描结果</h3>
                <button className="app-link" onClick={handleScanEmails}>
                  <RefreshCcw size={14} /> 重新扫描
                </button>
              </header>
              <p className="scan-result__summary">
                总共 {scanResult.stats?.total ?? 0} 封，已分类 {scanResult.stats?.processed ?? 0} 封，跳过 {scanResult.stats?.skipped ?? 0} 封。
              </p>
              <div className="scan-result__list">
                {(scanResult.results || []).map((item) => (
                  <div key={item.id} className="scan-result__item">
                    <div className="scan-result__badge">
                      {item.label ? item.label : 'Skipped'}
                    </div>
                    <div className="scan-result__content">
                      <p className="scan-result__subject">{item.subject || '(无主题)'}</p>
                      <p className="scan-result__meta">
                        {item.skipped ? `原因：${item.skipped}` : `置信度：${item.confidence}`}
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
              <h2>自动扫描</h2>
              <p>在服务器后台周期性扫描 Gmail 并自动打标签。</p>
            </div>
            <div className="card__cta-group">
              {autoScanStatus.running ? (
                <button
                  className="btn danger"
                  onClick={handleStopAutoScan}
                  disabled={!authStatus.authenticated || autoScanLoading}
                >
                  <PauseCircle size={16} /> 停止自动扫描
                </button>
              ) : (
                <button
                  className="btn primary"
                  onClick={handleStartAutoScan}
                  disabled={!authStatus.authenticated || autoScanLoading}
                >
                  <PlayCircle size={16} /> 启动自动扫描
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
              <dt>运行状态</dt>
              <dd>{autoScanStatus.running ? '运行中' : '已停止'}</dd>
            </div>
            <div>
              <dt>当前查询</dt>
              <dd>{autoScanStatus.query || query}</dd>
            </div>
            <div>
              <dt>每轮最大邮件数</dt>
              <dd>{autoScanStatus.maxResults || maxResults}</dd>
            </div>
            <div>
              <dt>扫描间隔</dt>
              <dd>{autoScanStatus.intervalMs ? `${autoScanStatus.intervalMs / 1000}s` : '60s 默认'}</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
};

export default JobEmailCategorizationApp;