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
    XCircle
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
import { Loader2 } from 'lucide-react';

import { TaskAttachments } from './TaskAttachments';
import { getPlainTextPreview } from '@/lib/utils';

interface TaskDetailPanelProps {
    taskId: string | null;
    projectId: string;
    onClose: () => void;
}

export function TaskDetailPanel({ taskId, projectId, onClose }: TaskDetailPanelProps) {
    const [task, setTask] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (taskId) {
            loadTask();
        } else {
            setTask(null);
        }
    }, [taskId]);

    // Listen for attachment changes to refresh task data
    useEffect(() => {
        const handleAttachmentRefresh = () => {
            console.log('[TaskDetailPanel] Attachment changed, refreshing task data...');
            setRefreshKey(k => k + 1);
            loadTask();
        };

        window.addEventListener('task-attachment-changed', handleAttachmentRefresh);
        return () => window.removeEventListener('task-attachment-changed', handleAttachmentRefresh);
    }, [taskId]);

    const loadTask = async () => {
        if (!taskId) return;
        console.log('[TaskDetailPanel] Loading task with ID:', taskId);
        setLoading(true);
        try {
            const { data, success } = await getTask(taskId);
            if (success && data) {
                console.log('[TaskDetailPanel] Loaded task with attachments:', data.attachments?.length || 0, 'taskId:', data.id);
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
                        <Badge variant="outline" className="bg-slate-800/50 border-white/5 text-slate-400 font-bold px-3">
                            TASK-{task?.id.substring(0, 4).toUpperCase()}
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
                                        </div>
                                        <TaskAttachments
                                            key={`task-attachments-${task.id}-${refreshKey}`}
                                            taskId={task.id}
                                            projectId={projectId}
                                            initialAttachments={task.attachments || []}
                                        />
                                    </div>

                                    {/* Task Documentation Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-widest">
                                                <FileText className="w-4 h-4 text-sky-400" />
                                                Documentation Cards
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {task.docs && task.docs.length > 0 ? (
                                                task.docs.map((doc: any) => (
                                                    <Card key={doc.id} className="bg-slate-900/40 border-white/5 group hover:border-sky-500/30 transition-all cursor-pointer print:bg-white print:border-gray-300">
                                                        <CardHeader className="p-4 pb-2 border-b border-white/5 flex flex-row items-center justify-between space-y-0 print:border-gray-200">
                                                            <CardTitle className="text-xs font-bold text-slate-200 uppercase truncate print:text-black">
                                                                {doc.title}
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="p-4 pt-3">
                                                            <div className="text-xs text-slate-400 line-clamp-3 leading-relaxed opacity-80 print:text-gray-700">
                                                                <div dangerouslySetInnerHTML={{ __html: doc.content || 'No content' }} />
                                                            </div>
                                                            <p className="text-[9px] font-black text-slate-600 mt-3 uppercase tracking-tighter print:text-gray-500">
                                                                Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            ) : (
                                                <div className="md:col-span-2 bg-slate-900/20 rounded-2xl p-8 border border-dashed border-white/5 text-center print:bg-gray-100 print:border-gray-300">
                                                    <FileText className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No documentation cards</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
        </>
    );
}
