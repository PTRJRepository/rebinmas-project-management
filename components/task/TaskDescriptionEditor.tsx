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
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                    Description
                </h2>
                {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        Edit
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                            setIsEditing(false);
                            setDescription(task.description || '');
                        }}>
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
                            className="prose prose-sm max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
                    ) : (
                        <p className="text-gray-500 italic">No description provided</p>
                    )
                )}
            </div>
        </div>
    );
}
