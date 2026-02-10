'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Calendar, Users, Flame, Printer, Settings, KanbanSquare, PenTool, Edit, X, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'
import KanbanBoard from '@/components/KanbanBoard'
import { CanvasBoard } from '@/components/CanvasBoard'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type ViewState = 'overview' | 'simple' | 'canvas' | 'details'

interface Project {
  id: string
  name: string
  description: string | null
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  owner: {
    id: string
    username: string
  }
  statuses: any[]
  priority?: string
}

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  statusId: string
  dueDate: Date | null
  estimatedHours?: number | null
  progress?: number | null
  assignee?: {
    id: string
    username: string
    avatarUrl?: string | null
  } | null
}

interface Stats {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  progress: number
}

interface ProjectBoardClientProps {
  project: Project & { statuses: any[] }
  tasks: Task[]
  stats: Stats | null
  urgentTasks: Task[]
  overdueTasks: Task[]
  dueTodayTasks: Task[]
  dueThisWeekTasks: Task[]
}

export default function ProjectBoardClient({
  project,
  tasks,
  stats,
  urgentTasks,
  overdueTasks,
  dueTodayTasks,
  dueThisWeekTasks
}: ProjectBoardClientProps) {
  const [viewState, setViewState] = useState<ViewState>('overview')
  const [filteredTaskIds, setFilteredTaskIds] = useState<string[]>([])
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: project.name,
    description: project.description || '',
    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    priority: project.priority || 'MEDIUM'
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleFilterTasks = (taskIds: string[]) => {
    setFilteredTaskIds(taskIds)
  }

  const clearFilter = () => {
    setFilteredTaskIds([])
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSaveProject = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (res.ok) {
        setEditDialogOpen(false)
        window.location.reload() // Refresh to get updated data
      } else {
        console.error('Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Filter tasks if filter is active
  const displayTasks = filteredTaskIds.length > 0
    ? tasks.filter(task => filteredTaskIds.includes(task.id))
    : tasks

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Calculate deadline info for the project
  const getProjectDeadlineInfo = () => {
    if (!project.endDate) return null

    const endDate = new Date(project.endDate)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24))

    if (diffDays < 0) {
      return {
        status: 'overdue',
        days: Math.abs(diffDays),
        text: `${Math.abs(diffDays)} hari overdue`,
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700'
      }
    } else if (diffDays === 0) {
      return {
        status: 'today',
        days: 0,
        text: 'DEADLINE HARI INI!',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700'
      }
    } else if (diffDays === 1) {
      return {
        status: 'tomorrow',
        days: 1,
        text: 'Deadline Besok',
        color: 'amber',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700'
      }
    } else if (diffDays <= 7) {
      return {
        status: 'thisWeek',
        days: diffDays,
        text: `${diffDays} hari lagi`,
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700'
      }
    } else {
      return {
        status: 'normal',
        days: diffDays,
        text: `${diffDays} hari lagi`,
        color: 'gray',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-700'
      }
    }
  }

  const deadlineInfo = getProjectDeadlineInfo()

  // Fullscreen canvas view
  if (isCanvasFullscreen) {
    return (
      <div className="h-screen w-screen">
        <CanvasBoard
          projectId={project.id}
          projectName={project.name}
          tasks={tasks}
        />
        <button
          onClick={() => setIsCanvasFullscreen(false)}
          className="fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {project.name}
              </h1>
              <p className="text-sm text-gray-600">Project Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewState('overview')}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  viewState === 'overview'
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <KanbanSquare className="w-4 h-4 mr-1.5" />
                Board
              </button>
              <button
                onClick={() => setViewState('simple')}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  viewState === 'simple'
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <ListTodo className="w-4 h-4 mr-1.5" />
                Simple
              </button>
              <button
                onClick={() => setIsCanvasFullscreen(true)}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  viewState === 'canvas'
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <PenTool className="w-4 h-4 mr-1.5" />
                Canvas
              </button>
              <button
                onClick={() => setEditDialogOpen(true)}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  "text-gray-500 hover:text-gray-700"
                )}
              >
                <Edit className="w-4 h-4 mr-1.5" />
                Edit
              </button>
            </div>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="print:hidden"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <CreateTaskDialog projectId={project.id} statuses={project.statuses} />
          </div>
        </div>
      </div>

      {/* Project Deadline Banner */}
      {deadlineInfo && (
        <div className={cn(
          "mx-6 mt-6 px-6 py-4 rounded-xl flex items-center justify-between",
          deadlineInfo.bgColor,
          deadlineInfo.borderColor && `border-2 ${deadlineInfo.borderColor}`
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-full",
              deadlineInfo.color === 'red' ? "bg-red-100" :
                deadlineInfo.color === 'amber' ? "bg-amber-100" :
                  deadlineInfo.color === 'blue' ? "bg-blue-100" : "bg-gray-100"
            )}>
              <Clock className={cn(
                "w-6 h-6",
                deadlineInfo.textColor
              )} />
            </div>
            <div>
              <p className={cn("text-sm font-medium mb-1", deadlineInfo.textColor)}>
                {deadlineInfo.status === 'overdue' && '⚠️ PROJECT OVERDUE'}
                {deadlineInfo.status === 'today' && '🔴 DEADLINE HARI INI'}
                {deadlineInfo.status === 'tomorrow' && '🟠 Deadline Besok'}
                {deadlineInfo.status === 'thisWeek' && '📅 Deadline Minggu Ini'}
                {deadlineInfo.status === 'normal' && '📅 Deadline Project'}
              </p>
              <p className={cn("text-2xl font-bold", deadlineInfo.textColor)}>
                {project.endDate && new Date(project.endDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className={cn(
            "text-right",
            deadlineInfo.color === 'red' || deadlineInfo.color === 'amber' ? "flex items-center gap-2" : ""
          )}>
            {(deadlineInfo.color === 'red' || deadlineInfo.color === 'amber') && (
              <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-full", deadlineInfo.textColor)}>
                {deadlineInfo.text}
              </span>
            )}
            <Button
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className={cn(
                "shadow-sm",
                deadlineInfo.color === 'red' ? "bg-red-600 hover:bg-red-700 text-white" :
                  deadlineInfo.color === 'amber' ? "bg-amber-600 hover:bg-amber-700 text-white" :
                  "bg-white border-gray-300 hover:bg-gray-50"
              )}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Project
            </Button>
          </div>
        </div>
      )}

      <main className="px-6 py-6">
        {/* Stats Cards - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Overdue Tasks */}
          <Card className={cn(
            "border-2 shadow-sm",
            overdueTasks.length > 0 ? "border-red-300 bg-red-50/50" : "border-gray-200"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overdue</p>
                  <p className={cn(
                    "text-2xl font-semibold",
                    overdueTasks.length > 0 ? "text-red-600" : "text-gray-900"
                  )}>{overdueTasks.length}</p>
                </div>
                <div className={cn(
                  "h-10 w-10 rounded flex items-center justify-center",
                  overdueTasks.length > 0 ? "bg-red-100" : "bg-gray-100"
                )}>
                  <AlertCircle className={cn(
                    "h-5 w-5",
                    overdueTasks.length > 0 ? "text-red-600" : "text-gray-400"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Due Today */}
          <Card className={cn(
            "border-2 shadow-sm",
            dueTodayTasks.length > 0 ? "border-amber-300 bg-amber-50/50" : "border-gray-200"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Due Today</p>
                  <p className={cn(
                    "text-2xl font-semibold",
                    dueTodayTasks.length > 0 ? "text-amber-600" : "text-gray-900"
                  )}>{dueTodayTasks.length}</p>
                </div>
                <div className={cn(
                  "h-10 w-10 rounded flex items-center justify-center",
                  dueTodayTasks.length > 0 ? "bg-amber-100" : "bg-gray-100"
                )}>
                  <Flame className={cn(
                    "h-5 w-5",
                    dueTodayTasks.length > 0 ? "text-amber-600" : "text-gray-400"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Due This Week */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Due This Week</p>
                  <p className="text-2xl font-semibold text-gray-900">{dueThisWeekTasks.length}</p>
                </div>
                <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.progress || 0}%</p>
                </div>
                <div className="h-10 w-10 rounded bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-600 h-1.5 rounded-full"
                  style={{ width: `${stats?.progress || 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Tasks List */}
        {urgentTasks.length > 0 && (
          <Card className="border border-gray-200 shadow-sm mb-6">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Urgent Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {urgentTasks.map((task) => {
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null
                  const isOverdue = dueDate && dueDate < today
                  const isDueToday = dueDate && dueDate >= today && dueDate < tomorrow

                  return (
                    <Link
                      key={task.id}
                      href={`/projects/${project.id}/board/${task.id}`}
                      className="block"
                    >
                      <div className={cn(
                        "p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                        isOverdue && "bg-red-50 border-red-200 hover:bg-red-100",
                        isDueToday && !isOverdue && "bg-amber-50 border-amber-200 hover:bg-amber-100",
                        !isOverdue && !isDueToday && "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      )}>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-gray-900 text-sm truncate flex-1">{task.title}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium shrink-0",
                            task.priority === 'CRITICAL' || task.priority === 'HIGH'
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          )}>
                            {task.priority}
                          </span>
                        </div>
                        {dueDate && (
                          <div className="flex items-center gap-1 mt-2 text-xs">
                            <Calendar className="w-3 h-3" />
                            <span className={cn(
                              "font-medium",
                              isOverdue ? "text-red-600" : "text-amber-600"
                            )}>
                              {isOverdue
                                ? `Overdue ${Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))}d`
                                : dueDate.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Indicator */}
        {filteredTaskIds.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 mb-4 flex items-center justify-between rounded-lg">
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

        {/* Simple View - Rencana / Sekarang / Selesai */}
        {viewState === 'simple' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Project Timeline</h2>
              <p className="text-sm text-gray-600">Rencana → Sekarang → Selesai</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rencana (Planned) */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      Rencana
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {displayTasks.filter(t => {
                          const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                          return statusName === 'Backlog' || statusName === 'To Do'
                        }).length}
                      </span>
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {displayTasks.filter(t => {
                      const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                      return statusName === 'Backlog' || statusName === 'To Do'
                    }).map(task => (
                      <Link
                        key={task.id}
                        href={`/projects/${project.id}/board/${task.id}`}
                        className="block"
                      >
                        <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium shrink-0",
                              task.priority === 'CRITICAL' ? "bg-red-100 text-red-700" :
                                task.priority === 'HIGH' ? "bg-orange-100 text-orange-700" :
                                  task.priority === 'MEDIUM' ? "bg-yellow-100 text-yellow-700" :
                                    "bg-green-100 text-green-700"
                            )}>
                              {task.priority}
                            </span>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                    {displayTasks.filter(t => {
                      const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                      return statusName === 'Backlog' || statusName === 'To Do'
                    }).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Tidak ada tugas terencana</p>
                    )}
                  </div>
                </div>

                {/* Sekarang (Current/In Progress) */}
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                      Sekarang
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        {displayTasks.filter(t => {
                          const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                          return statusName === 'In Progress' || statusName === 'Review'
                        }).length}
                      </span>
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {displayTasks.filter(t => {
                      const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                      return statusName === 'In Progress' || statusName === 'Review'
                    }).map(task => (
                      <Link
                        key={task.id}
                        href={`/projects/${project.id}/board/${task.id}`}
                        className="block"
                      >
                        <div className="bg-white p-3 rounded-lg border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium shrink-0",
                              task.priority === 'CRITICAL' ? "bg-red-100 text-red-700" :
                                task.priority === 'HIGH' ? "bg-orange-100 text-orange-700" :
                                  task.priority === 'MEDIUM' ? "bg-yellow-100 text-yellow-700" :
                                    "bg-green-100 text-green-700"
                            )}>
                              {task.priority}
                            </span>
                          </div>
                          {task.dueDate && (
                            <div className={cn(
                              "flex items-center gap-1 mt-2 text-xs",
                              new Date(task.dueDate) < today ? "text-red-600" : "text-gray-500"
                            )}>
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              {new Date(task.dueDate) < today && " ⚠️"}
                            </div>
                          )}
                          {task.assignee && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <Users className="w-3 h-3" />
                              {task.assignee.username}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                    {displayTasks.filter(t => {
                      const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                      return statusName === 'In Progress' || statusName === 'Review'
                    }).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Tidak ada tugas aktif</p>
                    )}
                  </div>
                </div>

                {/* Selesai (Completed) */}
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      Selesai
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {displayTasks.filter(t => {
                          const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                          return statusName === 'Done'
                        }).length}
                      </span>
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {displayTasks.filter(t => {
                      const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                      return statusName === 'Done'
                    }).map(task => (
                      <Link
                        key={task.id}
                        href={`/projects/${project.id}/board/${task.id}`}
                        className="block"
                      >
                        <div className="bg-white p-3 rounded-lg border border-green-200 hover:border-green-300 hover:shadow-sm transition-all cursor-pointer opacity-75">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-gray-900 text-sm line-through">{task.title}</h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium shrink-0",
                              task.priority === 'CRITICAL' ? "bg-red-100 text-red-700" :
                                task.priority === 'HIGH' ? "bg-orange-100 text-orange-700" :
                                  task.priority === 'MEDIUM' ? "bg-yellow-100 text-yellow-700" :
                                    "bg-green-100 text-green-700"
                            )}>
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Selesai
                          </div>
                        </div>
                      </Link>
                    ))}
                    {displayTasks.filter(t => {
                      const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                      return statusName === 'Done'
                    }).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Belum ada tugas selesai</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        {viewState === 'overview' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Kanban Board</h2>
              <p className="text-sm text-gray-600">Drag & drop tasks to update status</p>
            </div>
            <div className="p-6">
              <KanbanBoard
                initialTasks={displayTasks}
                statuses={project.statuses || []}
                projectId={project.id}
              />
            </div>
          </div>
        )}

        {/* Project Details */}
        <Card className="border border-gray-200 shadow-sm mt-6">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Owner</p>
                  <p className="text-base font-semibold text-gray-900">{project?.owner?.username || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Created Date</p>
                  <p className="text-base font-semibold text-gray-900">
                    {project?.createdAt ? new Date(project.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </p>
                </div>
              </div>
              {project?.endDate && (
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Project Deadline</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(project.endDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {project?.description && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
                <p className="text-sm text-gray-700">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) {
          // Reset form to original values
          setEditForm({
            name: project.name,
            description: project.description || '',
            startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
            endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
            priority: project.priority || 'MEDIUM'
          })
        }
      }}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProject} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="What is this project about?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Deadline)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
