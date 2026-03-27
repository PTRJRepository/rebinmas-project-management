import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sqlGateway } from '@/lib/api/sql-gateway'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Only MANAGER, ADMIN, and SUPER_ADMIN can access
    if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Fetch all users with their project and task counts
    const result = await sqlGateway.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.name,
        u.role,
        u.created_at,
        COUNT(DISTINCT p.id) as projectCount,
        COUNT(DISTINCT t.id) as taskCount
      FROM pm_users u
      LEFT JOIN pm_projects p ON u.id = p.owner_id
      LEFT JOIN pm_tasks t ON u.id = t.assignee_id
      GROUP BY u.id, u.username, u.email, u.name, u.role, u.created_at
      ORDER BY
        CASE u.role
          WHEN 'SUPER_ADMIN' THEN 1
          WHEN 'ADMIN' THEN 2
          WHEN 'MANAGER' THEN 3
          WHEN 'PM' THEN 4
          WHEN 'MEMBER' THEN 5
        END,
        u.name ASC
    `)

    const users = result.recordset.map((row: any) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: row.created_at,
      projectCount: row.projectCount || 0,
      taskCount: row.taskCount || 0
    }))

    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
