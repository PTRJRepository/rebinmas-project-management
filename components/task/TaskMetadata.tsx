'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { NovelEditor } from '@/components/editor/NovelEditor';
import { Calendar, Clock, User, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDeadlineInfo, getDeadlineClasses, formatDeadline } from '@/lib/deadline-utils';
import { updateTask } from '@/app/actions/task';
import { useToast } from "@/components/ui/use-toast";

interface Task {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    dueDate?: Date | null;
    estimatedHours?: number | null;
    progress?: number | null;
    documentation?: string | null;
    assignee?: {
        id: string;
        username: string;
        avatarUrl?: string | null;
    } | null;
    project: {
        id: string;
        name: string;
    };
}

interface TaskMetadataProps {
    task: Task;
    projectId: string;
}

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

const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
};

export function TaskMetadata({ task, projectId }: TaskMetadataProps) {
    const deadlineInfo = getDeadlineInfo(task.dueDate ? new Date(task.dueDate) : null);
    const { toast } = useToast();

    // Local state for controlled inputs
    const [priority, setPriority] = useState(task.priority);
    const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    const [estimatedHours, setEstimatedHours] = useState(task.estimatedHours?.toString() || '');

    // Sync state with props when task data changes
    useEffect(() => {
        setPriority(task.priority);
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
        setEstimatedHours(task.estimatedHours?.toString() || '');
    }, [task]);

    const handleDocumentationChange = async (content: string, jsonContent?: object) => {
        const result = await updateTask(task.id, { documentation: JSON.stringify(jsonContent) }, projectId);
        if (!result.success) {
            toast({ variant: "destructive", description: "Failed to save documentation" });
        }
    };

    const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPriority = e.target.value;
        setPriority(newPriority);
        const result = await updateTask(task.id, { priority: newPriority }, projectId);
        if (result.success) {
            toast({ description: "Priority updated" });
        } else {
            toast({ variant: "destructive", description: "Failed to update priority" });
        }
    };

    const handleDueDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDateStr = e.target.value;
        setDueDate(newDateStr);
        const date = newDateStr ? new Date(newDateStr) : null;
        const result = await updateTask(task.id, { dueDate: date }, projectId);
        if (result.success) {
            toast({ description: "Due date updated" });
        } else {
            toast({ variant: "destructive", description: "Failed to update due date" });
        }
    };

    const handleHoursBlur = async () => {
        const val = parseFloat(estimatedHours);
        const hours = isNaN(val) ? null : val;
        if (hours !== task.estimatedHours) {
            const result = await updateTask(task.id, { estimatedHours: hours }, projectId);
            if (result.success) {
                toast({ description: "Estimated hours updated" });
            } else {
                toast({ variant: "destructive", description: "Failed to update hours" });
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Task Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Task Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Project (Read-only) */}
                    <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-gray-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600">Project</p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {task.project.name}
                            </p>
                        </div>
                    </div>

                    {/* Priority (Editable) */}
                    <div className="flex items-center gap-3">
                        <div className="h-5 w-5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600">Priority</p>
                            <select
                                value={priority}
                                onChange={handlePriorityChange}
                                className={cn(
                                    "text-xs font-semibold px-2 py-1 border mt-1 rounded cursor-pointer",
                                    getPriorityColor(priority),
                                    "bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                )}
                            >
                                <option value="LOW">LOW</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HIGH">HIGH</option>
                                <option value="CRITICAL">CRITICAL</option>
                            </select>
                        </div>
                    </div>

                    {/* Assignee (Read-only for now - requires user list) */}
                    {task.assignee && (
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-gray-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-600">Assignee</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={task.assignee.avatarUrl || undefined} />
                                        <AvatarFallback className="text-xs bg-indigo-500 text-white">
                                            {task.assignee.username.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {task.assignee.username}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Due Date (Editable) */}
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600">Due Date</p>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={handleDueDateChange}
                                className={cn(
                                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1",
                                    getDeadlineClasses(deadlineInfo) // Note: this uses task.dueDate (prop), not state. This is fine as it updates after server response.
                                )}
                            />
                        </div>
                    </div>

                    {/* Estimated Hours (Editable) */}
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-gray-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600">Estimated Time (Hours)</p>
                            <input
                                type="number"
                                step="0.5"
                                value={estimatedHours}
                                onChange={(e) => setEstimatedHours(e.target.value)}
                                onBlur={handleHoursBlur}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                                placeholder="0.0"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Progress Card */}
            {(task.progress !== undefined && task.progress !== null) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Completion</span>
                                <span className="font-medium">{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Documentation Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                    <NovelEditor
                        content={task.documentation || ''}
                        onChange={handleDocumentationChange}
                        placeholder="Add task documentation, notes, or requirements..."
                        showMenuBar={true}
                        className="min-h-[300px]"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
