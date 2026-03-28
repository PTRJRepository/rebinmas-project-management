'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Calendar, Users, Flame, Printer, Settings, KanbanSquare, PenTool, Edit, X, ListTodo, Loader2, Paperclip, GitGraph } from 'lucide-react'
import { cn } from '@/lib/utils'
import KanbanBoard from '@/components/KanbanBoard'
import { CanvasBoard } from '@/components/CanvasBoard'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { ProjectMembersDialog } from '@/components/project/ProjectMembersDialog'
import { ProjectAttachments } from '@/components/project/ProjectAttachments'
import { ProjectDocs } from '@/components/project/ProjectDocs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ProjectReportPage } from '@/components/ProjectReportPage'
import { ProjectGraph } from '@/components/ProjectGraph'

type ViewState = 'overview' | 'simple' | 'assets' | 'canvas' | 'details' | 'graph'

interface Project {
  id: string
  name: string
  description: string | null
  startDate: Date | null
  endDate: Date | null
  bannerImage: string | null
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
    name: string
    avatarUrl?: string | null
  } | null
}

interface Stats {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  progress: number
  totalHoursSpent?: number
  totalAttachments?: number
  recentActivities?: Array<{
    id: string
    type: string
    content: string
    date: Date
    userName: string
    statusName?: string
  }>
}

interface ProjectBoardClientProps {
  project: Project & { statuses: any[] }
  tasks: Task[]
  stats: Stats | null
  urgentTasks: Task[]
  overdueTasks: Task[]
  dueTodayTasks: Task[]
  dueThisWeekTasks: Task[]
  currentUserId: string
  currentUserRole?: string
  users?: Array<{ id: string; username: string; name: string; email: string }>
}

export default function ProjectBoardClient({
  project,
  tasks,
  stats,
  urgentTasks,
  overdueTasks,
  dueTodayTasks,
  dueThisWeekTasks,
  currentUserId,
  currentUserRole,
  users = []
}: ProjectBoardClientProps) {
  const router = useRouter()
  const [viewState, setViewState] = useState<ViewState>('overview')
  const [activeSection, setActiveSection] = useState<'tasks' | 'assets' | 'details'>('tasks')
  const [filteredTaskIds, setFilteredTaskIds] = useState<string[]>([])
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [editForm, setEditForm] = useState({
    name: project.name,
    description: project.description || '',
    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    priority: project.priority || 'MEDIUM',
    bannerImage: project.bannerImage || ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [taskList, setTaskList] = useState<Task[]>(tasks)

  // Update taskList when tasks prop changes
  useEffect(() => {
    setTaskList(tasks)
  }, [tasks])

  // ScrollSpy Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id.replace('section-', '')
          setActiveSection(sectionId as any)
        }
      })
    }, { threshold: 0.2, rootMargin: '-10% 0px -50% 0px' })

    const sections = document.querySelectorAll('div[id^="section-"]')
    sections.forEach(section => observer.observe(section))

    return () => sections.forEach(section => observer.unobserve(section))
  }, [])

  const handleFilterTasks = (taskIds: string[]) => {
    setFilteredTaskIds(taskIds)
  }

  const handleTaskCreated = (newTask: Task) => {
    console.log('[ProjectBoardClient] Task created, adding to list:', newTask)
    setTaskList(prev => [newTask, ...prev])
  }

  const handleMoveToNext = async (taskId: string) => {
    console.log('[ProjectBoardClient] Moving task:', taskId);
    // The KanbanBoard will handle the optimistic update
    // We just need to trigger a refresh after the move
    router.refresh();
  }

  const clearFilter = () => {
    setFilteredTaskIds([])
  }

  const handlePrint = () => {
    setShowPrintPreview(true)
  }

  const handleSaveProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        textColor: 'text-red-400'
      }
    } else if (diffDays === 0) {
      return {
        status: 'today',
        days: 0,
        text: 'DEADLINE HARI INI!',
        color: 'red',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        textColor: 'text-red-400'
      }
    } else if (diffDays === 1) {
      return {
        status: 'tomorrow',
        days: 1,
        text: 'Deadline Besok',
        color: 'amber',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        textColor: 'text-amber-400'
      }
    } else if (diffDays <= 7) {
      return {
        status: 'thisWeek',
        days: diffDays,
        text: `${diffDays} hari lagi`,
        color: 'blue',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        textColor: 'text-blue-400'
      }
    } else {
      return {
        status: 'normal',
        days: diffDays,
        text: `${diffDays} hari lagi`,
        color: 'gray',
        bgColor: 'bg-slate-800/40',
        borderColor: 'border-white/5',
        textColor: 'text-slate-400'
      }
    }
  }

  const deadlineInfo = getProjectDeadlineInfo()

  // Fullscreen canvas view
  if (isCanvasFullscreen) {
    return (
      <div className="h-screen w-screen bg-slate-950">
        <CanvasBoard
          projectId={project.id}
          projectName={project.name}
          tasks={tasks}
        />
        <button
          onClick={() => setIsCanvasFullscreen(false)}
          className="fixed top-4 left-4 z-50 bg-slate-900/80 backdrop-blur-md p-2 rounded-lg shadow-lg hover:bg-slate-800 border border-white/10 text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className={cn(showPrintPreview ? "print:hidden" : "")}>
      {/* Page Header */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="outline" size="icon" className="border-white/10 hover:bg-white/5 text-slate-400">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {project.name}
              </h1>
              <p className="text-sm text-slate-500 font-medium">Project Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="inline-flex items-center bg-slate-800/50 rounded-lg p-1 gap-1 border border-white/5">
              <button
                onClick={() => {
                  setViewState('overview')
                  document.getElementById('section-tasks')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                  activeSection === 'tasks' && viewState === 'overview'
                    ? "bg-sky-500/20 text-sky-400 shadow-lg shadow-sky-500/10"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <KanbanSquare className="w-3.5 h-3.5" />
                BOARD
              </button>
              <button
                onClick={() => {
                  setViewState('simple')
                  document.getElementById('section-tasks')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                  activeSection === 'tasks' && viewState === 'simple'
                    ? "bg-sky-500/20 text-sky-400 shadow-lg shadow-sky-500/10"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <ListTodo className="w-3.5 h-3.5" />
                SIMPLE
              </button>
              <button
                onClick={() => {
                  document.getElementById('section-assets')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                  activeSection === 'assets'
                    ? "bg-sky-500/20 text-sky-400 shadow-lg shadow-sky-500/10"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Paperclip className="w-3.5 h-3.5" />
                ASSETS
              </button>
              <button
                onClick={() => setIsCanvasFullscreen(true)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                  "text-slate-500 hover:text-slate-300"
                )}
              >
                <PenTool className="w-3.5 h-3.5" />
                CANVAS
              </button>
              <button
                onClick={() => {
                  setViewState('graph')
                  document.getElementById('section-graph')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                  viewState === 'graph'
                    ? "bg-sky-500/20 text-sky-400 shadow-lg shadow-sky-500/10"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <GitGraph className="w-3.5 h-3.5" />
                GRAPH
              </button>
              <button
                onClick={() => setEditDialogOpen(true)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                  "text-slate-500 hover:text-slate-300"
                )}
              >
                <Edit className="w-3.5 h-3.5" />
                EDIT
              </button>
            </div>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="print:hidden border-white/10 hover:bg-white/5 text-slate-300"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
            <ProjectMembersDialog
              projectId={project.id}
              projectName={project.name}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
            <CreateTaskDialog
              projectId={project.id}
              statuses={project.statuses}
              users={users}
              onTaskCreated={handleTaskCreated}
            />
          </div>
        </div>
      </div>

      {/* Project Banner Image */}
      <div className="relative h-56 overflow-hidden bg-slate-950">
        <img
          src={project.bannerImage || 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&q=80&w=2000'}
          alt={project.name}
          className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&q=80&w=2000';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40"></div>
        <div className="absolute bottom-8 left-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-3">
             <Badge variant="outline" className={cn(
               "font-bold px-3 py-1",
               project.priority === 'CRITICAL' ? "bg-red-500/20 text-red-400 border-red-500/30" :
               project.priority === 'HIGH' ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
               project.priority === 'MEDIUM' ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
               "bg-green-500/20 text-green-400 border-green-500/30"
             )}>
               {project.priority || 'MEDIUM'}
             </Badge>
             <div className="h-4 w-[1px] bg-white/20" />
             <span className="text-slate-400 text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
               <Users className="w-3.5 h-3.5" />
               {project.owner?.username}
             </span>
             <div className="h-4 w-[1px] bg-white/20" />
             <span className="text-slate-400 text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
               <Paperclip className="w-3.5 h-3.5 text-sky-400" />
               {stats?.totalAttachments || 0} Assets
             </span>
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-2">{project.name}</h2>
          {project.description && (
            <p className="text-slate-300 text-base font-medium max-w-2xl line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>

      {/* Project Deadline Banner */}
      {deadlineInfo && (
        <div className={cn(
          "mx-6 mt-8 p-6 rounded-2xl flex items-center justify-between border backdrop-blur-sm",
          deadlineInfo.status === 'overdue' ? "bg-red-500/10 border-red-500/20 shadow-lg shadow-red-500/5" :
          deadlineInfo.status === 'today' ? "bg-red-500/10 border-red-500/20 shadow-lg shadow-red-500/5" :
          deadlineInfo.status === 'tomorrow' ? "bg-amber-500/10 border-amber-500/20" :
          deadlineInfo.status === 'thisWeek' ? "bg-blue-500/10 border-blue-500/20" :
          "bg-slate-800/40 border-white/5"
        )}>
          <div className="flex items-center gap-5">
            <div className={cn(
              "p-4 rounded-xl shadow-inner",
              deadlineInfo.status === 'overdue' ? "bg-red-500/20 text-red-400" :
              deadlineInfo.status === 'today' ? "bg-red-500/20 text-red-400" :
              deadlineInfo.status === 'tomorrow' ? "bg-amber-500/20 text-amber-400" :
              deadlineInfo.status === 'thisWeek' ? "bg-blue-500/20 text-blue-400" :
              "bg-slate-700/50 text-slate-400"
            )}>
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className={cn(
                "text-xs font-black tracking-widest uppercase mb-1",
                deadlineInfo.status === 'overdue' || deadlineInfo.status === 'today' ? "text-red-400" :
                deadlineInfo.status === 'tomorrow' ? "text-amber-400" :
                deadlineInfo.status === 'thisWeek' ? "text-blue-400" :
                "text-slate-500"
              )}>
                {deadlineInfo.status === 'overdue' && '⚠️ PROJECT OVERDUE'}
                {deadlineInfo.status === 'today' && '🔴 DEADLINE HARI INI'}
                {deadlineInfo.status === 'tomorrow' && '🟠 Deadline Besok'}
                {deadlineInfo.status === 'thisWeek' && '📅 Deadline Minggu Ini'}
                {deadlineInfo.status === 'normal' && '📅 Deadline Project'}
              </p>
              <p className="text-2xl font-bold text-white">
                {project.endDate && new Date(project.endDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(deadlineInfo.status === 'overdue' || deadlineInfo.status === 'today' || deadlineInfo.status === 'tomorrow') && (
              <span className={cn(
                "text-[10px] font-black px-3 py-1.5 rounded-full border uppercase tracking-tighter",
                deadlineInfo.status === 'overdue' || deadlineInfo.status === 'today' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                "bg-amber-500/20 text-amber-400 border-amber-500/30"
              )}>
                {deadlineInfo.text}
              </span>
            )}
            <Button
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className={cn(
                "font-bold h-10 px-5 rounded-xl transition-all shadow-lg shadow-black/20",
                deadlineInfo.status === 'overdue' || deadlineInfo.status === 'today' ? "bg-red-600 hover:bg-red-700 text-white" :
                deadlineInfo.status === 'tomorrow' ? "bg-amber-600 hover:bg-amber-700 text-white" :
                "bg-slate-800 hover:bg-slate-700 text-white border border-white/5"
              )}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Project
            </Button>
          </div>
        </div>
      )}

      <main id="section-tasks" className="px-6 py-8 scroll-mt-20">
        {/* Stats Cards - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
          {/* Total Completed */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-5 shadow-sm hover:border-white/10 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400 transition-colors">Completed</p>
                  <p className="text-3xl font-bold text-white">{stats?.completedTasks || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-lg shadow-green-500/5">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
          </div>

          {/* Overdue Tasks */}
          <div className={cn(
            "backdrop-blur-sm border rounded-2xl p-5 shadow-sm transition-colors group",
            overdueTasks.length > 0 ? "bg-red-500/5 border-red-500/20 hover:border-red-500/30" : "bg-slate-900/40 border-white/5 hover:border-white/10"
          )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400 transition-colors">Overdue</p>
                  <p className={cn(
                    "text-3xl font-bold",
                    overdueTasks.length > 0 ? "text-red-500" : "text-white"
                  )}>{overdueTasks.length}</p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-xl border flex items-center justify-center shadow-lg transition-colors",
                  overdueTasks.length > 0 ? "bg-red-500/10 border-red-500/20 shadow-red-500/5" : "bg-slate-800/50 border-white/5"
                )}>
                  <AlertCircle className={cn(
                    "h-6 w-6",
                    overdueTasks.length > 0 ? "text-red-500" : "text-slate-500"
                  )} />
                </div>
              </div>
          </div>

          {/* Due Today */}
          <div className={cn(
            "backdrop-blur-sm border rounded-2xl p-5 shadow-sm transition-colors group",
            dueTodayTasks.length > 0 ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30" : "bg-slate-900/40 border-white/5 hover:border-white/10"
          )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400 transition-colors">Due Today</p>
                  <p className={cn(
                    "text-3xl font-bold",
                    dueTodayTasks.length > 0 ? "text-amber-500" : "text-white"
                  )}>{dueTodayTasks.length}</p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-xl border flex items-center justify-center shadow-lg transition-colors",
                  dueTodayTasks.length > 0 ? "bg-amber-500/10 border-amber-500/20 shadow-amber-500/5" : "bg-slate-800/50 border-white/5"
                )}>
                  <Flame className={cn(
                    "h-6 w-6",
                    dueTodayTasks.length > 0 ? "text-amber-500" : "text-slate-500"
                  )} />
                </div>
              </div>
          </div>

          {/* Total Hours Spent */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-5 shadow-sm hover:border-white/10 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400 transition-colors">Total Hours</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalHoursSpent || 0}h</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                  <Clock className="h-6 w-6 text-indigo-400" />
                </div>
              </div>
          </div>

          {/* Progress */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-5 shadow-sm hover:border-white/10 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400 transition-colors">Overall Progress</p>
                  <p className="text-3xl font-bold text-white">{stats?.progress || 0}%</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shadow-lg shadow-sky-500/5">
                  <KanbanSquare className="h-6 w-6 text-sky-400" />
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(14,165,233,0.4)]"
                  style={{ width: `${stats?.progress || 0}%` }}
                ></div>
              </div>
          </div>
        </div>

        {/* Urgent Tasks List */}
        {urgentTasks.length > 0 && (
          <div className="bg-slate-900/20 border border-white/5 rounded-3xl overflow-hidden mb-10">
            <div className="px-8 py-5 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                Urgent Deadlines
              </h3>
              <Badge variant="outline" className="border-white/10 text-slate-500 font-black text-[10px]">{urgentTasks.length} TASKS</Badge>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        "p-4 rounded-2xl border transition-all hover:translate-y-[-2px] cursor-pointer relative group overflow-hidden",
                        isOverdue ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10" :
                        isDueToday ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10" :
                        "bg-slate-800/30 border-white/5 hover:border-white/10"
                      )}>
                        <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
                          <h4 className="font-bold text-slate-100 text-sm truncate flex-1">{task.title}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-black shrink-0",
                            task.priority === 'CRITICAL' || task.priority === 'HIGH'
                              ? "bg-red-500/20 text-red-400 border border-red-500/20"
                              : "bg-slate-700/50 text-slate-400 border border-white/5"
                          )}>
                            {task.priority}
                          </span>
                        </div>
                        {dueDate && (
                          <div className="flex items-center gap-2 relative z-10">
                            <div className={cn(
                              "p-1.5 rounded-lg",
                              isOverdue ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                            )}>
                              <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <span className={cn(
                              "text-xs font-bold",
                              isOverdue ? "text-red-400" : "text-amber-400"
                            )}>
                              {isOverdue
                                ? `Overdue ${Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                                : dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <ArrowLeft className="w-4 h-4 text-slate-500 rotate-180" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Filter Indicator */}
        {filteredTaskIds.length > 0 && (
          <div className="bg-sky-500/10 border border-sky-500/20 px-6 py-3 mb-6 flex items-center justify-between rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
              <span className="text-sm font-bold text-sky-400 uppercase tracking-widest">
                Filtered: Showing {filteredTaskIds.length} urgent task{filteredTaskIds.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="text-xs font-black text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 px-4 h-8 rounded-lg"
            >
              CLEAR FILTER
            </Button>
          </div>
        )}

        {/* Simple View - Rencana / Sekarang / Selesai */}
        {viewState === 'simple' && (
          <div className="bg-slate-900/20 border border-white/5 rounded-3xl overflow-hidden mb-10 shadow-2xl">
            <div className="border-b border-white/5 px-8 py-5 bg-slate-900/40 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Project Timeline</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Rencana → Sekarang → Selesai</p>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-black text-blue-400 uppercase">PLANNED</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-black text-amber-400 uppercase">ACTIVE</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-black text-green-400 uppercase">DONE</span>
                 </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rencana (Planned) */}
                <div className="bg-slate-800/30 rounded-2xl p-5 border border-white/5 relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      RENCANA
                    </h3>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-black text-[10px]">
                        {displayTasks.filter(t => {
                          const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                          return statusName === 'Backlog' || statusName === 'To Do'
                        }).length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {displayTasks.filter(t => {
                      const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                      return statusName === 'Backlog' || statusName === 'To Do'
                    }).map(task => (
                      <Link
                        key={task.id}
                        href={`/projects/${project.id}/board/${task.id}`}
                        className="block"
                      >
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 hover:border-blue-500/30 hover:bg-slate-800/80 transition-all cursor-pointer group">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-slate-200 text-sm group-hover:text-white transition-colors">{task.title}</h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-black shrink-0 uppercase",
                              task.priority === 'CRITICAL' ? "bg-red-500/20 text-red-400" :
                                task.priority === 'HIGH' ? "bg-orange-500/20 text-orange-400" :
                                  task.priority === 'MEDIUM' ? "bg-yellow-500/20 text-yellow-400" :
                                    "bg-green-500/20 text-green-400"
                            )}>
                              {task.priority}
                            </span>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-500">
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
                        <div className="text-center py-10">
                           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                              <X className="w-5 h-5 text-slate-600" />
                           </div>
                           <p className="text-xs font-bold text-slate-600 uppercase tracking-tighter">No tasks planned</p>
                        </div>
                      )}
                  </div>
                </div>

                {/* Sekarang (Current/In Progress) */}
                <div className="bg-slate-800/30 rounded-2xl p-5 border border-white/5 relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                      SEKARANG
                    </h3>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-black text-[10px]">
                        {displayTasks.filter(t => {
                          const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                          return statusName === 'In Progress' || statusName === 'Review'
                        }).length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {displayTasks.filter(t => {
                      const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                      return statusName === 'In Progress' || statusName === 'Review'
                    }).map(task => (
                      <Link
                        key={task.id}
                        href={`/projects/${project.id}/board/${task.id}`}
                        className="block"
                      >
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-amber-500/20 hover:border-amber-500/40 hover:bg-slate-800/80 transition-all cursor-pointer group">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-slate-200 text-sm group-hover:text-white transition-colors">{task.title}</h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-black shrink-0 uppercase",
                              task.priority === 'CRITICAL' ? "bg-red-500/20 text-red-400" :
                                task.priority === 'HIGH' ? "bg-orange-500/20 text-orange-400" :
                                  task.priority === 'MEDIUM' ? "bg-yellow-500/20 text-yellow-400" :
                                    "bg-green-500/20 text-green-400"
                            )}>
                              {task.priority}
                            </span>
                          </div>
                          {task.dueDate && (
                            <div className={cn(
                              "flex items-center gap-2 mt-3 text-[10px] font-bold",
                              new Date(task.dueDate) < today ? "text-red-400" : "text-slate-500"
                            )}>
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              {new Date(task.dueDate) < today && <Badge variant="outline" className="ml-auto bg-red-500/10 text-red-400 border-red-500/20 h-4 text-[8px]">OVERDUE</Badge>}
                            </div>
                          )}
                          {task.assignee && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                              <div className="w-4 h-4 rounded-full bg-sky-500/20 flex items-center justify-center text-[8px] font-black text-sky-400">
                                {task.assignee.username[0].toUpperCase()}
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">{task.assignee.username}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                    {displayTasks.filter(t => {
                      const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                      return statusName === 'In Progress' || statusName === 'Review'
                    }).length === 0 && (
                        <div className="text-center py-10">
                           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                              <Loader2 className="w-5 h-5 text-slate-600" />
                           </div>
                           <p className="text-xs font-bold text-slate-600 uppercase tracking-tighter">No active tasks</p>
                        </div>
                      )}
                  </div>
                </div>

                {/* Selesai (Completed) */}
                <div className="bg-slate-800/30 rounded-2xl p-5 border border-white/5 relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                      SELESAI
                    </h3>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 font-black text-[10px]">
                        {displayTasks.filter(t => {
                          const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                          return statusName === 'Done'
                        }).length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {displayTasks.filter(t => {
                      const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                      return statusName === 'Done'
                    }).map(task => (
                      <Link
                        key={task.id}
                        href={`/projects/${project.id}/board/${task.id}`}
                        className="block"
                      >
                        <div className="bg-slate-900/40 p-4 rounded-xl border border-green-500/10 hover:border-green-500/30 hover:bg-slate-800/60 transition-all cursor-pointer group opacity-60 hover:opacity-100">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-slate-400 text-sm group-hover:text-white transition-colors line-through">{task.title}</h4>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                          <div className="flex items-center gap-2 mt-3 text-[10px] font-black text-green-500/70 uppercase">
                            COMPLETED
                          </div>
                        </div>
                      </Link>
                    ))}
                    {displayTasks.filter(t => {
                      const statusName = project.statuses.find(s => s.id === t.statusId)?.name
                      return statusName === 'Done'
                    }).length === 0 && (
                        <div className="text-center py-10">
                           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                              <CheckCircle2 className="w-5 h-5 text-slate-600" />
                           </div>
                           <p className="text-xs font-bold text-slate-600 uppercase tracking-tighter">No tasks completed yet</p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Graph View */}
        {viewState === 'graph' && (
          <div id="section-graph" className="h-[calc(100vh-320px)] bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <ProjectGraph
              tasks={taskList}
              statuses={project.statuses || []}
              projectId={project.id}
              projectName={project.name}
            />
          </div>
        )}

        {/* Kanban Board */}
        {viewState === 'overview' && (
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-t-3xl border border-white/5 overflow-hidden mb-10 shadow-2xl">
            <div className="border-b border-white/5 px-8 py-5 bg-slate-900/60 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Kanban Board</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Drag & drop tasks to update status</p>
              </div>
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20 font-black text-[10px] py-1 px-3">
                    {taskList.length} TASKS TOTAL
                 </Badge>
              </div>
            </div>
            <div className="p-0">
              <KanbanBoard
                initialTasks={taskList}
                statuses={project.statuses || []}
                projectId={project.id}
                projectName={project.name}
                currentUserId={currentUserId}
                onMoveToNext={handleMoveToNext}
              />
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
        {stats?.recentActivities && stats.recentActivities.length > 0 && (
          <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden mb-10 shadow-lg">
            <div className="px-8 py-5 border-b border-white/5 bg-slate-900/60 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                Recent Activity
              </h3>
              <Clock className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/30 border border-white/5 hover:border-white/10 transition-colors group">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Users className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-200">
                          <span className="font-black text-white">{activity.userName}</span> updated <span className="text-sky-400 font-bold italic">"{activity.content}"</span>
                        </p>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter whitespace-nowrap">
                          {new Date(activity.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status:</span>
                        <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-white/5 text-[9px] font-bold py-0 px-2 h-5">
                          {activity.statusName || 'Updated'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assets & Docs Section */}
        <div id="section-assets" className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-2xl mx-6 mb-10 mt-10 scroll-mt-20">
          <div className="px-8 py-5 border-b border-white/5 bg-slate-900/60 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              Workspace Assets & Documentation
            </h3>
            <Paperclip className="h-5 w-5 text-purple-400" />
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Project Documentation Cards */}
                <div className="space-y-6">
                  <ProjectDocs projectId={project.id} />
                </div>

                {/* Project Assets & Attachments */}
                <div className="space-y-6">
                  <ProjectAttachments projectId={project.id} />
                </div>
            </div>
          </div>
        </div>

        {/* Project Details Card */}
        <div id="section-details" className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-2xl mx-6 mb-10 scroll-mt-20">
          <div className="px-8 py-5 border-b border-white/5 bg-slate-900/60 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
              Project Information
            </h3>
            <Settings className="h-5 w-5 text-slate-500" />
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/30 border border-white/5">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Owner</p>
                  <p className="text-base font-bold text-white">{project?.owner?.username || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/30 border border-white/5">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Created Date</p>
                  <p className="text-base font-bold text-white">
                    {project?.createdAt ? new Date(project.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </p>
                </div>
              </div>
              {project?.endDate && (
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/30 border border-white/5">
                  <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Project Deadline</p>
                    <p className="text-base font-bold text-white">
                      {new Date(project.endDate).toLocaleDateString('id-ID', {
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
              <div className="mt-8 pt-8 border-t border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Project Description</p>
                <div className="p-6 rounded-2xl bg-slate-800/20 border border-white/5">
                   <p className="text-sm text-slate-300 leading-relaxed font-medium">{project.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
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
            priority: project.priority || 'MEDIUM',
            bannerImage: project.bannerImage || ''
          })
        }
      }}>
        <DialogContent className="sm:max-w-[550px] bg-slate-900 border-white/10 text-white rounded-3xl overflow-hidden p-0">
          <DialogHeader className="px-8 pt-8 pb-4">
            <DialogTitle className="text-2xl font-black tracking-tight">Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProject} className="space-y-6 mt-2 p-8 pt-0">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-black text-slate-500 uppercase tracking-widest">Project Name *</Label>
              <Input
                id="name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-slate-800/50 border-white/5 h-12 rounded-xl focus:ring-sky-500/20"
                placeholder="Project title..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-black text-slate-500 uppercase tracking-widest">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="bg-slate-800/50 border-white/5 rounded-xl min-h-[100px] focus:ring-sky-500/20"
                placeholder="What is this project about?"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs font-black text-slate-500 uppercase tracking-widest">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  className="bg-slate-800/50 border-white/5 h-12 rounded-xl focus:ring-sky-500/20 color-scheme-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs font-black text-slate-500 uppercase tracking-widest">Deadline</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  className="bg-slate-800/50 border-white/5 h-12 rounded-xl focus:ring-sky-500/20 color-scheme-dark"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-xs font-black text-slate-500 uppercase tracking-widest">Priority</Label>
              <select
                id="priority"
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="w-full h-12 bg-slate-800/50 border border-white/5 rounded-xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerImage" className="text-xs font-black text-slate-500 uppercase tracking-widest">Banner Image URL</Label>
              <Input
                id="bannerImage"
                type="url"
                value={editForm.bannerImage}
                onChange={(e) => setEditForm({ ...editForm, bannerImage: e.target.value })}
                className="bg-slate-800/50 border-white/5 h-12 rounded-xl focus:ring-sky-500/20"
                placeholder="https://example.com/banner.jpg"
              />
            </div>
            <DialogFooter className="bg-slate-800/30 p-6 -mx-8 -mb-8 mt-10 border-t border-white/5 gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSaving}
                className="text-slate-400 hover:text-white font-bold"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                className="bg-sky-500 hover:bg-sky-600 text-white font-black px-8 rounded-xl shadow-lg shadow-sky-500/20 h-11"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    SAVING...
                  </>
                ) : 'SAVE CHANGES'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>

      {/* Print Preview - Project Report */}
      {showPrintPreview && (
        <ProjectReportPage
          project={{
            ...project,
            priority: project.priority || 'MEDIUM',
            startDate: project.startDate ? new Date(project.startDate).toISOString() : null,
            endDate: project.endDate ? new Date(project.endDate).toISOString() : null,
            tasks: displayTasks.map(t => ({
              ...t,
              dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
              status: {
                name: project.statuses.find(s => s.id === t.statusId)?.name || 'Unknown',
                order: project.statuses.find(s => s.id === t.statusId)?.order || 0
              }
            })) || [],
            statuses: project.statuses || []
          }}
          generatedAt={new Date().toLocaleString('id-ID', {
            dateStyle: 'full',
            timeStyle: 'long'
          })}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </div>
  )
}

