'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { updateTask } from '@/app/actions/task';
import { useRouter } from 'next/navigation';

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

export function TaskDetailHeader({ task, projectId }: TaskDetailHeaderProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const router = useRouter();

    const handleSave = async () => {
        if (title.trim() === '' || title === task.title) {
            setIsEditing(false);
            setTitle(task.title);
            return;
        }

        await updateTask(task.id, { title }, projectId);
        setIsEditing(false);
        router.refresh();
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTitle(task.title);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

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
                        {isEditing ? (
                            <div className="flex items-center gap-2 mb-2">
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    className="text-lg font-bold h-9"
                                />
                                <Button size="icon" size="sm" onClick={handleSave} className="h-9 w-9 shrink-0 bg-green-600 hover:bg-green-700">
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button size="icon" size="sm" variant="ghost" onClick={handleCancel} className="h-9 w-9 shrink-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 mb-2 group">
                                <h1
                                    onClick={() => setIsEditing(true)}
                                    className="text-2xl font-bold text-gray-900 truncate cursor-pointer hover:underline decoration-dashed underline-offset-4 decoration-gray-400"
                                    title="Click to edit title"
                                >
                                    {title}
                                </h1>
                                <Badge className={cn(
                                    "text-xs font-semibold px-2.5 py-1 border shrink-0",
                                    getPriorityColor(task.priority)
                                )}>
                                    {task.priority}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit className="h-3 w-3 text-gray-500" />
                                </Button>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {task.status.name}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Edit Button - redundant now, maybe remove or keep for other actions? 
                    I'll remove the external onEdit prop handling and keep the UI clean 
                    since I added inline edit button 
                */}
            </div>
        </div>
    );
}
