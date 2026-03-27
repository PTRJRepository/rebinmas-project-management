'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Attachment } from '@/lib/api/projects'
import { Card, CardContent } from '@/components/ui/card'
import { AssetPreviewDialog } from '@/components/ui/AssetPreviewDialog'
import { Button } from '@/components/ui/button'
import { 
    FileIcon, 
    ImageIcon, 
    Trash2, 
    Download, 
    Upload, 
    Loader2, 
    Paperclip,
    RefreshCw,
    Eye
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { 
    getProjectAttachments, 
    createAttachmentAction, 
    deleteAttachmentAction 
} from '@/app/actions/attachment'
import { cn } from '@/lib/utils'

interface ProjectAttachmentsProps {
    projectId: string
}

export function ProjectAttachments({ projectId }: ProjectAttachmentsProps) {
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const { toast } = useToast()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [previewAsset, setPreviewAsset] = useState<Attachment | null>(null)

    // Fetch attachments from server
    const fetchAttachments = useCallback(async () => {
        console.log('[ProjectAttachments] Fetching for projectId:', projectId)
        setIsLoading(true)
        try {
            const result = await getProjectAttachments(projectId)
            if (result.success && result.data) {
                console.log('[ProjectAttachments] Server returned:', result.data.length, 'items')
                setAttachments(result.data)
            }
        } catch (error) {
            console.error('[ProjectAttachments] Fetch error:', error)
        } finally {
            setIsLoading(false)
        }
    }, [projectId])

    // Initial fetch and when refreshKey changes
    useEffect(() => {
        fetchAttachments()
    }, [fetchAttachments, refreshKey])

    // Listen for refresh events
    useEffect(() => {
        const handleRefresh = () => {
            console.log('[ProjectAttachments] Refresh event received')
            setRefreshKey(k => k + 1)
        }
        window.addEventListener('project-attachment-changed', handleRefresh)
        return () => window.removeEventListener('project-attachment-changed', handleRefresh)
    }, [])

    const uploadFile = async (file: File) => {
        if (file.size > 100 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'File too large', description: 'Max file size is 100MB' })
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

            const { url, previewUrl } = await res.json()

            const attachmentResult = await createAttachmentAction({
                projectId,
                fileName: file.name,
                fileUrl: url,
                previewUrl: previewUrl || url,
                fileType: file.type.startsWith('image/') ? 'image' : 'document',
                fileSize: file.size,
            })

            if (attachmentResult.success && attachmentResult.data) {
                toast({
                    title: 'Upload Berhasil',
                    description: `${file.name} telah disimpan.`
                })
                // Trigger refresh to fetch fresh data
                setRefreshKey(k => k + 1)
                window.dispatchEvent(new CustomEvent('project-attachment-changed'))
                router.refresh()
            } else {
                throw new Error(attachmentResult.error)
            }
        } catch (error: any) {
            console.error('[ProjectAttachments] Upload error:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Upload Gagal', 
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
            setRefreshKey(k => k + 1)
            window.dispatchEvent(new CustomEvent('project-attachment-changed'))
            router.refresh()
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
    }, [projectId])

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Separate images and documents
    const imageAttachments = attachments.filter(a => a.fileType === 'image')

    return (
        <div className="space-y-6">
            {/* Documentation Gallery Section (Images Only) */}
            {imageAttachments.length > 0 && (
                <Card className="bg-slate-900/50 border-white/5 shadow-sm overflow-hidden glass-card print:border-gray-300 print:bg-white">
                    <div className="border-b border-white/5 py-4 print:border-gray-200 px-6">
                        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 font-space-grotesk print:text-black">
                            <ImageIcon className="h-5 w-5 text-purple-400 print:text-purple-600" />
                            Project Documentation Gallery ({imageAttachments.length})
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-purple-400" />}
                        </h2>
                    </div>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {imageAttachments.map((att) => (
                                <div key={att.id} className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-950 hover:shadow-lg transition-all duration-300 print:border-gray-300">
                                    <img 
                                        src={att.fileUrl} 
                                        alt={att.fileName}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/placeholder-image.png'
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px] print:hidden">
                                        <button 
                                            onClick={() => setPreviewAsset(att)}
                                            className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors border border-white/10"
                                            title="View Full Size"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </button>
                                        <a 
                                            href={att.fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors border border-white/10"
                                            title="Download"
                                        >
                                            <Download className="h-5 w-5" />
                                        </a>
                                        <button 
                                            onClick={() => handleDelete(att.id)}
                                            className="p-2 bg-red-500/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/40 transition-colors border border-white/10"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-[10px] text-white truncate font-medium">{att.fileName}</p>
                                        <p className="text-[9px] text-white/60">{formatSize(att.fileSize)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-slate-900/50 border-white/5 shadow-sm overflow-hidden glass-card print:border-gray-300 print:bg-white">
                <div className="border-b border-white/5 flex flex-row items-center justify-between py-4 px-6 print:border-gray-200">
                    <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 font-space-grotesk print:text-black">
                        <Paperclip className="h-5 w-5 text-sky-400 print:text-sky-600" />
                        All Assets ({attachments.length})
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-sky-400" />}
                    </h2>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRefreshKey(k => k + 1)}
                            className="h-8 w-8 p-0 border-white/10 hover:bg-white/5 text-slate-400 hover:text-white print:hidden"
                            title="Refresh"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
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
                            className="h-8 border-white/10 text-slate-300 hover:bg-white/5 print:hidden"
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Upload
                        </Button>
                    </div>
                </div>
                <CardContent className="p-0">
                    {/* Drop Zone */}
                    <div 
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className={cn(
                            "p-8 border-b border-dashed transition-colors flex flex-col items-center justify-center gap-2 print:hidden",
                            isDragging ? "bg-sky-500/10 border-sky-500/50" : "bg-slate-900/30 border-white/10",
                            isUploading && "opacity-50 pointer-events-none"
                        )}
                    >
                        <div className="h-12 w-12 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                            <Upload className="h-6 w-6 text-sky-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-200">
                                Drag & Drop files here, or <span className="text-sky-400 font-bold">Paste</span> image from clipboard
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Supports PNG, JPG, PDF, and Documents</p>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && attachments.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
                            <p className="text-xs text-slate-500">Loading attachments...</p>
                        </div>
                    )}

                    {/* List */}
                    {!isLoading && attachments.length > 0 && (
                        <div className="divide-y divide-white/5 print:divide-gray-200">
                            {attachments.map((att) => (
                                <div key={att.id} className="p-4 flex items-center justify-between group hover:bg-white/5 transition-colors print:hover:bg-transparent">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 print:bg-gray-100",
                                            att.fileType === 'image' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 print:text-purple-600" : "bg-sky-500/10 text-sky-400 border border-sky-500/20 print:text-sky-600"
                                        )}>
                                            {att.fileType === 'image' ? <ImageIcon className="h-5 w-5" /> : <FileIcon className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-200 truncate print:text-black" title={att.fileName}>
                                                {att.fileName}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-0.5 print:text-gray-500">
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded-md font-bold uppercase",
                                                    att.sourceTitle === 'Project Assets' ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"
                                                )}>
                                                    {att.sourceTitle}
                                                </span>
                                                <span>•</span>
                                                <span>{formatSize(att.fileSize)}</span>
                                                <span>•</span>
                                                <span>{new Date(att.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 print:gap-2">
                                        {att.previewUrl && (
                                            <button 
                                                onClick={() => setPreviewAsset(att)}
                                                className="p-2 text-slate-500 hover:text-purple-400 transition-colors rounded-md hover:bg-white/5 print:text-purple-600"
                                                title="Preview File"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        )}
                                        <a 
                                            href={att.fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 text-slate-500 hover:text-sky-400 transition-colors rounded-md hover:bg-white/5 print:text-sky-600"
                                            title="Download File"
                                        >
                                            <Download className="h-4 w-4" />
                                        </a>
                                        <button 
                                            onClick={() => handleDelete(att.id)}
                                            className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-md hover:bg-white/5 print:hidden"
                                            title="Delete File"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && attachments.length === 0 && (
                        <div className="py-12 text-center">
                            <Paperclip className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                            <p className="text-sm text-slate-500 italic print:text-gray-400">No attachments found for this project</p>
                            <p className="text-xs text-slate-600 mt-1">Upload files using the Upload button or drag & drop</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AssetPreviewDialog
                isOpen={!!previewAsset}
                onClose={() => setPreviewAsset(null)}
                asset={previewAsset}
            />
        </div>
    )
}
