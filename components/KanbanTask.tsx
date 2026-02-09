'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { updateTask } from '@/app/actions/task';

interface Task {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    statusId: string;
    dueDate?: Date | null;
    estimatedHours?: number | null;
    assignee?: {
        id: string;
        username: string;
        avatarUrl?: string | null;
    } | null;
}

interface KanbanTaskProps {
    task: Task;
    index: number;
    projectId: string;
}

const getPriorityIcon = (priority: string) => {
    switch (priority) {
        case 'CRITICAL':
        case 'HIGH':
            return <ArrowUp className="w-3 h-3 mr-1" />;
        case 'MEDIUM':
            return <Minus className="w-3 h-3 mr-1" />;
        case 'LOW':
            return <ArrowDown className="w-3 h-3 mr-1" />;
        default:
            return null;
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'CRITICAL':
            return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200';
        case 'HIGH':
            return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200';
        case 'MEDIUM':
            return 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200';
        case 'LOW':
            return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

export function KanbanTask({ task, index, projectId }: KanbanTaskProps) {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const inputRef = useRef<HTMLInputElement>(null);

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
        // Optimistic update could go here if we lifted state up, but for now we rely on revalidatePath
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
                        // Add tilt effect when dragging
                        transform: snapshot.isDragging
                            ? `${provided.draggableProps.style?.transform} rotate(3deg) scale(1.02)`
                            : provided.draggableProps.style?.transform,
                        transition: snapshot.isDragging ? 'none' : 'all 0.2s',
                    }}
                >
                    <Card
                        className={cn(
                            "cursor-grab active:cursor-grabbing border-l-4 transition-all duration-200 bg-white hover:shadow-md",
                            snapshot.isDragging ? "shadow-2xl ring-2 ring-indigo-500/20 opacity-90 rotate-2" : "shadow-sm",
                            // Border color based on priority
                            task.priority === 'CRITICAL' ? 'border-l-red-500' :
                                task.priority === 'HIGH' ? 'border-l-orange-500' :
                                    task.priority === 'MEDIUM' ? 'border-l-yellow-500' :
                                        'border-l-green-500'
                        )}
                    >
                        <CardContent className="p-3 space-y-2.5">
                            {/* Header: Title & Priority */}
                            <div className="flex justify-between items-start gap-2">
                                {isEditing ? (
                                    <Input
                                        ref={inputRef}
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={handleSave}
                                        onKeyDown={handleKeyDown}
                                        className="h-7 text-sm px-1 py-0 border-gray-300 focus-visible:ring-1"
                                    />
                                ) : (
                                    <h4
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsEditing(true);
                                        }}
                                        className="font-medium text-sm text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors cursor-text"
                                        title="Click to edit"
                                    >
                                        {title}
                                    </h4>
                                )}
                            </div>

                            {/* Description Preview (Optional) */}
                            {task.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                    {task.description}
                                </p>
                            )}

                            {/* Footer: Meta & Assignee */}
                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                    {/* Due Date */}
                                    {task.dueDate && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn(
                                                        "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                                                        isOverdue ? "bg-red-50 text-red-600 font-medium" : "bg-gray-100 text-gray-600"
                                                    )}>
                                                        <Calendar className="w-3 h-3" />
                                                        <span>
                                                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="text-xs">
                                                    {isOverdue ? "Overdue" : "Due Date"}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}

                                    {/* Estimate */}
                                    {task.estimatedHours && (
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                            <Clock className="w-3 h-3" />
                                            <span>{task.estimatedHours}h</span>
                                        </div>
                                    )}
                                </div>

                                {/* Assignee Avatar */}
                                <Avatar className="h-6 w-6 border-2 border-white shadow-sm">
                                    <AvatarImage src={task.assignee?.avatarUrl || undefined} />
                                    <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-600 font-medium">
                                        {task.assignee?.username ? task.assignee.username.substring(0, 2).toUpperCase() : 'UN'}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </Draggable>
    );
}
