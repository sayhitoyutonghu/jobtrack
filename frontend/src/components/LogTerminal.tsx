import React, { useEffect, useRef, useState } from 'react';
import { X, Terminal, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface LogMessage {
    type: 'log' | 'error' | 'success'; // simple types for display
    text: string;
    timestamp: string;
}

interface LogTerminalProps {
    onClose: () => void;
    logs: LogMessage[];
    progress: number;
    status: string; // "Scanning...", "Analyzing...", "Complete"
}

export const LogTerminal: React.FC<LogTerminalProps> = ({ onClose, logs, progress, status }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Determine status icon
    const getStatusIcon = () => {
        if (status.toLowerCase().includes('complete')) {
            return <CheckCircle2 className="w-5 h-5 text-green-600" />;
        }
        if (status.toLowerCase().includes('error')) {
            return <AlertCircle className="w-5 h-5 text-red-600" />;
        }
        return <Loader2 className="w-5 h-5 animate-spin" />;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[80vh] flex flex-col font-mono"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b-4 border-black bg-zinc-100">
                    <h2 className="text-xl font-black uppercase flex items-center gap-3">
                        {getStatusIcon()}
                        <span>{status}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-zinc-200 w-full border-b-2 border-black relative overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all duration-300 ease-out border-r-2 border-black"
                        style={{ width: `${progress}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                        {progress}%
                    </div>
                </div>

                {/* Logs Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 p-4 overflow-y-auto space-y-2 bg-white text-black text-xs max-h-[500px]"
                >
                    {logs.length === 0 && (
                        <div className="text-zinc-400 italic text-center py-10">
                            <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Waiting for scan stream...</p>
                        </div>
                    )}

                    {logs.map((log, idx) => (
                        <div key={idx} className="break-words flex items-start gap-2">
                            <span className="text-zinc-400 text-[10px] shrink-0 font-bold">[{log.timestamp}]</span>
                            <span className={
                                log.type === 'error' ? 'text-red-600 font-bold' :
                                    log.type === 'success' ? 'text-green-600 font-bold' :
                                        'text-black'
                            }>
                                {log.type === 'log' && '> '}
                                {log.text}
                            </span>
                        </div>
                    ))}

                    {progress < 100 && logs.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 animate-pulse">
                            <span className="w-2 h-2 bg-green-500 border border-black"></span>
                            <span className="text-zinc-400 text-[10px]">Processing...</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t-2 border-black bg-zinc-50 text-[10px] text-center text-zinc-600 uppercase tracking-wider">
                    Scan in progress • Press ESC or click X to minimize
                </div>
            </div>
        </div>
    );
};
