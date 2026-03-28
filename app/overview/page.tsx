'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  Users,
  FolderKanban,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  statusId: string
  dueDate: Date | string | null
  estimatedHours?: number | null
  actualHours?: number | null
  progress: number
  projectId: string
  project?: {
    id: string
    name: string
  }
  status?: {
    id: string
    name: string
    order: number
  }
  assignee?: {
    id: string
    username: string
    name: string
    email: string
  } | null
}

interface FilterOptions {
  status: string
  priority: string
  project: string
  assignee: string
}

export default function OverviewPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    project: 'all',
    assignee: 'all'
  })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch current user
      const userRes = await fetch('/api/user')
      const userData = await userRes.json()
      setCurrentUser(userData.user)

      // Check if user is Manager, Admin, or Super Admin
      const userRole = userData.user?.role
      if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        setError('Anda tidak memiliki akses ke halaman ini. Hanya Manager, Admin, dan Super Admin yang dapat mengakses.')
        setLoading(false)
        return
      }

      // Fetch all tasks from reports endpoint (which gets all projects data)
      const res = await fetch('/api/reports/tasks')
      const data = await res.json()

      if (data.success) {
        setTasks(data.tasks || [])
      } else {
        // Fallback: fetch from projects
        const projectsRes = await fetch('/api/projects')
        const projectsData = await projectsRes.json()
        if (projectsData.projects) {
          // Flatten tasks from all projects
          const allTasks: Task[] = []
          for (const project of projectsData.projects) {
            const taskRes = await fetch(`/api/tasks?projectId=${project.id}`)
            const taskData = await taskRes.json()
            if (taskData.tasks) {
              allTasks.push(...taskData.tasks.map((t: any) => ({
                ...t,
                project: { id: project.id, name: project.name }
              })))
            }
          }
          setTasks(allTasks)
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError('Gagal mengambil data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get unique values for filters
  const uniqueProjects = [...new Map(tasks.map(t => [t.projectId, t.project])).values()]
  const uniqueAssignees = [...new Map(tasks.filter(t => t.assignee).map(t => [t.assignee!.id, t.assignee])).values()]

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filters.status !== 'all' && task.status?.name !== filters.status) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    if (filters.project !== 'all' && task.projectId !== filters.project) return false
    if (filters.assignee !== 'all' && task.assignee?.id !== filters.assignee) return false
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  });

  // Calculate stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status?.name === 'Done').length
  const inProgressTasks = tasks.filter(t => ['In Progress', 'Review'].includes(t.status?.name || '')).length
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate) return false
    return new Date(t.dueDate) < new Date() && t.status?.name !== 'Done'
  }).length

  const clearFilters = () => {
    setFilters({ status: 'all', priority: 'all', project: 'all', assignee: 'all' })
    setSearchQuery('')
  }

  const hasActiveFilters = filters.status !== 'all' || filters.priority !== 'all' ||
    filters.project !== 'all' || filters.assignee !== 'all' || searchQuery !== ''

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-sky-400 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <Card className="bg-slate-900/50 border-red-500/20 max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Akses Ditolak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">{error}</p>
            <Link href="/projects">
              <Button className="mt-4 bg-slate-800 hover:bg-slate-700">
                Kembali ke Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Team Overview</h1>
                <p className="text-xs text-slate-400 font-medium">Semua task tim dalam satu view</p>
              </div>
            </div>
            <Badge
              className={cn(
                "font-black text-[10px] px-3 py-1",
                currentUser?.role === 'SUPER_ADMIN' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                currentUser?.role === 'ADMIN' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                "bg-purple-500/20 text-purple-400 border-purple-500/30"
              )}
            >
              {currentUser?.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' :
               currentUser?.role === 'ADMIN' ? 'ADMIN' : 'MANAGER'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Tasks</p>
                  <p className="text-3xl font-bold text-white mt-1">{totalTasks}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <FolderKanban className="h-6 w-6 text-sky-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Completed</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1">{completedTasks}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">In Progress</p>
                  <p className="text-3xl font-bold text-amber-400 mt-1">{inProgressTasks}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border",
            overdueTasks > 0 ? "bg-red-500/5 border-red-500/20" : "bg-slate-900/50 border-white/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Overdue</p>
                  <p className={cn(
                    "text-3xl font-bold mt-1",
                    overdueTasks > 0 ? "text-red-400" : "text-slate-400"
                  )}>{overdueTasks}</p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-xl border flex items-center justify-center",
                  overdueTasks > 0 ? "bg-red-500/10 border-red-500/20" : "bg-slate-800/50 border-white/5"
                )}>
                  <AlertCircle className={cn(
                    "h-6 w-6",
                    overdueTasks > 0 ? "text-red-400" : "text-slate-500"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900/50 border-white/5 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari task..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-slate-800/50 border border-white/5 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/30"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-slate-500" />

                <Select value={filters.status} onValueChange={(v: string) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger className="w-[150px] h-9 bg-slate-800/50 border-white/5 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Backlog">Backlog</SelectItem>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.priority} onValueChange={(v: string) => setFilters({ ...filters, priority: v })}>
                  <SelectTrigger className="w-[140px] h-9 bg-slate-800/50 border-white/5 text-sm">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all">Semua Priority</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.project} onValueChange={(v: string) => setFilters({ ...filters, project: v })}>
                  <SelectTrigger className="w-[180px] h-9 bg-slate-800/50 border-white/5 text-sm">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all">Semua Project</SelectItem>
                    {uniqueProjects.map(p => (
                      <SelectItem key={p!.id} value={p!.id}>{p!.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.assignee} onValueChange={(v: string) => setFilters({ ...filters, assignee: v })}>
                  <SelectTrigger className="w-[150px] h-9 bg-slate-800/50 border-white/5 text-sm">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all">Semua Member</SelectItem>
                    {uniqueAssignees.map(a => (
                      <SelectItem key={a!.id} value={a!.id}>{a!.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-3 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="ml-auto text-sm text-slate-500 font-medium">
                Menampilkan {filteredTasks.length} dari {totalTasks} task
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card className="bg-slate-900/50 border-white/5">
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {filteredTasks.length === 0 ? (
                <div className="p-12 text-center">
                  <FolderKanban className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Tidak ada task yang ditemukan</p>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status?.name !== 'Done'
                  const isDueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()

                  return (
                    <Link
                      key={task.id}
                      href={`/projects/${task.projectId}/board/${task.id}`}
                      className="block p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Priority & Status Icons */}
                        <div className="flex flex-col items-center gap-1">
                          {task.status?.name === 'Done' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : isOverdue ? (
                            <ArrowDownRight className="w-5 h-5 text-red-400" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-slate-600" />
                          )}
                        </div>

                        {/* Task Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-200 truncate">{task.title}</h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-black px-1.5 py-0 h-4",
                                task.priority === 'CRITICAL' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                task.priority === 'HIGH' ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                                task.priority === 'MEDIUM' ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                                "bg-green-500/20 text-green-400 border-green-500/30"
                              )}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <FolderKanban className="w-3 h-3" />
                              {task.project?.name}
                            </span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold",
                              task.status?.name === 'Done' ? "bg-emerald-500/20 text-emerald-400" :
                              task.status?.name === 'In Progress' ? "bg-amber-500/20 text-amber-400" :
                              task.status?.name === 'Review' ? "bg-purple-500/20 text-purple-400" :
                              "bg-slate-700/50 text-slate-400"
                            )}>
                              {task.status?.name || 'Unknown'}
                            </span>
                            {task.assignee && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {task.assignee.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Due Date */}
                        {task.dueDate && (
                          <div className={cn(
                            "flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg",
                            isOverdue ? "bg-red-500/10 text-red-400" :
                            isDueToday ? "bg-amber-500/10 text-amber-400" :
                            "bg-slate-800/50 text-slate-400"
                          )}>
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.dueDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                        )}

                        {/* Progress */}
                        <div className="w-20 hidden md:block">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  task.progress === 100 ? "bg-emerald-500" :
                                  task.progress > 0 ? "bg-sky-500" : "bg-slate-700"
                                )}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 w-8 text-right">
                              {task.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
