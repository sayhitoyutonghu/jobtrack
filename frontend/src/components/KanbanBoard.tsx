import React, { useState } from 'react';
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
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---
type Status = 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

interface Job {
    id: string;
    company: string;
    title: string;
    status: Status;
}

// --- Mock Data ---
const INITIAL_DATA: Job[] = [
    { id: '1', company: 'Acme Corp', title: 'Frontend Dev', status: 'Applied' },
    { id: '2', company: 'Globex', title: 'Full Stack Engineer', status: 'Interviewing' },
    { id: '3', company: 'Soylent Corp', title: 'Backend Dev', status: 'Applied' },
    { id: '4', company: 'Initech', title: 'Senior Engineer', status: 'Offer' },
    { id: '5', company: 'Umbrella Corp', title: 'Security Analyst', status: 'Rejected' },
    { id: '6', company: 'Stark Ind', title: 'AI Researcher', status: 'Applied' },
    { id: '7', company: 'Cyberdyne', title: 'Systems Architect', status: 'Interviewing' },
];

const COLUMNS: Status[] = ['Applied', 'Interviewing', 'Offer', 'Rejected'];

// --- Components ---

// 1. Job Card Component
interface JobCardProps {
    job: Job;
    isOverlay?: boolean;
}

const JobCard = ({ job, isOverlay }: JobCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: job.id,
        data: {
            type: 'Job',
            job,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Visual Style: Feather Computer / Brutalist
    // - Border: 2px solid black
    // - Shadow: Hard shadow 4px 4px 0px 0px #000
    // - Font: Mono
    // - Hover: bg-black text-white, move up 2px

    const baseClasses = `
    relative p-4 mb-3 bg-white 
    border-2 border-black 
    font-mono cursor-grab active:cursor-grabbing
    transition-all duration-200
  `;

    const shadowClass = isOverlay ? 'shadow-[8px_8px_0px_0px_#000]' : 'shadow-[4px_4px_0px_0px_#000]';

    // When dragging, we want the placeholder to be visible but maybe styled differently?
    // Actually, dnd-kit leaves a placeholder. We can style the dragging item opacity.
    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`
          ${baseClasses}
          opacity-30
          border-dashed
        `}
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
        ${baseClasses}
        ${shadowClass}
        hover:-translate-y-[2px]
        hover:bg-black hover:text-white
        group
      `}
        >
            <div className="font-bold text-lg mb-1 group-hover:text-white">{job.company}</div>
            <div className="text-sm opacity-80 group-hover:text-gray-300">{job.title}</div>
        </div>
    );
};

// 2. Column Component
interface ColumnProps {
    id: Status;
    jobs: Job[];
}

const Column = ({ id, jobs }: ColumnProps) => {
    const { setNodeRef } = useSortable({
        id: id,
        data: {
            type: 'Column',
            id,
        },
    });

    return (
        <div className="flex flex-col w-80 shrink-0 min-w-[300px]">
            {/* Column Header */}
            <div className="
        bg-white border-2 border-black p-3 mb-4
        shadow-[4px_4px_0px_0px_#000]
        font-mono font-bold text-xl uppercase tracking-wider
        text-center
      ">
                {id} <span className="text-sm ml-2">({jobs.length})</span>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className="flex-1 p-2 min-h-[500px] border-2 border-black/10 bg-gray-50"
            >
                <SortableContext items={jobs.map((job) => job.id)} strategy={verticalListSortingStrategy}>
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};

// 3. Main Board Component
export default function KanbanBoard() {
    const [jobs, setJobs] = useState<Job[]>(INITIAL_DATA);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Require slight movement to start drag, prevents accidental clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // --- Drag Handlers ---

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveJob = active.data.current?.type === 'Job';
        const isOverJob = over.data.current?.type === 'Job';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveJob) return;

        // Scenario 1: Dragging a job over another job
        if (isActiveJob && isOverJob) {
            setJobs((jobs) => {
                const activeIndex = jobs.findIndex((j) => j.id === activeId);
                const overIndex = jobs.findIndex((j) => j.id === overId);

                if (jobs[activeIndex].status !== jobs[overIndex].status) {
                    // Moving to a different column visually
                    const newJobs = [...jobs];
                    newJobs[activeIndex].status = jobs[overIndex].status;
                    return arrayMove(newJobs, activeIndex, overIndex - 1); // Simple reorder logic for now
                }

                return arrayMove(jobs, activeIndex, overIndex);
            });
        }

        // Scenario 2: Dragging a job over a column
        if (isActiveJob && isOverColumn) {
            setJobs((jobs) => {
                const activeIndex = jobs.findIndex((j) => j.id === activeId);
                const newStatus = overId as Status;

                if (jobs[activeIndex].status !== newStatus) {
                    const newJobs = [...jobs];
                    newJobs[activeIndex].status = newStatus;
                    return arrayMove(newJobs, activeIndex, activeIndex); // Just update status
                }
                return jobs;
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeJob = jobs.find((j) => j.id === activeId);
        const overJob = jobs.find((j) => j.id === overId);

        // If dropped over a column directly
        if (COLUMNS.includes(overId as Status)) {
            setJobs(jobs.map(job =>
                job.id === activeId ? { ...job, status: overId as Status } : job
            ));
            return;
        }

        // If dropped over another job
        if (activeJob && overJob && activeJob.status === overJob.status) {
            const activeIndex = jobs.findIndex((j) => j.id === activeId);
            const overIndex = jobs.findIndex((j) => j.id === overId);
            if (activeIndex !== overIndex) {
                setJobs((items) => arrayMove(items, activeIndex, overIndex));
            }
        }
    };

    // Helper to get jobs for a column
    const getJobsByStatus = (status: Status) => {
        return jobs.filter((job) => job.status === status);
    };

    const activeJob = activeId ? jobs.find((j) => j.id === activeId) : null;

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-mono text-black">
            <h1 className="text-4xl font-bold mb-8 uppercase tracking-widest border-b-4 border-black inline-block pb-2">
                Job_Tracker.exe
            </h1>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-row gap-4 h-full overflow-x-auto pb-8">
                    {COLUMNS.map((col) => (
                        <Column key={col} id={col} jobs={getJobsByStatus(col)} />
                    ))}
                </div>

                <DragOverlay>
                    {activeJob ? <JobCard job={activeJob} isOverlay /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
