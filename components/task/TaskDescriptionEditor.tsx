'use client';

import React, { useState } from 'react';
import { NovelEditor } from '@/components/editor/NovelEditor';
import { Button } from '@/components/ui/button';
import { updateTask } from '@/app/actions/task';
import { useToast } from "@/components/ui/use-toast";

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
    const { toast } = useToast();

    const handleSave = async () => {
        const result = await updateTask(task.id, { documentation }, projectId);
        if (result.success) {
            setIsEditing(false);
            toast({ description: "Documentation updated" });
        } else {
            toast({ variant: "destructive", description: "Failed to update documentation" });
        }
    };

    const handleImageUpload = async (file: File): Promise<string> => {
        if (file.size > 10 * 1024 * 1024) {
            toast({ variant: "destructive", description: "File size too large (max 10MB)" });
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
                const errorMsg = errorData.details || errorData.error || 'Upload failed';
                throw new Error(errorMsg);
            }

            const data = await response.json();
            return data.url;
        } catch (error: any) {
            console.error('[TaskDescriptionEditor] Upload error:', error);
            toast({ 
                variant: "destructive", 
                title: "Upload Failed",
                description: error.message || "Failed to upload image" 
            });
            throw error;
        }
    };

    return (
        <div className="bg-slate-900 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-slate-100">
                    Documentation
                </h2>
                {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-slate-200 hover:bg-slate-800">
                        Edit
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                            setIsEditing(false);
                            setDocumentation(task.documentation || '');
                        }} className="text-slate-400 hover:text-slate-200 hover:bg-slate-800">
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                )}
            </div>

            <div className="p-6">
                {isEditing ? (
                    <NovelEditor
                        content={documentation}
                        onChange={(content) => setDocumentation(content)}
                        onImageUpload={handleImageUpload}
                        placeholder="Add documentation (drag & drop images supported)..."
                        className="min-h-[200px]"
                    />
                ) : (
                    documentation ? (
                        <div
                            className="prose prose-invert prose-slate max-w-none text-slate-300"
                            dangerouslySetInnerHTML={{ __html: documentation }}
                        />
                    ) : (
                        <p className="text-slate-500 italic">No documentation provided</p>
                    )
                )}
            </div>
        </div>
    );
}
