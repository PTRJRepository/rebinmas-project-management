'use server'

/**
 * Project Actions - Using SQL Server via SQL Gateway API
 *
 * All project operations now use the SQL Server database (extend_db_ptrj)
 * via the SQL Gateway API instead of local SQLite.
 *
 * SECURITY: Only SERVER_PROFILE_1 and extend_db_ptrj are used for write operations.
 */

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/app/actions/auth'
import {
  getProjects as apiGetProjects,
  createProject as apiCreateProject,
  getProjectById,
  deleteProject as apiDeleteProject,
  getProjectDashboardStats,
  updateProject,
  type Project,
  type Task
} from '@/lib/api/projects'

export async function getProjects() {
    try {
        const session = await getCurrentUser()
        if (!session) {
            return { success: false, error: 'Unauthorized' }
        }

        const projects = await apiGetProjects(session.id)
        return { success: true, data: projects }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getAllProjects() {
    try {
        const projects = await apiGetProjects()
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
    const ownerId = session.id
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const priority = formData.get('priority') as string
    const status = formData.get('status') as string
    const bannerImage = formData.get('bannerImage') as string

    if (!name) {
        return { success: false, error: 'Name is required' }
    }

    try {
        const project = await apiCreateProject({
            name,
            description,
            ownerId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            priority: priority || 'MEDIUM',
            status: status || null,
            bannerImage: bannerImage || undefined,
        })

        revalidatePath('/projects')
        return { success: true, data: project }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateProjectAction(formData: FormData) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const priority = formData.get('priority') as string
    const status = formData.get('status') as string
    const bannerImage = formData.get('bannerImage') as string

    if (!id) {
        return { success: false, error: 'Project ID is required' }
    }

    try {
        // Verify ownership
        const existing = await getProjectById(id)
        if (!existing) {
            return { success: false, error: 'Project not found' }
        }

        if (existing.ownerId !== session.id) {
            return { success: false, error: 'Unauthorized: You can only edit your own projects' }
        }

        const project = await updateProject(id, {
            name,
            description,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            priority: priority as any,
            status: status as any,
            bannerImage: bannerImage || undefined,
        })

        revalidatePath(`/projects/${id}`)
        return { success: true, data: project }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getProjectStats(projectId: string) {
    try {
        const stats = await getProjectDashboardStats(projectId)
        return { success: true, data: stats }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getProject(projectId: string) {
    try {
        const project = await getProjectById(projectId)
        if (!project) {
            return { success: false, error: 'Project not found' }
        }
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
        const existing = await getProjectById(projectId)

        if (!existing) {
            return { success: false, error: 'Project not found' }
        }

        if (existing.ownerId !== session.id) {
            return { success: false, error: 'Unauthorized: You can only delete your own projects' }
        }

        await apiDeleteProject(projectId)

        revalidatePath('/projects')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
