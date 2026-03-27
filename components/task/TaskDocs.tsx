'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
    FileText, 
    Plus, 
    Trash2, 
    Edit2, 
    Loader2, 
    Sparkles,
    Calendar,
    FileImage
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { 
    getTaskDocsAction, 
    createTaskDocAction, 
    updateTaskDocAction, 
    deleteTaskDocAction 
} from '@/app/actions/task'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NovelEditor } from '@/components/editor/NovelEditor'
import { cn } from '@/lib/utils'

interface TaskDoc {
    id: string
    title: string
    content: string | null
    createdAt: Date
    updatedAt: Date
}

interface TaskDocsProps {
    taskId: string
    projectId: string
}

// Helper function to strip HTML tags and get plain text preview
const getPlainTextPreview = (html: string | null, maxLength: number = 150): string => {
    if (!html) return ''
    const plainText = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    if (plainText.length <= maxLength) return plainText
    return plainText.substring(0, maxLength).trim() + '...'
}

// Helper to extract the first image URL
const getFirstImage = (html: string | null): string | null => {
    if (!html) return null
    const match = html.match(/<img[^>]+src="([^">]+)"/)
    return match ? match[1] : null
}

export function TaskDocs({ taskId, projectId }: TaskDocsProps) {
    const [docs, setDocs] = useState<TaskDoc[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDocDialogOpen] = useState(false)
    const [editingDoc, setEditingDoc] = useState<TaskDoc | null>(null)
    const [docTitle, setDocTitle] = useState('')
    const [docContent, setDocContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()

    const fetchDocs = useCallback(async () => {
        setLoading(true)
        const result = await getTaskDocsAction(taskId)
        if (result.success && result.data) {
            setDocs(result.data)
        }
        setLoading(false)
    }, [taskId])

    useEffect(() => {
        fetchDocs()
    }, [fetchDocs])

    const handleOpenAddDoc = () => {
        setEditingDoc(null)
        setDocTitle('')
        setDocContent('')
        setDocDialogOpen(true)
    }

    const handleOpenEditDoc = (doc: TaskDoc) => {
        setEditingDoc(doc)
        setDocTitle(doc.title)
        setDocContent(doc.content || '')
        setDocDialogOpen(true)
    }

    const handleSaveDoc = async () => {
        if (!docTitle.trim()) {
            toast({ variant: "destructive", description: "Judul harus diisi" })
            return
        }

        setIsSaving(true)
        try {
            let result
            if (editingDoc) {
                result = await updateTaskDocAction(editingDoc.id, taskId, { title: docTitle, content: docContent }, projectId)
            } else {
                result = await createTaskDocAction(taskId, docTitle, docContent, projectId)
            }

            if (result.success) {
                toast({ title: "Berhasil", description: editingDoc ? "Dokumentasi diperbarui" : "Dokumentasi ditambahkan" })
                setDocDialogOpen(false)
                fetchDocs()
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error || "Gagal menyimpan dokumentasi" })
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteDoc = async (docId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus dokumentasi ini?')) return

        const result = await deleteTaskDocAction(docId, taskId, projectId)
        if (result.success) {
            toast({ title: "Berhasil", description: "Dokumentasi dihapus" })
            fetchDocs()
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error || "Gagal menghapus dokumentasi" })
        }
    }

    const handleEditorImageUpload = async (file: File): Promise<string> => {
        if (file.size > 10 * 1024 * 1024) {
            toast({ variant: "destructive", description: "Ukuran file terlalu besar (maksimal 10MB)" })
            throw new Error("File too large")
        }

        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.details || errorData.error || 'Upload gagal')
        }
        
        const data = await res.json()
        return data.url
    }

    if (loading && docs.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1 print:hidden">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-widest">
                    <FileText className="w-4 h-4 text-sky-400" />
                    Documentation Cards
                    <div className="ml-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-2 py-0.5 rounded-full">
                        {docs.length} cards
                    </div>
                </div>
                <Button 
                    size="sm"
                    onClick={handleOpenAddDoc}
                    className="bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/40 border-0 h-8"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Doc Card
                </Button>
            </div>

            {docs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1 print:gap-8">
                    {docs.map((doc) => {
                        const preview = getPlainTextPreview(doc.content)
                        const firstImage = getFirstImage(doc.content)
                        
                        return (
                            <Card 
                                key={doc.id} 
                                className="bg-slate-900/40 hover:border-sky-500/30 transition-all duration-300 group cursor-pointer h-full flex flex-col border-white/5 overflow-hidden print:bg-transparent print:border-none print:shadow-none print:p-0"
                                onClick={() => handleOpenEditDoc(doc)}
                            >
                                {firstImage && (
                                    <div className="h-32 w-full overflow-hidden border-b border-white/5 bg-slate-900 print:hidden">
                                        <img 
                                            src={firstImage} 
                                            alt={doc.title} 
                                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                )}
                                <CardHeader className="p-4 pb-2 border-b border-white/5 flex flex-row items-center justify-between space-y-0 print:border-b-2 print:border-black print:px-0 print:pb-4 print:mb-4">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <CardTitle className="text-xs font-bold text-slate-200 uppercase truncate print:text-xl print:text-black">
                                            {doc.title}
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 print:hidden">
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleOpenEditDoc(doc)
                                            }}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteDoc(doc.id)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-3 flex-1 flex flex-col print:px-0">
                                    {/* Content */}
                                    <div className="flex-1 min-h-[60px]">
                                        <div className="text-xs text-slate-400 line-clamp-3 leading-relaxed opacity-80 print:text-sm print:text-black print:line-clamp-none print:opacity-100">
                                            <div dangerouslySetInnerHTML={{ __html: doc.content || 'No content' }} />
                                        </div>
                                    </div>
                                    
                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 print:mt-6 print:border-t print:border-gray-200 print:pt-4">
                                        <p className="text-[9px] font-black text-slate-600 mt-0 uppercase tracking-tighter print:text-gray-500">
                                            Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                                        </p>
                                        <Sparkles className="h-3 w-3 text-sky-500/30 group-hover:text-sky-500 transition-colors print:hidden" />
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-slate-900/20 rounded-2xl p-8 border border-dashed border-white/5 text-center print:bg-transparent print:border-none print:hidden">
                    <FileText className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No documentation cards</p>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleOpenAddDoc}
                        className="mt-4 border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300"
                    >
                        Tambah Dokumentasi Task
                    </Button>
                </div>
            )}

            {/* Documentation Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDocDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-white/10 shadow-2xl side-panel-content">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent font-space-grotesk">
                                {editingDoc ? 'Edit Dokumentasi Task' : 'Tambah Dokumentasi Task'}
                            </DialogTitle>
                        </div>
                    </DialogHeader>
                    
                    <div className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="docTitle" className="text-slate-300 font-bold">Judul Dokumentasi</Label>
                            <Input 
                                id="docTitle"
                                value={docTitle}
                                onChange={(e) => setDocTitle(e.target.value)}
                                placeholder="Contoh: Log Percobaan, Memo Rapat, Rincian Spesifikasi"
                                className="bg-slate-900/50 border-white/10 focus:border-sky-500 focus:ring-sky-500 h-11 text-slate-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300 font-bold">Isi Dokumentasi</Label>
                            <div className="min-h-[400px] rounded-xl border border-white/10 overflow-hidden bg-slate-900/30 focus-within:border-sky-500/50 transition-colors">
                                <NovelEditor
                                    content={docContent}
                                    onChange={(content) => setDocContent(content)}
                                    placeholder="Tulis detail dokumentasi tugas di sini... (Mendukung copy-paste gambar)"
                                    showMenuBar={true}
                                    onImageUpload={handleEditorImageUpload}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-8 pt-6 border-t border-white/5 gap-3">
                        <Button 
                            variant="ghost" 
                            onClick={() => setDocDialogOpen(false)}
                            className="text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                            disabled={isSaving}
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={handleSaveDoc}
                            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white min-w-[140px] shadow-lg shadow-sky-900/40 py-6 font-bold border-0"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                editingDoc ? 'Update Dokumentasi' : 'Simpan Dokumentasi'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
