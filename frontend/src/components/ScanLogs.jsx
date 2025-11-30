import React, { useState, useEffect } from 'react';
import { Clock, Mail, CheckCircle, XCircle, Settings, RefreshCcw } from 'lucide-react';

const ScanLogs = () => {
    const [scanLogs, setScanLogs] = useState([]);
    const [maxResults, setMaxResults] = useState(50);
    const [tempMaxResults, setTempMaxResults] = useState(50);

    // Load scan logs from localStorage on mount
    useEffect(() => {
        const savedLogs = localStorage.getItem('scan_logs');
        const savedMaxResults = localStorage.getItem('scan_max_results');

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
                success: event.detail.success || false,
                error: event.detail.error || null,
                emails: event.detail.emails || []
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

    const handleSaveMaxResults = () => {
        setMaxResults(tempMaxResults);
        localStorage.setItem('scan_max_results', tempMaxResults.toString());

        // Dispatch event to update JobTrackBoard
        window.dispatchEvent(new CustomEvent('updateMaxResults', {
            detail: { maxResults: tempMaxResults }
        }));
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

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                                Max Results Per Scan
                            </label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="number"
                                    min="10"
                                    max="500"
                                    step="10"
                                    value={tempMaxResults}
                                    onChange={(e) => setTempMaxResults(parseInt(e.target.value, 10))}
                                    className="flex-1 px-4 py-2 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <button
                                    onClick={handleSaveMaxResults}
                                    className="bg-black text-white px-6 py-2 font-bold uppercase tracking-wider border-2 border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-0.5"
                                >
                                    Save
                                </button>
                            </div>
                            <p className="text-xs text-zinc-500 mt-2 font-mono">
                                Current: {maxResults} emails per scan
                            </p>
                        </div>
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
                                    </div>

                                    {log.error && (
                                        <div className="mb-3 p-3 bg-red-50 border-2 border-red-600 text-red-800 text-sm font-mono">
                                            <strong>Error:</strong> {log.error}
                                        </div>
                                    )}

                                    {/* Email List */}
                                    {log.emails && log.emails.length > 0 && (
                                        <div className="mt-3">
                                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                <Mail className="w-3 h-3" />
                                                Emails Processed ({log.emails.length})
                                            </div>
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {log.emails.slice(0, 10).map((email, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="p-2 bg-zinc-50 border border-zinc-200 text-xs font-mono"
                                                    >
                                                        <div className="font-bold truncate">{email.company || 'Unknown'}</div>
                                                        <div className="text-zinc-500 truncate">{email.role || 'Position'}</div>
                                                        <div className="text-[10px] text-zinc-400 mt-1">
                                                            Status: <span className="font-bold">{email.status}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {log.emails.length > 10 && (
                                                    <div className="text-xs text-zinc-400 text-center py-2 italic">
                                                        ... and {log.emails.length - 10} more
                                                    </div>
                                                )}
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
