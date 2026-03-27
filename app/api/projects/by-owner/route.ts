import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sqlGateway } from '@/lib/api/sql-gateway'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')
    const filterUserId = searchParams.get('userId')

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let sql = `
      SELECT
        p.id, p.name, p.description, p.start_date, p.end_date, p.priority, p.banner_image, p.status, p.owner_id, p.created_at, p.updated_at,
        u.id as user_id,
        u.username as owner_username,
        u.email as owner_email,
        u.name as owner_name,
        COUNT(t.id) as task_count
      FROM pm_projects p
      LEFT JOIN pm_users u ON p.owner_id = u.id
      LEFT JOIN pm_tasks t ON p.id = t.project_id
      WHERE 1=1
    `

    const params: Record<string, any> = {}

    // Filter by owner (user who owns the project)
    if (ownerId) {
      sql += ` AND p.owner_id = @ownerId`
      params.ownerId = ownerId
    }

    // Filter by user's membership (projects the user is a member of)
    if (filterUserId) {
      sql += ` AND (
        p.owner_id = @filterUserId
        OR EXISTS (
          SELECT 1 FROM pm_project_members pm
          WHERE pm.project_id = p.id AND pm.user_id = @filterUserId
        )
      )`
      params.filterUserId = filterUserId
    }

    // For regular users, only show projects they're member of
    if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      sql += ` AND (
        p.owner_id = @sessionUserId
        OR EXISTS (
          SELECT 1 FROM pm_project_members pm
          WHERE pm.project_id = p.id AND pm.user_id = @sessionUserId
        )
      )`
      params.sessionUserId = session.userId
    }

    sql += `
      GROUP BY p.id, p.name, p.description, p.start_date, p.end_date, p.priority, p.banner_image, p.status, p.owner_id, p.created_at, p.updated_at, u.id, u.username, u.email, u.name
      ORDER BY p.created_at DESC
    `

    const result = await sqlGateway.query(sql, params)

    const projects = result.recordset.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      priority: row.priority,
      bannerImage: row.banner_image,
      status: row.status,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      owner: {
        id: row.user_id,
        username: row.owner_username,
        email: row.owner_email,
        name: row.owner_name,
      },
      _count: { tasks: row.task_count },
    }))

    return NextResponse.json(projects)
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
