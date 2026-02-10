'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'

const prisma = new PrismaClient()

export async function getProjects() {
    try {
        const projects = await prisma.project.findMany({
            include: {
                owner: true,
                _count: {
                    select: { tasks: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })
        return { success: true, data: projects }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createProject(formData: FormData) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    // const ownerId = formData.get('ownerId') as string // Use session instead
    const ownerId = session.id
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string

    if (!name) {
        return { success: false, error: 'Name is required' }
    }

    try {
        const project = await prisma.project.create({
            data: {
                name,
                description,
                ownerId,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            },
        })

        // Create default statuses for the new project
        const statuses = ['To Do', 'In Progress', 'Done']
        for (let i = 0; i < statuses.length; i++) {
            await prisma.taskStatus.create({
                data: {
                    name: statuses[i],
                    order: i,
                    projectId: project.id,
                }
            });
        }

        revalidatePath('/projects')
        return { success: true, data: project }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getProjectStats(projectId: string) {
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                tasks: {
                    include: {
                        status: true,
                    }
                }
            }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        const totalTasks = project.tasks.length
        const completedTasks = project.tasks.filter(t => t.status.name === 'Done').length
        const overdueTasks = project.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status.name !== 'Done').length
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

        return {
            success: true,
            data: {
                totalTasks,
                completedTasks,
                overdueTasks,
                progress: Math.round(progress)
            }
        }

    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getProject(projectId: string) {
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                owner: true,
                statuses: {
                    orderBy: { order: 'asc' }
                }
            }
        })
        return { success: true, data: project }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteProject(projectId: string) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { ownerId: true }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        if (project.ownerId !== session.id) {
            return { success: false, error: 'Unauthorized: You can only delete your own projects' }
        }

        // Manual cascade delete since schema doesn't have onDelete: Cascade
        // 1. Delete all tasks
        await prisma.task.deleteMany({
            where: { projectId: projectId }
        })

        // 2. Delete all task statuses
        await prisma.taskStatus.deleteMany({
            where: { projectId: projectId }
        })

        // 3. Delete the project
        await prisma.project.delete({
            where: { id: projectId }
        })

        revalidatePath('/projects')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
