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
  getAllTasksForManager,
  createTask as apiCreateTask,
  getTaskById,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  getCommentsByTask,
  createComment as apiCreateComment,
  deleteComment as apiDeleteComment,
  getTaskStatuses,
  getTaskDocs,
  createTaskDoc as apiCreateTaskDoc,
  updateTaskDoc as apiUpdateTaskDoc,
  deleteTaskDoc as apiDeleteTaskDoc,
  type Task,
  type Comment,
  type TaskDoc
} from '@/lib/api/projects'

export async function getTasks(projectId: string) {
    try {
        const tasks = await apiGetTasks(projectId)
        return { success: true, data: tasks }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Get all tasks for managers - returns tasks from all projects
 * Manager role has global access to all projects and their tasks
 */
export async function getManagerTasks() {
    try {
        const session = await getCurrentUser()
        if (!session) {
            return { success: false, error: 'Unauthorized' }
        }

        // Only MANAGER, ADMIN, and SUPER_ADMIN can access all tasks
        if (session.role !== 'MANAGER' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
            return { success: false, error: 'Only managers can access all tasks' }
        }

        const tasks = await getAllTasksForManager()
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
    const location = formData.get('location') as string
    const tags = formData.get('tags') as string

    console.log('[createTask] Input:', { 
        title, 
        projectId, 
        statusId, 
        priority, 
        description, 
        dueDate, 
        estimatedHours,
        location,
        tags,
        assigneeId 
    })

    if (!title || !projectId || !statusId) {
        console.error('[createTask] Missing required fields:', { title: !!title, projectId: !!projectId, statusId: !!statusId })
        return { success: false, error: 'Missing required fields: title, projectId, statusId' }
    }

    try {
        // Combine location and tags with description if they exist
        let fullDescription: string = description || ''
        
        // Add location to description if provided
        if (location && location.trim().length > 0) {
            fullDescription = fullDescription 
                ? `${fullDescription}\n\n📍 Location: ${location}`
                : `📍 Location: ${location}`
        }
        
        // Add tags to description if provided
        if (tags && tags.trim().length > 0) {
            const tagList = tags.split(',').filter(t => t.trim().length > 0)
            if (tagList.length > 0) {
                const tagsFormatted = tagList.map(t => `#${t.trim()}`).join(' ')
                fullDescription = fullDescription 
                    ? `${fullDescription}\n\n${tagsFormatted}`
                    : tagsFormatted
            }
        }

        const task = await apiCreateTask({
            title,
            description: fullDescription || undefined,
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
// TASK DOCUMENTATION ACTIONS
// ==================================================

export async function getTaskDocsAction(taskId: string) {
    try {
        const docs = await getTaskDocs(taskId)
        return { success: true, data: docs }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createTaskDocAction(taskId: string, title: string, content: string, projectId: string) {
    try {
        const doc = await apiCreateTaskDoc({ taskId, title, content })
        revalidatePath(`/projects/${projectId}/board/${taskId}`)
        return { success: true, data: doc }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateTaskDocAction(docId: string, taskId: string, data: { title?: string; content?: string }, projectId: string) {
    try {
        const doc = await apiUpdateTaskDoc(docId, data)
        revalidatePath(`/projects/${projectId}/board/${taskId}`)
        return { success: true, data: doc }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteTaskDocAction(docId: string, taskId: string, projectId: string) {
    try {
        await apiDeleteTaskDoc(docId)
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
