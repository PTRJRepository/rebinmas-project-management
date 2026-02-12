import { redirect } from 'next/navigation'
import { ReportPage } from '@/components/ReportPage'
import { getCurrentUser } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma' // Using SQLite for reports (includes complex queries)

export default async function ReportsPage() {
  const session = await getCurrentUser()
  if (!session) {
    redirect('/auth/login')
  }

  const generatedAt = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'long'
  })

  // Fetch all projects with full details: tasks, statuses, owner, assignees
  const projects: any[] = await (prisma.project as any).findMany({
    include: {
      owner: {
        select: { id: true, username: true, name: true }
      },
      statuses: {
        orderBy: { order: 'asc' }
      },
      tasks: {
        include: {
          status: true,
          assignee: {
            select: { id: true, username: true, name: true }
          },
          comments: true,
          attachments: true,
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: { tasks: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Serialize dates to ISO strings for client component
  const serializedProjects = projects.map((project: any) => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter((t: any) => t.status.name === 'Done').length
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.startDate?.toISOString() || null,
      endDate: project.endDate?.toISOString() || null,
      priority: project.priority,
      bannerImage: project.bannerImage,
      status: project.status,
      owner: project.owner,
      statuses: project.statuses.map((s: any) => ({
        id: s.id,
        name: s.name,
        order: s.order,
      })),
      _count: project._count,
      overallProgress,
      totalTasks,
      completedTasks,
      tasks: project.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        progress: task.progress,
        dueDate: task.dueDate?.toISOString() || null,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        createdAt: task.createdAt.toISOString(),
        status: {
          name: task.status.name,
          order: task.status.order,
        },
        assignee: task.assignee ? {
          username: task.assignee.username,
          name: task.assignee.name,
        } : null,
        commentsCount: task.comments.length,
        attachmentsCount: task.attachments.length,
      }))
    }
  })

  return <ReportPage projects={serializedProjects} generatedAt={generatedAt} />
}
