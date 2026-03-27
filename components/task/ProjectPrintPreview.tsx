import React from 'react'
import { Printer, X, Calendar, User, Flag, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPriorityColor, getPriorityIcon } from '@/components/KanbanTask'

interface Task {
    id: string
    title: string
    description?: string | null
    priority: string
    statusId: string
    dueDate: Date | null
    estimatedHours?: number | null
    completedAt?: Date | null
    assignee?: {
        id: string
        username: string
        name: string
        avatarUrl?: string | null
    } | null
}

interface Status {
    id: string
    name: string
    order: number
}

interface ProjectPrintPreviewProps {
    tasks: Task[]
    projectName: string
    projectId: string
    statuses: Status[]
    onClose: () => void
}

export function ProjectPrintPreview({ tasks, projectName, projectId, statuses, onClose }: ProjectPrintPreviewProps) {
    if (!tasks || tasks.length === 0) return null

    // Group tasks by status
    const tasksByStatus = statuses.reduce((acc, status) => {
        acc[status.id] = {
            ...status,
            tasks: tasks.filter(t => t.statusId === status.id)
        }
        return acc
    }, {} as Record<string, { id: string; name: string; order: number; tasks: Task[] }>)

    // Get status color classes
    const getStatusBadgeClass = (index: number, total: number) => {
        if (index === 0) return 'bg-gray-100 text-gray-700 border-gray-300'
        if (index === total - 1) return 'bg-green-100 text-green-700 border-green-300'
        if (index === total - 2) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
        return 'bg-blue-100 text-blue-700 border-blue-300'
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 text-black overflow-y-auto pb-20">
            <style type="text/css" media="print">
                {`
                    @page { size: A4 portrait; margin: 15mm; }
                    body { background: white !important; }
                    .page-break { page-break-after: always; }
                `}
            </style>

            {/* Non-printable Action Bar */}
            <div className="print:hidden sticky top-0 left-0 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-cyan-500/30 p-4 flex items-center justify-between shadow-2xl z-50">
                <div className="flex items-center gap-4 text-white">
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 text-slate-300">
                        <X className="w-6 h-6" />
                    </Button>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">Project Task List</h2>
                        <p className="text-xs text-slate-400">{projectName} • {tasks.length} Tasks</p>
                    </div>
                </div>
                <Button
                    onClick={() => window.print()}
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-bold gap-2 shadow-lg shadow-cyan-900/50"
                >
                    <Printer className="w-5 h-5" />
                    Print Project
                </Button>
            </div>

            {/* Printable Container */}
            <div className="pt-8 print:p-0 max-w-4xl mx-auto px-6">
                {/* Document Header */}
                <div className="bg-white shadow-xl border-2 border-slate-800 rounded-2xl p-8 mb-8 page-break print:shadow-none print:border-2 print:rounded-none print:mb-6">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-8 pb-6 border-b-4 border-slate-800">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
                                <span className="text-xs font-black text-cyan-600 uppercase tracking-widest">Project Task List</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{projectName}</h1>
                            <p className="text-sm font-medium text-slate-500 mt-2">
                                Generated on {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="bg-slate-900 text-white px-4 py-2 rounded-lg">
                                <p className="text-xs font-bold text-slate-400 uppercase">Total Tasks</p>
                                <p className="text-2xl font-black">{tasks.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4 text-center">
                            <p className="text-xs font-black text-red-500 uppercase">Critical</p>
                            <p className="text-2xl font-black text-red-600">{tasks.filter(t => t.priority === 'CRITICAL').length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-4 text-center">
                            <p className="text-xs font-black text-orange-500 uppercase">High</p>
                            <p className="text-2xl font-black text-orange-600">{tasks.filter(t => t.priority === 'HIGH').length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 text-center">
                            <p className="text-xs font-black text-blue-500 uppercase">Medium</p>
                            <p className="text-2xl font-black text-blue-600">{tasks.filter(t => t.priority === 'MEDIUM').length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-4 text-center">
                            <p className="text-xs font-black text-slate-500 uppercase">Low</p>
                            <p className="text-2xl font-black text-slate-600">{tasks.filter(t => t.priority === 'LOW').length}</p>
                        </div>
                    </div>
                </div>

                {/* Task List by Status */}
                {statuses.map((status, statusIndex) => {
                    const statusData = tasksByStatus[status.id]
                    if (!statusData || statusData.tasks.length === 0) return null

                    return (
                        <div key={status.id} className="bg-white shadow-xl border-2 border-slate-800 rounded-2xl p-6 mb-6 page-break print:shadow-none print:border print:rounded-none print:mb-4">
                            {/* Status Header */}
                            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${statusIndex === 0 ? 'bg-gray-400' : statusIndex === statuses.length - 1 ? 'bg-green-500' : statusIndex === statuses.length - 2 ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">{status.name}</h2>
                                </div>
                                <span className={`text-xs font-black px-3 py-1 rounded-full border-2 ${getStatusBadgeClass(statusIndex, statuses.length)}`}>
                                    {statusData.tasks.length} Tasks
                                </span>
                            </div>

                            {/* Task List */}
                            <div className="space-y-3">
                                {statusData.tasks.map((task, taskIndex) => (
                                    <div
                                        key={task.id}
                                        className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Task Number */}
                                            <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200">
                                                <span className="text-xs font-black text-slate-600">{taskIndex + 1}</span>
                                            </div>

                                            {/* Task Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <h3 className="font-bold text-slate-900 leading-tight">{task.title}</h3>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                                                            {getPriorityIcon(task.priority)}
                                                            <span className="ml-1">{task.priority}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Task Meta */}
                                                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                                    {task.dueDate && (
                                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span className="font-medium">{new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                    )}
                                                    {task.estimatedHours && (
                                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                                            <span className="font-medium">{task.estimatedHours}h estimated</span>
                                                        </div>
                                                    )}
                                                    {task.assignee && (
                                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                                            <User className="w-3.5 h-3.5" />
                                                            <span className="font-medium">{task.assignee.name}</span>
                                                        </div>
                                                    )}
                                                    {task.completedAt && (
                                                        <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded border border-green-200 text-green-600">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span className="font-medium">Completed</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {/* Footer */}
                <div className="text-center py-6 text-xs text-slate-400 print:hidden">
                    <p>Generated by Rebinmas Schedule Tracker</p>
                </div>
            </div>
        </div>
    )
}
