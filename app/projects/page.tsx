'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  FolderKanban,
  Calendar,
  Users,
  Search,
  Star,
  Printer,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { QuickActions } from '@/components/QuickActions';
import { cn } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";

// Types
interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  bannerImage: string | null;
  priority: string | null;
  createdAt: Date;
  owner: {
    id: string;
    username: string;
  };
  _count: {
    tasks: number;
  };
}

interface Task {
  id: string;
  title: string;
  status: { name: string };
  priority: string;
  dueDate: string | null;
  project: { name: string };
  assignee: { username: string } | null;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [starredProjects, setStarredProjects] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    bannerImage: '',
  });

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('starredProjects');
    if (saved) {
      setStarredProjects(new Set(JSON.parse(saved)));
    }
    setIsMounted(true);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks')
      ]);

      const projectsData = await projectsRes.json();
      const tasksData = await tasksRes.json();

      setProjects(projectsData);
      setAllTasks(tasksData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        setFormData({ name: '', description: '', startDate: '', endDate: '', bannerImage: '' });
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

  const toggleStar = (projectId: string) => {
    const newStarred = new Set(starredProjects);
    if (newStarred.has(projectId)) newStarred.delete(projectId);
    else newStarred.add(projectId);
    setStarredProjects(newStarred);
    localStorage.setItem('starredProjects', JSON.stringify(Array.from(newStarred)));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      bannerImage: project.bannerImage || '',
    });
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingProject(null);
      setFormData({ name: '', description: '', startDate: '', endDate: '', bannerImage: '' });
    }
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

  // Categorize projects
  const categorizeProjects = (projects: Project[]) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const rencana: Project[] = [];
    const sekarang: Project[] = [];
    const selesai: Project[] = [];

    projects.forEach(project => {
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

    // Return in new order: Sekarang, Rencana, Selesai
    return { rencana, sekarang, selesai };
  };

  // Filter and categorize
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { rencana, sekarang, selesai } = categorizeProjects(filteredProjects);

  const stats = {
    totalProjects: projects.length,
    totalTasks: allTasks.length,
    rencanaCount: rencana.length,
    sekarangCount: sekarang.length,
    selesaiCount: selesai.length,
  };

  return (
    <div className="min-h-screen">
      {/* Header with Neon Styling */}
      <div className="glass-panel border-b border-cyan-500/10 px-6 py-6 sticky top-0 z-40">
        <div className="max-w-full mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-sky-100 heading-glow">
              Dashboard Proyek
            </h1>
            <p className="text-sm text-sky-400/70 mt-1">
              Kelola proyek Anda dari rencana hingga selesai
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/50" />
              <Input
                placeholder="Cari proyek..."
                className="pl-10 pr-4 py-2 border border-cyan-500/20 rounded-lg text-sm w-64 bg-slate-800/60 text-sky-100 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-cyan-500/30 text-sky-400 hover:bg-cyan-500/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>

            <Button
              onClick={() => {
                setEditingProject(null);
                setFormData({ name: '', description: '', startDate: '', endDate: '', bannerImage: '' });
                setDialogOpen(true);
              }}
              className="btn-neon-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Proyek Baru
            </Button>
          </div>
        </div>
      </div>

      <main className="px-6 py-6">

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
            <div className="glass-card rounded-xl border border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.15)] overflow-hidden">
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
                  <p className="text-sm text-gray-400 text-center py-8">Tidak ada proyek aktif</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                    {sekarang.map((project) => {
                      const deadlineInfo = getDeadlineInfo(project.endDate);
                      const priority = project.priority || 'MEDIUM';
                      const priorityColors = {
                        LOW: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-400/30', shadow: 'shadow-[0_0_10px_rgba(74,222,128,0.3)]' },
                        MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-400/30', shadow: 'shadow-[0_0_10px_rgba(250,204,21,0.3)]' },
                        HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-400/30', shadow: 'shadow-[0_0_10px_rgba(251,146,60,0.3)]' },
                        CRITICAL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-400/30', shadow: 'shadow-[0_0_10px_rgba(248,113,113,0.3)]' },
                      };
                      const priorityStyle = priorityColors[priority as keyof typeof priorityColors] || priorityColors.MEDIUM;

                      return (
                        <Link key={project.id} href={`/projects/${project.id}`} className="snap-start shrink-0 w-80">
                          <Card className={cn(
                            "glass-card h-full border hover:shadow-[0_0_25px_rgba(251,191,36,0.25)] transition-all cursor-pointer overflow-hidden flex flex-col",
                            deadlineInfo?.color === 'red' ? "border-red-400/50 shadow-[0_0_15px_rgba(248,113,113,0.3)]" :
                              deadlineInfo?.color === 'amber' ? "border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]" :
                                "border-amber-400/20",
                            starredProjects.has(project.id) && "ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                          )}>
                            {/* Banner Image */}
                            <div className="relative h-32 overflow-hidden bg-gray-100">
                              <img
                                src={project.bannerImage || 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg'}
                                alt={project.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg';
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                              {/* Top badges */}
                              <div className="absolute top-2 left-2 flex gap-2">
                                {/* Priority Badge */}
                                <span className={cn(
                                  "px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide border",
                                  priorityStyle.bg, priorityStyle.text, priorityStyle.border, priorityStyle.shadow
                                )}>
                                  {priority}
                                </span>
                                {/* Urgent Badge */}
                                {deadlineInfo && deadlineInfo.color === 'amber' && (
                                  <span className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1 animate-pulse">
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
                                <h3 className="font-bold text-white text-sm line-clamp-1 drop-shadow-lg">{project.name}</h3>
                              </div>
                            </div>

                            <CardContent className="p-4 flex-1 flex flex-col">
                              <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">
                                {project.description || 'Tidak ada deskripsi'}
                              </p>

                              {/* Highlighted Deadline Section */}
                              {project.endDate && deadlineInfo ? (
                                <div className={cn(
                                  "rounded-lg p-3 mb-3 border-2",
                                  deadlineInfo.color === 'red' ? "bg-red-50 border-red-400" :
                                    deadlineInfo.color === 'amber' ? "bg-amber-50 border-amber-400" :
                                      "bg-blue-50 border-blue-300"
                                )}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold uppercase text-gray-500">Deadline</span>
                                    <Clock className={cn(
                                      "w-4 h-4",
                                      deadlineInfo.color === 'red' ? "text-red-500 animate-pulse" :
                                        deadlineInfo.color === 'amber' ? "text-amber-500" : "text-blue-500"
                                    )} />
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                    <span className={cn(
                                      "text-2xl font-black",
                                      deadlineInfo.color === 'red' ? "text-red-600" :
                                        deadlineInfo.color === 'amber' ? "text-amber-600" : "text-blue-600"
                                    )}>
                                      {deadlineInfo.days === 0 ? 'HARI INI' : `${deadlineInfo.days}`}
                                    </span>
                                    <span className="text-xs text-gray-600">
                                      {deadlineInfo.days === 0 ? '' : 'hari lagi'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 font-medium">
                                    {new Date(project.endDate).toLocaleDateString('id-ID', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-lg p-3 mb-3 bg-gray-50 border border-gray-200">
                                  <span className="text-xs text-gray-400">Tidak ada deadline</span>
                                </div>
                              )}

                              <div className="mt-auto pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      <span>{project.owner.username}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{project._count.tasks} tugas</span>
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
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RENCANA - Proyek yang akan datang */}
            <div className="glass-card rounded-xl border border-sky-500/30 shadow-[0_0_20px_rgba(56,189,248,0.15)] overflow-hidden">
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
                  <p className="text-sm text-gray-400 text-center py-8">Tidak ada proyek terencana</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                    {rencana.map((project) => {
                      const deadlineInfo = getDeadlineInfo(project.endDate);
                      const priority = project.priority || 'MEDIUM';
                      const priorityColors = {
                        LOW: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-400/30', shadow: 'shadow-[0_0_10px_rgba(74,222,128,0.3)]' },
                        MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-400/30', shadow: 'shadow-[0_0_10px_rgba(250,204,21,0.3)]' },
                        HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-400/30', shadow: 'shadow-[0_0_10px_rgba(251,146,60,0.3)]' },
                        CRITICAL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-400/30', shadow: 'shadow-[0_0_10px_rgba(248,113,113,0.3)]' },
                      };
                      const priorityStyle = priorityColors[priority as keyof typeof priorityColors] || priorityColors.MEDIUM;

                      return (
                        <Link key={project.id} href={`/projects/${project.id}`} className="snap-start shrink-0 w-80">
                          <Card className={cn(
                            "glass-card h-full border hover:shadow-[0_0_25px_rgba(56,189,248,0.25)] transition-all cursor-pointer overflow-hidden flex flex-col",
                            deadlineInfo?.color === 'red' ? "border-red-400/50 shadow-[0_0_15px_rgba(248,113,113,0.3)]" :
                              deadlineInfo?.color === 'amber' ? "border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]" :
                                "border-sky-400/20",
                            starredProjects.has(project.id) && "ring-2 ring-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                          )}>
                            {/* Banner Image */}
                            <div className="relative h-32 overflow-hidden bg-gray-100">
                              <img
                                src={project.bannerImage || 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg'}
                                alt={project.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg';
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                              {/* Top badges */}
                              <div className="absolute top-2 left-2 flex gap-2">
                                {/* Priority Badge */}
                                <span className={cn(
                                  "px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide border",
                                  priorityStyle.bg, priorityStyle.text, priorityStyle.border, priorityStyle.shadow
                                )}>
                                  {priority}
                                </span>
                              </div>
                              <div className="absolute top-2 right-2 flex gap-1">
                                {starredProjects.has(project.id) && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-md" />}
                              </div>

                              {/* Project name overlay at bottom */}
                              <div className="absolute bottom-2 left-3 right-3">
                                <h3 className="font-bold text-white text-sm line-clamp-1 drop-shadow-lg">{project.name}</h3>
                              </div>
                            </div>

                            <CardContent className="p-4 flex-1 flex flex-col">
                              <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">
                                {project.description || 'Tidak ada deskripsi'}
                              </p>

                              {/* Highlighted Deadline Section */}
                              {project.endDate && deadlineInfo ? (
                                <div className={cn(
                                  "rounded-lg p-3 mb-3 border-2",
                                  deadlineInfo.color === 'red' ? "bg-red-50 border-red-300" :
                                    deadlineInfo.color === 'amber' ? "bg-amber-50 border-amber-300" :
                                      "bg-blue-50 border-blue-200"
                                )}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold uppercase text-gray-500">Deadline</span>
                                    {deadlineInfo.status !== 'normal' && (
                                      <Clock className={cn(
                                        "w-4 h-4",
                                        deadlineInfo.color === 'red' ? "text-red-500 animate-pulse" :
                                          deadlineInfo.color === 'amber' ? "text-amber-500" : "text-blue-500"
                                      )} />
                                    )}
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                    <span className={cn(
                                      "text-xl font-bold",
                                      deadlineInfo.color === 'red' ? "text-red-600" :
                                        deadlineInfo.color === 'amber' ? "text-amber-600" : "text-blue-600"
                                    )}>
                                      {deadlineInfo.days} hari
                                    </span>
                                    <span className="text-xs text-gray-600">lagi</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(project.endDate).toLocaleDateString('id-ID', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-lg p-3 mb-3 bg-gray-50 border border-gray-200">
                                  <span className="text-xs text-gray-400">Tidak ada deadline</span>
                                </div>
                              )}

                              {/* Start Date */}
                              {project.startDate && (
                                <div className="flex items-center gap-2 text-xs text-blue-600 mb-3">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    Mulai: {new Date(project.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              )}

                              <div className="mt-auto pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      <span>{project.owner.username}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{project._count.tasks} tugas</span>
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
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* SELESAI - Proyek yang sudah selesai */}
            <div className="glass-card rounded-xl border border-green-500/30 shadow-[0_0_20px_rgba(74,222,128,0.15)] overflow-hidden">
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
                  <p className="text-sm text-gray-400 text-center py-8">Belum ada proyek selesai</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                    {selesai.map((project) => {
                      const priority = project.priority || 'MEDIUM';
                      const priorityColors = {
                        LOW: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-400/30', shadow: 'shadow-[0_0_10px_rgba(74,222,128,0.3)]' },
                        MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-400/30', shadow: 'shadow-[0_0_10px_rgba(250,204,21,0.3)]' },
                        HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-400/30', shadow: 'shadow-[0_0_10px_rgba(251,146,60,0.3)]' },
                        CRITICAL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-400/30', shadow: 'shadow-[0_0_10px_rgba(248,113,113,0.3)]' },
                      };
                      const priorityStyle = priorityColors[priority as keyof typeof priorityColors] || priorityColors.MEDIUM;

                      return (
                        <Link key={project.id} href={`/projects/${project.id}`} className="snap-start shrink-0 w-80">
                          <Card className={cn(
                            "glass-card h-full border hover:shadow-[0_0_25px_rgba(74,222,128,0.25)] transition-all cursor-pointer opacity-60 hover:opacity-100 overflow-hidden flex flex-col",
                            "border-green-400/20",
                            starredProjects.has(project.id) && "ring-2 ring-green-400/40 shadow-[0_0_20px_rgba(74,222,128,0.3)]"
                          )}>
                            {/* Banner Image */}
                            <div className="relative h-32 overflow-hidden bg-gray-100">
                              <img
                                src={project.bannerImage || 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg'}
                                alt={project.name}
                                className="w-full h-full object-cover grayscale"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg';
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-green-900/40 via-transparent to-transparent"></div>

                              {/* Top badges */}
                              <div className="absolute top-2 left-2 flex gap-2">
                                {/* Priority Badge */}
                                <span className={cn(
                                  "px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-green-100 text-green-700",
                                )}>
                                  {priority}
                                </span>
                                {/* Completed Badge */}
                                <span className="bg-green-600 text-white px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Selesai
                                </span>
                              </div>
                              <div className="absolute top-2 right-2 flex gap-1">
                                {starredProjects.has(project.id) && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-md" />}
                              </div>

                              {/* Project name overlay at bottom */}
                              <div className="absolute bottom-2 left-3 right-3">
                                <h3 className="font-bold text-white text-sm line-clamp-1 drop-shadow-lg line-through">{project.name}</h3>
                              </div>
                            </div>

                            <CardContent className="p-4 flex-1 flex flex-col">
                              <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">
                                {project.description || 'Tidak ada deskripsi'}
                              </p>

                              {/* Completed Date Section */}
                              {project.endDate && (
                                <div className="rounded-lg p-3 mb-3 bg-green-50 border-2 border-green-300">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold uppercase text-green-600">Selesai Tanggal</span>
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  </div>
                                  <div className="text-sm font-bold text-green-700">
                                    {new Date(project.endDate).toLocaleDateString('id-ID', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                  </div>
                                </div>
                              )}

                              <div className="mt-auto pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      <span>{project.owner.username}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{project._count.tasks} tugas</span>
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
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
              <Label htmlFor="name">Nama Proyek *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Kampanye Marketing Q1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tentang apa proyek ini?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Tanggal Mulai</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal Selesai</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerImage">URL Banner Proyek</Label>
              <Input
                id="bannerImage"
                type="url"
                value={formData.bannerImage}
                onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                placeholder="https://example.com/banner.jpg"
              />
              <p className="text-xs text-gray-500">Masukkan URL gambar banner untuk proyek ini</p>
              {formData.bannerImage && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={formData.bannerImage}
                    alt="Banner preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x100?text=Invalid+Image+URL';
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
    </div>
  );
}
