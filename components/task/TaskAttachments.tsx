'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    FileIcon,
    ImageIcon,
    Trash2,
    Download,
    Upload,
    Loader2,
    Paperclip,
    Eye
} from 'lucide-react'
import {
    getProjectAttachments,
    createAttachmentAction,
    deleteAttachmentAction
} from '@/app/actions/attachment'
import { Attachment } from '@/lib/api/projects'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface TaskAttachmentsProps {
    taskId: string
    projectId: string
    initialAttachments?: Attachment[]
}

export function TaskAttachments({ taskId, projectId, initialAttachments = [] }: TaskAttachmentsProps) {
    const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const prevTaskIdRef = useRef<string | null>(null)

    // Update attachments when taskId changes (new task loaded), but preserve local state
    useEffect(() => {
        console.log('[TaskAttachments] Task changed:', prevTaskIdRef.current, '->', taskId);
        if (taskId !== prevTaskIdRef.current) {
            // Only reset to initialAttachments when switching to a different task
            if (taskId) {
                setAttachments(initialAttachments)
            }
            prevTaskIdRef.current = taskId
        }
    }, [taskId, initialAttachments])

    // Dispatch event when attachments change
    const notifyAttachmentChange = useCallback(() => {
        window.dispatchEvent(new CustomEvent('task-attachment-changed'));
    }, []);

    const uploadFile = async (file: File) => {
        console.log('[TaskAttachments] Starting upload for file:', file.name, 'taskId:', taskId, 'projectId:', projectId);
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Upload failed')

            const { url, previewUrl } = await res.json()
            console.log('[TaskAttachments] Upload successful, URL:', url);

            // Call create attachment action
            const attachmentResult = await createAttachmentAction({
                projectId,
                taskId,
                fileName: file.name,
                fileUrl: url,
                previewUrl: previewUrl || url,
                fileType: file.type.startsWith('image/') ? 'image' : 'document',
                fileSize: file.size,
            })

            console.log('[TaskAttachments] createAttachmentAction result:', attachmentResult);

            if (attachmentResult.success && attachmentResult.data) {
                toast({ title: 'Success', description: 'File uploaded successfully' })
                const newAttachment = attachmentResult.data
                // Add to local state - DON'T overwrite with initialAttachments
                setAttachments(prev => {
                    // Check if already exists to avoid duplicates
                    const exists = prev.some(a => a.id === newAttachment.id)
                    if (exists) return prev
                    return [newAttachment, ...prev]
                })

                // Notify parent to refresh
                notifyAttachmentChange();

                // Refresh the page after a short delay to get fresh data from server
                setTimeout(() => {
                    router.refresh()
                }, 500)
            } else {
                throw new Error(attachmentResult.error)
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Upload failed',
                description: error.message
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) uploadFile(file)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this attachment?')) return

        const result = await deleteAttachmentAction(id, projectId)
        if (result.success) {
            toast({ title: 'Success', description: 'Attachment deleted' })
            setAttachments(prev => prev.filter(a => a.id !== id))
            notifyAttachmentChange();
            router.refresh();
        } else {
            toast({
                variant: 'destructive',
                title: 'Delete failed',
                description: result.error
            })
        }
    }

    // Drag and Drop handlers
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const onDragLeave = () => {
        setIsDragging(false)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) uploadFile(file)
    }

    // Paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items
            if (!items) return

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile()
                    if (blob) {
                        const file = new File([blob], `task-pasted-image-${Date.now()}.png`, { type: blob.type })
                        uploadFile(file)
                    }
                }
            }
        }

        window.addEventListener('paste', handlePaste)
        return () => window.removeEventListener('paste', handlePaste)
    }, [taskId, projectId, uploadFile])

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <Card className="bg-slate-900 border-slate-700 shadow-sm overflow-hidden print:bg-white print:border-gray-300">
            <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between py-4 print:border-gray-200">
                <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2 print:text-black">
                    <Paperclip className="h-4 w-4 text-sky-500" />
                    Attachments ({attachments.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-300 hover:text-white print:hidden"
                    >
                        {isUploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                        Add
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Drop Zone */}
                <div 
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cn(
                        "p-4 border-b border-dashed transition-colors flex flex-col items-center justify-center gap-1 print:hidden",
                        isDragging ? "bg-sky-500/10 border-sky-500" : "bg-slate-900/50 border-slate-800",
                        isUploading && "opacity-50 pointer-events-none"
                    )}
                >
                    <p className="text-[10px] text-slate-500">
                        Drag & Drop or <span className="text-sky-400">Paste</span> image
                    </p>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-800 max-h-[300px] overflow-y-auto print:max-h-none print:divide-gray-200">
                    {attachments.length > 0 ? (
                        attachments.map((att) => (
                            <div key={att.id} className="p-3 flex items-center justify-between group hover:bg-slate-800/50 transition-colors print:hover:bg-transparent">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={cn(
                                        "h-8 w-8 rounded flex items-center justify-center shrink-0 print:bg-gray-100",
                                        att.fileType === 'image' ? "bg-purple-500/10 text-purple-400 print:text-purple-600" : "bg-sky-500/10 text-sky-400 print:text-sky-600"
                                    )}>
                                        {att.fileType === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-200 truncate max-w-[120px] print:text-black print:max-w-none" title={att.fileName}>
                                            {att.fileName}
                                        </p>
                                        <p className="text-[10px] text-slate-500 print:text-gray-500">{formatSize(att.fileSize)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity print:opacity-100">
                                    {att.previewUrl && (
                                        <a
                                            href={att.previewUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-slate-400 hover:text-purple-400 transition-colors rounded hover:bg-slate-700 print:text-purple-600"
                                            title="Preview"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                    <a
                                        href={att.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors rounded hover:bg-slate-700 print:text-sky-600"
                                        title="Download"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(att.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-slate-700 print:hidden"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-6 text-center">
                            <p className="text-[10px] text-slate-600 italic print:text-gray-400">No attachments</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
