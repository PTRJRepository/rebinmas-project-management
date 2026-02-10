'use client';

import React, { useState } from 'react';
import { NovelEditor } from '@/components/editor/NovelEditor';
import { Button } from '@/components/ui/button';
import { updateTask } from '@/app/actions/task';
import { useToast } from "@/components/ui/use-toast";

interface TaskDescriptionEditorProps {
    task: {
        id: string;
        description?: string | null;
    };
    projectId: string;
}

export function TaskDescriptionEditor({ task, projectId }: TaskDescriptionEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(task.description || '');
    const { toast } = useToast();

    const handleSave = async () => {
        const result = await updateTask(task.id, { description }, projectId);
        if (result.success) {
            setIsEditing(false);
            toast({ description: "Description updated" });
        } else {
            toast({ variant: "destructive", description: "Failed to update description" });
        }
    };

    return (
        <div className="bg-slate-900 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-slate-100">
                    Description
                </h2>
                {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-slate-200 hover:bg-slate-800">
                        Edit
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                            setIsEditing(false);
                            setDescription(task.description || '');
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
                        content={description}
                        onChange={(content) => setDescription(content)}
                        placeholder="Add a description..."
                        className="min-h-[200px]"
                    />
                ) : (
                    description ? (
                        <div
                            className="prose prose-invert prose-slate max-w-none text-slate-300"
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
                    ) : (
                        <p className="text-slate-500 italic">No description provided</p>
                    )
                )}
            </div>
        </div>
    );
}
