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

// --- Utility: 合并 Tailwind 类名 ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Types ---
type Status = "Applied" | "Interviewing" | "Offer" | "Rejected";

interface Job {
    id: string;
    company: string;
    role: string;
    salary: string;
    status: Status;
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
        <div className="flex flex-col w-full h-full min-w-[280px] md:min-w-[300px]">
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
                    "min-h-[500px]" // 保证空列也有高度
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
 * Job Details Modal
 */
const JobDetailsModal = ({ job, onClose }: { job: Job; onClose: () => void }) => {
    if (!job) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-colors"
                >
                    <span className="sr-only">Close</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div className="mb-6">
                    <div className="inline-block bg-black text-white px-3 py-1 text-sm font-mono mb-2">
                        ID: {job.id}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-1">{job.company}</h2>
                    <h3 className="text-xl font-mono text-zinc-600 border-b-2 border-black pb-4 mb-4">{job.role}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-zinc-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-zinc-400 uppercase mb-1">Status</span>
                        <span className={cn(
                            "inline-block px-2 py-1 text-sm font-bold border border-black",
                            job.status === 'Applied' && "bg-blue-100 text-blue-800",
                            job.status === 'Interviewing' && "bg-orange-100 text-orange-800",
                            job.status === 'Offer' && "bg-green-100 text-green-800",
                            job.status === 'Rejected' && "bg-red-100 text-red-800",
                        )}>
                            {job.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="bg-zinc-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-zinc-400 uppercase mb-1">Salary</span>
                        <span className="text-lg font-bold">{job.salary}</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 bg-black"></span>
                            Email Snippet
                        </h4>
                        <div className="bg-zinc-100 p-4 border-2 border-black font-mono text-sm leading-relaxed">
                            {job.emailSnippet || "No email content available."}
                        </div>
                    </div>

                    {job.description && (
                        <div>
                            <h4 className="font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-black"></span>
                                Description
                            </h4>
                            <p className="text-zinc-700 leading-relaxed">
                                {job.description}
                            </p>
                        </div>
                    )}
                </div>

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
export default function JobTrackBoard() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeJob, setActiveJob] = useState<Job | null>(null);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    useEffect(() => {
        async function fetchJobs() {
            try {
                // Try to fetch from API
                // Note: On Vercel, this will 404 unless you have a backend deployed and configured.
                // We use a timeout to prevent hanging.
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const res = await fetch("/api/emails/analyze", {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                clearTimeout(timeoutId);

                if (!res.ok) {
                    throw new Error(`API Error: ${res.status}`);
                }

                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setJobs(data);
                } else {
                    console.warn("API returned empty data, using fallback.");
                    setJobs(FALLBACK_DATA);
                }
            } catch (error) {
                console.warn("Failed to fetch jobs (using fallback data):", error);
                setJobs(FALLBACK_DATA);
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
        <div className="min-h-screen bg-zinc-50 text-black font-mono p-8 md:p-12 overflow-x-auto">
            {/* Page Header */}
            <header className="mb-10 border-b-4 border-black pb-6">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2 flex items-center gap-4">
                    <span className="bg-black text-white px-3 py-1 text-2xl block transform -rotate-2 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                        #
                    </span>
                    JobTrack_v1.0
                </h1>
                <p className="text-sm md:text-base font-bold opacity-60 uppercase tracking-widest ml-1">
                    Drag_and_Drop Interface // Secure_Mode
                </p>
            </header>

            {/* Kanban Board Area */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="flex flex-col md:flex-row gap-6 w-full md:w-max pb-10">
                    {COLUMNS.map((col) => (
                        <Column
                            key={col.id}
                            column={col}
                            jobs={columns.get(col.id) || []}
                            onJobClick={setSelectedJob}
                        />
                    ))}
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
        </div>
    );
}
