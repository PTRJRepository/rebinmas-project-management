'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, Printer } from 'lucide-react'
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

    const handlePrint = () => {
        window.print()
    }

    // Filter tasks if filter is active
    const displayTasks = filteredTaskIds.length > 0
        ? tasks.filter(task => filteredTaskIds.includes(task.id))
        : tasks

    const [currentDate, setCurrentDate] = useState('')

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString())
    }, [])

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 flex justify-between items-center no-print-hide">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${projectId}`}>
                        <Button variant="outline" size="icon" className="print:hidden">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {project.name}
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Kanban Board</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handlePrint}
                        className="print:hidden"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Tasks
                    </Button>
                    <CreateTaskDialog projectId={projectId} statuses={project.statuses} />
                    <Link href={`/projects/${projectId}`}>
                        <Button variant="outline" className="print:hidden">
                            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Print Header (only visible when printing) */}
            <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-sm text-gray-600">Task Board - Printed on {currentDate}</p>
                <p className="text-sm text-gray-600">Total Tasks: {displayTasks.length}</p>
            </div>

            {/* Deadline Alert Bar */}
            <div className="print:hidden">
                <DeadlineAlertBar
                    tasks={displayTasks}
                    onFilterTasks={handleFilterTasks}
                />
            </div>

            {/* Filter Indicator */}
            {filteredTaskIds.length > 0 && (
                <div className="bg-amber-50 border-b border-amber-200 py-2 flex items-center justify-between print:hidden">
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
            <div className="flex-1 overflow-hidden">
                <KanbanBoard
                    initialTasks={displayTasks}
                    statuses={project.statuses || []}
                    projectId={projectId}
                />
            </div>
        </div>
    )
}
