import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { sqlGateway } from '@/lib/api/sql-gateway'
import AdminClient from './AdminClient'

export default async function AdminPage() {
    const session = await getSession()
    
    // Verify Admin Request
    if (!session || session.role !== 'ADMIN') {
        redirect('/projects')
    }

    // Fetch all users
    const usersResult = await sqlGateway.query(`
        SELECT id, username, email, name, role, created_at 
        FROM pm_users 
        ORDER BY created_at DESC
    `)
    const users = usersResult.recordset.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.created_at
    }))

    // Fetch global stats
    const statsResult = await sqlGateway.query(`
        SELECT 
            (SELECT COUNT(*) FROM pm_projects) as totalProjects,
            (SELECT COUNT(*) FROM pm_tasks) as totalTasks,
            (SELECT COUNT(*) FROM pm_users) as totalUsers,
            (SELECT COUNT(*) FROM pm_task_docs) as totalAssets
    `)
    const stats = statsResult.recordset[0]

    return <AdminClient currentUser={session as any} users={users} stats={stats} />
}
