import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { sqlGateway } from '@/lib/api/sql-gateway'
import AdminClient from './AdminClient'

export default async function AdminPage() {
    const session = await getSession()

    // Verify Admin Request - SUPER_ADMIN and ADMIN can access
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
        redirect('/projects')
    }

    // Fetch all users with their project counts
    const usersResult = await sqlGateway.query(`
        SELECT
            u.id,
            u.username,
            u.email,
            u.name,
            u.role,
            u.created_at,
            u.updated_at,
            COUNT(DISTINCT p.id) as projectCount,
            COUNT(DISTINCT t.id) as taskCount
        FROM pm_users u
        LEFT JOIN pm_projects p ON u.id = p.owner_id
        LEFT JOIN pm_tasks t ON u.id = t.assignee_id
        GROUP BY u.id, u.username, u.email, u.name, u.role, u.created_at, u.updated_at
        ORDER BY
            CASE u.role
                WHEN 'SUPER_ADMIN' THEN 1
                WHEN 'ADMIN' THEN 2
                WHEN 'MANAGER' THEN 3
                WHEN 'PM' THEN 4
                WHEN 'MEMBER' THEN 5
            END,
            u.created_at DESC
    `)

    const users = usersResult.recordset.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        projectCount: u.projectCount || 0,
        taskCount: u.taskCount || 0
    }))

    // Fetch role-specific stats
    const roleStatsResult = await sqlGateway.query(`
        SELECT
            role,
            COUNT(*) as count
        FROM pm_users
        GROUP BY role
    `)

    const roleStats = roleStatsResult.recordset.reduce((acc: any, r: any) => {
        acc[r.role] = r.count
        return acc
    }, {})

    // Fetch detailed stats by role
    const detailedStatsResult = await sqlGateway.query(`
        SELECT
            u.role,
            COUNT(DISTINCT u.id) as userCount,
            COUNT(DISTINCT p.id) as projectCount,
            COUNT(DISTINCT t.id) as taskCount,
            COUNT(DISTINCT CASE WHEN t.status_id IN (SELECT id FROM pm_task_statuses WHERE name = 'Done') THEN t.id END) as completedTasks
        FROM pm_users u
        LEFT JOIN pm_projects p ON u.id = p.owner_id
        LEFT JOIN pm_tasks t ON u.id = t.assignee_id
        GROUP BY u.role
    `)

    const detailedByRole = detailedStatsResult.recordset.map((r: any) => ({
        role: r.role,
        userCount: r.userCount,
        projectCount: r.projectCount || 0,
        taskCount: r.taskCount || 0,
        completedTasks: r.completedTasks || 0
    }))

    // Fetch global stats
    const statsResult = await sqlGateway.query(`
        SELECT
            (SELECT COUNT(*) FROM pm_projects) as totalProjects,
            (SELECT COUNT(*) FROM pm_tasks) as totalTasks,
            (SELECT COUNT(*) FROM pm_users) as totalUsers,
            (SELECT COUNT(*) FROM pm_task_docs) as totalAssets,
            (SELECT COUNT(*) FROM pm_project_members) as totalMemberships
    `)
    const stats = statsResult.recordset[0]

    return <AdminClient
        currentUser={session as any}
        users={users}
        stats={stats}
        roleStats={roleStats}
        detailedByRole={detailedByRole}
    />
}
