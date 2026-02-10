'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowUp, Minus, ArrowDown, ChevronRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { updateTask, updateTaskStatus } from '@/app/actions/task';
import { getDeadlineInfo, getDeadlineClasses, formatDeadline } from '@/lib/deadline-utils';
import { Progress } from '@/components/ui/progress';

interface Task {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    statusId: string;
    dueDate?: Date | null;
    estimatedHours?: number | null;
    progress?: number | null;
    assignee?: {
        id: string;
        username: string;
        avatarUrl?: string | null;
    } | null;
}

interface Status {
    id: string;
    name: string;
}

interface KanbanTaskProps {
    task: Task;
    index: number;
    projectId: string;
    statuses: Status[];
    onMoveToNext?: (taskId: string) => Promise<void>;
}

const getPriorityIcon = (priority: string) => {
    switch (priority) {
        case 'CRITICAL':
        case 'HIGH':
            return <ArrowUp className="w-3 h-3" />;
        case 'MEDIUM':
            return <Minus className="w-3 h-3" />;
        case 'LOW':
            return <ArrowDown className="w-3 h-3" />;
        default:
            return null;
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'CRITICAL':
            return 'bg-red-500/90 text-white border-red-400/50 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
        case 'HIGH':
            return 'bg-orange-500/90 text-white border-orange-400/50 shadow-[0_0_10px_rgba(249,115,22,0.4)]';
        case 'MEDIUM':
            return 'bg-yellow-500/90 text-slate-900 border-yellow-400/50 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
        case 'LOW':
            return 'bg-green-500/90 text-white border-green-400/50 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
        default:
            return 'bg-slate-500/90 text-white border-slate-400/50';
    }
};

const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
        case 'CRITICAL':
            return 'border-l-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
        case 'HIGH':
            return 'border-l-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]';
        case 'MEDIUM':
            return 'border-l-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
        case 'LOW':
            return 'border-l-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]';
        default:
            return 'border-l-slate-400';
    }
};

const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
};

export function KanbanTask({ task, index, projectId, statuses, onMoveToNext }: KanbanTaskProps) {
    const deadlineInfo = getDeadlineInfo(task.dueDate ? new Date(task.dueDate) : null);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [isMoving, setIsMoving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Find current status index and next status
    const currentStatusIndex = statuses.findIndex(s => s.id === task.statusId);
    const nextStatus = currentStatusIndex < statuses.length - 1 ? statuses[currentStatusIndex + 1] : null;
    const canMoveToNext = nextStatus !== null;

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (!title.trim() || title === task.title) {
            setIsEditing(false);
            setTitle(task.title);
            return;
        }

        setIsEditing(false);
        await updateTask(task.id, { title }, projectId);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setTitle(task.title);
        }
    };

    const handleMoveToNext = async () => {
        if (!canMoveToNext || isMoving) return;

        setIsMoving(true);
        try {
            if (onMoveToNext) {
                await onMoveToNext(task.id);
            } else {
                // Default implementation: update status
                await updateTaskStatus(task.id, nextStatus!.id, projectId);
            }
        } finally {
            setIsMoving(false);
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on interactive elements
        if (
            e.target instanceof HTMLButtonElement ||
            e.target instanceof HTMLInputElement ||
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input')
        ) {
            return;
        }
        router.push(`/projects/${projectId}/board/${task.id}`);
    };

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                        "mb-3 group",
                        snapshot.isDragging && "z-50",
                        "print:mb-2 print:break-inside-avoid"
                    )}
                    style={{
                        ...provided.draggableProps.style,
                        transform: snapshot.isDragging
                            ? `${provided.draggableProps.style?.transform} rotate(3deg) scale(1.02)`
                            : provided.draggableProps.style?.transform,
                        transition: snapshot.isDragging ? 'none' : 'all 0.2s',
                    }}
                >
                    <Card
                        className={cn(
                            "glass-card cursor-grab active:cursor-grabbing border-l-4 transition-all duration-300",
                            snapshot.isDragging ? "shadow-2xl ring-2 ring-cyan-400/40 opacity-95 scale-105" : "hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]",
                            getPriorityBorderColor(task.priority),
                            deadlineInfo.isOverdue && "bg-red-500/10 hover:bg-red-500/15",
                            "print:cursor-auto print:shadow-none print:border-l-4 print:hover:shadow-none print:hover:scale-100"
                        )}
                        onClick={handleCardClick}
                    >
                        <CardContent className="p-4 space-y-3 print:p-3 print:space-y-2">
                            {/* Header: Priority Badge & Title */}
                            <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    {/* Priority Badge with Icon */}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge className={cn(
                                                    "text-xs font-semibold px-2 py-0.5 border flex items-center gap-1 shrink-0",
                                                    getPriorityColor(task.priority),
                                                    "print:border-2 print:shadow-none"
                                                )}>
                                                    {getPriorityIcon(task.priority)}
                                                    <span className="uppercase">{task.priority}</span>
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Priority Level</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    {/* Move to Next Button - Hide on print */}
                                    {canMoveToNext && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={handleMoveToNext}
                                                        disabled={isMoving}
                                                        className={cn(
                                                            "shrink-0 p-1 rounded-md transition-all duration-200",
                                                            "hover:bg-cyan-500/20 text-sky-400 hover:text-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]",
                                                            "disabled:opacity-50 disabled:cursor-not-allowed",
                                                            "print:hidden"
                                                        )}
                                                    >
                                                        <ChevronRight className={cn(
                                                            "w-4 h-4",
                                                            isMoving && "animate-pulse"
                                                        )} />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs">Move to {nextStatus?.name}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>

                                {/* Inline Editable Title */}
                                {isEditing ? (
                                    <Input
                                        ref={inputRef}
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={handleSave}
                                        onKeyDown={handleKeyDown}
                                        className="h-8 text-sm font-medium px-2 py-1 border-cyan-400/30 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/20"
                                    />
                                ) : (
                                    <h4
                                        onClick={() => setIsEditing(true)}
                                        className="font-semibold text-base text-sky-50 leading-snug cursor-text hover:text-cyan-400 transition-colors line-clamp-2 print:cursor-auto print:hover:text-gray-900"
                                        title="Click to edit title"
                                    >
                                        {title}
                                    </h4>
                                )}
                            </div>

                            {/* Description Preview */}
                            {task.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed print:text-gray-800">
                                    {task.description}
                                </p>
                            )}

                            {/* Progress Bar (if progress > 0) */}
                            {task.progress && task.progress > 0 && (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <span>Progress</span>
                                        <span className="font-medium">{task.progress}%</span>
                                    </div>
                                    <Progress
                                        value={task.progress}
                                        className="h-1.5"
                                    />
                                </div>
                            )}

                            {/* Footer: Meta & Actions */}
                            <div className="flex items-center justify-between pt-1 print:flex-wrap print:gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Deadline with Urgency Colors */}
                                    {task.dueDate && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium transition-colors",
                                                        getDeadlineClasses(deadlineInfo),
                                                        "print:border print:border-gray-400 print:bg-white print:text-gray-900"
                                                    )}>
                                                        <Calendar className="w-3.5 h-3.5 print:hidden" />
                                                        <span className="print:block print:inline">
                                                            Due: {new Date(task.dueDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs">
                                                        {deadlineInfo.isOverdue && 'This task is overdue!'}
                                                        {deadlineInfo.isDueToday && 'Due today!'}
                                                        {deadlineInfo.isDueTomorrow && 'Due tomorrow'}
                                                        {!deadlineInfo.isOverdue && !deadlineInfo.isDueToday && !deadlineInfo.isDueTomorrow && 'Due date'}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}

                                    {/* Estimated Hours */}
                                    {task.estimatedHours && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-slate-800/60 text-sky-300 border border-sky-500/20 font-medium print:border print:border-gray-400">
                                                        <Clock className="w-3.5 h-3.5 print:hidden" />
                                                        <span>{task.estimatedHours}h</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs">Estimated time</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>

                                {/* Assignee Avatar with Tooltip */}
                                {task.assignee && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Avatar className="h-7 w-7 border-2 border-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.2)] cursor-pointer hover:scale-110 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all duration-300 print:cursor-auto print:hover:scale-100 print:shadow-none print:border-gray-400">
                                                    <AvatarImage src={task.assignee.avatarUrl || undefined} />
                                                    <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-sky-600 text-white font-semibold">
                                                        {task.assignee.username.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-3 h-3" />
                                                    <p className="text-xs font-medium">{task.assignee.username}</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>

                            {/* Overdue Warning Banner */}
                            {deadlineInfo.isOverdue && (
                                <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-100 px-2 py-1.5 rounded-md font-medium animate-pulse print:animate-none print:border print:border-red-400">
                                    <Calendar className="w-3 h-3" />
                                    <span>Overdue by {Math.abs(deadlineInfo.daysUntilDue || 0)} days</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </Draggable>
    );
}
