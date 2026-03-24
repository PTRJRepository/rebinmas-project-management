'use server'

import { revalidatePath } from 'next/cache'
import {
    getAttachmentsByProject,
    getAttachmentsByTask,
    createAttachment,
    deleteAttachment,
    type Attachment
} from '@/lib/api/projects'

export async function getProjectAttachments(projectId: string) {
    try {
        // Force no-cache to ensure fresh data
        const attachments = await getAttachmentsByProject(projectId)
        console.log('[getProjectAttachments] Server action returning:', attachments.length, 'attachments');
        return { success: true, data: attachments }
    } catch (error: any) {
        console.error('[getProjectAttachments] Error:', error.message);
        return { success: false, error: error.message }
    }
}

export async function getAttachmentsByTaskAction(taskId: string) {
    try {
        const attachments = await getAttachmentsByTask(taskId)
        console.log('[getAttachmentsByTaskAction] Server action returning:', attachments.length, 'attachments');
        return { success: true, data: attachments }
    } catch (error: any) {
        console.error('[getAttachmentsByTaskAction] Error:', error.message);
        return { success: false, error: error.message }
    }
}

export async function createAttachmentAction(data: {
    projectId: string;
    taskId?: string;
    fileName: string;
    fileUrl: string;
    previewUrl?: string;
    fileType: string;
    fileSize: number;
}) {
    console.log('[createAttachmentAction] Received data:', data);
    if (!data.projectId && !data.taskId) {
        console.error('[createAttachmentAction] Missing both projectId and taskId');
        return { success: false, error: 'Missing projectId or taskId' };
    }

    try {
        const attachment = await createAttachment(data)
        console.log('[createAttachmentAction] Success:', attachment.id);
        if (data.taskId) {
            revalidatePath(`/projects/${data.projectId}/board/${data.taskId}`)
        }
        revalidatePath(`/projects/${data.projectId}`)
        return { success: true, data: attachment }
    } catch (error: any) {
        console.error('[createAttachmentAction] CRITICAL ERROR:', error.message);
        return { success: false, error: error.message }
    }
}

export async function deleteAttachmentAction(id: string, projectId: string) {
    try {
        await deleteAttachment(id)
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
