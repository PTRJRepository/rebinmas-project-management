'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Crown, 
  Shield, 
  User,
  Search,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  userId: string
  role: 'OWNER' | 'PM' | 'MEMBER'
  joinedAt: string
  user: {
    id: string
    name: string | null
    username: string
    email: string
  }
}

interface SearchResult {
  id: string
  username: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: string
}

interface ProjectMembersDialogProps {
  projectId: string
  projectName: string
  currentUserId: string
  currentUserRole?: string
  trigger?: React.ReactNode
}

const roleIcons = {
  OWNER: Crown,
  PM: Shield,
  MEMBER: User,
}

const roleColors = {
  OWNER: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  PM: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  MEMBER: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export function ProjectMembersDialog({
  projectId,
  projectName,
  currentUserId,
  currentUserRole,
  trigger,
}: ProjectMembersDialogProps) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<'PM' | 'MEMBER'>('MEMBER')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null)
  const [searching, setSearching] = useState(false)

  const canManageMembers = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

  useEffect(() => {
    if (open) {
      fetchMembers()
    }
  }, [open, projectId])

  // Search users when email input changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchEmail.trim().length < 2) {
        setSearchResults([])
        setShowSearchResults(false)
        return
      }

      setSearching(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchEmail.trim())}&limit=5`)
        const data = await response.json()
        if (data.success) {
          setSearchResults(data.data)
          setShowSearchResults(true)
        }
      } catch (err) {
        console.error('Failed to search users:', err)
      } finally {
        setSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchEmail])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      const data = await response.json()
      if (data.success) {
        setMembers(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch members:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUser) {
      setError('Please select a user from the search results')
      return
    }

    setAdding(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('projectId', projectId)
      formData.append('userId', selectedUser.id)
      formData.append('role', selectedRole)

      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        await fetchMembers()
        setSearchEmail('')
        setSelectedUser(null)
        setSearchResults([])
        setShowSearchResults(false)
        setSelectedRole('MEMBER')
      } else {
        setError(data.error || 'Failed to add member')
      }
    } catch (err) {
      setError('Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  const handleSelectUser = (user: SearchResult) => {
    setSelectedUser(user)
    setSearchEmail(user.email || user.username || '')
    setShowSearchResults(false)
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchMembers()
      }
    } catch (err) {
      console.error('Failed to remove member:', err)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchMembers()
      }
    } catch (err) {
      console.error('Failed to update role:', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 border-white/10 text-slate-300 hover:bg-white/5">
            <Users className="w-4 h-4" />
            Members
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-slate-950 border border-white/10 shadow-2xl side-panel-content">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100 font-space-grotesk">
            <Users className="w-5 h-5 text-sky-400" />
            Project Members
          </DialogTitle>
          <p className="text-sm text-slate-500">{projectName}</p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add Member Form */}
          {canManageMembers && (
            <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-white/5">
              <div className="relative">
                <Input
                  placeholder="Search by email or username..."
                  value={searchEmail}
                  onChange={(e) => {
                    setSearchEmail(e.target.value)
                    if (!e.target.value) {
                      setSelectedUser(null)
                    }
                  }}
                  className="flex-1 bg-slate-950/50 border-white/10 focus:border-sky-500 text-slate-100"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-500" />
                )}
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-white/10 rounded-md shadow-lg max-h-48 overflow-y-auto glass-panel">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm text-slate-300 border border-white/10">
                          {user.name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {user.name || user.username}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'PM' | 'MEMBER')}
                  className="px-3 py-2 bg-slate-950 border border-white/10 rounded-md text-sm text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-colors"
                >
                  <option value="MEMBER" className="bg-slate-950">Member</option>
                  <option value="PM" className="bg-slate-950">PM</option>
                </select>
                <Button
                  onClick={handleAddMember}
                  disabled={adding || !selectedUser}
                  className="flex-1 gap-2 bg-sky-600 hover:bg-sky-500 text-white border-0 shadow-lg shadow-sky-900/40"
                >
                  {adding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Add Member
                </Button>
              </div>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
            </div>
          )}
          
          {/* Members List */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No members found</p>
            ) : (
              members.map((member) => {
                const RoleIcon = roleIcons[member.role]
                const isCurrentUser = member.userId === currentUserId
                const isOwner = member.role === 'OWNER'
                
                return (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border border-white/5",
                      "bg-slate-900/30 hover:bg-slate-900/50 transition-colors",
                      isCurrentUser && "ring-1 ring-sky-500/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-white/10 text-xs font-bold">
                        {member.user.name?.[0]?.toUpperCase() || member.user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-200">
                          {member.user.name || member.user.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-sky-400">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("gap-1 border-0", roleColors[member.role])}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {member.role}
                      </Badge>
                      
                      {canManageMembers && !isOwner && !isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
