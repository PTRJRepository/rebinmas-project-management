'use server'

/**
 * Task Actions - Using SQL Server via SQL Gateway API
 *
 * All task operations now use the SQL Server database (extend_db_ptrj)
 * via the SQL Gateway API instead of local SQLite.
 *
 * SECURITY: Only SERVER_PROFILE_1 and extend_db_ptrj are used for write operations.
 */

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/app/actions/auth'
import {
  getTasks as apiGetTasks,
  createTask as apiCreateTask,
  getTaskById,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  getCommentsByTask,
  createComment as apiCreateComment,
  deleteComment as apiDeleteComment,
  getTaskStatuses,
  type Task,
  type Comment
} from '@/lib/api/projects'

export async function getTasks(projectId: string) {
    try {
        const tasks = await apiGetTasks(projectId)
        return { success: true, data: tasks }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createTask(formData: FormData) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const title = formData.get('title') as string
    const projectId = formData.get('projectId') as string
    const statusId = formData.get('statusId') as string
    let assigneeId = formData.get('assigneeId') as string
    const priority = formData.get('priority') as string
    const description = formData.get('description') as string
    const dueDate = formData.get('dueDate') as string
    const estimatedHours = formData.get('estimatedHours') as string

    console.log('[createTask] Input:', { title, projectId, statusId, priority, description, dueDate, estimatedHours })

    if (!title || !projectId || !statusId) {
        console.error('[createTask] Missing required fields:', { title: !!title, projectId: !!projectId, statusId: !!statusId })
        return { success: false, error: 'Missing required fields: title, projectId, statusId' }
    }

    try {
        const task = await apiCreateTask({
            title,
            description,
            priority: priority || 'MEDIUM',
            dueDate: dueDate ? new Date(dueDate) : undefined,
            estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
            projectId,
            statusId,
            assigneeId: assigneeId || undefined,
        })

        console.log('[createTask] Success:', task)
        revalidatePath(`/projects/${projectId}`)
        return { success: true, data: task }
    } catch (error: any) {
        console.error('[createTask] Error:', error)
        return { success: false, error: error.message || 'Failed to create task' }
    }
}

export async function updateTaskStatus(taskId: string, statusId: string, projectId: string) {
    try {
        const task = await apiUpdateTask(taskId, { statusId })

        revalidatePath(`/projects/${projectId}`)
        return { success: true, data: task }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateTask(taskId: string, data: any, projectId: string) {
    try {
        const task = await apiUpdateTask(taskId, {
            ...data,
            updatedAt: new Date()
        })
        revalidatePath(`/projects/${projectId}`)
        return { success: true, data: task }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getTask(taskId: string) {
    try {
        const task = await getTaskById(taskId)
        if (!task) {
            return { success: false, error: 'Task not found' }
        }

        // Get comments for the task
        const comments = await getCommentsByTask(taskId)

        return { success: true, data: { ...task, comments } }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteTaskAction(taskId: string, projectId: string) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        await apiDeleteTask(taskId)

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ==================================================
// COMMENT ACTIONS
// ==================================================

export async function getComments(taskId: string) {
    try {
        const comments = await getCommentsByTask(taskId)
        return { success: true, data: comments }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createCommentAction(formData: FormData) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const taskId = formData.get('taskId') as string
    const content = formData.get('content') as string
    const projectId = formData.get('projectId') as string

    if (!taskId || !content) {
        return { success: false, error: 'Missing required fields' }
    }

    try {
        const comment = await apiCreateComment({
            taskId,
            userId: session.id,
            content
        })

        revalidatePath(`/projects/${projectId}/board/${taskId}`)
        return { success: true, data: comment }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteCommentAction(commentId: string, taskId: string, projectId: string) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        await apiDeleteComment(commentId)

        revalidatePath(`/projects/${projectId}/board/${taskId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ==================================================
// TASK STATUS ACTIONS
// ==================================================

export async function getStatuses(projectId: string) {
    try {
        const statuses = await getTaskStatuses(projectId)
        return { success: true, data: statuses }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
