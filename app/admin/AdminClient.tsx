'use client'

import { useState } from 'react'
import { updateUserRole } from '@/app/actions/admin'
import {
    ShieldAlert,
    Users,
    FolderKanban,
    CheckSquare,
    HardDrive,
    ShieldCheck,
    Mail,
    UserCircle2,
    Crown,
    UserPlus,
    Activity,
    ListTodo,
    Loader2,
    ChevronDown,
    ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface UserStats {
    id: string
    username: string
    email: string
    name: string
    role: string
    createdAt: Date | string
    updatedAt?: Date | string
    projectCount: number
    taskCount: number
}

interface AdminClientProps {
    currentUser: any
    users: UserStats[]
    stats: any
    roleStats?: Record<string, number>
    detailedByRole?: Array<{
        role: string
        userCount: number
        projectCount: number
        taskCount: number
        completedTasks: number
    }>
}

export default function AdminClient({
    currentUser,
    users,
    stats,
    roleStats = {},
    detailedByRole = []
}: AdminClientProps) {
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<string>('overview')
    const [expandedRole, setExpandedRole] = useState<string | null>(null)
    const { toast } = useToast()

    // Group users by role
    const usersByRole = users.reduce((acc, user) => {
        if (!acc[user.role]) {
            acc[user.role] = []
        }
        acc[user.role].push(user)
        return acc
    }, {} as Record<string, UserStats[]>)

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingId(userId)
        const res = await updateUserRole(userId, newRole)
        setUpdatingId(null)

        if (res.success) {
            toast({
                title: "Hak Akses Diperbarui",
                description: "Hak akses pengguna berhasil diubah.",
            })
            window.location.reload()
        } else {
            toast({
                variant: "destructive",
                title: "Gagal Mengubah Akses",
                description: res.error
            })
        }
    }

    const toggleRoleExpand = (role: string) => {
        setExpandedRole(expandedRole === role ? null : role)
    }

    // Get role display info
    const getRoleInfo = (role: string) => {
        const roleMap: Record<string, { label: string; color: string; icon: any; description: string }> = {
            SUPER_ADMIN: {
                label: 'Super Admin',
                color: 'amber',
                icon: Crown,
                description: 'Akses penuh ke semua fitur dan pengaturan sistem'
            },
            ADMIN: {
                label: 'Administrator',
                color: 'red',
                icon: ShieldCheck,
                description: 'Mengelola pengguna dan project'
            },
            MANAGER: {
                label: 'Global Manager',
                color: 'purple',
                icon: FolderKanban,
                description: 'Melihat semua task dari seluruh project'
            },
            PM: {
                label: 'Project Manager',
                color: 'blue',
                icon: ListTodo,
                description: 'Mengelola project tertentu'
            },
            MEMBER: {
                label: 'Member',
                color: 'slate',
                icon: Users,
                description: 'Akses terbatas sesuai project'
            }
        }
        return roleMap[role] || roleMap.MEMBER
    }

    // Stats by role
    const superAdminCount = roleStats['SUPER_ADMIN'] || 0
    const adminCount = roleStats['ADMIN'] || 0
    const managerCount = roleStats['MANAGER'] || 0
    const pmCount = roleStats['PM'] || 0
    const memberCount = roleStats['MEMBER'] || 0

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            {/* Header */}
            <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-5 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white">Admin Control Panel</h1>
                                <p className="text-sm text-slate-400">Kelola pengguna, roles, dan pengaturan sistem</p>
                            </div>
                        </div>
                        <Badge
                            className={cn(
                                "font-black text-xs px-4 py-2",
                                currentUser?.role === 'SUPER_ADMIN' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                "bg-red-500/20 text-red-400 border-red-500/30"
                            )}
                        >
                            <Crown className="w-3 h-3 mr-1.5" />
                            {currentUser?.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'ADMIN'}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Tab Navigation */}
                <div className="flex items-center gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-xl border border-white/5 w-fit">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'overview'
                                ? "bg-slate-800 text-white shadow-lg"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Activity className="w-4 h-4" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'users'
                                ? "bg-slate-800 text-white shadow-lg"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Users className="w-4 h-4" />
                        Users ({users.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'roles'
                                ? "bg-slate-800 text-white shadow-lg"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        Roles
                    </button>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Global Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Card className="bg-slate-900/50 border-white/5">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Users</p>
                                            <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                            <Users className="h-6 w-6 text-indigo-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 border-white/5">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Projects</p>
                                            <p className="text-3xl font-bold text-white mt-1">{stats.totalProjects}</p>
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
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tasks</p>
                                            <p className="text-3xl font-bold text-white mt-1">{stats.totalTasks}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <ListTodo className="h-6 w-6 text-emerald-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 border-white/5">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Memberships</p>
                                            <p className="text-3xl font-bold text-white mt-1">{stats.totalMemberships}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                            <UserPlus className="h-6 w-6 text-purple-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 border-white/5">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assets</p>
                                            <p className="text-3xl font-bold text-white mt-1">{stats.totalAssets}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                            <HardDrive className="h-6 w-6 text-amber-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Role Distribution */}
                        <Card className="bg-slate-900/50 border-white/5">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-sky-400" />
                                    Role Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Crown className="w-4 h-4 text-amber-400" />
                                            <span className="text-xs font-bold text-amber-400 uppercase">Super Admin</span>
                                        </div>
                                        <p className="text-3xl font-black text-amber-400">{superAdminCount}</p>
                                    </div>

                                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldCheck className="w-4 h-4 text-red-400" />
                                            <span className="text-xs font-bold text-red-400 uppercase">Admin</span>
                                        </div>
                                        <p className="text-3xl font-black text-red-400">{adminCount}</p>
                                    </div>

                                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FolderKanban className="w-4 h-4 text-purple-400" />
                                            <span className="text-xs font-bold text-purple-400 uppercase">Manager</span>
                                        </div>
                                        <p className="text-3xl font-black text-purple-400">{managerCount}</p>
                                    </div>

                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ListTodo className="w-4 h-4 text-blue-400" />
                                            <span className="text-xs font-bold text-blue-400 uppercase">PM</span>
                                        </div>
                                        <p className="text-3xl font-black text-blue-400">{pmCount}</p>
                                    </div>

                                    <div className="bg-slate-500/5 border border-slate-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-400 uppercase">Member</span>
                                        </div>
                                        <p className="text-3xl font-black text-slate-400">{memberCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detailed Stats by Role */}
                        {detailedByRole.length > 0 && (
                            <Card className="bg-slate-900/50 border-white/5">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-emerald-400" />
                                        Statistics by Role
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-slate-500 text-xs uppercase tracking-wider">
                                                    <th className="text-left py-3 px-4 font-bold">Role</th>
                                                    <th className="text-center py-3 px-4 font-bold">Users</th>
                                                    <th className="text-center py-3 px-4 font-bold">Projects</th>
                                                    <th className="text-center py-3 px-4 font-bold">Tasks Assigned</th>
                                                    <th className="text-center py-3 px-4 font-bold">Tasks Completed</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {detailedByRole.map((stat) => {
                                                    const roleInfo = getRoleInfo(stat.role)
                                                    return (
                                                        <tr key={stat.role} className="hover:bg-white/[0.02]">
                                                            <td className="py-3 px-4">
                                                                <Badge
                                                                    className={cn(
                                                                        "font-bold",
                                                                        stat.role === 'SUPER_ADMIN' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                                                        stat.role === 'ADMIN' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                                                        stat.role === 'MANAGER' ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                                                                        stat.role === 'PM' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                                                        "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                                                    )}
                                                                >
                                                                    <roleInfo.icon className="w-3 h-3 mr-1.5" />
                                                                    {roleInfo.label}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-3 px-4 text-center text-white font-bold">{stat.userCount}</td>
                                                            <td className="py-3 px-4 text-center text-sky-400 font-bold">{stat.projectCount}</td>
                                                            <td className="py-3 px-4 text-center text-emerald-400 font-bold">{stat.taskCount}</td>
                                                            <td className="py-3 px-4 text-center text-purple-400 font-bold">{stat.completedTasks}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
                            <div className="px-6 py-5 border-b border-white/5 bg-slate-900/50">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-sky-400" />
                                    All Users ({users.length})
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">Kelola hak akses dan role pengguna</p>
                            </div>

                            <div className="divide-y divide-white/5">
                                {users.map((user) => {
                                    const roleInfo = getRoleInfo(user.role)
                                    const RoleIcon = roleInfo.icon
                                    const isCurrentUser = user.id === currentUser?.userId
                                    const canEdit = !isCurrentUser || currentUser?.role === 'SUPER_ADMIN'

                                    return (
                                        <div
                                            key={user.id}
                                            className={cn(
                                                "p-6 hover:bg-white/[0.02] transition-colors",
                                                isCurrentUser && "bg-sky-500/5"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-6">
                                                {/* User Info */}
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border",
                                                        user.role === 'SUPER_ADMIN' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                                        user.role === 'ADMIN' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                                        user.role === 'MANAGER' ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                                                        "bg-slate-800 text-slate-400 border-white/10"
                                                    )}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="font-bold text-white text-lg">{user.name}</h3>
                                                            {isCurrentUser && (
                                                                <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 text-[10px] font-bold">
                                                                    YOU
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-slate-400">
                                                            <span className="flex items-center gap-1.5">
                                                                <UserCircle2 className="w-4 h-4" />
                                                                @{user.username}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Mail className="w-4 h-4" />
                                                                {user.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center gap-6">
                                                    <div className="text-center">
                                                        <p className="text-2xl font-black text-white">{user.projectCount}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Projects</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-black text-white">{user.taskCount}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tasks</p>
                                                    </div>
                                                    <div className="text-center min-w-[100px]">
                                                        <Badge
                                                            className={cn(
                                                                "font-bold mb-2",
                                                                user.role === 'SUPER_ADMIN' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                                                user.role === 'ADMIN' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                                                user.role === 'MANAGER' ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                                                                user.role === 'PM' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                                                "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                                            )}
                                                        >
                                                            <RoleIcon className="w-3 h-3 mr-1.5" />
                                                            {roleInfo.label}
                                                        </Badge>
                                                        <p className="text-[10px] text-slate-500">
                                                            Joined {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Role Selector */}
                                                <div className="flex items-center gap-3">
                                                    {canEdit ? (
                                                        <>
                                                            <select
                                                                value={user.role}
                                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                                disabled={updatingId === user.id}
                                                                className="bg-slate-800 border border-white/10 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-44 p-2.5"
                                                            >
                                                                <option value="MEMBER">Member</option>
                                                                <option value="PM">Project Manager</option>
                                                                <option value="MANAGER">Global Manager</option>
                                                                <option value="ADMIN">Administrator</option>
                                                                <option value="SUPER_ADMIN">Super Admin</option>
                                                            </select>
                                                            {updatingId === user.id && (
                                                                <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/30">
                                                            Cannot edit own role
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Role Description */}
                                            <div className="mt-4 pl-16">
                                                <p className="text-xs text-slate-500">{roleInfo.description}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Roles Tab */}
                {activeTab === 'roles' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PM', 'MEMBER'].map((role) => {
                            const roleInfo = getRoleInfo(role)
                            const RoleIcon = roleInfo.icon
                            const roleUsers = usersByRole[role] || []
                            const isExpanded = expandedRole === role

                            return (
                                <Card key={role} className="bg-slate-900/50 border-white/5 overflow-hidden">
                                    <button
                                        onClick={() => toggleRoleExpand(role)}
                                        className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                                role === 'SUPER_ADMIN' ? "bg-amber-500/20 border border-amber-500/30" :
                                                role === 'ADMIN' ? "bg-red-500/20 border border-red-500/30" :
                                                role === 'MANAGER' ? "bg-purple-500/20 border border-purple-500/30" :
                                                role === 'PM' ? "bg-blue-500/20 border border-blue-500/30" :
                                                "bg-slate-800 border border-white/10"
                                            )}>
                                                <RoleIcon className={cn(
                                                    "w-6 h-6",
                                                    role === 'SUPER_ADMIN' ? "text-amber-400" :
                                                    role === 'ADMIN' ? "text-red-400" :
                                                    role === 'MANAGER' ? "text-purple-400" :
                                                    role === 'PM' ? "text-blue-400" :
                                                    "text-slate-400"
                                                )} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-white">{roleInfo.label}</h3>
                                                <p className="text-sm text-slate-400">{roleInfo.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <Badge
                                                className={cn(
                                                    "font-bold text-sm px-3 py-1.5",
                                                    role === 'SUPER_ADMIN' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                                    role === 'ADMIN' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                                    role === 'MANAGER' ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                                                    role === 'PM' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                                    "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                                )}
                                            >
                                                {roleUsers.length} users
                                            </Badge>
                                            {isExpanded ? (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-white/5 bg-slate-900/30">
                                            {roleUsers.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                                    <p className="text-slate-500 font-medium">No users with this role</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-white/5">
                                                    {roleUsers.map((user) => (
                                                        <div key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-white">{user.name}</p>
                                                                    <p className="text-xs text-slate-500">@{user.username}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-6 text-sm">
                                                                <span className="text-slate-400">{user.email}</span>
                                                                <span className="text-sky-400 font-medium">{user.projectCount} projects</span>
                                                                <span className="text-emerald-400 font-medium">{user.taskCount} tasks</span>
                                                                <span className="text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
