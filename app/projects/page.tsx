'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  FolderKanban,
  FolderOpen,
  Calendar,
  Users,
  Search,
  Star,
  Printer,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Tag,
  User,
  BarChart3,
  ChevronDown,
  ArrowUpDown,
  Trash2,
  RotateCcw,
  XCircle,
  MoreHorizontal,
  Filter,
  UserCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { QuickActions } from '@/components/QuickActions';
import { cn } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  deleteProjectAction,
  restoreProjectAction,
  permanentDeleteProjectAction,
  getDeletedProjectsAction,
  getRecentActivitiesAction
} from '@/app/actions/project';
import { Project, Task } from '@/lib/api/projects';
import { isToday, isTomorrow, isThisWeek, isThisMonth, parseISO, addDays, startOfWeek, endOfWeek, startOfMonth, isWithinInterval } from 'date-fns';
import { TicketPrintPreview } from '@/components/task/TicketPrintPreview';

interface FilterUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  projectCount: number;
  taskCount: number;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [starredProjects, setStarredProjects] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<'status' | 'date' | 'priority' | 'owner' | 'none'>('status');
  const [isMounted, setIsMounted] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // User filter states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<FilterUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [canFilterByUser, setCanFilterByUser] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    bannerImage: '',
    status: '',  // Manual status selection
  });

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Drag and Drop states
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('starredProjects');
    if (saved) {
      setStarredProjects(new Set(JSON.parse(saved)));
    }
    setIsMounted(true);
  }, []);

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

          // Check if there's a stored selected user from filter page
          const storedSelectedUserId = localStorage.getItem('selectedUserId');
          
          if (storedSelectedUserId) {
            // Use stored selection
            setSelectedUserId(storedSelectedUserId);
          } else if (data.user) {
            // Default to current user
            setSelectedUserId(data.user.id);
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching projects, tasks and activities...');

      // Build URL with user filter
      let projectsUrl = '/api/projects';
      if (selectedUserId !== 'all') {
        projectsUrl += `?userId=${selectedUserId}`;
      }

      const results = await Promise.allSettled([
        fetch(projectsUrl),
        fetch('/api/tasks'),
        getRecentActivitiesAction(10)
      ]);

      const projectsResult = results[0];
      const tasksResult = results[1];
      const activitiesResult = results[2];

      // Handle Projects
      if (projectsResult.status === 'fulfilled') {
        const res = projectsResult.value as Response;
        console.log('Projects Res Status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Projects Data:', data);
          setProjects(Array.isArray(data) ? data : []);
        } else {
          console.error('Projects API failed:', res.statusText);
          setProjects([]);
        }
      } else {
        console.error('Projects Fetch failed:', projectsResult.reason);
        setProjects([]);
      }

      // Handle Tasks
      if (tasksResult.status === 'fulfilled') {
        const res = tasksResult.value as Response;
        console.log('Tasks Res Status:', res.status);
        if (res.ok) {
          const data = await res.json();
          setAllTasks(Array.isArray(data) ? data : []);
        } else {
          // Task API might fail if unauthorized, which is expected for public view
          console.warn('Tasks API failed (expected if not logged in):', res.status);
          setAllTasks([]);
        }
      } else {
        console.error('Tasks Fetch failed:', tasksResult.reason);
        setAllTasks([]);
      }

      // Handle Recent Activities
      if (activitiesResult.status === 'fulfilled') {
        const res = activitiesResult.value;
        if (res.success && res.data) {
          setRecentActivities(res.data);
        } else {
          console.error('Activities API failed:', res.error);
          setRecentActivities([]);
        }
      } else {
        console.error('Activities Fetch failed:', activitiesResult.reason);
        setRecentActivities([]);
      }

    } catch (error) {
      console.error('Critical Error in fetchData:', error);
      // Ensure states are cleared on critical error
      setProjects([]);
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when selected user changes
  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [selectedUserId]);

  const fetchDeletedProjects = async () => {
    setLoading(true);
    try {
      const res = await getDeletedProjectsAction();
      if (res.success && res.data) {
        setDeletedProjects(res.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Gagal memuat proyek yang dihapus"
        });
      }
    } catch (error) {
      console.error('Error fetching deleted projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'trash') {
      fetchDeletedProjects();
    } else {
      fetchData();
    }
  }, [viewMode]);

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProject
        ? `/api/projects/${editingProject.id}`
        : '/api/projects';

      const method = editingProject ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Project saved successfully" });
        setDialogOpen(false);
        setEditingProject(null);
        setFormData({ name: '', description: '', startDate: '', endDate: '', bannerImage: '', status: '' });
        fetchData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.error || "Failed to save project"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred"
      });
    }
  };

  const handleDeleteClick = (project: Project) => setProjectToDelete(project);

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== projectToDelete.id));
        setProjectToDelete(null);
        if (starredProjects.has(projectToDelete.id)) {
          const newStarred = new Set(starredProjects);
          newStarred.delete(projectToDelete.id);
          setStarredProjects(newStarred);
          localStorage.setItem('starredProjects', JSON.stringify(Array.from(newStarred)));
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleMoveToTrash = async (project: Project) => {
    try {
      const res = await deleteProjectAction(project.id);
      if (res.success) {
        setProjects(projects.filter(p => p.id !== project.id));
        if (starredProjects.has(project.id)) {
          const newStarred = new Set(starredProjects);
          newStarred.delete(project.id);
          setStarredProjects(newStarred);
          localStorage.setItem('starredProjects', JSON.stringify(Array.from(newStarred)));
        }
        toast({ title: "Berhasil", description: "Proyek dipindahkan ke sampah" });
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error || "Gagal menghapus proyek" });
      }
    } catch (error) {
      console.error('Error moving to trash:', error);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await restoreProjectAction(id);
      if (res.success) {
        setDeletedProjects(deletedProjects.filter(p => p.id !== id));
        toast({ title: "Berhasil", description: "Proyek dipulihkan" });
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error || "Gagal memulihkan proyek" });
      }
    } catch (error) {
      console.error('Error restoring project:', error);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      const res = await permanentDeleteProjectAction(id);
      if (res.success) {
        setDeletedProjects(deletedProjects.filter(p => p.id !== id));
        toast({ title: "Berhasil", description: "Proyek dihapus permanen" });
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error || "Gagal menghapus permanen" });
      }
    } catch (error) {
      console.error('Error permanently deleting project:', error);
    }
  };

  // Bulk Actions
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedProjects(newSelected);
  };

  const handleBulkMoveToTrash = async () => {
    if (!confirm(`Pindahkan ${selectedProjects.size} proyek ke sampah?`)) return;

    setLoading(true);
    for (const id of Array.from(selectedProjects)) {
      await deleteProjectAction(id);
    }
    await fetchData();
    setSelectedProjects(new Set());
    setSelectionMode(false);
    toast({ title: "Selesai", description: "Proyek dipindahkan ke sampah" });
  };

  const handleBulkRestore = async () => {
    setLoading(true);
    for (const id of Array.from(selectedProjects)) {
      await restoreProjectAction(id);
    }
    await fetchDeletedProjects();
    setSelectedProjects(new Set());
    toast({ title: "Selesai", description: "Proyek dipulihkan" });
  };

  const handleBulkPermanentDelete = async () => {
    if (!confirm(`Hapus permanen ${selectedProjects.size} proyek? TIDAK BISA DIKEMBALIKAN!`)) return;

    setLoading(true);
    for (const id of Array.from(selectedProjects)) {
      await permanentDeleteProjectAction(id);
    }
    await fetchDeletedProjects();
    setSelectedProjects(new Set());
    toast({ title: "Selesai", description: "Proyek dihapus permanen" });
  };

  const toggleStar = (projectId: string) => {
    const newStarred = new Set(starredProjects);
    if (newStarred.has(projectId)) newStarred.delete(projectId);
    else newStarred.add(projectId);
    setStarredProjects(newStarred);
    localStorage.setItem('starredProjects', JSON.stringify(Array.from(newStarred)));
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      bannerImage: project.bannerImage || '',
      status: project.status || '',
    });
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingProject(null);
      setFormData({ name: '', description: '', startDate: '', endDate: '', bannerImage: '', status: '' });
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (project: Project) => {
    setDraggedProject(project);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverSection(null);
  };

  const handleDragOver = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    setDragOverSection(section);
  };

  const handleDragLeave = () => {
    setDragOverSection(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: any) => {
    e.preventDefault();
    setDragOverSection(null);

    if (!draggedProject || draggedProject.status === targetStatus) {
      setDraggedProject(null);
      return;
    }

    try {
      const res = await fetch(`/api/projects/${draggedProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draggedProject,
          status: targetStatus
        }),
      });

      if (res.ok) {
        const updatedProject = await res.json();
        // Update local state
        setProjects(projects.map(p => p.id === draggedProject.id ? { ...p, status: targetStatus } : p));
        toast({
          title: "Berhasil",
          description: `Proyek dipindahkan ke ${targetStatus === 'SEKARANG' ? 'Sekarang' : targetStatus === 'RENCANA' ? 'Rencana' : 'Selesai'}`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Gagal memindahkan proyek"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan saat memindahkan proyek"
      });
    }

    setDraggedProject(null);
  };

  // Helper function to get deadline info
  const getDeadlineInfo = (endDate: Date | null) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        status: 'overdue',
        days: Math.abs(diffDays),
        text: `${Math.abs(diffDays)} hari lewat`,
        color: 'green' // Completed projects
      };
    } else if (diffDays === 0) {
      return {
        status: 'today',
        days: 0,
        text: 'Deadline HARI INI!',
        color: 'amber'
      };
    } else if (diffDays === 1) {
      return {
        status: 'tomorrow',
        days: 1,
        text: 'Besok!',
        color: 'amber'
      };
    }
    return {
      status: 'upcoming',
      days: diffDays,
      text: `${diffDays} hari lagi`,
      color: 'blue'
    };
  };

  // Categorize projects - manual status takes precedence
  const categorizeProjects = (projects: Project[]) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const rencana: Project[] = [];
    const sekarang: Project[] = [];
    const selesai: Project[] = [];

    projects.forEach(project => {
      // Manual status takes precedence
      if (project.status) {
        if (project.status === 'RENCANA') {
          rencana.push(project);
        } else if (project.status === 'SELESAI') {
          selesai.push(project);
        } else {
          sekarang.push(project);  // SEKARANG or any other value
        }
        return;
      }

      // Auto-categorize based on dates
      const startDate = project.startDate ? new Date(project.startDate) : null;
      const endDate = project.endDate ? new Date(project.endDate) : null;

      // Selesai: Project yang sudah lewat deadline nya
      if (endDate && endDate < now) {
        selesai.push(project);
      }
      // Sekarang: Project yang sedang berjalan (sudah mulai, belum selesai)
      else if ((!startDate || startDate <= now) && (!endDate || endDate >= now)) {
        sekarang.push(project);
      }
      // Rencana: Project yang akan datang (startDate di masa depan)
      else if (startDate && startDate > now) {
        rencana.push(project);
      }
      // Default: Project tanpa tanggal masuk ke Sekarang
      else {
        sekarang.push(project);
      }
    });

    // Sort each category by time: Start Date (asc) -> End Date (asc) -> Name (asc)
    const sortProjects = (a: Project, b: Project) => {
      // First sort by start date (ascending - oldest first)
      const startA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
      const startB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
      
      if (startA !== startB) {
        return startA - startB;
      }

      // If same start date, sort by end date (ascending - earliest deadline first)
      const endA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      const endB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
      
      if (endA !== endB) {
        return endA - endB;
      }

      // If same dates, sort by name
      return a.name.localeCompare(b.name);
    };

    rencana.sort(sortProjects);
    sekarang.sort(sortProjects);
    selesai.sort(sortProjects);

    // Return in new order: Sekarang, Rencana, Selesai
    return { rencana, sekarang, selesai };
  };

  // Smart Grouping: Group projects by various criteria
  interface GroupedProjects {
    id: string;
    name: string;
    projects: Project[];
  }

  const groupProjects = (projectList: Project[]): GroupedProjects[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = addDays(today, 1);
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);

    if (groupBy === 'none') {
      return [{ id: 'all', name: 'All Projects', projects: projectList }];
    }

    if (groupBy === 'date') {
      const todayProjects: Project[] = [];
      const tomorrowProjects: Project[] = [];
      const thisWeekProjects: Project[] = [];
      const thisMonthProjects: Project[] = [];
      const laterProjects: Project[] = [];
      const noDeadlineProjects: Project[] = [];
      const overdueProjects: Project[] = [];

      projectList.forEach(project => {
        if (!project.endDate) {
          noDeadlineProjects.push(project);
          return;
        }
        const endDate = new Date(project.endDate);

        if (endDate < today) {
          overdueProjects.push(project);
        } else if (isToday(endDate)) {
          todayProjects.push(project);
        } else if (isTomorrow(endDate)) {
          tomorrowProjects.push(project);
        } else if (isWithinInterval(endDate, { start: weekStart, end: weekEnd })) {
          thisWeekProjects.push(project);
        } else if (isThisMonth(endDate)) {
          thisMonthProjects.push(project);
        } else {
          laterProjects.push(project);
        }
      });

      return [
        { id: 'overdue', name: 'Terlambat', projects: overdueProjects },
        { id: 'today', name: `Hari Ini (${today.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}))`, projects: todayProjects },
        { id: 'tomorrow', name: `Besok (${tomorrow.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`, projects: tomorrowProjects },
        { id: 'thisweek', name: 'Minggu Ini', projects: thisWeekProjects },
        { id: 'thismonth', name: 'Bulan Ini', projects: thisMonthProjects },
        { id: 'later', name: 'Nanti', projects: laterProjects },
        { id: 'nodeadline', name: 'Tanpa Deadline', projects: noDeadlineProjects },
      ].filter(g => g.projects.length > 0);
    }

    if (groupBy === 'priority') {
      const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      return priorities.map(priority => ({
        id: priority,
        name: priority === 'CRITICAL' ? 'Kritis' :
              priority === 'HIGH' ? 'Tinggi' :
              priority === 'MEDIUM' ? 'Sedang' : 'Rendah',
        projects: projectList.filter(p => p.priority === priority)
      })).filter(g => g.projects.length > 0);
    }

    if (groupBy === 'owner') {
      const ownerGroups: Record<string, Project[]> = {};
      projectList.forEach(project => {
        const ownerName = project.owner?.name || project.ownerName || 'Unknown';
        if (!ownerGroups[ownerName]) ownerGroups[ownerName] = [];
        ownerGroups[ownerName].push(project);
      });
      return Object.keys(ownerGroups)
        .sort()
        .map(name => ({ id: name, name, projects: ownerGroups[name] }));
    }

    // Default: group by status (Sekarang/Rencana/Selesai)
    const { rencana, sekarang, selesai } = categorizeProjects(projectList);
    return [
      { id: 'sekarang', name: 'Sekarang', projects: sekarang },
      { id: 'rencana', name: 'Rencana', projects: rencana },
      { id: 'selesai', name: 'Selesai', projects: selesai },
    ].filter(g => g.projects.length > 0);
  };

  // Filter and categorize
  const filteredProjects = (projects || []).filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

  const { rencana, sekarang, selesai } = categorizeProjects(filteredProjects);

  // Use groupProjects for rendering when groupBy is not 'status'
  const groupedProjects = groupProjects(filteredProjects);

  const stats = {
    totalProjects: (projects || []).length,
    totalTasks: (allTasks || []).length,
    rencanaCount: rencana.length,
    sekarangCount: sekarang.length,
    selesaiCount: selesai.length,
  };

  return (
    <div className="min-h-screen">
      {/* Header with Neon Styling */}
      <div className="glass-panel border-b border-cyan-500/10 p-4 sticky top-0 z-40">
        <div className="max-w-full mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-sky-100 heading-glow">
              Dashboard Proyek
            </h1>
            <p className="text-sm text-sky-400/70 mt-1">
              {viewMode === 'active' ? 'Kelola proyek Anda dari rencana hingga selesai' : 'Kelola proyek yang dihapus'}
            </p>
            {/* User Filter Dropdown - Only visible for Manager/Admin/Super Admin */}
            {canFilterByUser && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-cyan-400/70" />
                <span className="text-xs text-cyan-400/70">Filter:</span>
                <Select value={selectedUserId} onValueChange={(value: string) => setSelectedUserId(value)}>
                  <SelectTrigger className="h-7 w-[220px] bg-slate-800/60 border border-cyan-500/20 text-xs font-medium text-sky-100 focus:ring-cyan-500/30">
                    <SelectValue placeholder="Pilih user" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border border-cyan-500/20 max-h-[300px]">
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-medium">Semua User</span>
                      </div>
                    </SelectItem>
                    {allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <div className="flex items-center gap-2">
                            <UserCircle className={cn(
                              "w-3.5 h-3.5",
                              user.role === 'SUPER_ADMIN' ? "text-amber-400" :
                              user.role === 'ADMIN' ? "text-red-400" :
                              user.role === 'MANAGER' ? "text-purple-400" :
                              "text-slate-400"
                            )} />
                            <span>{user.name}</span>
                            <span className="text-[10px] text-slate-500">@{user.username}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{user.projectCount} proj</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUserId !== 'all' && allUsers.find(u => u.id === selectedUserId) && (
                  <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      allUsers.find(u => u.id === selectedUserId)?.role === 'SUPER_ADMIN' ? "bg-amber-500/20 text-amber-400" :
                      allUsers.find(u => u.id === selectedUserId)?.role === 'ADMIN' ? "bg-red-500/20 text-red-400" :
                      allUsers.find(u => u.id === selectedUserId)?.role === 'MANAGER' ? "bg-purple-500/20 text-purple-400" :
                      "bg-slate-700 text-slate-400"
                    )}>
                      {allUsers.find(u => u.id === selectedUserId)?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-cyan-400 font-medium">
                      {allUsers.find(u => u.id === selectedUserId)?.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUserId('all')}
                      className="h-4 w-4 p-0 text-cyan-400/70 hover:text-cyan-400"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
            {/* View Toggle */}
            <div className="flex rounded-lg bg-slate-800/60 p-1 border border-cyan-500/20 shrink-0">
              <button
                onClick={() => setViewMode('active')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  viewMode === 'active' ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Aktif
              </button>
              <button
                onClick={() => setViewMode('trash')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                  viewMode === 'trash' ? "bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(248,113,113,0.2)]" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Trash2 className="w-3 h-3" />
                Sampah
              </button>
            </div>

            {/* Smart Group Selector */}
            {viewMode === 'active' && (
              <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-white/5 shrink-0 overflow-x-auto max-w-full">
                <Button
                  variant={groupBy === 'status' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-7 text-[10px] font-bold px-3 gap-1.5 whitespace-nowrap",
                    groupBy === 'status' ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "text-slate-400"
                  )}
                  onClick={() => setGroupBy('status')}
                >
                  <LayoutGrid className="w-3 h-3" />
                  STATUS
                </Button>
                <Button
                  variant={groupBy === 'date' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-7 text-[10px] font-bold px-3 gap-1.5 whitespace-nowrap",
                    groupBy === 'date' ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "text-slate-400"
                  )}
                  onClick={() => setGroupBy('date')}
                >
                  <Calendar className="w-3 h-3" />
                  TANGGAL
                </Button>
                <Button
                  variant={groupBy === 'priority' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-7 text-[10px] font-bold px-3 gap-1.5 whitespace-nowrap",
                    groupBy === 'priority' ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "text-slate-400"
                  )}
                  onClick={() => setGroupBy('priority')}
                >
                  <BarChart3 className="w-3 h-3" />
                  PRIORITAS
                </Button>
                <Button
                  variant={groupBy === 'owner' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-7 text-[10px] font-bold px-3 gap-1.5 whitespace-nowrap",
                    groupBy === 'owner' ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "text-slate-400"
                  )}
                  onClick={() => setGroupBy('owner')}
                >
                  <User className="w-3 h-3" />
                  OWNER
                </Button>
              </div>
            )}

            {/* Bulk Actions Toolbar */}
            {selectedProjects.size > 0 && (
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-cyan-500/30 animate-in fade-in slide-in-from-top-2 shrink-0">
                <span className="text-xs text-slate-300 font-medium mr-2 hidden sm:inline">{selectedProjects.size} dipilih</span>
                <Button size="sm" variant="outline" onClick={handlePrint} className="h-7 text-xs border-sky-500/30 text-sky-400 hover:bg-sky-500/10">
                    <Printer className="w-3 h-3 sm:mr-1" />
                    <span className="hidden sm:inline">Print</span>
                </Button>
                {viewMode === 'active' ? (
                  <Button size="sm" variant="destructive" onClick={handleBulkMoveToTrash} className="h-7 text-xs">
                    <Trash2 className="w-3 h-3 sm:mr-1" />
                    <span className="hidden sm:inline">Buang</span>
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={handleBulkRestore} className="h-7 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10">
                      <RotateCcw className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Pulihkan</span>
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleBulkPermanentDelete} className="h-7 text-xs">
                      <XCircle className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Hapus Permanen</span>
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => setSelectedProjects(new Set())} className="h-7 w-7 p-0">
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            )}
            {/* Status & Priority Filters */}
            <div className="flex items-center gap-2 shrink-0">
              <Select value={statusFilter} onValueChange={(v: string) => setStatusFilter(v)}>
                <SelectTrigger className="h-9 w-[120px] bg-slate-800/60 border border-cyan-500/20 text-[10px] font-bold text-sky-100">
                  <SelectValue placeholder="STATUS" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border border-cyan-500/20">
                  <SelectItem value="all">SEMUA STATUS</SelectItem>
                  <SelectItem value="SEKARANG">SEKARANG</SelectItem>
                  <SelectItem value="RENCANA">RENCANA</SelectItem>
                  <SelectItem value="SELESAI">SELESAI</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(v: string) => setPriorityFilter(v)}>
                <SelectTrigger className="h-9 w-[120px] bg-slate-800/60 border border-cyan-500/20 text-[10px] font-bold text-sky-100">
                  <SelectValue placeholder="PRIORITAS" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border border-cyan-500/20">
                  <SelectItem value="all">SEMUA PRIORITAS</SelectItem>
                  <SelectItem value="CRITICAL">KRITIS</SelectItem>
                  <SelectItem value="HIGH">TINGGI</SelectItem>
                  <SelectItem value="MEDIUM">SEDANG</SelectItem>
                  <SelectItem value="LOW">RENDAH</SelectItem>
                </SelectContent>
              </Select>

              {(statusFilter !== 'all' || priorityFilter !== 'all' || searchTerm !== '' || selectedUserId !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setSearchTerm('');
                    setSelectedUserId(currentUser?.id || 'all');
                  }}
                  className="h-9 px-2 text-[10px] font-bold text-slate-400 hover:text-white"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  RESET
                </Button>
              )}
            </div>

            <div className="relative shrink-1 w-full sm:w-auto min-w-[150px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/50" />
              <Input
                placeholder="Cari proyek..."
                className="pl-10 pr-4 py-2 border border-cyan-500/20 rounded-lg text-sm w-full sm:w-64 bg-slate-800/60 text-sky-100 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-cyan-500/30 text-sky-400 hover:bg-cyan-500/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] shrink-0"
            >
              <Printer className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>

            <Button
              onClick={() => {
                setEditingProject(null);
                setFormData({ name: '', description: '', startDate: '', endDate: '', bannerImage: '', status: '' });
                setDialogOpen(true);
              }}
              className="btn-neon-primary shrink-0 whitespace-nowrap"
              disabled={viewMode === 'trash'}
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              Proyek Baru
            </Button>

            <Button
              variant="outline"
              onClick={() => setSelectionMode(!selectionMode)}
              className={cn(
                "border-cyan-500/30",
                selectionMode ? "bg-cyan-500/20 text-cyan-400" : "text-sky-400 hover:bg-cyan-500/10"
              )}
            >
              {selectionMode ? 'Batal Pilih' : 'Pilih'}
            </Button>
          </div>
        </div>
      </div>

      <main className="px-6 py-6">

        {viewMode === 'active' ? (
          /* Active Projects View */
          <>
            {/* Stats Cards with Neon Styling */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="glass-card border border-cyan-500/20 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-sky-400">Total Proyek</p>
                      <h3 className="text-2xl font-semibold text-cyan-400 mt-1 text-neon-blue">{stats.totalProjects}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                      <FolderKanban className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border border-amber-500/20 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-400">Sekarang</p>
                      <h3 className="text-2xl font-semibold text-amber-400 mt-1" style={{ textShadow: '0 0 10px rgba(251,191,36,0.5)' }}>{stats.sekarangCount}</h3>
                      <p className="text-xs text-amber-400/70">Sedang berjalan</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                      <Clock className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border border-sky-500/20 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-sky-400">Rencana</p>
                      <h3 className="text-2xl font-semibold text-sky-400 mt-1" style={{ textShadow: '0 0 10px rgba(56,189,248,0.5)' }}>{stats.rencanaCount}</h3>
                      <p className="text-xs text-sky-400/70">Akan datang</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                      <Calendar className="w-6 h-6 text-sky-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border border-green-500/20 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)] transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-400">Selesai</p>
                      <h3 className="text-2xl font-semibold text-green-400 mt-1" style={{ textShadow: '0 0 10px rgba(74,222,128,0.5)' }}>{stats.selesaiCount}</h3>
                      <p className="text-xs text-green-400/70">Sudah selesai</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(74,222,128,0.3)]">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-96 bg-slate-800/40 animate-pulse rounded-xl border border-cyan-500/10" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <Card className="border border-dashed border-cyan-500/20 glass-card">
                <CardContent className="p-12 text-center">
                  <FolderKanban className="w-16 h-16 mx-auto text-sky-400/40 mb-4" />
                  <h3 className="text-lg font-semibold text-sky-100 mb-2">Tidak ada proyek ditemukan</h3>
                  <p className="text-sky-400/70 mb-6">Buat proyek pertama Anda untuk memulai</p>
                  <Button onClick={() => setDialogOpen(true)} className="btn-neon-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Proyek
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Three Row Layout - Horizontal Cards - Order: SEKARANG, RENCANA, SELESAI */
              <div className="space-y-6">

                {/* SEKARANG - Proyek yang sedang berjalan */}
                <div
                  className={cn(
                    "glass-card rounded-xl border shadow-[0_0_20px_rgba(251,191,36,0.15)] overflow-hidden transition-all duration-200",
                    dragOverSection === 'SEKARANG' ? "border-amber-400 ring-4 ring-amber-400/30 scale-[1.01]" : "border-amber-500/30"
                  )}
                  onDragOver={(e) => handleDragOver(e, 'SEKARANG')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'SEKARANG')}
                >
                  <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)] animate-pulse"></div>
                        <div>
                          <h2 className="text-base font-semibold text-amber-400" style={{ textShadow: '0 0 10px rgba(251,191,36,0.5)' }}>Sekarang</h2>
                          <p className="text-xs text-amber-400/70">Sedang berjalan</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-amber-400">{sekarang.length}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    {sekarang.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">
                        {draggedProject ? 'Drop proyek di sini' : 'Tidak ada proyek aktif'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {sekarang.map((project) => {
                          const deadlineInfo = getDeadlineInfo(project.endDate || null);
                          const priority = project.priority || 'MEDIUM';
                          
                          // Colorful gradients based on priority
                          const priorityGradients = {
                            LOW: {
                              border: 'border-emerald-500/40',
                              gradient: 'from-emerald-500/10 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
                              badgeBg: 'bg-emerald-500/20',
                              badgeText: 'text-emerald-400',
                              badgeBorder: 'border-emerald-400/30',
                            },
                            MEDIUM: {
                              border: 'border-amber-500/40',
                              gradient: 'from-amber-500/10 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
                              badgeBg: 'bg-amber-500/20',
                              badgeText: 'text-amber-400',
                              badgeBorder: 'border-amber-400/30',
                            },
                            HIGH: {
                              border: 'border-orange-500/40',
                              gradient: 'from-orange-500/10 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
                              badgeBg: 'bg-orange-500/20',
                              badgeText: 'text-orange-400',
                              badgeBorder: 'border-orange-400/30',
                            },
                            CRITICAL: {
                              border: 'border-red-500/40',
                              gradient: 'from-red-500/10 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
                              badgeBg: 'bg-red-500/20',
                              badgeText: 'text-red-400',
                              badgeBorder: 'border-red-400/30',
                            },
                          };
                          const priorityStyle = priorityGradients[priority as keyof typeof priorityGradients] || priorityGradients.MEDIUM;

                          return (
                            <div key={project.id} className="w-full">
                              <Card
                                draggable
                                onDragStart={() => handleDragStart(project)}
                                onDragEnd={handleDragEnd}
                                onClick={() => router.push(`/projects/${project.id}`)}
                                className={cn(
                                  "glass-card h-full border transition-all cursor-pointer overflow-hidden flex flex-col relative group",
                                  "bg-gradient-to-br", priorityStyle.gradient,
                                  priorityStyle.border, priorityStyle.glow,
                                  "hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02]",
                                  draggedProject?.id === project.id ? "opacity-50 scale-95" : "",
                                  starredProjects.has(project.id) && "ring-2 ring-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.4)]",
                                  selectedProjects.has(project.id) && "ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] transform scale-[1.02]"
                                )}
                              >
                                {/* Selection Checkbox */}
                                {(selectionMode || selectedProjects.size > 0) && (
                                  <div className="absolute top-2 left-2 z-20" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={selectedProjects.has(project.id)}
                                      onCheckedChange={() => toggleSelection(project.id)}
                                      className="border-white/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 w-5 h-5"
                                    />
                                  </div>
                                )}
                                {/* Banner Image */}
                                <div className="relative h-32 overflow-hidden bg-slate-800">
                                  <img
                                    src={project.bannerImage || 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg'}
                                    alt={project.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent"></div>

                                  {/* Top badges */}
                                  <div className={cn("absolute top-2 left-2 flex gap-2", (selectionMode || selectedProjects.size > 0) ? "pl-6" : "")}>
                                    {/* Priority Badge */}
                                    <span className={cn(
                                      "px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide border backdrop-blur-sm",
                                      priorityStyle.badgeBg, priorityStyle.badgeText, priorityStyle.badgeBorder
                                    )}>
                                      {priority === 'LOW' ? '🟢 Low' : priority === 'MEDIUM' ? '🟡 Medium' : priority === 'HIGH' ? '🟠 High' : '🔴 Critical'}
                                    </span>
                                    {/* Urgent Badge */}
                                    {deadlineInfo && deadlineInfo.color === 'amber' && (
                                      <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1 animate-pulse shadow-lg">
                                        <Clock className="w-3 h-3" />
                                        {deadlineInfo.days === 0 ? 'HARI INI' : `${deadlineInfo.days} HARI`}
                                      </span>
                                    )}
                                  </div>
                                  <div className="absolute top-2 right-2 flex gap-1">
                                    {starredProjects.has(project.id) && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-md" />}
                                  </div>

                                  {/* Project name overlay at bottom */}
                                  <div className="absolute bottom-2 left-3 right-3">
                                    <div className="bg-slate-950/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/5 shadow-lg">
                                      <h3 className="font-bold text-white text-sm whitespace-normal break-words leading-tight">{project.name}</h3>
                                    </div>
                                  </div>
                                </div>

                                <CardContent className="p-4 flex-1 flex flex-col">
                                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 h-8">
                                    {project.description || 'Tidak ada deskripsi'}
                                  </p>

                                  {/* Highlighted Deadline Section */}
                                  {project.endDate && deadlineInfo ? (
                                    <div className={cn(
                                      "rounded-lg p-3 mb-3 border",
                                      deadlineInfo.color === 'red' ? "bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]" :
                                        deadlineInfo.color === 'amber' ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" :
                                          "bg-sky-500/10 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]"
                                    )}>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold uppercase text-slate-500">Deadline</span>
                                        <Clock className={cn(
                                          "w-4 h-4",
                                          deadlineInfo.color === 'red' ? "text-red-400 animate-pulse" :
                                            deadlineInfo.color === 'amber' ? "text-amber-400" : "text-sky-400"
                                        )} />
                                      </div>
                                      <div className="flex items-baseline gap-2">
                                        <span className={cn(
                                          "text-2xl font-black heading-glow",
                                          deadlineInfo.color === 'red' ? "text-red-400" :
                                            deadlineInfo.color === 'amber' ? "text-amber-400" : "text-sky-400"
                                        )}>
                                          {deadlineInfo.days === 0 ? 'HARI INI' : `${deadlineInfo.days}`}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                          {deadlineInfo.days === 0 ? '' : 'hari lagi'}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-1 font-medium">
                                        {new Date(project.endDate).toLocaleDateString('id-ID', {
                                          weekday: 'short',
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg p-3 mb-3 bg-slate-800/50 border border-white/5">
                                      <span className="text-xs text-slate-500">Tidak ada deadline</span>
                                    </div>
                                  )}

                                  <div className="mt-auto pt-3 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                        <div className="flex items-center gap-1">
                                          <Users className="w-3 h-3 text-sky-400" />
                                          <span className="truncate max-w-[60px]">{project.owner?.username || 'Unknown'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                          <span>{project._count?.tasks || 0} tasks</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <FolderOpen className="w-3 h-3 text-amber-400" />
                                          <span>{project._count?.docs || 0} Assets</span>
                                        </div>
                                      </div>
                                      <QuickActions
                                        projectId={project.id}
                                        isStarred={starredProjects.has(project.id)}
                                        onStar={() => toggleStar(project.id)}
                                        onEdit={() => handleEditClick(project)}
                                        onDelete={() => handleMoveToTrash(project)}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* RENCANA - Proyek yang akan datang */}
                <div
                  className={cn(
                    "glass-card rounded-xl border shadow-[0_0_20px_rgba(56,189,248,0.15)] overflow-hidden transition-all duration-200",
                    dragOverSection === 'RENCANA' ? "border-sky-400 ring-4 ring-sky-400/30 scale-[1.01]" : "border-sky-500/30"
                  )}
                  onDragOver={(e) => handleDragOver(e, 'RENCANA')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'RENCANA')}
                >
                  <div className="bg-sky-500/10 border-b border-sky-500/20 px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)]"></div>
                        <div>
                          <h2 className="text-base font-semibold text-sky-400" style={{ textShadow: '0 0 10px rgba(56,189,248,0.5)' }}>Rencana</h2>
                          <p className="text-xs text-sky-400/70">Proyek yang akan datang</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-sky-400">{rencana.length}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    {rencana.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">
                        {draggedProject ? 'Drop proyek di sini' : 'Tidak ada proyek terencana'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {rencana.map((project) => {
                          const deadlineInfo = getDeadlineInfo(project.endDate || null);
                          const priority = project.priority || 'MEDIUM';
                          
                          // Colorful gradients based on priority
                          const priorityGradients = {
                            LOW: {
                              border: 'border-emerald-500/40',
                              gradient: 'from-emerald-500/10 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
                              badgeBg: 'bg-emerald-500/20',
                              badgeText: 'text-emerald-400',
                              badgeBorder: 'border-emerald-400/30',
                            },
                            MEDIUM: {
                              border: 'border-sky-500/40',
                              gradient: 'from-sky-500/10 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_20px_rgba(14,165,233,0.2)]',
                              badgeBg: 'bg-sky-500/20',
                              badgeText: 'text-sky-400',
                              badgeBorder: 'border-sky-400/30',
                            },
                            HIGH: {
                              border: 'border-orange-500/40',
                              gradient: 'from-orange-500/10 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
                              badgeBg: 'bg-orange-500/20',
                              badgeText: 'text-orange-400',
                              badgeBorder: 'border-orange-400/30',
                            },
                            CRITICAL: {
                              border: 'border-red-500/40',
                              gradient: 'from-red-500/10 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
                              badgeBg: 'bg-red-500/20',
                              badgeText: 'text-red-400',
                              badgeBorder: 'border-red-400/30',
                            },
                          };
                          const priorityStyle = priorityGradients[priority as keyof typeof priorityGradients] || priorityGradients.MEDIUM;

                          return (
                            <div key={project.id} className="w-full">
                              <Card
                                draggable
                                onDragStart={() => handleDragStart(project)}
                                onDragEnd={handleDragEnd}
                                onClick={() => router.push(`/projects/${project.id}`)}
                                className={cn(
                                  "glass-card h-full border transition-all cursor-pointer overflow-hidden flex flex-col relative group",
                                  "bg-gradient-to-br", priorityStyle.gradient,
                                  priorityStyle.border, priorityStyle.glow,
                                  "hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02]",
                                  draggedProject?.id === project.id ? "opacity-50 scale-95" : "",
                                  starredProjects.has(project.id) && "ring-2 ring-sky-400/40 shadow-[0_0_25px_rgba(56,189,248,0.4)]",
                                  selectedProjects.has(project.id) && "ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] transform scale-[1.02]"
                                )}
                              >
                                {/* Selection Checkbox */}
                                {(selectionMode || selectedProjects.size > 0) && (
                                  <div className="absolute top-2 left-2 z-20" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={selectedProjects.has(project.id)}
                                      onCheckedChange={() => toggleSelection(project.id)}
                                      className="border-white/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 w-5 h-5"
                                    />
                                  </div>
                                )}
                                {/* Banner Image */}
                                <div className="relative h-32 overflow-hidden bg-slate-800">
                                  <img
                                    src={project.bannerImage || 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg'}
                                    alt={project.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent"></div>

                                  {/* Top badges */}
                                  <div className={cn("absolute top-2 left-2 flex gap-2", (selectionMode || selectedProjects.size > 0) ? "pl-6" : "")}>
                                    {/* Priority Badge */}
                                    <span className={cn(
                                      "px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide border backdrop-blur-sm",
                                      priorityStyle.badgeBg, priorityStyle.badgeText, priorityStyle.badgeBorder
                                    )}>
                                      {priority === 'LOW' ? '🟢 Low' : priority === 'MEDIUM' ? '🟡 Medium' : priority === 'HIGH' ? '🟠 High' : '🔴 Critical'}
                                    </span>
                                  </div>
                                  <div className="absolute top-2 right-2 flex gap-1">
                                    {starredProjects.has(project.id) && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-md" />}
                                  </div>

                                  {/* Project name overlay at bottom */}
                                  <div className="absolute bottom-2 left-3 right-3">
                                    <div className="bg-slate-950/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/5 shadow-lg">
                                      <h3 className="font-bold text-white text-sm whitespace-normal break-words leading-tight">{project.name}</h3>
                                    </div>
                                  </div>
                                </div>

                                <CardContent className="p-4 flex-1 flex flex-col">
                                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 h-8">
                                    {project.description || 'Tidak ada deskripsi'}
                                  </p>

                                  {/* Highlighted Deadline Section */}
                                  {project.endDate && deadlineInfo ? (
                                    <div className={cn(
                                      "rounded-lg p-3 mb-3 border",
                                      deadlineInfo.color === 'red' ? "bg-red-500/10 border-red-500/30" :
                                        deadlineInfo.color === 'amber' ? "bg-amber-500/10 border-amber-500/30" :
                                          "bg-sky-500/10 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]"
                                    )}>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold uppercase text-slate-500">Deadline</span>
                                        {deadlineInfo.status !== 'normal' && (
                                          <Clock className={cn(
                                            "w-4 h-4",
                                            deadlineInfo.color === 'red' ? "text-red-400 animate-pulse" :
                                              deadlineInfo.color === 'amber' ? "text-amber-400" : "text-sky-400"
                                          )} />
                                        )}
                                      </div>
                                      <div className="flex items-baseline gap-2">
                                        <span className={cn(
                                          "text-xl font-bold",
                                          deadlineInfo.color === 'red' ? "text-red-400" :
                                            deadlineInfo.color === 'amber' ? "text-amber-400" : "text-sky-400"
                                        )}>
                                          {deadlineInfo.days} hari
                                        </span>
                                        <span className="text-xs text-slate-400">lagi</span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-1">
                                        {new Date(project.endDate).toLocaleDateString('id-ID', {
                                          weekday: 'short',
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg p-3 mb-3 bg-slate-800/50 border border-white/5">
                                      <span className="text-xs text-slate-500">Tidak ada deadline</span>
                                    </div>
                                  )}

                                  {/* Start Date */}
                                  {project.startDate && (
                                    <div className="flex items-center gap-2 text-xs text-sky-400 mb-3">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        Mulai: {new Date(project.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </span>
                                    </div>
                                  )}

                                  <div className="mt-auto pt-3 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                        <div className="flex items-center gap-1">
                                          <Users className="w-3 h-3 text-sky-400" />
                                          <span className="truncate max-w-[60px]">{project.owner?.username || 'Unknown'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                          <span>{project._count?.tasks || 0} tasks</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <FolderOpen className="w-3 h-3 text-amber-400" />
                                          <span>{project._count?.docs || 0} Assets</span>
                                        </div>
                                      </div>
                                      <QuickActions
                                        projectId={project.id}
                                        isStarred={starredProjects.has(project.id)}
                                        onStar={() => toggleStar(project.id)}
                                        onEdit={() => handleEditClick(project)}
                                        onDelete={() => handleDeleteClick(project)}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* SELESAI - Proyek yang sudah selesai */}
                {/* Same structure for Selesai, adding selection logic */}
                <div
                  className={cn(
                    "glass-card rounded-xl border shadow-[0_0_20px_rgba(74,222,128,0.15)] overflow-hidden transition-all duration-200",
                    dragOverSection === 'SELESAI' ? "border-green-400 ring-4 ring-green-400/30 scale-[1.01]" : "border-green-500/30"
                  )}
                  onDragOver={(e) => handleDragOver(e, 'SELESAI')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'SELESAI')}
                >
                  {/* ... (Header content unchanged) ... */}
                  <div className="bg-green-500/10 border-b border-green-500/20 px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]"></div>
                        <div>
                          <h2 className="text-base font-semibold text-green-400" style={{ textShadow: '0 0 10px rgba(74,222,128,0.5)' }}>Selesai</h2>
                          <p className="text-xs text-green-400/70">Sudah selesai</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-green-400">{selesai.length}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    {selesai.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">
                        {draggedProject ? 'Drop proyek di sini' : 'Belum ada proyek selesai'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {selesai.map((project) => {
                          const priority = project.priority || 'MEDIUM';
                          
                          // Colorful gradients based on priority for completed projects
                          const priorityGradients = {
                            LOW: {
                              border: 'border-emerald-500/30',
                              gradient: 'from-emerald-500/5 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
                              badgeBg: 'bg-emerald-500/20',
                              badgeText: 'text-emerald-400',
                              badgeBorder: 'border-emerald-400/30',
                            },
                            MEDIUM: {
                              border: 'border-violet-500/30',
                              gradient: 'from-violet-500/5 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]',
                              badgeBg: 'bg-violet-500/20',
                              badgeText: 'text-violet-400',
                              badgeBorder: 'border-violet-400/30',
                            },
                            HIGH: {
                              border: 'border-fuchsia-500/30',
                              gradient: 'from-fuchsia-500/5 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_15px_rgba(217,70,239,0.15)]',
                              badgeBg: 'bg-fuchsia-500/20',
                              badgeText: 'text-fuchsia-400',
                              badgeBorder: 'border-fuchsia-400/30',
                            },
                            CRITICAL: {
                              border: 'border-rose-500/30',
                              gradient: 'from-rose-500/5 via-slate-900/40 to-slate-950/40',
                              glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
                              badgeBg: 'bg-rose-500/20',
                              badgeText: 'text-rose-400',
                              badgeBorder: 'border-rose-400/30',
                            },
                          };
                          const priorityStyle = priorityGradients[priority as keyof typeof priorityGradients] || priorityGradients.MEDIUM;

                          return (
                            <div key={project.id} className="w-full">
                              <Card
                                draggable
                                onDragStart={() => handleDragStart(project)}
                                onDragEnd={handleDragEnd}
                                onClick={() => router.push(`/projects/${project.id}`)}
                                className={cn(
                                  "glass-card h-full border transition-all cursor-pointer opacity-60 hover:opacity-100 overflow-hidden flex flex-col relative group",
                                  "bg-gradient-to-br", priorityStyle.gradient,
                                  priorityStyle.border, priorityStyle.glow,
                                  "hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] hover:scale-[1.02]",
                                  draggedProject?.id === project.id ? "opacity-50 scale-95" : "",
                                  starredProjects.has(project.id) && "ring-2 ring-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                )}
                              >
                                {/* Banner Image */}
                                <div className="relative h-32 overflow-hidden bg-slate-800">
                                  <img
                                    src={project.bannerImage || 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg'}
                                    alt={project.name}
                                    className="w-full h-full object-cover grayscale"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent"></div>

                                  {/* Top badges */}
                                  <div className={cn("absolute top-2 left-2 flex gap-2", (selectionMode || selectedProjects.size > 0) ? "pl-6" : "")}>
                                    {/* Priority Badge */}
                                    <span className={cn(
                                      "px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-green-500/20 text-green-400 border border-green-500/30",
                                    )}>
                                      {priority === 'LOW' ? '🟢 Low' : priority === 'MEDIUM' ? '🟡 Medium' : priority === 'HIGH' ? '🟠 High' : '🔴 Critical'}
                                    </span>
                                    {/* Completed Badge */}
                                    <span className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1 backdrop-blur-sm">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Selesai
                                    </span>
                                  </div>
                                  <div className="absolute top-2 right-2 flex gap-1">
                                    {starredProjects.has(project.id) && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-md" />}
                                  </div>

                                  {/* Project name overlay at bottom */}
                                  <div className="absolute bottom-2 left-3 right-3">
                                    <div className="bg-slate-950/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/5 shadow-lg">
                                      <h3 className="font-bold text-white text-sm drop-shadow-lg line-through whitespace-normal break-words leading-tight">{project.name}</h3>
                                    </div>
                                  </div>
                                </div>

                                <CardContent className="p-4 flex-1 flex flex-col">
                                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 h-8">
                                    {project.description || 'Tidak ada deskripsi'}
                                  </p>

                                  {/* Completed Date Section */}
                                  {project.endDate && (
                                    <div className="rounded-lg p-3 mb-3 bg-green-500/10 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold uppercase text-slate-500">Selesai Tanggal</span>
                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                      </div>
                                      <div className="text-sm font-bold text-green-400 heading-glow">
                                        {new Date(project.endDate).toLocaleDateString('id-ID', {
                                          weekday: 'short',
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  <div className="mt-auto pt-3 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                        <div className="flex items-center gap-1">
                                          <Users className="w-3 h-3 text-sky-400" />
                                          <span className="truncate max-w-[60px]">{project.owner?.username || 'Unknown'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                          <span>{project._count?.tasks || 0} tasks</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <FolderOpen className="w-3 h-3 text-amber-400" />
                                          <span>{project._count?.docs || 0} Assets</span>
                                        </div>
                                      </div>
                                      <QuickActions
                                        projectId={project.id}
                                        isStarred={starredProjects.has(project.id)}
                                        onStar={() => toggleStar(project.id)}
                                        onEdit={() => handleEditClick(project)}
                                        onDelete={() => handleDeleteClick(project)}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                                </div>
                
                                {/* Global Recent Activity */}
                                {recentActivities.length > 0 && (
                                  <div className="mt-8">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                        <Clock className="w-5 h-5 text-indigo-400" />
                                      </div>
                                      <div>
                                        <h2 className="text-xl font-bold text-sky-100 heading-glow">Aktivitas Terbaru</h2>
                                        <p className="text-sm text-sky-400/70">Pembaruan terkini dari semua proyek</p>
                                      </div>
                                    </div>
                                    <Card className="glass-card border border-cyan-500/10 overflow-hidden">
                                      <CardContent className="p-0">
                                        <div className="divide-y divide-cyan-500/10">
                                          {recentActivities.map((activity) => (
                                            <div key={activity.id} className="p-4 hover:bg-white/5 transition-colors group">
                                              <div className="flex items-start justify-between gap-4">
                                                <div className="flex gap-3">
                                                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                                    <Users className="w-4 h-4 text-indigo-400" />
                                                  </div>
                                                  <div>
                                                    <p className="text-sm text-sky-100">
                                                      <span className="font-semibold text-cyan-400">{activity.userName}</span> memperbarui <span className="font-medium italic">"{activity.content}"</span>
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                      <Link href={`/projects/${activity.projectId}`} className="text-xs text-indigo-400 hover:underline">
                                                        {activity.projectName}
                                                      </Link>
                                                      <span className="text-[10px] text-sky-400/40">•</span>
                                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                                        {activity.statusName || 'Updated'}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                                <span className="text-[10px] text-sky-400/50 whitespace-nowrap pt-1">
                                                  {new Date(activity.date).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                
                              </div>
                            )}
                          </>
                        ) : groupBy !== 'status' && groupBy !== 'none' ? (
          /* Smart Grouping View */
          <div className="space-y-6">
            {groupedProjects.map((group) => (
              <div
                key={group.id}
                className="glass-card rounded-xl border border-cyan-500/20 overflow-hidden"
              >
                {/* Group Header */}
                <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]"></div>
                      <div>
                        <h2 className="text-base font-semibold text-cyan-400" style={{ textShadow: '0 0 10px rgba(34,211,238,0.5)' }}>
                          {group.name}
                        </h2>
                        <p className="text-xs text-cyan-400/70">
                          {group.projects.length} {group.projects.length === 1 ? 'proyek' : 'proyek'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-cyan-400">{group.projects.length}</span>
                  </div>
                </div>

                {/* Group Projects Grid */}
                <div className="p-4">
                  {group.projects.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">Tidak ada proyek</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {group.projects.map((project) => {
                        const deadlineInfo = getDeadlineInfo(project.endDate || null);
                        const priority = project.priority || 'MEDIUM';
                        const priorityColors = {
                          LOW: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-400/30', shadow: 'shadow-[0_0_10px_rgba(74,222,128,0.3)]' },
                          MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-400/30', shadow: 'shadow-[0_0_10px_rgba(250,204,21,0.3)]' },
                          HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-400/30', shadow: 'shadow-[0_0_10px_rgba(251,146,60,0.3)]' },
                          CRITICAL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-400/30', shadow: 'shadow-[0_0_10px_rgba(248,113,113,0.3)]' },
                        };
                        const priorityStyle = priorityColors[priority as keyof typeof priorityColors] || priorityColors.MEDIUM;

                        return (
                          <div key={project.id} className="w-full">
                            <Card
                              draggable
                              onDragStart={() => handleDragStart(project)}
                              onDragEnd={handleDragEnd}
                              onClick={() => router.push(`/projects/${project.id}`)}
                              className={cn(
                                "glass-card h-full border hover:shadow-[0_0_25px_rgba(34,211,238,0.25)] transition-all cursor-pointer overflow-hidden flex flex-col relative group",
                                draggedProject?.id === project.id ? "opacity-50 scale-95" : "",
                                deadlineInfo?.color === 'red' ? "border-red-400/50 shadow-[0_0_15px_rgba(248,113,113,0.3)]" :
                                  deadlineInfo?.color === 'amber' ? "border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]" :
                                    "border-cyan-400/20",
                                starredProjects.has(project.id) && "ring-2 ring-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.3)]",
                                selectedProjects.has(project.id) && "ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] transform scale-[1.02]"
                              )}
                            >
                              {(selectionMode || selectedProjects.size > 0) && (
                                <div className="absolute top-2 left-2 z-20" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedProjects.has(project.id)}
                                    onCheckedChange={() => toggleSelection(project.id)}
                                    className="border-white/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 w-5 h-5"
                                  />
                                </div>
                              )}
                              <div className="relative h-24 bg-slate-900 border-b border-white/5">
                                <img src={project.bannerImage || ""} className="w-full h-full object-cover opacity-60" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                                <div className="absolute bottom-2 left-3 right-3">
                                  <h3 className="font-bold text-white text-sm truncate">{project.name}</h3>
                                </div>
                                {/* Priority Badge */}
                                <div className={cn("absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase", priorityStyle.bg, priorityStyle.text)}>
                                  {priority}
                                </div>
                              </div>
                              <CardContent className="p-3 flex-1 flex flex-col gap-2">
                                {project.description && (
                                  <p className="text-xs text-slate-400 line-clamp-2">{project.description}</p>
                                )}
                                <div className="flex items-center justify-between mt-auto pt-2">
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Users className="w-3 h-3" />
                                    <span>{(project as any)._count?.tasks || 0}</span>
                                  </div>
                                  {project.endDate && (
                                    <div className={cn("flex items-center gap-1 text-xs", deadlineInfo?.color === 'red' ? 'text-red-400' : deadlineInfo?.color === 'amber' ? 'text-amber-400' : 'text-slate-400')}>
                                      <Calendar className="w-3 h-3" />
                                      <span>{deadlineInfo?.text}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                  <div className="flex items-center gap-1">
                                    {(project.owner as any)?.avatarUrl ? (
                                      <img src={(project.owner as any).avatarUrl} className="w-5 h-5 rounded-full" alt="" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-cyan-400">{(project.owner?.name || project.ownerName || 'U')[0].toUpperCase()}</span>
                                      </div>
                                    )}
                                    <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{project.owner?.name || project.ownerName || 'Unknown'}</span>
                                  </div>
                                  {starredProjects.has(project.id) && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
                        ) : (
          /* Trash View */
          <div className="space-y-6">
            <div className="glass-card rounded-xl border border-red-500/30 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_15px_rgba(248,113,113,0.2)]">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-400 heading-glow">Sampah Proyek</h2>
                  <p className="text-sm text-slate-400">Proyek yang dihapus dapat dipulihkan atau dihapus selamanya</p>
                </div>
              </div>

              {deletedProjects.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-700/50 rounded-lg">
                  <p className="text-slate-500">Tidak ada proyek di sampah</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {deletedProjects.map((project) => (
                    <Card key={project.id} className={cn(
                      "glass-card border border-red-500/20 overflow-hidden relative group transition-all hover:border-red-500/40",
                      selectedProjects.has(project.id) && "ring-2 ring-cyan-400 scale-[1.02]"
                    )}>
                      <div className="absolute top-2 left-2 z-20" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedProjects.has(project.id)}
                          onCheckedChange={() => toggleSelection(project.id)}
                          className="border-white/50 data-[state=checked]:bg-cyan-500 w-5 h-5"
                        />
                      </div>

                      <div className="absolute top-2 right-2 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="outline" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white" onClick={() => handleRestore(project.id)} title="Pulihkan">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8 text-white" onClick={() => handlePermanentDelete(project.id)} title="Hapus Permanen">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="relative h-24 bg-slate-900 border-b border-white/5">
                        <img src={project.bannerImage || ""} className="w-full h-full object-cover opacity-50 grayscale" alt="" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-slate-200 truncate">{project.name}</h3>
                        <p className="text-xs text-red-400 mt-1">Dihapus: {project.deletedAt ? new Date(project.deletedAt).toLocaleDateString() : '-'}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* --- Print View */}
      {isMounted && (
        <div className="hidden print:block p-8 bg-white text-black min-h-screen">
          <div className="mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold mb-2">Laporan Proyek</h1>
            <p className="text-sm text-gray-600">Dibuat pada {new Date().toLocaleDateString('id-ID')}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Sekarang ({sekarang.length})</h2>
            {sekarang.map(p => (
              <div key={p.id} className="py-2 border-b">{p.name}</div>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Rencana ({rencana.length})</h2>
            {rencana.map(p => (
              <div key={p.id} className="py-2 border-b">{p.name}</div>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Selesai ({selesai.length})</h2>
            {selesai.map(p => (
              <div key={p.id} className="py-2 border-b">{p.name}</div>
            ))}
          </div>
        </div>
      )}


      {/* --- Dialogs with Neon Styling --- */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[500px] glass-panel border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-sky-100 heading-glow">{editingProject ? 'Edit Proyek' : 'Buat Proyek Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProject} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sky-100/80">Nama Proyek *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Membuat Integrasi Verifikasi Absen Muka"
                className="bg-slate-800/60 border-cyan-500/20 text-sky-100 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sky-100/80">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tentang apa proyek ini?"
                className="bg-slate-800/60 border-cyan-500/20 text-sky-100 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] placeholder:text-slate-500 min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sky-100/80">Tanggal Mulai</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-slate-800/60 border-cyan-500/20 text-sky-100 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sky-100/80">Tanggal Selesai</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-slate-800/60 border-cyan-500/20 text-sky-100 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sky-100/80">Kategori Proyek</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/60 border border-cyan-500/20 rounded-lg text-sky-100 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                <option value="" className="bg-slate-900">Otomatis (berdasarkan tanggal)</option>
                <option value="SEKARANG" className="bg-slate-900">Sekarang (sedang berjalan)</option>
                <option value="RENCANA" className="bg-slate-900">Rencana (akan datang)</option>
                <option value="SELESAI" className="bg-slate-900">Selesai (sudah selesai)</option>
              </select>
              <p className="text-[10px] text-sky-400/50">Pilih kategori secara manual, atau biarkan kosong untuk otomatis berdasarkan tanggal</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerImage" className="text-sky-100/80">URL Banner Proyek</Label>
              <Input
                id="bannerImage"
                type="url"
                value={formData.bannerImage}
                onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                placeholder="https://example.com/banner.jpg"
                className="bg-slate-800/60 border-cyan-500/20 text-sky-100 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] placeholder:text-slate-500"
              />
              <p className="text-[10px] text-slate-500">Masukkan URL gambar banner untuk proyek ini</p>
              {formData.bannerImage && (
                <div className="mt-2 rounded-lg overflow-hidden border border-white/5 shadow-inner bg-slate-900/50">
                  <img
                    src={formData.bannerImage}
                    alt="Banner preview"
                    className="w-full h-32 object-cover opacity-80"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x100/0f172a/38bdf8?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-cyan-500/30 text-sky-400 hover:bg-cyan-500/10">Batal</Button>
              <Button type="submit" className="btn-neon-primary">
                {editingProject ? 'Simpan Perubahan' : 'Buat Proyek'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <DialogContent className="sm:max-w-[425px] glass-panel border-red-500/20">
          <DialogHeader>
            <DialogTitle className="text-red-400" style={{ textShadow: '0 0 10px rgba(248,113,113,0.5)' }}>Hapus Proyek</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-sky-300">
              Apakah Anda yakin ingin menghapus <span className="font-semibold text-sky-100">{projectToDelete?.name}</span>?
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua tugas terkait.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setProjectToDelete(null)}
              className="border-cyan-500/30 text-sky-400 hover:bg-cyan-500/10"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-500/90 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(248,113,113,0.4)]"
            >
              Hapus Proyek
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showPrintPreview && (() => {
        const printedProjects = selectedProjects.size > 0 
            ? projects.filter(p => selectedProjects.has(p.id)) 
            : groupedProjects.flatMap(g => g.projects);
        
        const projectIds = new Set(printedProjects.map(p => p.id));
        const tasksToPrint = allTasks.filter(t => projectIds.has(t.projectId));
        const printName = printedProjects.length === 1 ? printedProjects[0].name : "Selected Projects";

        return (
          <TicketPrintPreview
            tasks={tasksToPrint as any}
            projectName={printName}
            onClose={() => setShowPrintPreview(false)}
          />
        );
      })()}
    </div>
  );
}
