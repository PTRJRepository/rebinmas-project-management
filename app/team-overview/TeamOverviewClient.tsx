'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  UserCircle2,
  Crown,
  ShieldCheck,
  ListTodo,
  BarChart3,
  PieChart
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface User {
  id: string
  username: string
  email: string
  name: string
  role: string
  projectCount: number
  taskCount: number
  completedTaskCount: number
}

interface GroupedData {
  owner: {
    id: string
    name: string
    username: string
  }
  projects: Array<{
    id: string
    name: string
    description?: string | null
    priority?: string | null
    status?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    createdAt?: Date | string
    taskCount: number
    completedTaskCount: number
  }>
  totalProjects: number
  totalTasks: number
  totalCompletedTasks: number
}

interface TeamOverviewClientProps {
  currentUser: any
  users: User[]
  groupedData: GroupedData[]
  stats: {
    totalUsers: number
    totalOwners: number
    totalProjects: number
    totalTasks: number
  }
}

export default function TeamOverviewClient({
  currentUser,
  users,
  groupedData,
  stats
}: TeamOverviewClientProps) {
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped')

  const toggleOwner = (ownerId: string) => {
    setExpandedOwner(expandedOwner === ownerId ? null : ownerId)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'ADMIN':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'MANAGER':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'PM':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getPriorityColor = (priority?: string | null) => {
    switch (priority) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  }

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'SEKARANG':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20'
      case 'RENCANA':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
      case 'SELESAI':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return Crown
      case 'ADMIN':
        return ShieldCheck
      case 'MANAGER':
        return BarChart3
      case 'PM':
        return FolderKanban
      default:
        return Users
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                Team Overview
              </h1>
              <p className="text-sm text-slate-400">View all team members and their projects</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grouped')}
              className={cn(viewMode === 'grouped' ? 'bg-sky-600 hover:bg-sky-700' : 'text-slate-400')}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Grouped
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(viewMode === 'list' ? 'bg-sky-600 hover:bg-sky-700' : 'text-slate-400')}
            >
              <ListTodo className="w-4 h-4 mr-2" />
              List
            </Button>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-400">
                Back to Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sky-400">{stats.totalUsers}</div>
              <p className="text-xs text-slate-500 mt-1">Across all roles</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <UserCircle2 className="w-4 h-4" />
                Project Owners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-400">{stats.totalOwners}</div>
              <p className="text-xs text-slate-500 mt-1">Users with projects</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">{stats.totalProjects}</div>
              <p className="text-xs text-slate-500 mt-1">Active and completed</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Total Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">{stats.totalTasks}</div>
              <p className="text-xs text-slate-500 mt-1">Assigned tasks</p>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {viewMode === 'grouped' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Projects by Owner</h2>
            {groupedData.map((group) => (
              <Card key={group.owner.id} className="bg-slate-900/50 border-slate-700">
                <CardHeader className="pb-3">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleOwner(group.owner.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {group.owner.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-100">{group.owner.name}</CardTitle>
                        <CardDescription className="text-slate-400">@{group.owner.username}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-sky-400">{group.totalProjects} projects</div>
                        <div className="text-xs text-slate-500">{group.totalTasks} tasks • {group.totalCompletedTasks} completed</div>
                      </div>
                      {expandedOwner === group.owner.id ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {expandedOwner === group.owner.id && (
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 mt-4">
                      {group.projects.map((project) => (
                        <div
                          key={project.id}
                          className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-sky-500/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link href={`/projects/${project.id}`}>
                                <h3 className="font-semibold text-slate-100 hover:text-sky-400 transition-colors">
                                  {project.name}
                                </h3>
                              </Link>
                              {project.description && (
                                <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                  {project.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                {project.priority && (
                                  <Badge className={cn('text-xs', getPriorityColor(project.priority))}>
                                    {project.priority}
                                  </Badge>
                                )}
                                {project.status && (
                                  <Badge className={cn('text-xs', getStatusColor(project.status))}>
                                    {project.status === 'SEKARANG' ? 'Current' : project.status === 'RENCANA' ? 'Planned' : 'Completed'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-sky-400">{project.taskCount} tasks</div>
                              <div className="text-xs text-slate-500">{project.completedTaskCount} completed</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">All Team Members</h2>
            <div className="grid grid-cols-1 gap-4">
              {users.map((user) => {
                const RoleIcon = getRoleIcon(user.role)
                return (
                  <Card key={user.id} className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100">{user.name}</div>
                            <div className="text-sm text-slate-400">@{user.username} • {user.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Badge className={cn('text-xs', getRoleBadgeColor(user.role))}>
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {user.role}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-sky-400">{user.projectCount} projects</div>
                            <div className="text-xs text-slate-500">{user.taskCount} tasks • {user.completedTaskCount} completed</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
