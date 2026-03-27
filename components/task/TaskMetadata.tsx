'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { NovelEditor } from '@/components/editor/NovelEditor';
import { Calendar, Clock, User, FolderOpen, Plus, FileText, Trash2, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDeadlineInfo, getDeadlineClasses, formatDeadline } from '@/lib/deadline-utils';
import { 
    updateTask, 
    createTaskDocAction, 
    updateTaskDocAction, 
    deleteTaskDocAction 
} from '@/app/actions/task';
import { useToast } from "@/components/ui/use-toast";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { TaskAttachments } from './TaskAttachments';

export interface TaskDoc {
    id: string;
    taskId: string;
    title: string;
    content: string | null;
    createdAt: Date;
    updatedAt: Date;
}

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
    project?: {
        id: string;
        name: string;
    };
    docs?: TaskDoc[];
    attachments?: any[];
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

    // Documentation state
    const [docDialogOpen, setDocDialogOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<TaskDoc | null>(null);
    const [docTitle, setDocTitle] = useState('');
    const [docContent, setDocContent] = useState('');
    const [isSavingDoc, setIsSavingDoc] = useState(false);

    // Sync state with props when task data changes
    useEffect(() => {
        setPriority(task.priority);
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
        setEstimatedHours(task.estimatedHours?.toString() || '');
    }, [task]);

    const handleOpenAddDoc = () => {
        setEditingDoc(null);
        setDocTitle('');
        setDocContent('');
        setDocDialogOpen(true);
    };

    const handleOpenEditDoc = (doc: TaskDoc) => {
        setEditingDoc(doc);
        setDocTitle(doc.title);
        setDocContent(doc.content || '');
        setDocDialogOpen(true);
    };

    const handleEditorImageUpload = async (file: File): Promise<string> => {
        console.log('[TaskMetadata] Starting image upload:', file.name, file.type, file.size);
        if (file.size > 100 * 1024 * 1024) {
            toast({ variant: "destructive", description: "Ukuran file terlalu besar (maksimal 100MB)" });
            throw new Error("File too large");
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorMsg = errorData.details || errorData.error || 'Upload failed';
                console.error('[TaskMetadata] Upload failed:', errorMsg);
                toast({ 
                    variant: "destructive", 
                    title: "Upload Failed",
                    description: errorMsg 
                });
                throw new Error(errorMsg);
            }
            
            const data = await res.json();
            console.log('[TaskMetadata] Upload successful:', data.url);
            return data.url;
        } catch (error: any) {
            console.error('[TaskMetadata] Upload exception:', error);
            if (!error.message.includes('File too large')) {
                toast({ 
                    variant: "destructive", 
                    title: "Upload Error",
                    description: error.message || "An unexpected error occurred during upload" 
                });
            }
            throw error;
        }
    };

    const handleSaveDoc = async () => {
        if (!docTitle.trim()) {
            toast({ variant: "destructive", description: "Title is required" });
            return;
        }

        setIsSavingDoc(true);
        try {
            let result;
            if (editingDoc) {
                result = await updateTaskDocAction(editingDoc.id, task.id, { title: docTitle, content: docContent }, projectId);
            } else {
                result = await createTaskDocAction(task.id, docTitle, docContent, projectId);
            }

            if (result.success) {
                toast({ description: editingDoc ? "Documentation updated" : "Documentation added" });
                setDocDialogOpen(false);
            } else {
                toast({ variant: "destructive", description: result.error || "Failed to save documentation" });
            }
        } finally {
            setIsSavingDoc(false);
        }
    };

    const handleDeleteDoc = async (docId: string) => {
        if (!confirm('Are you sure you want to delete this documentation card?')) return;

        const result = await deleteTaskDocAction(docId, task.id, projectId);
        if (result.success) {
            toast({ description: "Documentation deleted" });
        } else {
            toast({ variant: "destructive", description: result.error || "Failed to delete documentation" });
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
            <div className="space-y-6">
                {/* Project (Read-only) */}
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-800/50 flex items-center justify-center border border-white/5">
                        <FolderOpen className="h-5 w-5 text-slate-500 shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Project</p>
                        <p className="text-sm font-bold text-slate-200 truncate">
                            {task.project?.name || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Priority (Editable) */}
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border border-white/5",
                        task.priority === 'CRITICAL' ? "bg-red-500/10 text-red-400" :
                        task.priority === 'HIGH' ? "bg-orange-500/10 text-orange-400" :
                        task.priority === 'MEDIUM' ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-green-500/10 text-green-400"
                    )}>
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Priority</p>
                        <select
                            value={priority}
                            onChange={handlePriorityChange}
                            className="bg-transparent text-sm font-bold text-slate-200 border-0 p-0 focus:ring-0 cursor-pointer w-full"
                        >
                            <option value="LOW" className="bg-slate-950">LOW</option>
                            <option value="MEDIUM" className="bg-slate-950">MEDIUM</option>
                            <option value="HIGH" className="bg-slate-950">HIGH</option>
                            <option value="CRITICAL" className="bg-slate-950">CRITICAL</option>
                        </select>
                    </div>
                </div>

                {/* Assignee */}
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-800/50 flex items-center justify-center border border-white/5 overflow-hidden">
                        <Avatar className="h-full w-full rounded-none">
                            <AvatarImage src={task.assignee?.avatarUrl || ""} />
                            <AvatarFallback className="bg-slate-800 text-[10px] font-black">
                                {task.assignee?.username?.substring(0, 2).toUpperCase() || '??'}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Assignee</p>
                        <p className="text-sm font-bold text-slate-200 truncate">
                            {task.assignee?.username || 'Unassigned'}
                        </p>
                    </div>
                </div>

                {/* Due Date (Editable) */}
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border border-white/5",
                        deadlineInfo.isOverdue ? "bg-red-500/10 text-red-400" : "bg-slate-800/50 text-slate-500"
                    )}>
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Date</p>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={handleDueDateChange}
                            className="bg-transparent text-sm font-bold text-slate-200 border-0 p-0 focus:ring-0 cursor-pointer w-full [color-scheme:dark]"
                        />
                    </div>
                </div>

                {/* Estimated Hours (Editable) */}
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-800/50 flex items-center justify-center border border-white/5">
                        <Clock className="h-5 w-5 text-slate-500 shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Effort (Hours)</p>
                        <input
                            type="number"
                            step="0.5"
                            value={estimatedHours}
                            onChange={(e) => setEstimatedHours(e.target.value)}
                            onBlur={handleHoursBlur}
                            className="bg-transparent text-sm font-bold text-slate-200 border-0 p-0 focus:ring-0 w-full"
                            placeholder="0.0"
                        />
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            {(task.progress !== undefined && task.progress !== null) && (
                <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</p>
                        <span className="text-xs font-black text-sky-400">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                            className="bg-sky-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${task.progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
