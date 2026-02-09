'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
    id: string;
    title: string;
    priority: string;
    status: {
        id: string;
        name: string;
    };
}

interface TaskDetailHeaderProps {
    task: Task;
    projectId: string;
    onEdit?: () => void;
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

export function TaskDetailHeader({ task, projectId, onEdit }: TaskDetailHeaderProps) {
    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    {/* Back Button */}
                    <Link href={`/projects/${projectId}/board`}>
                        <Button variant="outline" size="icon" className="shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>

                    {/* Task Title and Badges */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900 truncate">
                                {task.title}
                            </h1>
                            <Badge className={cn(
                                "text-xs font-semibold px-2.5 py-1 border shrink-0",
                                getPriorityColor(task.priority)
                            )}>
                                {task.priority}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {task.status.name}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Edit Button */}
                {onEdit && (
                    <Button onClick={onEdit} variant="outline" className="shrink-0">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Task
                    </Button>
                )}
            </div>
        </div>
    );
}
