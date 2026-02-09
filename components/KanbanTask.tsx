'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowUp, Minus, ArrowDown, ChevronRight, User } from 'lucide-react';
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
            return 'bg-red-500 text-white border-red-600';
        case 'HIGH':
            return 'bg-orange-500 text-white border-orange-600';
        case 'MEDIUM':
            return 'bg-yellow-500 text-white border-yellow-600';
        case 'LOW':
            return 'bg-green-500 text-white border-green-600';
        default:
            return 'bg-gray-500 text-white border-gray-600';
    }
};

const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
        case 'CRITICAL':
            return 'border-l-red-500';
        case 'HIGH':
            return 'border-l-orange-500';
        case 'MEDIUM':
            return 'border-l-yellow-500';
        case 'LOW':
            return 'border-l-green-500';
        default:
            return 'border-l-gray-500';
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

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                        "mb-3 group",
                        snapshot.isDragging && "z-50"
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
                            "cursor-grab active:cursor-grabbing border-l-4 transition-all duration-200 hover:shadow-lg",
                            snapshot.isDragging ? "shadow-2xl ring-2 ring-indigo-500/30 opacity-95" : "shadow-sm",
                            getPriorityBorderColor(task.priority),
                            deadlineInfo.isOverdue && "bg-red-50/80 hover:bg-red-100/80"
                        )}
                    >
                        <CardContent className="p-4 space-y-3">
                            {/* Header: Priority Badge & Title */}
                            <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    {/* Priority Badge with Icon */}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge className={cn(
                                                    "text-xs font-semibold px-2 py-0.5 border flex items-center gap-1 shrink-0",
                                                    getPriorityColor(task.priority)
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

                                    {/* Move to Next Button */}
                                    {canMoveToNext && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={handleMoveToNext}
                                                        disabled={isMoving}
                                                        className={cn(
                                                            "shrink-0 p-1 rounded-md transition-all duration-200",
                                                            "hover:bg-indigo-100 text-gray-500 hover:text-indigo-600",
                                                            "disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        className="h-8 text-sm font-medium px-2 py-1 border-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
                                    />
                                ) : (
                                    <h4
                                        onClick={() => setIsEditing(true)}
                                        className="font-semibold text-base text-gray-900 leading-snug cursor-text hover:text-indigo-600 transition-colors line-clamp-2"
                                        title="Click to edit title"
                                    >
                                        {title}
                                    </h4>
                                )}
                            </div>

                            {/* Description Preview */}
                            {task.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
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
                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Deadline with Urgency Colors */}
                                    {task.dueDate && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium transition-colors",
                                                        getDeadlineClasses(deadlineInfo)
                                                    )}>
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>
                                                            {formatDeadline(new Date(task.dueDate))}
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
                                                    <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-medium">
                                                        <Clock className="w-3.5 h-3.5" />
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
                                                <Avatar className="h-7 w-7 border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform">
                                                    <AvatarImage src={task.assignee.avatarUrl || undefined} />
                                                    <AvatarFallback className="text-xs bg-indigo-500 text-white font-semibold">
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
                                <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-100 px-2 py-1.5 rounded-md font-medium animate-pulse">
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
