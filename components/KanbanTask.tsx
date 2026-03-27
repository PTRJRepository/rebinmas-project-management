'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowUp, Minus, ArrowDown, ChevronRight, User, FileText, CheckCircle2, Paperclip } from 'lucide-react';
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
    completedAt?: Date | null;
    docCount?: number;
    attachmentCount?: number;
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
    isSelected?: boolean;
    onToggleSelect?: (taskId: string, selected: boolean) => void;
}

export const getPriorityIcon = (priority: string) => {
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

export const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/50'
        case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/50'
        case 'MEDIUM': return 'bg-blue-500/10 text-blue-500 border-blue-500/50'
        case 'LOW': return 'bg-slate-500/10 text-slate-400 border-slate-500/50'
        default: return 'bg-slate-500/10 text-slate-400 border-slate-500/50'
    }
}

export const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
        case 'CRITICAL': return 'border-l-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25),inset_0_0_30px_rgba(239,68,68,0.05)]'
        case 'HIGH': return 'border-l-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.25),inset_0_0_30px_rgba(249,115,22,0.05)]'
        case 'MEDIUM': return 'border-l-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25),inset_0_0_30px_rgba(59,130,246,0.05)]'
        case 'LOW': return 'border-l-slate-500/50'
        default: return 'border-l-slate-700'
    }
}

export const getPriorityGradient = (priority: string) => {
    switch (priority) {
        case 'CRITICAL': return 'from-red-950/40 via-red-900/20 to-transparent'
        case 'HIGH': return 'from-orange-950/40 via-orange-900/20 to-transparent'
        case 'MEDIUM': return 'from-blue-950/40 via-blue-900/20 to-transparent'
        case 'LOW': return 'from-slate-900/40 via-slate-800/20 to-transparent'
        default: return 'from-slate-900/40 via-slate-800/20 to-transparent'
    }
}

export const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
};

export function KanbanTask({ task, index, projectId, statuses, onMoveToNext, isSelected = false, onToggleSelect }: KanbanTaskProps) {
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

        console.log('[KanbanTask] Saving title:', title);
        setIsEditing(false);
        await updateTask(task.id, { title }, projectId);
        console.log('[KanbanTask] Title saved successfully');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setTitle(task.title);
        }
    };

    const handleMoveToNext = async (e?: React.MouseEvent) => {
        // Prevent card click event
        if (e) {
            e.stopPropagation();
        }
        
        if (!canMoveToNext || isMoving) return;

        console.log('[KanbanTask] Moving task to next status:', {
            taskId: task.id,
            currentStatusId: task.statusId,
            nextStatusId: nextStatus?.id,
            nextStatusName: nextStatus?.name
        });

        setIsMoving(true);
        try {
            if (onMoveToNext) {
                await onMoveToNext(task.id);
            } else {
                // Default implementation: update status
                await updateTaskStatus(task.id, nextStatus!.id, projectId);
            }
            console.log('[KanbanTask] Task moved successfully');
        } catch (error) {
            console.error('[KanbanTask] Error moving task:', error);
        } finally {
            setIsMoving(false);
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on interactive elements
        const target = e.target as HTMLElement;
        
        // Check if clicking on button, input, or their children
        const isInteractiveElement = 
            target instanceof HTMLButtonElement ||
            target instanceof HTMLInputElement ||
            target.closest('button') ||
            target.closest('input') ||
            target.closest('[role="button"]') ||
            target.closest('[data-no-navigate="true"]');
        
        // Also check if this is a drag event (drag handle)
        const isDragging = target.closest('[data-rbd-drag-handle-draggable-id]');
        
        if (isInteractiveElement || isDragging) {
            console.log('[KanbanTask] Click prevented - interactive element or dragging');
            return;
        }
        
        console.log('[KanbanTask] Navigating to task detail:', task.id);
        e.preventDefault();
        e.stopPropagation();
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
                            "cursor-grab active:cursor-grabbing border-l-4 transition-all duration-300 rounded-xl overflow-hidden relative",
                            snapshot.isDragging ? "shadow-2xl ring-2 ring-cyan-400/40 opacity-95 scale-105" : "hover:scale-[1.01] hover:shadow-xl hover:shadow-black/30",
                            "bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border-t border-r border-b border-white/5",
                            getPriorityBorderColor(task.priority),
                            deadlineInfo.isOverdue && "bg-red-950/30 hover:bg-red-950/40 border-r-red-900/50",
                            "print:cursor-auto print:shadow-none print:border-l-4 print:hover:shadow-none print:hover:scale-100",
                            isSelected && "ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-900"
                        )}
                        onClick={handleCardClick}
                    >
                        {/* Gradient overlay based on priority */}
                        <div className={cn(
                            "absolute inset-0 rounded-xl opacity-50 pointer-events-none",
                            getPriorityGradient(task.priority)
                        )} />
                        {/* Subtle animated border glow */}
                        <div className={cn(
                            "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300",
                            task.priority === 'CRITICAL' ? "shadow-[inset_0_0_30px_rgba(239,68,68,0.1)]" :
                            task.priority === 'HIGH' ? "shadow-[inset_0_0_30px_rgba(249,115,22,0.1)]" :
                            task.priority === 'MEDIUM' ? "shadow-[inset_0_0_30px_rgba(59,130,246,0.1)]" :
                            "shadow-[inset_0_0_30px_rgba(100,116,139,0.1)]"
                        )} />
                        <CardContent className="p-3.5 space-y-3 print:p-3 print:space-y-2 relative">
                            {/* Top row: Priority, Due Date (if not overflowing) & Move Next Button */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {onToggleSelect && (
                                        <div 
                                            onClick={(e) => e.stopPropagation()} 
                                            className="print:hidden flex items-center justify-center bg-slate-800/80 rounded"
                                        >
                                            <input 
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => onToggleSelect(task.id, e.target.checked)}
                                                className="w-4 h-4 rounded border-2 border-slate-500 cursor-pointer accent-sky-500 bg-slate-900 focus:ring-sky-500 focus:ring-offset-slate-800"
                                            />
                                        </div>
                                    )}
                                    {/* Priority Badge */}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 border flex items-center gap-1.5 shrink-0 bg-slate-900",
                                                    task.priority ? getPriorityColor(task.priority) : "bg-slate-800 text-slate-400 border-slate-600",
                                                    "print:border-2 print:shadow-none"
                                                )}>
                                                    {task.priority ? getPriorityIcon(task.priority) : <Minus className="w-3 h-3" />}
                                                    <span className="uppercase tracking-widest">{task.priority || 'NO PRIORITY'}</span>
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Priority Level</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    {/* Deadline Chip */}
                                    {task.dueDate && (
                                        <div className={cn(
                                            "flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border",
                                            deadlineInfo.isOverdue 
                                                ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" 
                                                : deadlineInfo.isDueToday || deadlineInfo.isDueTomorrow 
                                                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                                    : "bg-slate-700/50 text-slate-400 border-slate-600/50",
                                            "print:border print:border-gray-400 print:bg-white print:text-gray-900"
                                        )}>
                                            <Calendar className="w-2.5 h-2.5 print:hidden" />
                                            <span>
                                                {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Move to Next Button */}
                                {canMoveToNext && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMoveToNext(e);
                                                    }}
                                                    disabled={isMoving}
                                                    className={cn(
                                                        "shrink-0 p-1 rounded-md transition-all duration-200",
                                                        "bg-indigo-500/10 hover:bg-cyan-500/20 text-indigo-400 hover:text-cyan-400",
                                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                                        "print:hidden"
                                                    )}
                                                >
                                                    <ChevronRight className={cn(
                                                        "w-3.5 h-3.5",
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

                            {/* Title Block */}
                            <div className="pt-1">
                                {isEditing ? (
                                    <Input
                                        ref={inputRef}
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={handleSave}
                                        onKeyDown={handleKeyDown}
                                        className="h-8 text-sm font-bold px-2 py-1 border-cyan-400/30 bg-slate-900/50 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/20 text-white"
                                    />
                                ) : (
                                    <h4
                                        onClick={() => setIsEditing(true)}
                                        className="font-bold text-[15px] leading-tight cursor-text group-hover/title:text-cyan-400 transition-all duration-200 line-clamp-2 print:cursor-auto print:hover:text-gray-900"
                                        title="Click to edit title"
                                    >
                                        <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent group-hover/title:from-cyan-300 group-hover/title:to-cyan-100">
                                            {title}
                                        </span>
                                    </h4>
                                )}
                            </div>

                            {/* Description Preview / Summary */}
                            {(task.description || (task.docCount ?? 0) > 0) && (
                                <div className="space-y-2 mt-2">
                                    {task.description && (
                                        <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
                                            {task.description}
                                        </div>
                                    )}
                                    {(task.docCount ?? 0) > 0 && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-sky-400/80 font-medium px-1">
                                            <FileText className="w-3 h-3" />
                                            <span>Has detailed documentation</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Progress Bar (if progress > 0) */}
                            {(task.progress ?? 0) > 0 && (
                                <div className="space-y-1.5 mt-2">
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <span>Progress</span>
                                        <span className={getProgressColor(task.progress!)} style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>{task.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className={cn("h-full rounded-full transition-all duration-500", getProgressColor(task.progress!))}
                                            style={{ width: `${task.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Footer: Meta & Actions */}
                            <div className="flex items-center justify-between pt-1 print:flex-wrap print:gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Estimated Hours */}
                                    {task.estimatedHours && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 text-[10px] px-1.5 py-1 rounded-md bg-slate-900/60 text-sky-300 border border-sky-500/20 font-bold print:border print:border-gray-400">
                                                        <Clock className="w-3 h-3 print:hidden" />
                                                        <span>{task.estimatedHours}h</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs">Estimated time</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}

                                    {/* Documentation Card Count */}
                                    {(task.docCount ?? 0) > 0 && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 text-[10px] px-1.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                                                        <FileText className="w-3 h-3" />
                                                        <span>{task.docCount}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs">{task.docCount} documentation cards</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}

                                    {/* Attachment Indicator */}
                                    {(task.attachmentCount ?? 0) > 0 && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 text-[10px] px-1.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                                                        <Paperclip className="w-3 h-3" />
                                                        <span>{task.attachmentCount}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs">{task.attachmentCount} attachments</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}

                                    {/* Done Date */}
                                    {task.completedAt && (
                                        <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Done: {new Date(task.completedAt).toLocaleDateString()}</span>
                                        </div>
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
