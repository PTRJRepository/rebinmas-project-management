import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { sqlGateway } from '@/lib/api/sql-gateway'
import TeamOverviewClient from './TeamOverviewClient'

export default async function TeamOverviewPage() {
  const session = await getSession()

  // Only MANAGERS, ADMINS, and SUPER_ADMINS can access
  if (!session || !['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
    redirect('/projects')
  }

  // Fetch all users with their project and task statistics
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
      COUNT(DISTINCT t.id) as taskCount,
      COUNT(DISTINCT CASE WHEN t.status_id IN (SELECT id FROM pm_task_statuses WHERE name = 'Done') THEN t.id END) as completedTaskCount
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
      u.name ASC
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
    taskCount: u.taskCount || 0,
    completedTaskCount: u.completedTaskCount || 0
  }))

  // Fetch projects grouped by owner
  const projectsByOwnerResult = await sqlGateway.query(`
    SELECT
      u.id as owner_id,
      u.name as owner_name,
      u.username as owner_username,
      p.id as project_id,
      p.name as project_name,
      p.description as project_description,
      p.priority as project_priority,
      p.status as project_status,
      p.start_date as project_start_date,
      p.end_date as project_end_date,
      p.created_at as project_created_at,
      COUNT(t.id) as task_count,
      COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as completed_task_count
    FROM pm_users u
    LEFT JOIN pm_projects p ON u.id = p.owner_id
    LEFT JOIN pm_tasks t ON p.id = t.project_id
    LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
    GROUP BY u.id, u.name, u.username, p.id, p.name, p.description, p.priority, p.status, p.start_date, p.end_date, p.created_at
    ORDER BY u.name ASC, p.created_at DESC
  `)

  // Group projects by owner
  const projectsByOwner: Record<string, any> = {}
  projectsByOwnerResult.recordset.forEach((row: any) => {
    const ownerId = row.owner_id
    if (!projectsByOwner[ownerId]) {
      projectsByOwner[ownerId] = {
        owner: {
          id: row.owner_id,
          name: row.owner_name,
          username: row.owner_username
        },
        projects: []
      }
    }
    
    if (row.project_id) {
      projectsByOwner[ownerId].projects.push({
        id: row.project_id,
        name: row.project_name,
        description: row.project_description,
        priority: row.project_priority,
        status: row.project_status,
        startDate: row.project_start_date,
        endDate: row.project_end_date,
        createdAt: row.project_created_at,
        taskCount: row.task_count || 0,
        completedTaskCount: row.completed_task_count || 0
      })
    }
  })

  // Convert to array and sort by owner name
  const groupedData = Object.values(projectsByOwner).map((item: any) => ({
    owner: item.owner,
    projects: item.projects,
    totalProjects: item.projects.length,
    totalTasks: item.projects.reduce((sum: number, p: any) => sum + p.taskCount, 0),
    totalCompletedTasks: item.projects.reduce((sum: number, p: any) => sum + p.completedTaskCount, 0)
  }))

  // Calculate summary stats
  const totalUsers = users.length
  const totalOwners = groupedData.length
  const totalProjects = groupedData.reduce((sum: number, o: any) => sum + o.totalProjects, 0)
  const totalTasks = groupedData.reduce((sum: number, o: any) => sum + o.totalTasks, 0)

  return <TeamOverviewClient
    currentUser={session}
    users={users}
    groupedData={groupedData}
    stats={{
      totalUsers,
      totalOwners,
      totalProjects,
      totalTasks
    }}
  />
}
