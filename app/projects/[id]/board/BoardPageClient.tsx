'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, Printer } from 'lucide-react'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { DeadlineAlertBar } from '@/components/notifications/DeadlineAlertBar'
import KanbanBoard from '@/components/KanbanBoard'
import { ProjectPrintPreview } from '@/components/task/ProjectPrintPreview'
import { Project, Task } from '@prisma/client'

interface BoardPageClientProps {
    projectId: string
    project: Project & { statuses: any[] }
    tasks: Task[]
}

export default function BoardPageClient({ projectId, project, tasks }: BoardPageClientProps) {
    const [filteredTaskIds, setFilteredTaskIds] = useState<string[]>([])
    const [showPrintPreview, setShowPrintPreview] = useState(false)

    const handleFilterTasks = (taskIds: string[]) => {
        setFilteredTaskIds(taskIds)
    }

    const clearFilter = () => {
        setFilteredTaskIds([])
    }

    const handlePrint = () => {
        setShowPrintPreview(true)
    }

    // Filter tasks if filter is active
    const displayTasks = filteredTaskIds.length > 0
        ? tasks.filter(task => filteredTaskIds.includes(task.id))
        : tasks

    return (
        <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-md border-b border-white/5 py-4 px-6 flex justify-between items-center no-print-hide">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${projectId}`}>
                        <Button variant="outline" size="icon" className="print:hidden border-white/10 hover:bg-white/5 text-slate-400">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            {project.name}
                        </h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kanban Board</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handlePrint}
                        className="print:hidden border-white/10 hover:bg-white/5 text-slate-300"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Tasks
                    </Button>
                    <CreateTaskDialog projectId={projectId} statuses={project.statuses} />
                    <Link href={`/projects/${projectId}`}>
                        <Button variant="outline" className="print:hidden border-white/10 hover:bg-white/5 text-slate-300">
                            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Deadline Alert Bar */}
            <div className="print:hidden">
                <DeadlineAlertBar
                    tasks={displayTasks as any}
                    onFilterTasks={handleFilterTasks}
                />
            </div>

            {/* Filter Indicator */}
            {filteredTaskIds.length > 0 && (
                <div className="bg-sky-500/10 border-b border-sky-500/20 py-2 px-6 flex items-center justify-between print:hidden">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
                        Showing {filteredTaskIds.length} urgent task{filteredTaskIds.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilter}
                        className="h-6 text-[10px] font-black text-sky-400 hover:text-white hover:bg-sky-500/20"
                    >
                        CLEAR FILTER
                    </Button>
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

            {/* Print Preview Modal */}
            {showPrintPreview && (
                <ProjectPrintPreview
                    tasks={displayTasks}
                    projectName={project.name}
                    projectId={projectId}
                    statuses={project.statuses || []}
                    onClose={() => setShowPrintPreview(false)}
                />
            )}
        </div>
    )
}
