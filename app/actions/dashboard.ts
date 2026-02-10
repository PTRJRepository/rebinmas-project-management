'use server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getDashboardStats(projectId: string) {
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

        // Group tasks by status for chart
        const statusDistribution = project.tasks.reduce((acc: any, task) => {
            const statusName = task.status.name
            acc[statusName] = (acc[statusName] || 0) + 1
            return acc
        }, {})

        // Format for chart: [{ name: 'To Do', value: 5 }, ...]
        const chartData = Object.keys(statusDistribution).map(key => ({
            name: key,
            value: statusDistribution[key]
        }))

        return {
            success: true,
            data: {
                totalTasks,
                completedTasks,
                overdueTasks,
                chartData
            }
        }

    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
