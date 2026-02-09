'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { DeadlineAlertBar } from '@/components/notifications/DeadlineAlertBar'
import KanbanBoard from '@/components/KanbanBoard'
import { Project, Task } from '@prisma/client'

interface BoardPageClientProps {
    projectId: string
    project: Project & { statuses: any[] }
    tasks: Task[]
}

export default function BoardPageClient({ projectId, project, tasks }: BoardPageClientProps) {
    const [filteredTaskIds, setFilteredTaskIds] = useState<string[]>([])

    const handleFilterTasks = (taskIds: string[]) => {
        setFilteredTaskIds(taskIds)
    }

    const clearFilter = () => {
        setFilteredTaskIds([])
    }

    // Filter tasks if filter is active
    const displayTasks = filteredTaskIds.length > 0
        ? tasks.filter(task => filteredTaskIds.includes(task.id))
        : tasks

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${projectId}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {project.name}
                        </h1>
                        <p className="text-sm text-gray-600">Kanban Board - Drag & drop to update status</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <CreateTaskDialog projectId={projectId} statuses={project.statuses} />
                    <Link href={`/projects/${projectId}`}>
                        <Button variant="outline">
                            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Deadline Alert Bar */}
            <DeadlineAlertBar
                tasks={displayTasks}
                onFilterTasks={handleFilterTasks}
            />

            {/* Filter Indicator */}
            {filteredTaskIds.length > 0 && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between">
                    <span className="text-sm text-amber-800">
                        Showing {filteredTaskIds.length} urgent task{filteredTaskIds.length !== 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={clearFilter}
                        className="text-sm text-amber-700 hover:text-amber-900 font-medium"
                    >
                        Clear Filter
                    </button>
                </div>
            )}

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <KanbanBoard
                    initialTasks={displayTasks}
                    statuses={project.statuses || []}
                    projectId={projectId}
                />
            </div>
        </div>
    )
}
