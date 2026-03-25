'use client'

import { useState } from 'react'
import { updateUserRole } from '@/app/actions/admin'
import { ShieldAlert, Users, FolderKanban, CheckSquare, HardDrive, ShieldCheck, Mail, UserCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'

interface AdminClientProps {
    currentUser: any;
    users: any[];
    stats: any;
}

export default function AdminClient({ currentUser, users, stats }: AdminClientProps) {
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const { toast } = useToast()

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingId(userId)
        const res = await updateUserRole(userId, newRole)
        setUpdatingId(null)

        if (res.success) {
            toast({
                title: "Hak Akses Diperbarui",
                description: "Hak akses pengguna berhasil diubah."
            })
        } else {
            toast({
                variant: "destructive",
                title: "Gagal Mengubah Akses",
                description: res.error
            })
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-8 h-8 text-sky-400" />
                    <h1 className="text-3xl font-black bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                        Administrator Control Panel
                    </h1>
                </div>
                <p className="text-slate-400 font-medium">Manage user roles, monitor system metrics, and control platform access.</p>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 glass-card">
                    <div className="flex items-center justify-between mb-4">
                        <Users className="w-5 h-5 text-indigo-400" />
                        <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-500/20 text-indigo-400">Total</span>
                    </div>
                    <div className="text-3xl font-black text-white">{stats.totalUsers}</div>
                    <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-1">Users</div>
                </div>
                
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 glass-card">
                    <div className="flex items-center justify-between mb-4">
                        <FolderKanban className="w-5 h-5 text-sky-400" />
                        <span className="text-xs font-bold px-2 py-1 rounded bg-sky-500/20 text-sky-400">Total</span>
                    </div>
                    <div className="text-3xl font-black text-white">{stats.totalProjects}</div>
                    <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-1">Projects</div>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 glass-card">
                    <div className="flex items-center justify-between mb-4">
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">Total</span>
                    </div>
                    <div className="text-3xl font-black text-white">{stats.totalTasks}</div>
                    <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-1">Tasks</div>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 glass-card">
                    <div className="flex items-center justify-between mb-4">
                        <HardDrive className="w-5 h-5 text-amber-400" />
                        <span className="text-xs font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-400">Total</span>
                    </div>
                    <div className="text-3xl font-black text-white">{stats.totalAssets}</div>
                    <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-1">Stored Assets/Docs</div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden glass-card">
                <div className="px-6 py-5 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-sky-400" />
                            User Access Management
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Assign platform-wide roles and manager visibility overrides</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-900/60 font-semibold text-slate-400 border-b border-white/5 uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">System Role</th>
                                <th className="px-6 py-4">Joined Date</th>
                                <th className="px-6 py-4 flex justify-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sky-400 border border-white/10">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-200">{user.name}</div>
                                                <div className="text-xs text-slate-500 font-medium font-mono flex items-center gap-1">
                                                    <UserCircle2 className="w-3 h-3" /> @{user.username}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Mail className="w-3.5 h-3.5" />
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={
                                            user.role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            user.role === 'MANAGER' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }>
                                            <ShieldAlert className="w-3 h-3 mr-1.5" />
                                            {user.role}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-medium">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end pr-2">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={updatingId === user.id || (user.id === currentUser.userId && user.role === 'ADMIN')}
                                                className="bg-slate-900 border border-white/10 text-slate-300 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-32 p-2"
                                            >
                                                <option value="MEMBER">Member</option>
                                                <option value="PM">Project Manager</option>
                                                <option value="MANAGER">Global Manager</option>
                                                <option value="ADMIN">Administrator</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
