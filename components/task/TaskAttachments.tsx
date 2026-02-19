'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface Attachment {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
    createdAt: Date
}

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
    const fileInputRef = useRef<HTMLInputElement>(null)

    const uploadFile = async (file: File) => {
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Upload failed')

            const { url } = await res.json()

            // Call create attachment action (need to import it)
            const { createAttachmentAction } = await import('@/app/actions/attachment')
            const attachmentResult = await createAttachmentAction({
                projectId,
                taskId,
                fileName: file.name,
                fileUrl: url,
                fileType: file.type.startsWith('image/') ? 'image' : 'document',
                fileSize: file.size,
            } as any)

            if (attachmentResult.success) {
                toast({ title: 'Success', description: 'File uploaded successfully' })
                setAttachments(prev => [attachmentResult.data, ...prev])
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

        const { deleteAttachmentAction } = await import('@/app/actions/attachment')
        const result = await deleteAttachmentAction(id, projectId)
        if (result.success) {
            toast({ title: 'Success', description: 'Attachment deleted' })
            setAttachments(prev => prev.filter(a => a.id !== id))
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
        <Card className="bg-slate-900 border-slate-700 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-sky-500" />
                    Attachments
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
                        className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
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
                        "p-4 border-b border-dashed transition-colors flex flex-col items-center justify-center gap-1",
                        isDragging ? "bg-sky-500/10 border-sky-500" : "bg-slate-900/50 border-slate-800",
                        isUploading && "opacity-50 pointer-events-none"
                    )}
                >
                    <p className="text-[10px] text-slate-500">
                        Drag & Drop or <span className="text-sky-400">Paste</span> image
                    </p>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-800 max-h-[300px] overflow-y-auto">
                    {attachments.length > 0 ? (
                        attachments.map((att) => (
                            <div key={att.id} className="p-3 flex items-center justify-between group hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={cn(
                                        "h-8 w-8 rounded flex items-center justify-center shrink-0",
                                        att.fileType === 'image' ? "bg-purple-500/10 text-purple-400" : "bg-sky-500/10 text-sky-400"
                                    )}>
                                        {att.fileType === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-200 truncate max-w-[120px]" title={att.fileName}>
                                            {att.fileName}
                                        </p>
                                        <p className="text-[10px] text-slate-500">{formatSize(att.fileSize)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a 
                                        href={att.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors rounded hover:bg-slate-700"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </a>
                                    <button 
                                        onClick={() => handleDelete(att.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-slate-700"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-6 text-center">
                            <p className="text-[10px] text-slate-600 italic">No attachments</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
