
import { getProject, getProjectStats } from '@/app/actions/project'
import { getTasks } from '@/app/actions/task'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Calendar, Users, Flame, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import ProjectBoardClient from './ProjectBoardClient'

export default async function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { success, data: stats } = await getProjectStats(id)
    const { data: project } = await getProject(id)
    const { data: tasks } = await getTasks(id)

    if (!success) return <div>Error loading stats</div>
    if (!project) return <div>Project not found</div>

    // Calculate deadline info for tasks
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const overdueTasks = tasks?.filter(t => t.dueDate && new Date(t.dueDate) < today) || []
    const dueTodayTasks = tasks?.filter(t => {
        if (!t.dueDate) return false
        const dueDate = new Date(t.dueDate)
        return dueDate >= today && dueDate < tomorrow
    }) || []
    const dueThisWeekTasks = tasks?.filter(t => {
        if (!t.dueDate) return false
        const dueDate = new Date(t.dueDate)
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        return dueDate >= tomorrow && dueDate < weekFromNow
    }) || []

    const urgentTasks = [...overdueTasks, ...dueTodayTasks, ...dueThisWeekTasks].slice(0, 5)

    return (
        <ProjectBoardClient
            project={project}
            tasks={tasks || []}
            stats={stats || null}
            urgentTasks={urgentTasks}
            overdueTasks={overdueTasks}
            dueTodayTasks={dueTodayTasks}
            dueThisWeekTasks={dueThisWeekTasks}
        />
    )
}
