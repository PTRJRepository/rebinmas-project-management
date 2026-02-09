
import { getTasks } from '@/app/actions/task'
import { getProject } from '@/app/actions/project'
import KanbanBoard from '@/components/KanbanBoard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { DeadlineAlertBar } from '@/components/notifications/DeadlineAlertBar'
import BoardPageClient from './BoardPageClient'

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: tasks } = await getTasks(id)
    const { data: project } = await getProject(id)

    if (!project) return <div>Project not found</div>

    return (
        <BoardPageClient
            projectId={id}
            project={project}
            tasks={tasks || []}
        />
    )
}
