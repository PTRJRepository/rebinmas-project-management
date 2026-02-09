'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { NovelEditor } from '@/components/editor/NovelEditor';
import { Calendar, Clock, User, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDeadlineInfo, getDeadlineClasses, formatDeadline } from '@/lib/deadline-utils';
import { updateTask } from '@/app/actions/task';

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

    const handleDocumentationChange = async (content: string, jsonContent?: object) => {
        await updateTask(task.id, { documentation: JSON.stringify(jsonContent) }, projectId);
    };

    return (
        <div className="space-y-6">
            {/* Task Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Task Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Project */}
                    <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-gray-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600">Project</p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {task.project.name}
                            </p>
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center gap-3">
                        <div className="h-5 w-5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600">Priority</p>
                            <Badge className={cn(
                                "text-xs font-semibold px-2 py-1 border mt-1",
                                getPriorityColor(task.priority)
                            )}>
                                {task.priority}
                            </Badge>
                        </div>
                    </div>

                    {/* Assignee */}
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

                    {/* Due Date */}
                    {task.dueDate && (
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-600">Due Date</p>
                                <div className={cn(
                                    "inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium mt-1",
                                    getDeadlineClasses(deadlineInfo)
                                )}>
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{formatDeadline(new Date(task.dueDate))}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Estimated Hours */}
                    {task.estimatedHours && (
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-gray-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-600">Estimated Time</p>
                                <p className="text-sm font-medium text-gray-900 mt-1">
                                    {task.estimatedHours}h
                                </p>
                            </div>
                        </div>
                    )}
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
