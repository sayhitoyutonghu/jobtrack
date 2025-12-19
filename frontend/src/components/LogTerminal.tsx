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

    return (
        <div className="fixed bottom-4 right-4 w-[400px] h-[500px] bg-black text-green-400 font-mono text-xs rounded-lg shadow-2xl flex flex-col border border-zinc-800 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-zinc-900 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider">{status}</span>
                </div>
                <button onClick={onClose} className="hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-zinc-800 w-full">
                <div
                    className="h-full bg-green-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Logs Area */}
            <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto space-y-2"
            >
                {logs.length === 0 && (
                    <div className="text-zinc-500 italic">Waiting for stream...</div>
                )}

                {logs.map((log, idx) => (
                    <div key={idx} className="break-words">
                        <span className="opacity-50 mr-2">[{log.timestamp}]</span>
                        <span className={
                            log.type === 'error' ? 'text-red-400' :
                                log.type === 'success' ? 'text-blue-300 font-bold' :
                                    'text-green-400'
                        }>
                            {log.type === 'log' && '> '}
                            {log.text}
                        </span>
                    </div>
                ))}

                {progress < 100 && (
                    <div className="animate-pulse flex items-center gap-2 mt-2 opacity-50">
                        <span className="w-2 h-4 bg-green-500 block"></span>
                    </div>
                )}
            </div>
        </div>
    );
};
