'use server'

import { revalidatePath } from 'next/cache'
import { 
    getAttachmentsByProject, 
    createAttachment, 
    deleteAttachment,
    type Attachment 
} from '@/lib/api/projects'

export async function getProjectAttachments(projectId: string) {
    try {
        const attachments = await getAttachmentsByProject(projectId)
        return { success: true, data: attachments }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createAttachmentAction(data: {
    projectId: string;
    taskId?: string;
    fileName: string;
    fileUrl: string;
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
