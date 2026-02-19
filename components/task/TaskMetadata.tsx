'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { NovelEditor } from '@/components/editor/NovelEditor';
import { Calendar, Clock, User, FolderOpen, Plus, FileText, Trash2, Edit2, Loader2 } from 'lucide-react';
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
            <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-100">Task Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Project (Read-only) */}
                    <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-slate-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-500">Project</p>
                            <p className="text-sm font-medium text-slate-200 truncate">
                                {task.project?.name || 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Priority (Editable) */}
                    <div className="flex items-center gap-3">
                        <div className="h-5 w-5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-500">Priority</p>
                            <select
                                value={priority}
                                onChange={handlePriorityChange}
                                className={cn(
                                    "text-xs font-semibold px-2 py-1 border mt-1 rounded cursor-pointer",
                                    getPriorityColor(priority),
                                    "bg-slate-800 text-slate-100 border-slate-600 focus:ring-2 focus:ring-sky-500"
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
                            <User className="h-5 w-5 text-slate-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-500">Assignee</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={task.assignee.avatarUrl || "https://img.freepik.com/premium-vector/man-avatar-profile-picture-isolated-background-avatar-profile-picture-man_1293239-4868.jpg"} />
                                        <AvatarFallback className="text-xs bg-sky-500 text-white">
                                            {task.assignee.username.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm font-medium text-slate-200 truncate">
                                        {task.assignee.username}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Due Date (Editable) */}
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-slate-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-500">Due Date</p>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={handleDueDateChange}
                                className={cn(
                                    "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1",
                                    "bg-slate-800 border-slate-700 text-slate-200",
                                    "focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                )}
                            />
                        </div>
                    </div>

                    {/* Estimated Hours (Editable) */}
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-slate-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-500">Estimated Time (Hours)</p>
                            <input
                                type="number"
                                step="0.5"
                                value={estimatedHours}
                                onChange={(e) => setEstimatedHours(e.target.value)}
                                onBlur={handleHoursBlur}
                                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1 bg-slate-800 border-slate-700 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                placeholder="0.0"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Progress Card */}
            {(task.progress !== undefined && task.progress !== null) && (
                <Card className="bg-slate-900 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-100">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Completion</span>
                                <span className="font-medium text-slate-200">{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Documentation Cards Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-sky-500" />
                        Documentation
                    </h3>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleOpenAddDoc}
                        className="h-8 bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-700"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Doc
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {task.docs && task.docs.length > 0 ? (
                        task.docs.map((doc) => (
                            <Card key={doc.id} className="bg-slate-900 border-slate-700 group">
                                <CardHeader className="p-4 pb-2 border-b border-slate-800 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm font-semibold text-slate-200">
                                        {doc.title}
                                    </CardTitle>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-7 w-7 text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                                            onClick={() => handleOpenEditDoc(doc)}
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                                            onClick={() => handleDeleteDoc(doc.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-3">
                                    {/* Preview content - simple text summary */}
                                    <div className="text-sm text-slate-400 line-clamp-3 prose prose-invert prose-sm max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: doc.content || 'No content' }} />
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-2">
                                        Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 px-6 rounded-lg border-2 border-dashed border-slate-800 bg-slate-900/50 text-center">
                            <FileText className="h-10 w-10 text-slate-700 mb-2" />
                            <p className="text-slate-500 text-sm italic">No documentation yet</p>
                            <Button 
                                variant="link" 
                                size="sm" 
                                onClick={handleOpenAddDoc}
                                className="mt-2 text-sky-500 hover:text-sky-400 p-0 h-auto"
                            >
                                Add your first document
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Documentation Dialog */}
            <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800 text-slate-100 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
                            {editingDoc ? 'Edit Documentation' : 'Add Documentation'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="docTitle" className="text-slate-300 font-semibold">Title</Label>
                            <Input 
                                id="docTitle"
                                value={docTitle}
                                onChange={(e) => setDocTitle(e.target.value)}
                                placeholder="Documentation title (e.g., API Requirements, Design Specs)"
                                className="bg-slate-900 border-slate-700 text-slate-100 focus:border-sky-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300 font-semibold">Content</Label>
                            <div className="min-h-[400px] rounded-lg border border-slate-800 overflow-hidden bg-slate-900">
                                <NovelEditor
                                    content={docContent}
                                    onChange={(content) => setDocContent(content)}
                                    placeholder="Write your documentation here..."
                                    showMenuBar={true}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-8 pt-6 border-t border-slate-800 gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setDocDialogOpen(false)}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            disabled={isSavingDoc}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSaveDoc}
                            className="bg-sky-600 hover:bg-sky-700 text-white min-w-[120px] shadow-lg shadow-sky-900/20"
                            disabled={isSavingDoc}
                        >
                            {isSavingDoc ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                editingDoc ? 'Update Card' : 'Add Card'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
