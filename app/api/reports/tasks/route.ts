import { NextResponse } from 'next/server'
import { sqlGateway } from '@/lib/api/sql-gateway'
import { getSession } from '@/lib/auth'

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

    // Fetch all tasks with project, assignee, and owner info
    const result = await sqlGateway.query(`
      SELECT
        t.id,
        t.title,
        t.description,
        t.priority,
        t.due_date,
        t.estimated_hours,
        t.actual_hours,
        t.progress,
        t.project_id,
        t.status_id,
        t.assignee_id,
        t.created_at,
        t.updated_at,
        p.id as project_id_ref,
        p.name as project_name,
        p.owner_id as project_owner_id,
        o.name as owner_name,
        o.role as owner_role,
        ts.id as status_id_ref,
        ts.name as status_name,
        ts.[order] as status_order,
        u.id as assignee_id_ref,
        u.username as assignee_username,
        u.name as assignee_name,
        u.email as assignee_email
      FROM pm_tasks t
      INNER JOIN pm_projects p ON t.project_id = p.id
      INNER JOIN pm_task_statuses ts ON t.status_id = ts.id
      LEFT JOIN pm_users u ON t.assignee_id = u.id
      LEFT JOIN pm_users o ON p.owner_id = o.id
      ORDER BY o.name ASC, p.name ASC, t.updated_at DESC
    `)

    const tasks = result.recordset.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      dueDate: row.due_date,
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
      progress: row.progress,
      projectId: row.project_id,
      statusId: row.status_id,
      assigneeId: row.assignee_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      project: {
        id: row.project_id,
        name: row.project_name,
      },
      owner: {
        id: row.project_owner_id,
        name: row.owner_name,
        role: row.owner_role,
      },
      status: {
        id: row.status_id_ref,
        name: row.status_name,
        order: row.status_order,
      },
      assignee: row.assignee_id_ref ? {
        id: row.assignee_id_ref,
        username: row.assignee_username,
        name: row.assignee_name,
        email: row.assignee_email,
      } : null,
    }))

    return NextResponse.json({ success: true, tasks })
  } catch (error: any) {
    console.error('Error fetching all tasks:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
