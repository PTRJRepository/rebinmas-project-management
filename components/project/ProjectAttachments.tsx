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
    Plus,
    X
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { 
    getProjectAttachments, 
    createAttachmentAction, 
    deleteAttachmentAction 
} from '@/app/actions/attachment'
import { cn } from '@/lib/utils'

interface Attachment {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
    createdAt: Date
}

interface ProjectAttachmentsProps {
    projectId: string
}

export function ProjectAttachments({ projectId }: ProjectAttachmentsProps) {
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const { toast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const fetchAttachments = useCallback(async () => {
        console.log('[ProjectAttachments] Fetching for:', projectId)
        const result = await getProjectAttachments(projectId)
        if (result.success && result.data) {
            console.log('[ProjectAttachments] Received:', result.data.length, 'items')
            setAttachments(result.data)
        }
    }, [projectId])

    useEffect(() => {
        fetchAttachments()
    }, [fetchAttachments])

    const uploadFile = async (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'File too large', description: 'Max file size is 10MB' })
            return
        }

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || 'Upload failed');
            }

            const { url } = await res.json()

            const attachmentResult = await createAttachmentAction({
                projectId,
                fileName: file.name,
                fileUrl: url,
                fileType: file.type.startsWith('image/') ? 'image' : 'document',
                fileSize: file.size,
            })

            if (attachmentResult.success) {
                toast({ title: 'Success', description: 'File uploaded successfully' })
                // Always re-fetch to ensure sync with DB structure
                await fetchAttachments()
            } else {
                throw new Error(attachmentResult.error)
            }
        } catch (error: any) {
            console.error('[ProjectAttachments] Upload error:', error);
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
            fetchAttachments()
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
                        const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type })
                        uploadFile(file)
                    }
                }
            }
        }

        window.addEventListener('paste', handlePaste)
        return () => window.removeEventListener('paste', handlePaste)
    }, [projectId, uploadFile])

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="space-y-6">
            {/* Documentation Gallery Section (Images Only) */}
            {attachments.filter(a => a.fileType === 'image').length > 0 && (
                <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-gray-100 py-4">
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-purple-500" />
                            Project Documentation Gallery
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {attachments
                                .filter(a => a.fileType === 'image')
                                .map((att) => (
                                    <div key={att.id} className="group relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 hover:shadow-lg transition-all duration-300">
                                        <img 
                                            src={att.fileUrl} 
                                            alt={att.fileName}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <a 
                                                href={att.fileUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                                                title="View Full Size"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </a>
                                            <button 
                                                onClick={() => handleDelete(att.id)}
                                                className="p-2 bg-red-500/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/60 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-[10px] text-white truncate font-medium">{att.fileName}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Paperclip className="h-5 w-5 text-blue-500" />
                        Upload Project Assets
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
                            className="h-8"
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Upload
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
                            "p-8 border-b border-dashed transition-colors flex flex-col items-center justify-center gap-2",
                            isDragging ? "bg-blue-50 border-blue-400" : "bg-gray-50/50 border-gray-200",
                            isUploading && "opacity-50 pointer-events-none"
                        )}
                    >
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Upload className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">
                                Drag & Drop files here, or <span className="text-blue-600 font-bold">Paste</span> image from clipboard
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Supports PNG, JPG, PDF, and Documents</p>
                        </div>
                    </div>

                    {/* List */}
                    <div className="divide-y divide-gray-100">
                        {attachments.length > 0 ? (
                            attachments.map((att) => (
                                <div key={att.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                                            att.fileType === 'image' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                        )}>
                                            {att.fileType === 'image' ? <ImageIcon className="h-5 w-5" /> : <FileIcon className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate" title={att.fileName}>
                                                {att.fileName}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                <span>{formatSize(att.fileSize)}</span>
                                                <span>•</span>
                                                <span>{new Date(att.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <a 
                                            href={att.fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                                        >
                                            <Download className="h-4 w-4" />
                                        </a>
                                        <button 
                                            onClick={() => handleDelete(att.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Paperclip className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 italic">No attachments found for this project</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
