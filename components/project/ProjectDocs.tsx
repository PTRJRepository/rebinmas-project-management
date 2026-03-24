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
    getProjectDocsAction, 
    createProjectDocAction, 
    updateProjectDocAction, 
    deleteProjectDocAction 
} from '@/app/actions/project'
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

interface ProjectDoc {
    id: string
    title: string
    content: string | null
    createdAt: Date
    updatedAt: Date
}

interface ProjectDocsProps {
    projectId: string
}

// Helper function to strip HTML tags and get plain text preview
const getPlainTextPreview = (html: string | null, maxLength: number = 150): string => {
    if (!html) return ''
    // Remove HTML tags
    const plainText = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    // Truncate to maxLength
    if (plainText.length <= maxLength) return plainText
    return plainText.substring(0, maxLength).trim() + '...'
}

// Helper to check if content has images
const hasImages = (html: string | null): boolean => {
    if (!html) return false
    return html.includes('<img') || html.includes('data:image')
}

// Helper to extract the first image URL
const getFirstImage = (html: string | null): string | null => {
    if (!html) return null
    const match = html.match(/<img[^>]+src="([^">]+)"/)
    return match ? match[1] : null
}

export function ProjectDocs({ projectId }: ProjectDocsProps) {
    const [docs, setDocs] = useState<ProjectDoc[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDocDialogOpen] = useState(false)
    const [editingDoc, setEditingDoc] = useState<ProjectDoc | null>(null)
    const [docTitle, setDocTitle] = useState('')
    const [docContent, setDocContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()

    const fetchDocs = useCallback(async () => {
        setLoading(true)
        const result = await getProjectDocsAction(projectId)
        if (result.success && result.data) {
            setDocs(result.data)
        }
        setLoading(false)
    }, [projectId])

    useEffect(() => {
        fetchDocs()
    }, [fetchDocs])

    const handleOpenAddDoc = () => {
        setEditingDoc(null)
        setDocTitle('')
        setDocContent('')
        setDocDialogOpen(true)
    }

    const handleOpenEditDoc = (doc: ProjectDoc) => {
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
                result = await updateProjectDocAction(editingDoc.id, projectId, { title: docTitle, content: docContent })
            } else {
                result = await createProjectDocAction(projectId, docTitle, docContent)
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

        const result = await deleteProjectDocAction(docId, projectId)
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
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-space-grotesk">
                    <FileText className="h-6 w-6 text-sky-500" />
                    Project Documentation
                </h3>
                <Button 
                    onClick={handleOpenAddDoc}
                    className="bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/40 border-0"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Doc Card
                </Button>
            </div>

            {docs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {docs.map((doc) => {
                        const preview = getPlainTextPreview(doc.content)
                        const firstImage = getFirstImage(doc.content)
                        
                        return (
                            <Card 
                                key={doc.id} 
                                className="glass-card hover:border-sky-500/30 transition-all duration-300 group cursor-pointer h-full flex flex-col border-white/5 overflow-hidden"
                                onClick={() => handleOpenEditDoc(doc)}
                            >
                                {firstImage && (
                                    <div className="h-32 w-full overflow-hidden border-b border-white/5 bg-slate-900">
                                        <img 
                                            src={firstImage} 
                                            alt={doc.title} 
                                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                )}
                                <CardHeader className="p-4 pb-2 border-b border-white/5 flex flex-row items-start justify-between space-y-0">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <CardTitle className="text-base font-bold text-slate-100 truncate">
                                            {doc.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="h-3 w-3 text-slate-500" />
                                            <p className="text-[11px] text-slate-500">
                                                {new Date(doc.updatedAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
                                <CardContent className="p-4 pt-3 flex-1 flex flex-col">
                                    {/* Preview Content */}
                                    <div className="flex-1 min-h-[60px]">
                                        {preview ? (
                                            <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                                                {preview}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">
                                                Belum ada konten
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            {firstImage && <FileImage className="h-3.5 w-3.5 text-sky-500" />}
                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                                {firstImage ? 'Berisi Gambar' : 'Text Only'}
                                            </span>
                                        </div>
                                        <Sparkles className="h-3 w-3 text-sky-500/30 group-hover:text-sky-500 transition-colors" />
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed border-white/10 bg-slate-900/30 text-center glass-panel">
                    <div className="h-16 w-16 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-4 border border-sky-500/20">
                        <FileText className="h-8 w-8 text-sky-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-100 font-space-grotesk">Belum ada dokumentasi</h4>
                    <p className="text-slate-400 text-sm max-w-xs mt-1">
                        Buat kartu dokumentasi untuk menyimpan informasi penting, panduan, atau catatan projek.
                    </p>
                    <Button 
                        variant="outline" 
                        onClick={handleOpenAddDoc}
                        className="mt-6 border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300"
                    >
                        Buat Dokumentasi Pertama
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
                                {editingDoc ? 'Edit Dokumentasi' : 'Tambah Dokumentasi Projek'}
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
                                placeholder="Contoh: Panduan Instalasi, Spesifikasi API, Catatan Meeting"
                                className="bg-slate-900/50 border-white/10 focus:border-sky-500 focus:ring-sky-500 h-11 text-slate-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300 font-bold">Isi Dokumentasi</Label>
                            <div className="min-h-[400px] rounded-xl border border-white/10 overflow-hidden bg-slate-900/30 focus-within:border-sky-500/50 transition-colors">
                                <NovelEditor
                                    content={docContent}
                                    onChange={(content) => setDocContent(content)}
                                    placeholder="Tulis detail dokumentasi di sini... (Mendukung copy-paste gambar)"
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
