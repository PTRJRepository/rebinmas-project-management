'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getTasks(projectId: string) {
    try {
        const tasks = await prisma.task.findMany({
            where: { projectId },
            include: {
                status: true,
                assignee: true,
                comments: true,
            },
            orderBy: { createdAt: 'desc' },
        })
        return { success: true, data: tasks }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createTask(formData: FormData) {
    const title = formData.get('title') as string
    const projectId = formData.get('projectId') as string
    const statusId = formData.get('statusId') as string
    const assigneeId = formData.get('assigneeId') as string
    const priority = formData.get('priority') as string
    const description = formData.get('description') as string
    const dueDate = formData.get('dueDate') as string
    const estimatedHours = formData.get('estimatedHours') as string

    if (!title || !projectId || !statusId) {
        return { success: false, error: 'Missing required fields' }
    }

    try {
        const task = await prisma.task.create({
            data: {
                title,
                projectId,
                statusId,
                assigneeId: assigneeId || undefined,
                priority: priority || 'MEDIUM',
                description: description || undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
            },
        })

        revalidatePath(`/projects/${projectId}`)
        return { success: true, data: task }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateTaskStatus(taskId: string, statusId: string, projectId: string) {
    try {
        const task = await prisma.task.update({
            where: { id: taskId },
            data: { statusId },
        })

        revalidatePath(`/projects/${projectId}`)
        return { success: true, data: task }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateTask(taskId: string, data: any, projectId: string) {
    try {
        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...data,
                updatedAt: new Date() // Force update
            }
        })
        revalidatePath(`/projects/${projectId}`)
        return { success: true, data: task }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getTask(taskId: string) {
    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                assignee: true,
                status: true,
                project: {
                    include: {
                        statuses: true
                    }
                },
                attachments: true,
                comments: {
                    include: {
                        user: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
        return { success: true, data: task }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
