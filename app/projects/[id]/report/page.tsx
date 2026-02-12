import { notFound, redirect } from 'next/navigation'
import { ProjectReportPage } from '@/components/ProjectReportPage'
import { getProjectById } from '@/lib/api/projects'
import { getCurrentUser } from '@/app/actions/auth'
import { getTasks } from '@/app/actions/task'

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getCurrentUser()
  if (!session) {
    redirect('/auth/login')
  }

  const { id } = await params
  const project = await getProjectById(id)

  if (!project) {
    notFound()
  }

  const { data: tasks } = await getTasks(id)

  const generatedAt = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'long'
  })

  const formattedTasks = tasks?.map(task => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  })) || []

  const formattedProject = {
    id: project.id,
    name: project.name,
    description: project.description,
    priority: (project as any).priority,
    bannerImage: (project as any).bannerImage,
    owner: project.owner || { username: 'Unknown' },
    statuses: (project as any).statuses,
    startDate: project.startDate ? project.startDate.toISOString() : null,
    endDate: project.endDate ? project.endDate.toISOString() : null,
    tasks: formattedTasks
  }

  return (
    <ProjectReportPage
      project={formattedProject as any}
      generatedAt={generatedAt}
    />
  )
}
