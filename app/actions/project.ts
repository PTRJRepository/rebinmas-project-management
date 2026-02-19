'use server'

/**
 * Project Actions - Using SQL Server via SQL Gateway API
 *
 * All project operations now use the SQL Server database (extend_db_ptrj)
 * via the SQL Gateway API instead of local SQLite.
 *
 * SECURITY: Only SERVER_PROFILE_1 and extend_db_ptrj are used for write operations.
 * OWNERSHIP: Projects are filtered based on user ownership and membership.
 */

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/app/actions/auth'
import {
    createProject as apiCreateProject,
    getProjectById,
    getProjectWithTasks,
    deleteProject,
    getProjectDashboardStats,
    getGlobalRecentActivities,
    getProjectDocs,
    createProjectDoc,
    updateProjectDoc,
    deleteProjectDoc,
    updateProject,
    restoreProject,
    permanentDeleteProject,
    getDeletedProjects,
    getProjectByIdIncludeDeleted,
    type Project,
    type Task
} from '@/lib/api/projects'
import {
    checkProjectAccess,
    getAccessibleProjects,
    getProjectMembers,
    addProjectMember,
    removeProjectMember,
    updateMemberRole,
    transferOwnership,
    canPerformAction,
    type ProjectMember,
} from '@/lib/api/project-members'

// ==================================================
// PROJECT DOCUMENTATION ACTIONS
// ==================================================

export async function getProjectDocsAction(projectId: string) {
    try {
        const docs = await getProjectDocs(projectId)
        return { success: true, data: docs }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createProjectDocAction(projectId: string, title: string, content: string) {
    try {
        const doc = await createProjectDoc({ projectId, title, content })
        revalidatePath(`/projects/${projectId}`)
        return { success: true, data: doc }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateProjectDocAction(docId: string, projectId: string, data: { title?: string; content?: string }) {
    try {
        const doc = await updateProjectDoc(docId, data)
        revalidatePath(`/projects/${projectId}`)
        return { success: true, data: doc }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteProjectDocAction(docId: string, projectId: string) {
    try {
        await deleteProjectDoc(docId)
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getProjects() {
    try {
        const session = await getCurrentUser()
        if (!session) {
            return { success: false, error: 'Unauthorized' }
        }

        // Use access-controlled query
        const projects = await getAccessibleProjects(session.id, session.role)
        return { success: true, data: projects }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getAllProjects() {
    try {
        const projects = await getProjects()
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
        // Check if user can edit project (OWNER or ADMIN only)
        const canEdit = await canPerformAction('edit_project', id, session.id)
        if (!canEdit) {
            return { success: false, error: 'Unauthorized: Only project owner or admin can edit' }
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
        const session = await getCurrentUser()
        if (!session) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check access
        const access = await checkProjectAccess(projectId, session.id)
        if (!access.hasAccess) {
            return { success: false, error: 'Access denied', code: 'FORBIDDEN' }
        }

        // Use getProjectWithTasks to include statuses and tasks
        const project = await getProjectWithTasks(projectId)
        if (!project) {
            return { success: false, error: 'Project not found' }
        }
        return { success: true, data: project, userRole: access.role }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getRecentActivitiesAction(limit?: number) {
    try {
        const activities = await getGlobalRecentActivities(limit)
        return { success: true, data: activities }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteProjectAction(id: string) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check ownership
        const project = await getProjectById(id);
        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        if (project.ownerId !== session.id && session.role !== 'ADMIN') {
            return { success: false, error: 'Not authorized to delete this project' };
        }

        await deleteProject(id); // Now performs soft delete
        revalidatePath('/projects');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting project:', error);
        return { success: false, error: 'Failed to delete project' };
    }
}

export async function restoreProjectAction(id: string) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check ownership (need to include deleted projects)
        const project = await getProjectByIdIncludeDeleted(id);
        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        if (project.ownerId !== session.id && session.role !== 'ADMIN') {
            return { success: false, error: 'Not authorized to restore this project' };
        }

        await restoreProject(id);
        revalidatePath('/projects');
        return { success: true };
    } catch (error: any) {
        console.error('Error restoring project:', error);
        return { success: false, error: 'Failed to restore project' };
    }
}

export async function permanentDeleteProjectAction(id: string) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check ownership
        const project = await getProjectByIdIncludeDeleted(id);
        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        if (project.ownerId !== session.id && session.role !== 'ADMIN') {
            return { success: false, error: 'Not authorized to permanently delete this project' };
        }

        await permanentDeleteProject(id);
        revalidatePath('/projects');
        return { success: true };
    } catch (error: any) {
        console.error('Error permanently deleting project:', error);
        return { success: false, error: 'Failed to permanently delete project' };
    }
}

export async function getDeletedProjectsAction() {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        const projects = await getDeletedProjects(session.id);
        return { success: true, data: projects };
    } catch (error: any) {
        console.error('Error getting deleted projects:', error);
        return { success: false, error: 'Failed to get deleted projects' };
    }
}

// ==================================================
// MEMBER MANAGEMENT ACTIONS
// ==================================================

export async function getProjectMembersAction(projectId: string) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Check access
        const access = await checkProjectAccess(projectId, session.id)
        if (!access.hasAccess) {
            return { success: false, error: 'Access denied' }
        }

        const members = await getProjectMembers(projectId)
        return { success: true, data: members }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function addProjectMemberAction(formData: FormData) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const projectId = formData.get('projectId') as string
    const userId = formData.get('userId') as string
    const role = formData.get('role') as string

    if (!projectId || !userId || !role) {
        return { success: false, error: 'Missing required fields' }
    }

    try {
        // Check if user can manage members (OWNER or ADMIN only)
        const canManage = await canPerformAction('manage_members', projectId, session.id)
        if (!canManage) {
            return { success: false, error: 'Unauthorized: Only project owner or admin can add members' }
        }

        // Prevent assigning OWNER role through this action
        if (role === 'OWNER') {
            return { success: false, error: 'Cannot assign ownership through this action. Use transfer ownership instead.' }
        }

        // Validate role
        if (role !== 'PM' && role !== 'MEMBER') {
            return { success: false, error: 'Invalid role. Must be PM or MEMBER.' }
        }

        const member = await addProjectMember({
            projectId,
            userId,
            role,
            addedBy: session.id,
        })

        revalidatePath(`/projects/${projectId}`)
        return { success: true, data: member }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function removeProjectMemberAction(projectId: string, userId: string) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Check if user can manage members (OWNER or ADMIN only)
        const canManage = await canPerformAction('manage_members', projectId, session.id)
        if (!canManage) {
            return { success: false, error: 'Unauthorized: Only project owner or admin can remove members' }
        }

        await removeProjectMember(projectId, userId)

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateMemberRoleAction(projectId: string, userId: string, newRole: string) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Check if user can manage members (OWNER or ADMIN only)
        const canManage = await canPerformAction('manage_members', projectId, session.id)
        if (!canManage) {
            return { success: false, error: 'Unauthorized: Only project owner or admin can update member roles' }
        }

        await updateMemberRole(projectId, userId, newRole as any)

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function transferOwnershipAction(projectId: string, newOwnerId: string) {
    const session = await getCurrentUser()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Check if current user is the owner or admin
        const access = await checkProjectAccess(projectId, session.id, 'OWNER')
        if (!access.hasAccess && session.role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized: Only project owner or admin can transfer ownership' }
        }

        // Get current owner
        const project = await getProjectById(projectId)
        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        await transferOwnership(projectId, newOwnerId, project.ownerId)

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
