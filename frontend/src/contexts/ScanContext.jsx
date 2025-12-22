import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/client';

const ScanContext = createContext();

export const useScan = () => {
    const context = useContext(ScanContext);
    if (!context) {
        throw new Error('useScan must be used within a ScanProvider');
    }
    return context;
};

export const ScanProvider = ({ children }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanLogs, setScanLogs] = useState([]);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanStatus, setScanStatus] = useState('Idle');
    const eventSourceRef = useRef(null);

    // Persist logs if needed or just keep in memory for the session
    // For now, we keep in memory to show "Live" logs.
    // Historical logs are handled by ScanLogs component via localStorage/events.

    const performScan = async (options = {}) => {
        if (isScanning) return; // Prevent double scan

        const {
            query = 'newer_than:7d',
            maxResults = 50,
            scanSource = 'inbox', // 'inbox' or 'unread'
            dateRange = '7d',
            endpoint = '/api/gmail/stream-scan'
        } = options;

        setIsScanning(true);
        setScanLogs([]);
        setScanProgress(0);
        setScanStatus('Initializing scan...');

        // Build the query
        let finalQuery = query;
        if (scanSource === 'unread' && !query.includes('is:unread')) {
            finalQuery = `is:unread ${query}`;
        }

        const sessionId = localStorage.getItem('session_id');
        if (!sessionId) {
            setScanLogs([{ type: 'error', text: 'No session ID found. Please log in.', timestamp: new Date().toLocaleTimeString() }]);
            setIsScanning(false);
            return;
        }

        const url = `${API_BASE_URL}${endpoint}?query=${encodeURIComponent(finalQuery)}&maxResults=${maxResults}&sessionId=${sessionId}`;

        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;
        let scanSuccess = false;
        let found = 0;
        let scanned = 0;
        let allEmails = [];
        let jobEmails = [];

        eventSource.onopen = () => {
            setScanLogs(prev => [...prev, { type: 'log', text: 'Connected to scan stream...', timestamp: new Date().toLocaleTimeString() }]);
            setScanStatus('Connected');
        };

        eventSource.addEventListener('log', (e) => {
            try {
                const data = JSON.parse(e.data);
                setScanLogs(prev => [...prev, { type: 'log', text: data.message, timestamp: new Date().toLocaleTimeString() }]);
            } catch (err) { }
        });

        eventSource.addEventListener('progress', (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.percent) setScanProgress(data.percent);

                // Update status text based on activity
                if (data.type === 'match') {
                    setScanStatus(`Found: ${data.job?.company || 'Job'}`);
                    setScanLogs(prev => [...prev, { type: 'success', text: data.log, timestamp: new Date().toLocaleTimeString() }]);
                    found++;
                    if (data.job) jobEmails.push(data.job);
                } else if (data.type === 'skipped') {
                    setScanStatus(`Skipping: ${data.subject?.substring(0, 20)}...`);
                }

                if (data.subject) {
                    // Keep track of all emails for the history log
                    const isJob = data.type === 'match';
                    allEmails.push({
                        subject: data.subject,
                        from: '...', // We might not have this in progress event unless we add it to backend
                        isJobEmail: isJob,
                        classification: isJob ? (data.job?.status || 'Applied') : 'skipped'
                    });
                    scanned++;
                }

            } catch (err) { }
        });

        eventSource.addEventListener('complete', (e) => {
            try {
                const data = JSON.parse(e.data);

                // Use backend stats if available (most accurate)
                let finalScanned = scanned;
                let finalFound = found;
                let finalAllEmails = allEmails;

                // Backend sends comprehensive stats and results
                if (data.stats && data.results && Array.isArray(data.results)) {
                    finalScanned = data.stats.totalScanned || data.results.length;
                    finalFound = data.stats.newJobs || data.results.filter(r => r.status && r.status !== 'skipped' && r.status !== 'error').length;

                    // Map backend results to UI format
                    finalAllEmails = data.results.map(r => ({
                        subject: r.subject || "Unknown Subject",
                        from: r.from || "Unknown Sender",
                        isJobEmail: r.status && r.status !== 'skipped' && r.status !== 'error',
                        classification: r.status === 'skipped' ? (r.reason || 'Skipped') : (r.status || 'Unknown')
                    }));
                }

                setScanLogs(prev => [...prev, {
                    type: 'success',
                    text: `Scan complete. Total: ${finalScanned}, Jobs: ${finalFound}, Others: ${finalScanned - finalFound}`,
                    timestamp: new Date().toLocaleTimeString()
                }]);
                setScanProgress(100);
                setScanStatus('Complete');
                scanSuccess = true;

                // Dispatch global event for ScanLogs component
                window.dispatchEvent(new CustomEvent('scanComplete', {
                    detail: {
                        success: true,
                        emailsFound: finalFound,
                        emailsScanned: finalScanned,
                        query: finalQuery,
                        scanSource,
                        dateRange,
                        allEmails: finalAllEmails,
                        jobEmails
                    }
                }));

            } catch (err) {
                console.error("Parse complete error", err);
            }
            eventSource.close();
            setIsScanning(false);
            eventSourceRef.current = null;
        });

        eventSource.addEventListener('error', (e) => {
            let msg = "Connection error";
            try {
                const data = JSON.parse(e.data);
                msg = data.message;
            } catch (err) { }

            console.error("EventSource error:", e);
            setScanLogs(prev => [...prev, { type: 'error', text: `Error: ${msg}`, timestamp: new Date().toLocaleTimeString() }]);
            setScanStatus('Failed');

            // Dispatch scanComplete even on error so it saves to history
            window.dispatchEvent(new CustomEvent('scanComplete', {
                detail: {
                    success: false,
                    error: msg || 'Unknown error',
                    emailsFound: found,
                    emailsScanned: scanned,
                    query: finalQuery,
                    scanSource,
                    dateRange,
                    allEmails,
                    jobEmails
                }
            }));

            eventSource.close();
            setIsScanning(false);
            eventSourceRef.current = null;
        });
    };

    const cancelScan = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsScanning(false);
        setScanStatus('Cancelled');
        setScanLogs(prev => [...prev, { type: 'error', text: 'Scan cancelled by user', timestamp: new Date().toLocaleTimeString() }]);
    };

    return (
        <ScanContext.Provider value={{
            isScanning,
            scanLogs,
            scanProgress,
            scanStatus,
            performScan,
            cancelScan
        }}>
            {children}
        </ScanContext.Provider>
    );
};
