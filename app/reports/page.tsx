import { redirect } from 'next/navigation'
import { ReportPage } from '@/components/ReportPage'
import { getProjects } from '@/lib/api/projects'
import { getCurrentUser } from '@/app/actions/auth'
import { getTasks } from '@/app/actions/task'

export default async function ReportsPage() {
  const session = await getCurrentUser()
  if (!session) {
    redirect('/auth/login')
  }

  const projects = await getProjects()
  const generatedAt = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'long'
  })

  // Fetch tasks for each project
  const projectsWithTasks = await Promise.all(
    projects.map(async (project) => {
      const tasksData = await getTasks(project.id)
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        startDate: project.startDate?.toISOString() || null,
        endDate: project.endDate?.toISOString() || null,
        priority: (project as any).priority,
        bannerImage: (project as any).bannerImage,
        _count: (project as any)._count,
        tasks: (tasksData.data || []).map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate?.toISOString() || null,
          assignee: task.assignee,
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours
        }))
      }
    })
  )

  return <ReportPage projects={projectsWithTasks} generatedAt={generatedAt} />
}
