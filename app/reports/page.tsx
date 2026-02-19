import { redirect } from 'next/navigation'
import { ReportPage } from '@/components/ReportPage'
import { getCurrentUser } from '@/app/actions/auth'
import { sqlGateway } from '@/lib/api/sql-gateway'

export default async function ReportsPage() {
  const session = await getCurrentUser()
  if (!session) {
    redirect('/auth/login')
  }

  const generatedAt = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'long'
  })

  // Fetch all projects with full details using SQL Server
  const projectsResult = await sqlGateway.query(`
    SELECT 
      p.id, p.name, p.description, p.start_date, p.end_date, p.priority, p.banner_image, p.status, p.owner_id, p.created_at, p.updated_at,
      u.id as owner_id_ref, u.username as owner_username, u.name as owner_name,
      ts.id as status_id_ref, ts.name as status_name, ts.[order] as status_order,
      t.id as task_id, t.title as task_title, t.description as task_description, t.priority as task_priority, 
      t.due_date as task_due_date, t.estimated_hours as task_estimated_hours, t.actual_hours as task_actual_hours,
      t.progress as task_progress, t.created_at as task_created_at, t.updated_at as task_updated_at,
      t.status_id as task_status_id, t.assignee_id as task_assignee_id,
      au.id as assignee_id_ref, au.username as assignee_username, au.name as assignee_name,
      c.id as comment_id, c.content as comment_content, c.created_at as comment_created_at, c.user_id as comment_user_id,
      att.id as attachment_id, att.file_name as attachment_file_name, att.file_url as attachment_file_url, 
      att.file_type as attachment_file_type, att.file_size as attachment_file_size
    FROM pm_projects p
    LEFT JOIN pm_users u ON p.owner_id = u.id
    LEFT JOIN pm_task_statuses ts ON p.id = ts.project_id
    LEFT JOIN pm_tasks t ON ts.id = t.status_id
    LEFT JOIN pm_users au ON t.assignee_id = au.id
    LEFT JOIN pm_comments c ON t.id = c.task_id
    LEFT JOIN pm_attachments att ON t.id = att.task_id
    ORDER BY p.created_at DESC, ts.[order], t.created_at DESC
  `)

  // Group results by project
  const projectsMap = new Map()
  
  for (const row of projectsResult.recordset) {
    if (!projectsMap.has(row.id)) {
      projectsMap.set(row.id, {
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
          id: row.owner_id_ref,
          username: row.owner_username,
          name: row.owner_name
        },
        statuses: [],
        tasks: [],
        _count: { tasks: 0 }
      })
    }

    const project = projectsMap.get(row.id)

    // Add status if not exists
    if (row.status_id_ref && !project.statuses.find((s: any) => s.id === row.status_id_ref)) {
      project.statuses.push({
        id: row.status_id_ref,
        name: row.status_name,
        order: row.status_order
      })
    }

    // Add task if not exists
    if (row.task_id && !project.tasks.find((t: any) => t.id === row.task_id)) {
      const task = {
        id: row.task_id,
        title: row.task_title,
        description: row.task_description,
        priority: row.task_priority,
        dueDate: row.task_due_date,
        estimatedHours: row.task_estimated_hours,
        actualHours: row.task_actual_hours,
        progress: row.task_progress,
        createdAt: row.task_created_at,
        updatedAt: row.task_updated_at,
        statusId: row.task_status_id,
        assigneeId: row.task_assignee_id,
        status: project.statuses.find((s: any) => s.id === row.task_status_id) || null,
        assignee: row.assignee_id_ref ? {
          id: row.assignee_id_ref,
          username: row.assignee_username,
          name: row.assignee_name
        } : null,
        comments: [],
        attachments: []
      }
      project.tasks.push(task)
    }

    // Add comment to task
    const currentTask = project.tasks.find((t: any) => t.id === row.task_id)
    if (currentTask && row.comment_id) {
      currentTask.comments.push({
        id: row.comment_id,
        content: row.comment_content,
        createdAt: row.comment_created_at,
        userId: row.comment_user_id
      })
    }

    // Add attachment to task
    if (currentTask && row.attachment_id) {
      currentTask.attachments.push({
        id: row.attachment_id,
        fileName: row.attachment_file_name,
        fileUrl: row.attachment_file_url,
        fileType: row.attachment_file_type,
        fileSize: row.attachment_file_size
      })
    }
  }

  const projects = Array.from(projectsMap.values())

  // Calculate stats
  const serializedProjects = projects.map((project: any) => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter((t: any) => t.status?.name === 'Done').length
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      ...project,
      totalTasks,
      completedTasks,
      overallProgress
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ReportPage 
        projects={serializedProjects} 
        generatedAt={generatedAt}
      />
    </div>
  )
}
