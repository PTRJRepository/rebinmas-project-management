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
    Sparkles 
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
            toast({ variant: "destructive", description: "Title is required" })
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
                toast({ title: "Success", description: editingDoc ? "Documentation updated" : "Documentation added" })
                setDocDialogOpen(false)
                fetchDocs()
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error || "Failed to save documentation" })
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteDoc = async (docId: string) => {
        if (!confirm('Are you sure you want to delete this documentation card?')) return

        const result = await deleteProjectDocAction(docId, projectId)
        if (result.success) {
            toast({ title: "Success", description: "Documentation deleted" })
            fetchDocs()
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error || "Failed to delete documentation" })
        }
    }

    const handleEditorImageUpload = async (file: File): Promise<string> => {
        if (file.size > 10 * 1024 * 1024) {
            toast({ variant: "destructive", description: "File size too large (max 10MB)" })
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
            throw new Error(errorData.details || errorData.error || 'Upload failed')
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
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-sky-500" />
                    Project Documentation
                </h3>
                <Button 
                    onClick={handleOpenAddDoc}
                    className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-900/20"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Doc Card
                </Button>
            </div>

            {docs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {docs.map((doc) => (
                        <Card key={doc.id} className="bg-white border-gray-200 group hover:shadow-md transition-all h-full flex flex-col">
                            <CardHeader className="p-4 pb-2 border-b border-gray-50 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-base font-bold text-gray-800 truncate pr-8">
                                    {doc.title}
                                </CardTitle>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-gray-400 hover:text-sky-600 hover:bg-sky-50"
                                        onClick={() => handleOpenEditDoc(doc)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDeleteDoc(doc.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-3 flex-1 overflow-hidden">
                                <div className="text-sm text-gray-600 line-clamp-4 prose prose-sm max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: doc.content || 'No content' }} />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-4 font-medium italic">
                                    Last updated: {new Date(doc.updatedAt).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-sky-100 flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-sky-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Belum ada dokumentasi</h4>
                    <p className="text-gray-500 text-sm max-w-xs mt-1">
                        Buat kartu dokumentasi untuk menyimpan informasi penting, panduan, atau catatan projek.
                    </p>
                    <Button 
                        variant="outline" 
                        onClick={handleOpenAddDoc}
                        className="mt-6 border-sky-200 text-sky-700 hover:bg-sky-50"
                    >
                        Buat Dokumentasi Pertama
                    </Button>
                </div>
            )}

            {/* Documentation Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDocDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                                {editingDoc ? 'Edit Dokumentasi' : 'Tambah Dokumentasi Projek'}
                            </DialogTitle>
                        </div>
                    </DialogHeader>
                    
                    <div className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="docTitle" className="text-gray-700 font-bold">Judul Dokumentasi</Label>
                            <Input 
                                id="docTitle"
                                value={docTitle}
                                onChange={(e) => setDocTitle(e.target.value)}
                                placeholder="Contoh: Panduan Instalasi, Spesifikasi API, Catatan Meeting"
                                className="border-gray-200 focus:border-sky-500 focus:ring-sky-500 h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">Isi Dokumentasi</Label>
                            <div className="min-h-[400px] rounded-xl border border-gray-200 overflow-hidden bg-gray-50 focus-within:border-sky-500 transition-colors">
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

                    <DialogFooter className="mt-8 pt-6 border-t border-gray-100 gap-3">
                        <Button 
                            variant="ghost" 
                            onClick={() => setDocDialogOpen(false)}
                            className="text-gray-500 hover:bg-gray-100"
                            disabled={isSaving}
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={handleSaveDoc}
                            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white min-w-[140px] shadow-lg shadow-sky-900/20 py-6 font-bold"
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
