import React, { useState, useEffect } from 'react';
import { Clock, Mail, CheckCircle, XCircle, Settings, RefreshCcw } from 'lucide-react';

const ScanLogs = () => {
    const [scanLogs, setScanLogs] = useState([]);
    const [maxResults, setMaxResults] = useState(50);
    const [tempMaxResults, setTempMaxResults] = useState(50);
    const [scanSource, setScanSource] = useState('inbox');
    const [tempScanSource, setTempScanSource] = useState('inbox');
    const [dateRange, setDateRange] = useState('7d');
    const [tempDateRange, setTempDateRange] = useState('7d');

    // Load scan logs from localStorage on mount
    useEffect(() => {
        const savedLogs = localStorage.getItem('scan_logs');
        const savedMaxResults = localStorage.getItem('scan_max_results');
        const savedScanSource = localStorage.getItem('scan_source');
        const savedDateRange = localStorage.getItem('scan_date_range');

        if (savedLogs) {
            try {
                setScanLogs(JSON.parse(savedLogs));
            } catch (e) {
                console.error('Failed to parse scan logs:', e);
            }
        }

        if (savedMaxResults) {
            const max = parseInt(savedMaxResults, 10);
            setMaxResults(max);
            setTempMaxResults(max);
        }

        if (savedScanSource) {
            setScanSource(savedScanSource);
            setTempScanSource(savedScanSource);
        }

        if (savedDateRange) {
            setDateRange(savedDateRange);
            setTempDateRange(savedDateRange);
        }
    }, []);

    // Listen for new scan events from JobTrackBoard
    useEffect(() => {
        console.log('[ScanLogs] Setting up scanComplete event listener');

        const handleScanComplete = (event) => {
            console.log('[ScanLogs] Received scanComplete event:', event.detail);

            const newLog = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                emailsScanned: event.detail.emailsScanned || 0,
                emailsFound: event.detail.emailsFound || 0,
                query: event.detail.query || 'newer_than:7d',
                scanSource: event.detail.scanSource || 'inbox',
                dateRange: event.detail.dateRange || '7d',
                success: event.detail.success || false,
                error: event.detail.error || null,
                allEmails: event.detail.allEmails || [],
                jobEmails: event.detail.jobEmails || []
            };

            console.log('[ScanLogs] Creating new log entry:', newLog);

            setScanLogs(prev => {
                const updated = [newLog, ...prev].slice(0, 50); // Keep last 50 logs
                localStorage.setItem('scan_logs', JSON.stringify(updated));
                console.log('[ScanLogs] Updated scan logs, total:', updated.length);
                return updated;
            });
        };

        window.addEventListener('scanComplete', handleScanComplete);
        return () => {
            console.log('[ScanLogs] Removing scanComplete event listener');
            window.removeEventListener('scanComplete', handleScanComplete);
        };
    }, []);

    const handleSaveConfig = () => {
        setMaxResults(tempMaxResults);
        setScanSource(tempScanSource);
        setDateRange(tempDateRange);

        localStorage.setItem('scan_max_results', tempMaxResults.toString());
        localStorage.setItem('scan_source', tempScanSource);
        localStorage.setItem('scan_date_range', tempDateRange);

        // Dispatch event to update JobTrackBoard
        window.dispatchEvent(new CustomEvent('updateScanConfig', {
            detail: {
                maxResults: tempMaxResults,
                scanSource: tempScanSource,
                dateRange: tempDateRange
            }
        }));

        console.log('[ScanLogs] Saved scan config:', { maxResults: tempMaxResults, scanSource: tempScanSource, dateRange: tempDateRange });
    };

    const clearLogs = () => {
        if (window.confirm('Are you sure you want to clear all scan logs?')) {
            setScanLogs([]);
            localStorage.removeItem('scan_logs');
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="h-full w-full bg-zinc-50 p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="border-b-4 border-black pb-4">
                    <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 flex items-center gap-4">
                        <span className="bg-black text-white px-3 py-1 text-2xl block transform -rotate-2 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                            📊
                        </span>
                        Scan_Logs
                    </h1>
                    <p className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">
                        Email Scan History // Configuration
                    </p>
                </div>

                {/* Settings Card */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Settings className="w-5 h-5" />
                        <h2 className="text-xl font-black uppercase tracking-tight">Scan Configuration</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Scan Source */}
                        <div>
                            <label className="block text-sm font-bold mb-3 uppercase tracking-wide">
                                Scan Source
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="scanSource"
                                        value="inbox"
                                        checked={tempScanSource === 'inbox'}
                                        onChange={(e) => setTempScanSource(e.target.value)}
                                        className="w-4 h-4 border-2 border-black"
                                    />
                                    <span className="font-mono text-sm">📥 Inbox</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="scanSource"
                                        value="unread"
                                        checked={tempScanSource === 'unread'}
                                        onChange={(e) => setTempScanSource(e.target.value)}
                                        className="w-4 h-4 border-2 border-black"
                                    />
                                    <span className="font-mono text-sm">✉️ Unread Only</span>
                                </label>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-bold mb-3 uppercase tracking-wide">
                                Date Range
                            </label>
                            <select
                                value={tempDateRange}
                                onChange={(e) => setTempDateRange(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="7d">📅 Last 7 days</option>
                                <option value="14d">📅 Last 14 days</option>
                                <option value="30d">📅 Last 30 days</option>
                                <option value="60d">📅 Last 60 days</option>
                            </select>
                        </div>

                        {/* Max Results */}
                        <div>
                            <label className="block text-sm font-bold mb-3 uppercase tracking-wide">
                                Max Results Per Scan
                            </label>
                            <input
                                type="number"
                                min="10"
                                max="500"
                                step="10"
                                value={tempMaxResults}
                                onChange={(e) => setTempMaxResults(parseInt(e.target.value, 10))}
                                className="w-full px-4 py-2 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>

                        {/* Current Settings Display */}
                        <div className="pt-4 border-t-2 border-black/10">
                            <p className="text-xs text-zinc-500 font-mono mb-1">
                                <strong>Current:</strong> {scanSource === 'inbox' ? 'Inbox' : 'Unread'} • {dateRange} • {maxResults} emails
                            </p>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveConfig}
                            className="w-full bg-black text-white px-6 py-3 font-bold uppercase tracking-wider border-2 border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-0.5"
                        >
                            💾 Save Configuration
                        </button>
                    </div>
                </div>

                {/* Logs Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                        Scan History ({scanLogs.length})
                    </h2>
                    {scanLogs.length > 0 && (
                        <button
                            onClick={clearLogs}
                            className="text-sm font-bold text-red-600 hover:text-red-800 uppercase tracking-wide"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Logs List */}
                {scanLogs.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-zinc-300 p-12 text-center">
                        <RefreshCcw className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
                        <p className="text-zinc-400 font-mono text-sm">
                            No scan logs yet. Run a scan from the Board View to see results here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {scanLogs.map((log) => (
                            <div
                                key={log.id}
                                className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all"
                            >
                                {/* Log Header */}
                                <div className="p-4 border-b-2 border-black bg-zinc-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {log.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                        <div>
                                            <div className="font-bold text-sm uppercase tracking-wide">
                                                {log.success ? 'Scan Completed' : 'Scan Failed'}
                                            </div>
                                            <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {formatTimestamp(log.timestamp)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs text-zinc-500 uppercase tracking-wide">Found</div>
                                            <div className="text-xl font-black">{log.emailsFound}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-zinc-500 uppercase tracking-wide">Scanned</div>
                                            <div className="text-xl font-black">{log.emailsScanned}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Log Details */}
                                <div className="p-4">
                                    <div className="mb-3">
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Query:</span>
                                        <code className="ml-2 text-sm font-mono bg-zinc-100 px-2 py-1 border border-black">
                                            {log.query}
                                        </code>
                                        <span className="ml-3 text-xs text-zinc-500">
                                            ({log.scanSource === 'inbox' ? '📥 Inbox' : '✉️ Unread'} • {log.dateRange})
                                        </span>
                                    </div>

                                    {log.error && (
                                        <div className="mb-3 p-3 bg-red-50 border-2 border-red-600 text-red-800 text-sm font-mono">
                                            <strong>Error:</strong> {log.error}
                                        </div>
                                    )}

                                    {/* All Emails List */}
                                    {log.allEmails && log.allEmails.length > 0 && (
                                        <div className="mt-3">
                                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                <Mail className="w-3 h-3" />
                                                All Scanned Emails ({log.allEmails.length})
                                            </div>
                                            <div className="space-y-2 max-h-80 overflow-y-auto border-2 border-zinc-200 p-2">
                                                {log.allEmails.map((email, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-3 border-2 text-xs font-mono ${email.isJobEmail
                                                                ? 'bg-green-50 border-green-600'
                                                                : 'bg-zinc-50 border-zinc-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold truncate">{email.subject}</div>
                                                                <div className="text-zinc-500 text-[10px] truncate mt-1">
                                                                    From: {email.from}
                                                                </div>
                                                            </div>
                                                            <div className={`shrink-0 px-2 py-1 text-[10px] font-bold border ${email.isJobEmail
                                                                    ? 'bg-green-600 text-white border-green-700'
                                                                    : 'bg-zinc-400 text-white border-zinc-500'
                                                                }`}>
                                                                {email.isJobEmail ? '✅ JOB' : '❌ OTHER'}
                                                            </div>
                                                        </div>
                                                        {email.isJobEmail && (
                                                            <div className="text-[10px] text-green-700 mt-1">
                                                                Classification: <span className="font-bold uppercase">{email.classification}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanLogs;
