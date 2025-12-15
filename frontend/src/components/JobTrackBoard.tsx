"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
import { gmailApi, authApi, jobsApi } from "../api/client.js";
import WelcomeCard from "./WelcomeCard";
import { MOCK_JOBS } from "../data/mockJobs";

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
    { id: "1", company: "Google", role: "Frontend Engineer", salary: "$180k", status: "Applied", location: "Mountain View, CA", description: "Working on the Google Cloud Console team.", date: "2023-10-01", emailSnippet: "Thank you for your application..." },
    { id: "2", company: "Spotify", role: "UI Designer", salary: "$140k", status: "Applied", location: "Remote", description: "Design system team.", date: "2023-10-05", emailSnippet: "We have received your application..." },
    { id: "3", company: "Stripe", role: "Fullstack Dev", salary: "$200k", status: "Interviewing", location: "San Francisco, CA", description: "Payments infrastructure.", date: "2023-10-10", emailSnippet: "We'd like to schedule a chat..." },
    { id: "4", company: "Linear", role: "Product Engineer", salary: "$170k", status: "Interviewing", location: "Remote", description: "Building the issue tracker.", date: "2023-10-12", emailSnippet: "Next steps for your application..." },
    { id: "5", company: "Vercel", role: "DevRel", salary: "$160k", status: "Offer", location: "Remote", description: "Developer Relations for Next.js.", date: "2023-10-15", emailSnippet: "Congratulations! We are pleased to offer..." },
    { id: "6", company: "Oracle", role: "Java Dev", salary: "$120k", status: "Rejected", location: "Redwood City, CA", description: "Legacy systems maintenance.", date: "2023-09-20", emailSnippet: "Thank you for your interest, but..." },
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
 * 新增：说明书风格的幽灵卡片
 */
function EmptyStatePlaceholder({ columnId, onClick }: { columnId: string, onClick?: () => void }) {

    // 定义每一列的专属“任务说明书”
    const instructions: Record<string, { step: string; title: string; desc: string; icon: string }> = {
        'Applied': {
            step: '01',
            title: 'INGESTION',
            desc: 'SYSTEM OFFLINE. CLICK [SCAN_GMAIL] TO INGEST DATA.',
            icon: '📡'
        },
        'Interviewing': {
            step: '02',
            title: 'PROCESSING',
            desc: 'DRAG_AND_DROP OBJECTS HERE TO UPDATE STATUS.',
            icon: '🕹️'
        },
        'Offer': {
            step: '03',
            title: 'SUCCESS',
            desc: 'CLICK JOB TO EDIT DETAILS.',
            icon: '💾'
        },
        'Rejected': {
            step: '04',
            title: 'ARCHIVE',
            desc: "LIKE IT? CAN'T WAIT TO KNOW HOW MANY JOBS YOU APPLIED? CLICK SIGN IN AT THE LEFT BOTTOM CORNER.",
            icon: '🗑️'
        }
    };

    const info = instructions[columnId] || { step: '??', title: 'UNKNOWN', desc: 'Waiting for data...', icon: '❓' };

    return (
        <div
            onClick={columnId === 'Applied' ? onClick : undefined}
            className={cn(
                "border-2 border-dashed border-zinc-300 bg-zinc-100/50 p-4 h-48 flex flex-col justify-between group select-none transition-colors hover:border-zinc-400 hover:bg-zinc-100",
                columnId === 'Applied' && "border-zinc-400 bg-zinc-100 cursor-pointer hover:border-blue-400 hover:bg-blue-50" // Applied 列稍微显眼一点
            )}
        >

            {/* 顶部：步骤编号 */}
            <div className="flex justify-between items-start opacity-50">
                <span className="font-mono text-xs font-bold text-zinc-500">
          // STEP_{info.step}
                </span>
                <span className="text-xl grayscale opacity-50">{info.icon}</span>
            </div>

            {/* 中间：核心指令 */}
            <div className="mt-2">
                <h3 className="font-mono font-bold text-sm text-zinc-700 mb-1">
                    {`> ${info.title}`}
                </h3>
                <p className="font-mono text-xs text-zinc-500 leading-relaxed uppercase">
                    {info.desc}
                </p>
            </div>

            {/* 底部：装饰性光标 */}
            <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-4 bg-zinc-400 animate-pulse"></div>
                <span className="font-mono text-[10px] text-zinc-400">WAITING_FOR_INPUT</span>
            </div>

        </div>
    );
}

/**
 * 列容器组件
 */
interface ColumnProps {
    column: { id: Status; title: string; color: string; borderColor: string };
    jobs: Job[];
    onJobClick: (job: Job) => void;
    onPlaceholderClick?: () => void;
    showWelcomeCard?: boolean;
    onStartDemo?: () => void;
    isAuthenticated?: boolean;
}

const Column = ({ column, jobs, onJobClick, onPlaceholderClick, showWelcomeCard, onStartDemo, isAuthenticated }: ColumnProps) => {
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
                        {jobs.length === 0 && showWelcomeCard && column.id === 'Applied' && !isAuthenticated && (
                            <WelcomeCard onPlay={onStartDemo} />
                        )}

                        {jobs.length === 0 && (!showWelcomeCard || column.id !== 'Applied') && !isAuthenticated && (
                            <EmptyStatePlaceholder columnId={column.id} onClick={onPlaceholderClick} />
                        )}

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
const JobDetailsModal = ({ job, onClose, onDelete, onSave }: { job: Job; onClose: () => void; onDelete: (jobId: string) => void; onSave: (job: Job) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedJob, setEditedJob] = useState<Job>(job);

    // Reset edited job when job prop changes
    useEffect(() => {
        setEditedJob(job);
    }, [job]);

    if (!job) return null;

    const handleSave = () => {
        onSave(editedJob);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedJob(job);
        setIsEditing(false);
    };

    const handleChange = (field: keyof Job, value: string) => {
        setEditedJob(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-4 right-4 flex gap-2">
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-colors"
                        >
                            <span className="sr-only">Edit</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Header Section */}
                <div className="mb-8">
                    <div className="inline-block bg-black text-white px-3 py-1 text-sm font-mono mb-4">
                        {job.date ? new Date(job.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        }) : 'Date Unknown'}
                    </div>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedJob.company}
                            onChange={(e) => handleChange('company', e.target.value)}
                            className="w-full text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 border-b-4 border-black focus:outline-none focus:border-blue-600 bg-transparent"
                            placeholder="COMPANY NAME"
                        />
                    ) : (
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">{job.company}</h2>
                    )}
                </div>

                {/* Three-column grid: Position, Company, Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-blue-600 uppercase mb-2">Job Position</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedJob.role}
                                onChange={(e) => handleChange('role', e.target.value)}
                                className="w-full text-lg font-bold text-black border-b-2 border-black bg-transparent focus:outline-none focus:border-blue-600"
                            />
                        ) : (
                            <span className="text-lg font-bold text-black">{job.role}</span>
                        )}
                    </div>
                    <div className="bg-green-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-green-600 uppercase mb-2">Company</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedJob.company}
                                onChange={(e) => handleChange('company', e.target.value)}
                                className="w-full text-lg font-bold text-black border-b-2 border-black bg-transparent focus:outline-none focus:border-green-600"
                            />
                        ) : (
                            <span className="text-lg font-bold text-black">{job.company}</span>
                        )}
                    </div>
                    <div className="bg-purple-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-purple-600 uppercase mb-2">Location</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedJob.location || ''}
                                onChange={(e) => handleChange('location', e.target.value)}
                                className="w-full text-lg font-bold text-black border-b-2 border-black bg-transparent focus:outline-none focus:border-purple-600"
                                placeholder="Unknown"
                            />
                        ) : (
                            <span className="text-lg font-bold text-black">{job.location || "Unknown"}</span>
                        )}
                    </div>
                </div>

                {/* Status and Salary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-zinc-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-zinc-400 uppercase mb-2">Status</span>
                        {isEditing ? (
                            <select
                                value={editedJob.status}
                                onChange={(e) => handleChange('status', e.target.value as Status)}
                                className="w-full p-2 text-sm font-bold border-2 border-black bg-white focus:outline-none"
                            >
                                <option value="Applied">APPLIED</option>
                                <option value="Interviewing">INTERVIEWING</option>
                                <option value="Offer">OFFER</option>
                                <option value="Rejected">REJECTED</option>
                            </select>
                        ) : (
                            <span className={cn(
                                "inline-block px-3 py-1.5 text-sm font-bold border-2 border-black",
                                job.status === 'Applied' && "bg-blue-100 text-blue-800",
                                job.status === 'Interviewing' && "bg-orange-100 text-orange-800",
                                job.status === 'Offer' && "bg-green-100 text-green-800",
                                job.status === 'Rejected' && "bg-red-100 text-red-800",
                            )}>
                                {job.status.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="bg-zinc-50 p-4 border-2 border-black">
                        <span className="block text-xs font-bold text-zinc-400 uppercase mb-2">Salary</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedJob.salary}
                                onChange={(e) => handleChange('salary', e.target.value)}
                                className="w-full text-lg font-bold border-b-2 border-black bg-transparent focus:outline-none"
                            />
                        ) : (
                            <span className="text-lg font-bold">{job.salary}</span>
                        )}
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
                <div className="mt-8 pt-6 border-t-2 border-black flex justify-between items-center">
                    <button
                        onClick={() => {
                            // Delete the job (same as dragging to trash)
                            onDelete(job.id);
                            onClose();
                        }}
                        className="px-6 py-2 border-2 border-red-600 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <span>🗑️</span>
                        DELETE
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox/${job.id}`, '_blank')}
                            className="px-6 py-2 bg-black text-white border-2 border-black font-bold hover:bg-zinc-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                        >
                            OPEN IN GMAIL
                        </button>

                        {isEditing && (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-2 bg-red-600 text-white border-2 border-black font-bold hover:bg-red-700 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-green-600 text-white border-2 border-black font-bold hover:bg-green-700 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                                >
                                    SAVE
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * System Check List Component - Neo-Brutalist Terminal Style
 */
interface SystemCheckListProps {
    steps: string[];
    className?: string;
}

const SystemCheckList = ({ steps, className }: SystemCheckListProps) => {
    const [visibleSteps, setVisibleSteps] = useState<number>(0);

    useEffect(() => {
        // Progressive reveal animation
        if (visibleSteps < steps.length) {
            const timer = setTimeout(() => {
                setVisibleSteps(prev => prev + 1);
            }, 300); // Delay between each step appearing
            return () => clearTimeout(timer);
        }
    }, [visibleSteps, steps.length]);

    return (
        <div className={cn("font-mono text-sm", className)}>
            <div className="border-2 border-black bg-zinc-900 text-green-400 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {/* Terminal Header */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-400/30">
                    <span className="w-2 h-2 bg-red-500 border border-black"></span>
                    <span className="w-2 h-2 bg-yellow-500 border border-black"></span>
                    <span className="w-2 h-2 bg-green-500 border border-black"></span>
                    <span className="ml-2 text-xs opacity-70">SYSTEM_INIT.LOG</span>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                    {steps.map((step, index) => {
                        const isVisible = index < visibleSteps;
                        const stepNumber = String(index + 1).padStart(2, '0');

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-start gap-3 transition-all duration-300",
                                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                                )}
                            >
                                {/* Status Indicator */}
                                <span className={cn(
                                    "shrink-0 w-4 h-4 border-2 border-green-400 flex items-center justify-center text-[10px]",
                                    isVisible && "bg-green-400 text-black animate-pulse"
                                )}>
                                    {isVisible && "✓"}
                                </span>

                                {/* Step Content */}
                                <div className="flex-1">
                                    <span className="text-green-400/60">&gt; {stepNumber}.</span>{" "}
                                    <span className="text-green-400">{step}</span>
                                    {isVisible && <span className="animate-blink ml-1">_</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Status */}
                {visibleSteps === steps.length && (
                    <div className="mt-4 pt-3 border-t border-green-400/30 text-xs opacity-70 animate-fade-in">
                        <span className="text-green-400">[OK]</span> System ready. All checks passed.
                    </div>
                )}
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
    const [savedJobs, setSavedJobs] = useState<Record<string, Job>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeJob, setActiveJob] = useState<Job | null>(null);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState<string | null>(null);
    const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
    const [maxResults, setMaxResults] = useState<number>(() => {
        const saved = localStorage.getItem('scan_max_results');
        return saved ? parseInt(saved, 10) : 50;
    });
    const [scanSource, setScanSource] = useState<string>(() => {
        const saved = localStorage.getItem('scan_source');
        return saved || 'inbox';
    });
    const [dateRange, setDateRange] = useState<string>(() => {
        const saved = localStorage.getItem('scan_date_range');
        return saved || '7d';
    });
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Listen for scan config updates from ScanLogs
    useEffect(() => {
        const handleScanConfigUpdate = (event: any) => {
            console.log('[JobTrackBoard] Scan config updated:', event.detail);
            setMaxResults(event.detail.maxResults);
            setScanSource(event.detail.scanSource);
            setDateRange(event.detail.dateRange);
        };
        window.addEventListener('updateScanConfig', handleScanConfigUpdate);
        return () => window.removeEventListener('updateScanConfig', handleScanConfigUpdate);
    }, []);

    // Fetch saved jobs on mount
    useEffect(() => {
        async function loadSavedJobs() {
            try {
                const data = await jobsApi.getAll();
                if (data.success && data.jobs) {
                    setSavedJobs(data.jobs);
                }
            } catch (error) {
                console.error("Failed to load saved jobs:", error);
            }
        }
        loadSavedJobs();
    }, []);

    // Keep a ref of savedJobs for access inside fetchJobs without dependency
    const savedJobsRef = useRef(savedJobs);
    useEffect(() => {
        savedJobsRef.current = savedJobs;
    }, [savedJobs]);

    // Update jobs when savedJobs changes (to apply overrides to already loaded jobs)
    useEffect(() => {
        if (Object.keys(savedJobs).length === 0) return;

        setJobs(prevJobs => prevJobs.map(job =>
            savedJobs[job.id] ? { ...job, ...savedJobs[job.id] } : job
        ));
    }, [savedJobs]);

    const handleStartDemo = () => {
        setJobs(MOCK_JOBS as unknown as Job[]);
    };

    const handleSaveJob = async (updatedJob: Job) => {
        try {
            // Optimistic update
            setSavedJobs(prev => ({
                ...prev,
                [updatedJob.id]: updatedJob
            }));

            setJobs(prevJobs => prevJobs.map(job =>
                job.id === updatedJob.id ? updatedJob : job
            ));

            if (selectedJob?.id === updatedJob.id) {
                setSelectedJob(updatedJob);
            }

            // Persist to backend if not in demo mode
            if (!isDemoMode) {
                await jobsApi.update(updatedJob.id, updatedJob);
            }

            setScanMessage("✓ Job updated successfully");
            setTimeout(() => setScanMessage(null), 3000);
        } catch (error) {
            console.error("Failed to save job:", error);
            setScanMessage("❌ Failed to save job");
            setTimeout(() => setScanMessage(null), 3000);
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        try {
            if (!isDemoMode) {
                await jobsApi.delete(jobId);
            }
            setJobs(prevJobs => prevJobs.filter(j => j.id !== jobId));
            setSelectedJob(null);
        } catch (error) {
            console.error("Failed to delete job:", error);
            // Optionally show error toast
        }
    };

    const handleDemoLoad = () => {
        setIsDemoMode(true);
        setJobs(FALLBACK_DATA);
        setScanMessage("✨ Demo data loaded!");
        setTimeout(() => setScanMessage(null), 3000);
    };

    const handleScan = async () => {
        setIsScanning(true);
        setScanMessage(null);

        // Check if authenticated
        const sessionId = localStorage.getItem('session_id');
        if (!sessionId) {
            // If not authenticated, trigger demo mode
            handleDemoLoad();
            setIsScanning(false);
            return;
        }

        // Build query based on configuration
        const sourceQuery = scanSource === 'inbox' ? 'in:inbox' : 'is:unread';
        const query = `${sourceQuery} newer_than:${dateRange}`;

        let scanSuccess = false;
        let scanError = null;
        let emailsScanned = 0;
        let emailsFound = 0;
        let processedEmails: Job[] = [];
        let allScannedEmails: any[] = [];

        try {
            const sessionId = localStorage.getItem('session_id');
            if (!sessionId) {
                scanError = "Please sign in with Google first";
                setScanMessage("⚠️ " + scanError);
                setTimeout(() => setScanMessage(null), 3000);
                setIsScanning(false);
                return;
            }

            // Use gmailApi which handles authentication headers automatically
            const data = await gmailApi.scanEmails({
                maxResults: maxResults,
                query: query
            });

            if (data.success && data.results) {
                emailsScanned = data.results.length;

                // Process ALL emails and add classification info
                allScannedEmails = data.results.map((r: any) => ({
                    id: r.id,
                    subject: r.subject || "No subject",
                    from: r.from || "Unknown",
                    date: r.date || new Date().toISOString(),
                    isJobEmail: !r.skipped && !!r.label,
                    classification: r.label || "not_classified",
                    skipped: r.skipped || false
                }));

                // Extract only job emails for the board
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

                emailsFound = newJobs.length;
                processedEmails = newJobs;

                setJobs(prevJobs => {
                    const existingIds = new Set(prevJobs.map(j => j.id));
                    const uniqueNewJobs = newJobs.filter((j: Job) => !existingIds.has(j.id));

                    // Merge with saved jobs using ref to avoid dependency
                    const currentSavedJobs = savedJobsRef.current;
                    const mergedJobs = [...prevJobs, ...uniqueNewJobs].map(job => {
                        return currentSavedJobs[job.id] ? { ...job, ...currentSavedJobs[job.id] } : job;
                    });

                    return mergedJobs;
                });

                setLastScanTime(new Date());
                scanSuccess = true;
                setScanMessage(`✓ Found ${newJobs.length} job email${newJobs.length !== 1 ? 's' : ''}!`);
                setTimeout(() => setScanMessage(null), 5000);
            } else {
                scanSuccess = true;
                setScanMessage("No new emails found");
                setTimeout(() => setScanMessage(null), 3000);
            }

            // Refresh jobs from DB to get latest state (including any newly scanned ones)
            const dbJobs = await jobsApi.getAll();
            if (dbJobs.success && dbJobs.jobs) {
                setJobs(dbJobs.jobs);
            }

        } catch (e: any) {
            console.error("Scan failed", e);
            scanError = e.message || "Network error";
            if (e.response?.status === 401) {
                scanError = "Session expired - please sign in again";
                setScanMessage("⚠️ " + scanError);
                localStorage.removeItem('session_id');
            } else {
                setScanMessage("❌ Scan failed - " + scanError);
            }
            setTimeout(() => setScanMessage(null), 3000);
        } finally {
            setIsScanning(false);

            // Emit scan event for logging
            const eventDetail = {
                success: scanSuccess,
                emailsScanned: emailsScanned,
                emailsFound: emailsFound,
                query: query,
                scanSource: scanSource,
                dateRange: dateRange,
                error: scanError,
                allEmails: allScannedEmails,
                jobEmails: processedEmails
            };

            console.log('[JobTrackBoard] Dispatching scanComplete event:', eventDetail);
            window.dispatchEvent(new CustomEvent('scanComplete', {
                detail: eventDetail
            }));
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
                setIsAuthenticated(authRes.authenticated);

                if (!authRes.authenticated) {
                    console.log("Not authenticated, no data to load");
                    setJobs([]);
                    setIsLoading(false);
                    return;
                }

                // Fetch saved jobs from DB
                const data = await jobsApi.getAll();

                if (data.success && data.jobs) {
                    setJobs(data.jobs);
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
    }, []); // Empty dependency array to run only once on mount

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
        const { active, over } = event;
        setActiveJob(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the job and its new status
        const job = jobs.find(j => j.id === activeId);
        if (!job) return;

        // If dropped on a column, the new status is the column ID
        // If dropped on another job, the new status is that job's status
        let newStatus: Status | undefined;

        if (over.data.current?.type === "Column") {
            newStatus = over.id as Status;
        } else if (over.data.current?.type === "Job") {
            const overJob = jobs.find(j => j.id === overId);
            if (overJob) {
                newStatus = overJob.status;
            }
        }

        // If status changed, persist it
        if (newStatus && newStatus !== job.status && newStatus !== "Trash") {
            // 1. Update savedJobsRef immediately to prevent reversion on re-render/fetch
            if (savedJobsRef.current) {
                savedJobsRef.current = {
                    ...savedJobsRef.current,
                    [job.id]: {
                        ...savedJobsRef.current[job.id],
                        status: newStatus
                    }
                };
            }

            // 2. Persist to backend if not in demo mode
            if (!isDemoMode) {
                jobsApi.update(job.id, { status: newStatus }).catch(err => {
                    console.error("Failed to persist drag and drop status change:", err);
                    // Optionally revert UI here if needed, but for now we trust optimistic update
                });
            }
        }
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
                        JobTrack_v2.0
                    </h1>
                    <p className="text-sm md:text-base font-bold opacity-60 uppercase tracking-widest ml-1">
                        Drag_and_Drop Interface // Secure_Mode
                    </p>
                </div>
                <button
                    onClick={handleScan}
                    disabled={isScanning}
                    className={cn(
                        "bg-black text-white px-6 py-3 font-bold uppercase tracking-wider border-2 border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                        // Add breathing animation if Applied column is empty
                        (columns.get('Applied')?.length === 0 && !isScanning) && "animate-pulse"
                    )}
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
                                    jobs={jobs.filter((job) => job.status === col.id)}
                                    onJobClick={setSelectedJob}
                                    onPlaceholderClick={() => {
                                        if (col.id === 'Applied') {
                                            setIsScanning(true);
                                            // Trigger scan logic here...
                                        }
                                    }}
                                    showWelcomeCard={jobs.length === 0}
                                    onStartDemo={handleStartDemo}
                                    isAuthenticated={isAuthenticated}
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
                <JobDetailsModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onDelete={handleDeleteJob}
                    onSave={handleSaveJob}
                />
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
