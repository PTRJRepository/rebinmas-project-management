'use client';

import React, { useState, useEffect } from 'react';
import { NovelEditor } from '@/components/editor/NovelEditor';
import { Button } from '@/components/ui/button';
import { updateTask } from '@/app/actions/task';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileText, Edit2, Save, X } from 'lucide-react';

interface TaskDescriptionEditorProps {
    task: {
        id: string;
        documentation?: string | null;
    };
    projectId: string;
}

export function TaskDescriptionEditor({ task, projectId }: TaskDescriptionEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [documentation, setDocumentation] = useState(task.documentation || '');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    // Sync documentation when task prop changes
    useEffect(() => {
        setDocumentation(task.documentation || '');
    }, [task.documentation]);

    const handleSave = async () => {
        if (isSaving) return;
        
        setIsSaving(true);
        console.log('[TaskDescriptionEditor] Saving documentation for task:', task.id);
        
        try {
            const result = await updateTask(task.id, { documentation }, projectId);
            
            if (result.success) {
                setIsEditing(false);
                toast({ 
                    title: "Berhasil", 
                    description: "Dokumentasi berhasil disimpan" 
                });
                console.log('[TaskDescriptionEditor] Documentation saved successfully');
            } else {
                toast({ 
                    variant: "destructive", 
                    title: "Gagal Menyimpan",
                    description: result.error || "Gagal menyimpan dokumentasi" 
                });
                console.error('[TaskDescriptionEditor] Save failed:', result.error);
            }
        } catch (error: any) {
            console.error('[TaskDescriptionEditor] Save error:', error);
            toast({ 
                variant: "destructive", 
                title: "Error",
                description: error.message || "Terjadi kesalahan saat menyimpan" 
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setDocumentation(task.documentation || '');
        setIsEditing(false);
    };

    const handleImageUpload = async (file: File): Promise<string> => {
        if (file.size > 10 * 1024 * 1024) {
            toast({ variant: "destructive", description: "Ukuran file terlalu besar (maksimal 10MB)" });
            throw new Error("File too large");
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.details || errorData.error || 'Upload gagal';
                throw new Error(errorMsg);
            }

            const data = await response.json();
            console.log('[TaskDescriptionEditor] Image uploaded:', data.url);
            return data.url;
        } catch (error: any) {
            console.error('[TaskDescriptionEditor] Upload error:', error);
            toast({ 
                variant: "destructive", 
                title: "Upload Gagal",
                description: error.message || "Gagal mengupload gambar" 
            });
            throw error;
        }
    };

    // Helper function to check if content has any meaningful content
    const hasContent = (html: string | null | undefined): boolean => {
        if (!html) return false;
        // Remove empty tags and check if there's any text content
        const cleaned = html.replace(/<[^>]*>/g, '').trim();
        return cleaned.length > 0;
    };

    // Helper function to strip HTML for preview
    const getPreviewText = (html: string | null, maxLength: number = 200): string => {
        if (!html) return '';
        const plainText = html
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
        if (plainText.length <= maxLength) return plainText;
        return plainText.substring(0, maxLength).trim() + '...';
    };

    return (
        <div className="bg-slate-900 rounded-lg border border-slate-700 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-sky-400" />
                    <h2 className="text-lg font-semibold text-slate-100">
                        Documentation
                    </h2>
                </div>
                {!isEditing ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                            disabled={isSaving}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-sky-600 hover:bg-sky-700"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-1" />
                                    Save
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Content - Full height editor */}
            <div className="flex-1 p-6 overflow-auto">
                {isEditing ? (
                    <div className="h-full min-h-[500px]">
                        <NovelEditor
                            content={documentation}
                            onChange={(content) => setDocumentation(content)}
                            onImageUpload={handleImageUpload}
                            placeholder="Tambahkan dokumentasi (drag & drop gambar didukung)..."
                            showMenuBar={true}
                            className="h-full"
                        />
                    </div>
                ) : (
                    <div className="min-h-[100px]">
                        {hasContent(documentation) ? (
                            <div
                                className="prose prose-invert prose-slate max-w-none text-slate-300"
                                dangerouslySetInnerHTML={{ __html: documentation }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                                    <FileText className="h-6 w-6 text-slate-500" />
                                </div>
                                <p className="text-slate-500 text-sm">Belum ada dokumentasi</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="mt-3 border-slate-600 text-slate-400 hover:bg-slate-800"
                                >
                                    <Edit2 className="h-3 w-3 mr-1" />
                                    Tambah Dokumentasi
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
