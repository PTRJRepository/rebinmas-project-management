'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Users, FolderKanban, ArrowRight, LogOut, LayoutDashboard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FilterUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  projectCount: number;
  taskCount: number;
}

export default function UserFilterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<FilterUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [canFilterByUser, setCanFilterByUser] = useState(false);

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);

          // Check if user can filter by other users (Manager, Admin, Super Admin)
          const canFilter = ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(data.user?.role);
          setCanFilterByUser(canFilter);

          // Set default selected user to current user
          if (data.user) {
            setSelectedUserId(data.user.id);
          }
        } else {
          // Not logged in, redirect to login
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, [router]);

  // Fetch all users for filter (only for managers/admins)
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (!canFilterByUser) return;

      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAllUsers(data.users || []);
          }
        }
      } catch (error) {
        console.error('Error fetching all users:', error);
      }
    };
    fetchAllUsers();
  }, [canFilterByUser]);

  const handleContinue = () => {
    if (!selectedUserId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Pilih user terlebih dahulu',
      });
      return;
    }

    // Store selected user in localStorage for other pages to use
    localStorage.setItem('selectedUserId', selectedUserId);
    
    // Redirect to projects dashboard
    router.push('/projects');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.clear();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'ADMIN':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MANAGER':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'PM':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <FolderKanban className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                Project Management
              </h1>
              <p className="text-sm text-slate-400">Select user to view projects</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">{currentUser.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor(currentUser.role)}`}>
                  {currentUser.role}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-r from-sky-900/20 to-indigo-900/20 border-sky-500/20">
          <CardHeader>
            <CardTitle className="text-2xl text-sky-100 flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-sky-400" />
              Welcome, {currentUser?.name || 'User'}!
            </CardTitle>
            <CardDescription className="text-slate-400">
              {canFilterByUser 
                ? "Select a user to view their projects and tasks. As a manager/admin, you can view all users' projects."
                : "View your projects and tasks. Select your profile to continue."}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* User Selection */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-400" />
              {canFilterByUser ? 'Select User' : 'Your Profile'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {canFilterByUser 
                ? 'Choose which user\'s projects you want to view'
                : 'Click continue to view your projects'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canFilterByUser ? (
              <div className="space-y-4">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-100 h-12">
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {allUsers.map((user) => (
                      <SelectItem
                        key={user.id}
                        value={user.id}
                        className="text-slate-100 focus:bg-slate-700 focus:text-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-slate-400">@{user.username} • {user.projectCount} projects</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected User Info */}
                {selectedUserId && (
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                        {allUsers.find(u => u.id === selectedUserId)?.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-100">
                          {allUsers.find(u => u.id === selectedUserId)?.name}
                        </div>
                        <div className="text-sm text-slate-400">
                          {allUsers.find(u => u.id === selectedUserId)?.projectCount} projects •{' '}
                          {allUsers.find(u => u.id === selectedUserId)?.taskCount} tasks
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-sky-400" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                    {currentUser?.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-100">{currentUser?.name}</div>
                    <div className="text-sm text-slate-400">@{currentUser?.username}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-sky-400" />
                </div>
              </div>
            )}

            {/* Continue Button */}
            <div className="mt-6">
              <Button
                onClick={handleContinue}
                className="w-full h-12 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-sky-900/40"
              >
                Continue to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {canFilterByUser && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-sky-400">
                  {allUsers.length}
                </div>
                <div className="text-sm text-slate-400 mt-1">Total Users</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-indigo-400">
                  {allUsers.reduce((sum, u) => sum + u.projectCount, 0)}
                </div>
                <div className="text-sm text-slate-400 mt-1">Total Projects</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-emerald-400">
                  {allUsers.reduce((sum, u) => sum + u.taskCount, 0)}
                </div>
                <div className="text-sm text-slate-400 mt-1">Total Tasks</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
