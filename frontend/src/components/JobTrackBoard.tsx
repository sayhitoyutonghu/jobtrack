"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { GripVertical } from "lucide-react";
import { gmailApi, authApi } from "../api/client.js";

// --- Utility: 合并 Tailwind 类名 ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Types ---
type Status = "Applied" | "Interviewing" | "Offer" | "Rejected" | "Trash";

interface Job {
    id: string;
    company: string;
    role: string;
    salary: string;
    status: Status;
    location?: string;
    description?: string;
    date?: string;
    emailSnippet?: string;
}

// --- Mock Data (Fallback) ---
const FALLBACK_DATA: Job[] = [
    { id: "1", company: "Google", role: "Frontend Engineer", salary: "$180k", status: "Applied", description: "Working on the Google Cloud Console team.", date: "2023-10-01", emailSnippet: "Thank you for your application..." },
    { id: "2", company: "Spotify", role: "UI Designer", salary: "$140k", status: "Applied", description: "Design system team.", date: "2023-10-05", emailSnippet: "We have received your application..." },
    { id: "3", company: "Stripe", role: "Fullstack Dev", salary: "$200k", status: "Interviewing", description: "Payments infrastructure.", date: "2023-10-10", emailSnippet: "We'd like to schedule a chat..." },
    { id: "4", company: "Linear", role: "Product Engineer", salary: "$170k", status: "Interviewing", description: "Building the issue tracker.", date: "2023-10-12", emailSnippet: "Next steps for your application..." },
    { id: "5", company: "Vercel", role: "DevRel", salary: "$160k", status: "Offer", description: "Developer Relations for Next.js.", date: "2023-10-15", emailSnippet: "Congratulations! We are pleased to offer..." },
    { id: "6", company: "Oracle", role: "Java Dev", salary: "$120k", status: "Rejected", description: "Legacy systems maintenance.", date: "2023-09-20", emailSnippet: "Thank you for your interest, but..." },
];

const COLUMNS: { id: Status; title: string; color: string; borderColor: string }[] = [
    { id: "Applied", title: "APPLIED", color: "bg-blue-600", borderColor: "border-blue-600" },
    { id: "Interviewing", title: "INTERVIEWING", color: "bg-orange-500", borderColor: "border-orange-500" },
    { id: "Offer", title: "OFFER", color: "bg-green-600", borderColor: "border-green-600" },
    { id: "Rejected", title: "REJECTED", color: "bg-red-600", borderColor: "border-red-600" },
];

// --- Components ---

/**
 * 单个职位卡片组件
 */
interface JobCardProps {
    job: Job;
    isOverlay?: boolean;
    onClick?: (job: Job) => void;
}

const JobCard = ({ job, isOverlay, onClick }: JobCardProps) => {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: job.id,
        data: {
            type: "Job",
            job,
        },
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    // 动态样式类
    const baseStyles = cn(
        "relative flex flex-col gap-2 p-4 mb-3 bg-white",
        "border-2 border-black rounded-sm", // 硬边框，微圆角
        "font-mono text-sm text-black", // 等宽字体
        "cursor-grab active:cursor-grabbing",
        "group transition-all duration-200 ease-in-out"
    );

    // 静态状态下的样式 (Hard Shadow + Hover Effect)
    const staticStyles = cn(
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", // 硬阴影
        "hover:-translate-y-1 hover:-translate-x-1", // Hover 位移
        "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]", // Hover 阴影加深
        "hover:bg-black hover:text-white" // Hover 反转色
    );

    // 拖拽时的样式 (Overlay)
    const overlayStyles = cn(
        "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]", // 更深的硬阴影
        "scale-105 rotate-2", // 旋转 + 放大
        "bg-white text-black z-50 cursor-grabbing",
        "border-2 border-black" // 确保拖拽时边框依然存在
    );

    // 占位符样式 (当卡片被拖走后留下的坑)
    const placeholderStyles = "opacity-20 border-dashed border-2 border-black bg-zinc-100 shadow-none";

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className={cn(baseStyles, placeholderStyles)}
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onClick?.(job)}
            className={cn(baseStyles, isOverlay ? overlayStyles : staticStyles)}
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <span className="font-bold text-lg uppercase tracking-tighter group-hover:text-white">
                    {job.company}
                </span>
                <GripVertical className="w-4 h-4 opacity-20 group-hover:text-white group-hover:opacity-100" />
            </div>

            {/* Body */}
            <div className="flex flex-col gap-1 mt-2">
                <span className="text-xs opacity-70 group-hover:text-zinc-300 group-hover:opacity-100">
                    ROLE
                </span>
                <span className="font-bold leading-tight">{job.role}</span>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t-2 border-black/10 group-hover:border-white/30 flex justify-between items-center">
                <span className="bg-zinc-200 px-1 py-0.5 text-xs font-bold border border-black group-hover:bg-white group-hover:text-black">
                    {job.salary}
                </span>
                <span className="text-[10px] opacity-50 group-hover:text-zinc-400">ID: {job.id}</span>
            </div>
        </div>
    );
};

/**
 * 列容器组件
 */
interface ColumnProps {
    column: { id: Status; title: string; color: string; borderColor: string };
    jobs: Job[];
    onJobClick: (job: Job) => void;
}

const Column = ({ column, jobs, onJobClick }: ColumnProps) => {
    const { setNodeRef } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
    });

    return (
        <div className="flex flex-col h-full w-full">
            {/* Column Header - 模仿终端标题栏 */}
            <div className={cn(
                "mb-4 border-2 border-black text-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]",
                column.color
            )}>
                <h2 className="font-mono font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                    <span className="w-3 h-3 bg-white border border-black"></span>
                    {column.title}
                    <span className="ml-auto bg-white text-black px-1.5 text-xs border border-black">
                        {jobs.length}
                    </span>
                </h2>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 p-2 border-2 border-black bg-zinc-100/50 transition-colors",
                    "min-h-[500px] overflow-y-auto" // 添加垂直滚动
                )}
            >
                <SortableContext
                    items={jobs.map((job) => job.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-1">
                        {jobs.map((job) => (
                            <JobCard key={job.id} job={job} onClick={onJobClick} />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
};

/**
 * Trash Bin Component
 */
const TrashBin = () => {
    const { setNodeRef, isOver } = useSortable({
        id: "Trash",
        data: {
            type: "Column",
            column: { id: "Trash", title: "TRASH", color: "bg-zinc-800", borderColor: "border-zinc-800" }
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col items-center justify-center border-2 border-black border-dashed rounded-sm transition-colors mt-4 md:mt-0",
                "w-full h-24 md:h-full md:w-24 min-w-[80px]", // Mobile: full width bottom bar, Desktop: narrow side column
                isOver ? "bg-red-100 border-red-600" : "bg-zinc-100 border-zinc-300 opacity-50 hover:opacity-100"
            )}
        >
            <div className="text-center p-2 md:p-4 flex md:block items-center justify-center gap-4 h-full">
                <span className="text-2xl md:text-3xl mb-0 md:mb-2 block">🗑️</span>
                <span className="font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest hidden md:block">
                    {isOver ? "DROP" : "TRASH"}
                </span>
            </div>
        </div>
    );
};

/**
 * Job Details Modal - Inspired by Teal design
 */
const JobDetailsModal = ({ job, onClose }: { job: Job; onClose: () => void }) => {
    if (!job) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-colors"
                >
                    <span className="sr-only">Close</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {/* Header Section */}
                <div className="mb-8">
                    <div className="inline-block bg-black text-white px-3 py-1 text-sm font-mono mb-4">
                        ID: {job.id}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">{job.company}</h2>
                </div>

                {/* Three-column grid: Position, Company, Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-blue-600 uppercase mb-2">Job Position</span>
                        <span className="text-lg font-bold text-black">{job.role}</span>
                    </div>
                    <div className="bg-green-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-green-600 uppercase mb-2">Company</span>
                        <span className="text-lg font-bold text-black">{job.company}</span>
                    </div>
                    <div className="bg-purple-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-purple-600 uppercase mb-2">Location</span>
                        <span className="text-lg font-bold text-black">{job.location || "Unknown"}</span>
                    </div>
                </div>

                {/* Status and Salary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-zinc-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-zinc-400 uppercase mb-2">Status</span>
                        <span className={cn(
                            "inline-block px-3 py-1.5 text-sm font-bold border-2 border-black",
                            job.status === 'Applied' && "bg-blue-100 text-blue-800",
                            job.status === 'Interviewing' && "bg-orange-100 text-orange-800",
                            job.status === 'Offer' && "bg-green-100 text-green-800",
                            job.status === 'Rejected' && "bg-red-100 text-red-800",
                        )}>
                            {job.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="bg-zinc-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-zinc-400 uppercase mb-2">Salary</span>
                        <span className="text-lg font-bold">{job.salary}</span>
                    </div>
                </div>

                {/* Email Content */}
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-black"></span>
                            EMAIL SNIPPET
                        </h4>
                        <div className="bg-zinc-100 p-4 border-2 border-black font-mono text-sm leading-relaxed">
                            {job.emailSnippet || "No email content available."}
                        </div>
                    </div>

                    {job.description && (
                        <div>
                            <h4 className="font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 bg-black"></span>
                                DESCRIPTION
                            </h4>
                            <p className="text-zinc-700 leading-relaxed">
                                {job.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 pt-6 border-t-2 border-black flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 border-2 border-black font-bold hover:bg-zinc-100 transition-colors">
                        CLOSE
                    </button>
                    <button className="px-6 py-2 bg-black text-white border-2 border-black font-bold hover:bg-zinc-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                        OPEN IN GMAIL
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * 主看板组件
 */
// Helper functions for Gmail data conversion
function extractCompany(subject: string, from: string): string {
    // Common job email patterns
    const patterns = [
        /(?:from|at|@|with)\s+([A-Z][a-zA-Z\s&.]+?)(?:\s+(?:for|regarding|re:|\||,|$))/i,
        /([A-Z][a-zA-Z\s&.]+?)\s+(?:job|position|role|opportunity|application)/i,
        /^([A-Z][a-zA-Z\s&.]+?)\s+-/,  // "Company - Job Title" format
    ];

    for (const pattern of patterns) {
        const match = subject.match(pattern);
        if (match && match[1]) {
            const company = match[1].trim();
            // Filter out common non-company words
            if (!['New', 'Your', 'Job', 'Application', 'Interview', 'Thank'].includes(company)) {
                return company;
            }
        }
    }

    // Extract from email domain as fallback
    const fromMatch = from.match(/@([a-zA-Z0-9-]+)\./);
    if (fromMatch) {
        const domain = fromMatch[1];
        // Capitalize first letter
        return domain.charAt(0).toUpperCase() + domain.slice(1);
    }

    return "Unknown";
}

function extractRole(subject: string): string {
    // Common role patterns
    const rolePatterns = [
        /(?:for|as|position:|role:)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:at|with|\||,|$))/i,
        /(Software Engineer|Frontend Engineer|Backend Engineer|Full Stack|Product Manager|Designer|Data Scientist|DevOps|QA Engineer|Marketing Manager)/i,
    ];

    for (const pattern of rolePatterns) {
        const match = subject.match(pattern);
        if (match && match[1]) return match[1].trim();
    }

    // Fallback: look for common role keywords
    const roleKeywords = [
        "Engineer", "Developer", "Designer", "Manager", "Analyst",
        "Scientist", "Architect", "Director", "Lead", "Specialist"
    ];
    for (const keyword of roleKeywords) {
        if (subject.toLowerCase().includes(keyword.toLowerCase())) return keyword;
    }

    return "Position";
}

function extractLocation(subject: string, body: string): string {
    const text = subject + " " + body;

    // Common location patterns
    const locationPatterns = [
        /(?:in|at|location:|based in)\s+([A-Z][a-zA-Z\s]+?,\s*[A-Z]{2})/i,  // "San Francisco, CA"
        /(?:in|at|location:|based in)\s+(New York|San Francisco|Los Angeles|Seattle|Austin|Boston|Chicago|Remote)/i,
        /\b(Remote|Hybrid|On-site)\b/i,
    ];

    for (const pattern of locationPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) return match[1].trim();
    }

    return "Unknown";
}

function mapLabelToStatus(label: string): Status {
    const labelLower = label.toLowerCase();
    if (labelLower.includes("application") || labelLower.includes("applied")) return "Applied";
    if (labelLower.includes("interview")) return "Interviewing";
    if (labelLower.includes("offer")) return "Offer";
    if (labelLower.includes("reject")) return "Rejected";
    return "Applied";
}

export default function JobTrackBoard() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeJob, setActiveJob] = useState<Job | null>(null);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState<string | null>(null);
    const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

    const handleScan = async () => {
        setIsScanning(true);
        setScanMessage(null);

        try {
            const sessionId = localStorage.getItem('session_id');
            if (!sessionId) {
                setScanMessage("⚠️ Please sign in with Google first");
                setTimeout(() => setScanMessage(null), 3000);
                setIsScanning(false);
                return;
            }

            // Use gmailApi which handles authentication headers automatically
            const data = await gmailApi.scanEmails({
                maxResults: 50,
                query: "newer_than:7d" // Scan all emails from last 7 days, not just unread
            });

            if (data.success && data.results) {
                const newJobs = data.results
                    .filter((r: any) => !r.skipped && r.label)
                    .map((r: any) => ({
                        id: r.id,
                        company: extractCompany(r.subject || "", r.from || ""),
                        role: extractRole(r.subject || ""),
                        salary: "Unknown",
                        status: mapLabelToStatus(r.label),
                        location: extractLocation(r.subject || "", ""),
                        description: r.subject,
                        date: new Date().toISOString().split('T')[0],
                        emailSnippet: r.subject || "No subject"
                    }));

                setJobs(prevJobs => {
                    const existingIds = new Set(prevJobs.map(j => j.id));
                    const uniqueNewJobs = newJobs.filter((j: Job) => !existingIds.has(j.id));
                    return [...prevJobs, ...uniqueNewJobs];
                });

                setLastScanTime(new Date());
                setScanMessage(`✓ Found ${newJobs.length} job email${newJobs.length !== 1 ? 's' : ''}!`);
                setTimeout(() => setScanMessage(null), 5000);
            } else {
                setScanMessage("No new emails found");
                setTimeout(() => setScanMessage(null), 3000);
            }
        } catch (e: any) {
            console.error("Scan failed", e);
            if (e.response?.status === 401) {
                setScanMessage("⚠️ Session expired - please sign in again");
                localStorage.removeItem('session_id');
            } else {
                setScanMessage("❌ Scan failed - " + (e.message || "Network error"));
            }
            setTimeout(() => setScanMessage(null), 3000);
        } finally {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        async function fetchJobs() {
            try {
                setIsLoading(true);
                const sessionId = localStorage.getItem('session_id');

                // Check if authenticated
                if (!sessionId) {
                    console.log("Not authenticated, no data to load");
                    setJobs([]);
                    setIsLoading(false);
                    return;
                }

                const authRes = await authApi.checkStatus();

                if (!authRes.authenticated) {
                    console.log("Not authenticated, no data to load");
                    setJobs([]);
                    setIsLoading(false);
                    return;
                }

                // Fetch recent labeled emails using gmailApi
                const data = await gmailApi.scanEmails({
                    maxResults: 50,
                    query: "newer_than:7d" // Reduced from 30d to 7d for faster loading
                });

                if (data.success && data.results) {
                    const loadedJobs = data.results
                        .filter((r: any) => !r.skipped && r.label)
                        .map((r: any) => ({
                            id: r.id,
                            company: extractCompany(r.subject || "", r.from || ""),
                            role: extractRole(r.subject || ""),
                            salary: "Unknown",
                            status: mapLabelToStatus(r.label),
                            location: extractLocation(r.subject || "", ""),
                            description: r.subject,
                            date: new Date().toISOString().split('T')[0],
                            emailSnippet: r.subject || "No subject"
                        }));

                    setJobs(loadedJobs);
                } else {
                    setJobs([]);
                }
            } catch (error) {
                console.warn("Failed to fetch jobs:", error);
                setJobs([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchJobs();
    }, []);

    const columns = useMemo(() => {
        const cols = new Map<Status, Job[]>();
        COLUMNS.forEach((c) => cols.set(c.id, []));
        jobs.forEach((job) => {
            const col = cols.get(job.status);
            if (col) col.push(job);
        });
        return cols;
    }, [jobs]);

    // Sensors definition
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // 避免轻微抖动触发拖拽
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Logic: Find where we are dragging
    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === "Job") {
            setActiveJob(event.active.data.current.job);
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveABot = active.data.current?.type === "Job";
        const isOverABot = over.data.current?.type === "Job";
        const isOverAColumn = over.data.current?.type === "Column";

        if (!isActiveABot) return;

        // Scenario 1: Dragging over another Job
        if (isActiveABot && isOverABot) {
            setJobs((jobs) => {
                const activeIndex = jobs.findIndex((j) => j.id === activeId);
                const overIndex = jobs.findIndex((j) => j.id === overId);

                if (jobs[activeIndex].status !== jobs[overIndex].status) {
                    const newJobs = [...jobs];
                    newJobs[activeIndex].status = jobs[overIndex].status;
                    return arrayMove(newJobs, activeIndex, overIndex - 1); // Move to approximate new index
                }
                return arrayMove(jobs, activeIndex, overIndex);
            });
        }

        // Scenario 2: Dragging over an empty Column
        if (isActiveABot && isOverAColumn) {
            setJobs((jobs) => {
                const activeIndex = jobs.findIndex((j) => j.id === activeId);
                const newStatus = over.id as Status;

                // If dropped in Trash, remove it
                if (newStatus === "Trash") {
                    return jobs.filter(j => j.id !== activeId);
                }

                if (jobs[activeIndex].status !== newStatus) {
                    const newJobs = [...jobs];
                    newJobs[activeIndex].status = newStatus;
                    return arrayMove(newJobs, activeIndex, activeIndex); // Just update status
                }
                return jobs;
            });
        }
    };

    const onDragEnd = (event: DragEndEvent) => {
        setActiveJob(null);
        // Final reordering logic is partly handled in DragOver for smoothness,
        // but you could do API calls here.
    };

    // Custom Drop Animation to remove blur and keep crisp edges
    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: "0.5",
                },
            },
        }),
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-mono">
                <div className="animate-pulse text-xl font-bold tracking-widest">
                    &gt; SYSTEM_INITIALIZING..._
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-zinc-50 text-black font-mono p-4 md:p-8 flex flex-col overflow-hidden">
            {/* Page Header */}
            <header className="mb-6 border-b-4 border-black pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2 flex items-center gap-4">
                        <span className="bg-black text-white px-3 py-1 text-2xl block transform -rotate-2 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                            #
                        </span>
                        JobTrack_v1.0
                    </h1>
                    <p className="text-sm md:text-base font-bold opacity-60 uppercase tracking-widest ml-1">
                        Drag_and_Drop Interface // Secure_Mode
                    </p>
                </div>
                <button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="bg-black text-white px-6 py-3 font-bold uppercase tracking-wider border-2 border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isScanning ? (
                        <>
                            <span className="animate-spin">⏳</span> Scanning...
                        </>
                    ) : (
                        <>
                            <span>🔍</span> Scan Gmail
                        </>
                    )}
                </button>
            </header>

            {/* Kanban Board Area */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="flex-1 flex flex-col md:flex-row gap-4 w-full h-full min-h-0">
                    {/* Main Grid for Columns */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full min-h-0">
                        {COLUMNS.map((col) => (
                            <div key={col.id} className="h-full min-h-0 flex flex-col">
                                <Column
                                    column={col}
                                    jobs={columns.get(col.id) || []}
                                    onJobClick={setSelectedJob}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Trash Bin - Side on Desktop, Bottom on Mobile */}
                    <div className="shrink-0">
                        <TrashBin />
                    </div>
                </div>

                {/* Drag Overlay (The floating card) */}
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeJob ? (
                        <JobCard job={activeJob} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Job Details Modal */}
            {selectedJob && (
                <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />
            )}

            {/* Toast Notification */}
            {scanMessage && (
                <div className="fixed top-4 right-4 z-50 bg-black text-white px-6 py-3 border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] font-mono text-sm animate-slide-in">
                    {scanMessage}
                </div>
            )}
        </div>
    );
}
