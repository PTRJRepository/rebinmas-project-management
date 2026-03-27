'use client';

import React, { useEffect, useState } from 'react';
import { 
    X, 
    Calendar, 
    Clock, 
    User, 
    Tag, 
    AlertCircle, 
    CheckCircle2, 
    MessageSquare, 
    Paperclip,
    MoreVertical,
    ChevronRight,
    ArrowRight,
    FileText,
    LayoutList,
    XCircle,
    RefreshCw,
    Loader2,
    Printer,
    Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTask } from '@/app/actions/task';
import { TaskDescriptionEditor } from './TaskDescriptionEditor';
import { TaskMetadata } from './TaskMetadata';

import { TaskAttachments } from './TaskAttachments';
import { getPlainTextPreview } from '@/lib/utils';
import { ResizableImage } from './ResizableImage';
import { TaskDocs } from './TaskDocs';
import { TicketPrintPreview } from './TicketPrintPreview';

interface TaskDetailPanelProps {
    taskId: string | null;
    projectId: string;
    projectName?: string;
    onClose: () => void;
}

export function TaskDetailPanel({ taskId, projectId, projectName = 'Project', onClose }: TaskDetailPanelProps) {
    const [task, setTask] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showPrintPreview, setShowPrintPreview] = useState(false);

    useEffect(() => {
        if (taskId) {
            loadTask();
        } else {
            setTask(null);
        }
    }, [taskId, refreshKey]);

    // Listen for attachment changes to refresh task data
    useEffect(() => {
        const handleAttachmentRefresh = () => {
            console.log('[TaskDetailPanel] Attachment changed, refreshing task data...');
            setRefreshKey(k => k + 1);
        };

        window.addEventListener('task-attachment-changed', handleAttachmentRefresh);
        return () => window.removeEventListener('task-attachment-changed', handleAttachmentRefresh);
    }, []);

    const loadTask = async () => {
        if (!taskId) return;
        console.log('[TaskDetailPanel] Loading task with ID:', taskId);
        setLoading(true);
        try {
            const { data, success } = await getTask(taskId);
            if (success && data) {
                console.log('[TaskDetailPanel] Loaded task with attachments:', data.attachments?.length || 0, 'docs:', data.docs?.length || 0, 'taskId:', data.id);
                setTask(data);
            } else {
                console.log('[TaskDetailPanel] Failed to load task, success:', success);
            }
        } catch (error) {
            console.error('Failed to load task:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshKey(k => k + 1);
    };

    if (!taskId) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40 transition-opacity animate-in fade-in duration-300 print:hidden" 
                onClick={onClose}
            />
            
            {/* Panel */}
            <div className={cn(
                "fixed top-0 right-0 h-screen w-full md:w-[700px] lg:w-[1000px] bg-slate-950 border-l border-white/10 z-50 flex flex-col",
                "animate-in slide-in-from-right duration-500 ease-out shadow-[0_0_50px_rgba(0,0,0,0.5)]",
                "print:relative print:w-full print:h-auto print:border-0 print:shadow-none print:animate-none"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md print:bg-transparent">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl print:hidden">
                            <X className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span>Projects</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-sky-400 font-bold truncate max-w-[150px]">Task Detail</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={handleRefresh}
                            className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl print:hidden"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setShowPrintPreview(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 print:hidden"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                        <Badge variant="outline" className="bg-slate-800/50 border-white/5 text-slate-400 font-bold px-3">
                            TASK-{task?.id?.substring(0, 4).toUpperCase() || 'LOAD'}
                        </Badge>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50 print:overflow-visible">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Details...</p>
                            </div>
                        </div>
                    ) : task ? (
                        <div className="px-10 py-10">
                            {/* Title Section */}
                            <div className="mb-12">
                                <div className="flex items-center gap-3 mb-4">
                                    <Badge className={cn(
                                        "px-3 py-1 text-[10px] font-black tracking-widest uppercase border-0 shadow-lg",
                                        task.priority === 'CRITICAL' ? "bg-red-500 text-white shadow-red-500/20" :
                                        task.priority === 'HIGH' ? "bg-orange-500 text-white shadow-orange-500/20" :
                                        task.priority === 'MEDIUM' ? "bg-yellow-500 text-black shadow-yellow-500/20" :
                                        "bg-green-500 text-white shadow-green-500/20"
                                    )}>
                                        {task.priority} Priority
                                    </Badge>
                                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Status: {task.status?.name || 'Unknown'}</span>
                                </div>
                                <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight print:text-2xl print:text-black">
                                    {task.title}
                                </h1>
                            </div>

                            {/* Main Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 print:grid-cols-1 print:gap-4">
                                {/* Left Side: Content (8 cols) */}
                                <div className="lg:col-span-8 space-y-12 print:space-y-4">
                                    {/* Description */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-widest">
                                            <AlertCircle className="w-4 h-4 text-sky-400" />
                                            Detailed Description
                                        </div>
                                        <div className="bg-slate-900/40 rounded-2xl p-4 border border-white/5 backdrop-blur-sm shadow-inner print:bg-white print:text-black print:border-gray-300">
                                            <TaskDescriptionEditor task={task} projectId={projectId} />
                                        </div>
                                    </div>

                                    {/* Attachments Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-widest px-1">
                                            <Paperclip className="w-4 h-4 text-sky-400" />
                                            Task Assets & Files
                                            <Badge variant="outline" className="ml-2 bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px]">
                                                {task.attachments?.length || 0} files
                                            </Badge>
                                        </div>
                                        <TaskAttachments
                                            key={`task-attachments-${task.id}-${refreshKey}`}
                                            taskId={task.id}
                                            projectId={projectId}
                                            initialAttachments={task.attachments || []}
                                        />
                                    </div>

                                    {/* Task Documentation Section */}
                                    <div className="pt-2">
                                        <TaskDocs taskId={task.id} projectId={projectId} />
                                    </div>

                                    {/* Printable Documentation Images Section */}
                                    {task.attachments?.filter((a: any) => a.fileType === 'image').length > 0 && (
                                        <div className="space-y-4 pt-8 border-t border-white/5 print:border-gray-200">
                                            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-widest px-1 print:text-black">
                                                <FileText className="w-4 h-4 text-sky-400 print:text-sky-600" />
                                                Printable Image Documentation
                                            </div>
                                            <div className="bg-slate-900/40 rounded-3xl p-6 border border-white/5 shadow-inner print:bg-transparent print:border-none print:p-0 print:shadow-none space-y-8">
                                                {task.attachments
                                                    .filter((att: any) => att.fileType === 'image')
                                                    .map((att: any) => (
                                                        <ResizableImage 
                                                            key={`res-img-${att.id}`}
                                                            src={att.previewUrl || att.fileUrl}
                                                            alt={att.fileName}
                                                            title={att.fileName}
                                                        />
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Meta Data (4 cols) */}
                                <div className="lg:col-span-4 space-y-8 print:space-y-4">
                                    <div className="bg-slate-900/40 rounded-3xl p-8 border border-white/5 shadow-xl backdrop-blur-md print:bg-white print:border-gray-300 print:shadow-none print:rounded print:p-4">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 pb-4 border-b border-white/5 print:text-gray-700 print:border-gray-200">Task Intelligence</h3>
                                        <TaskMetadata task={task} projectId={projectId} />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3 print:hidden">
                                        <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 border-0 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Complete Task
                                        </Button>
                                        <Button variant="outline" className="w-full h-12 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 font-bold rounded-xl transition-all">
                                            <ArrowRight className="w-4 h-4 mr-2" />
                                            Next Stage
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                            <XCircle className="w-12 h-12 text-slate-800" />
                            <p className="text-sm font-black uppercase tracking-widest">Task not found</p>
                        </div>
                    )}
                </div>
            </div>
            {showPrintPreview && task && (
                <TicketPrintPreview
                    tasks={[task]}
                    projectName={projectName}
                    onClose={() => setShowPrintPreview(false)}
                />
            )}
        </>
    );
}
