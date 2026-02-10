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
        setFormData({ name: '', description: '', startDate: '', endDate: '' });
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
    });
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingProject(null);
      setFormData({ name: '', description: '', startDate: '', endDate: '' });
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-40">
        <div className="max-w-full mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Dashboard Proyek
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola proyek Anda dari rencana hingga selesai
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari proyek..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-gray-200"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>

            <Button
              onClick={() => {
                setEditingProject(null);
                setFormData({ name: '', description: '', startDate: '', endDate: '' });
                setDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Proyek Baru
            </Button>
          </div>
        </div>
      </div>

      <main className="px-6 py-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Proyek</p>
                  <h3 className="text-2xl font-semibold text-gray-900 mt-1">{stats.totalProjects}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-blue-200 shadow-sm bg-blue-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Rencana</p>
                  <h3 className="text-2xl font-semibold text-blue-900 mt-1">{stats.rencanaCount}</h3>
                  <p className="text-xs text-blue-600">Akan datang</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-amber-200 shadow-sm bg-amber-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700">Sekarang</p>
                  <h3 className="text-2xl font-semibold text-amber-900 mt-1">{stats.sekarangCount}</h3>
                  <p className="text-xs text-amber-600">Sedang berjalan</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-green-200 shadow-sm bg-green-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Selesai</p>
                  <h3 className="text-2xl font-semibold text-green-900 mt-1">{stats.selesaiCount}</h3>
                  <p className="text-xs text-green-600">Sudah selesai</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="border border-dashed border-gray-300 bg-white">
            <CardContent className="p-12 text-center">
              <FolderKanban className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada proyek ditemukan</h3>
              <p className="text-gray-500 mb-6">Buat proyek pertama Anda untuk memulai</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Buat Proyek
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Three Row Layout - Horizontal Cards */
          <div className="space-y-6">

            {/* RENCANA - Proyek yang akan datang */}
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-200 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div>
                      <h2 className="text-base font-semibold text-blue-900">Rencana</h2>
                      <p className="text-xs text-blue-700">Proyek yang akan datang</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-blue-700">{rencana.length}</span>
                </div>
              </div>
              <div className="p-4">
                {rencana.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Tidak ada proyek terencana</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                    {rencana.map((project) => {
                      const deadlineInfo = getDeadlineInfo(project.endDate);
                      return (
                        <Link key={project.id} href={`/projects/${project.id}`} className="snap-start shrink-0 w-72">
                          <Card className={cn(
                            "h-full border hover:shadow-md transition-all cursor-pointer",
                            deadlineInfo?.color === 'red' ? "border-red-200" :
                              deadlineInfo?.color === 'amber' ? "border-amber-200" :
                                "border-gray-200",
                            starredProjects.has(project.id) && "ring-2 ring-blue-100"
                          )}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <FolderKanban className="w-5 h-5 text-blue-600" />
                                </div>
                                {starredProjects.has(project.id) && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                              </div>

                              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{project.name}</h3>
                              <p className="text-xs text-gray-500 line-clamp-2 h-8 mb-3">
                                {project.description || 'Tidak ada deskripsi'}
                              </p>

                              {project.startDate && (
                                <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    Mulai: {new Date(project.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                              )}

                              {project.endDate && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    Deadline: {new Date(project.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{project.owner.username}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{project._count.tasks}</span>
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
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* SEKARANG - Proyek yang sedang berjalan */}
            <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="bg-amber-50 border-b border-amber-200 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                    <div>
                      <h2 className="text-base font-semibold text-amber-900">Sekarang</h2>
                      <p className="text-xs text-amber-700">Sedang berjalan</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-amber-700">{sekarang.length}</span>
                </div>
              </div>
              <div className="p-4">
                {sekarang.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Tidak ada proyek aktif</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                    {sekarang.map((project) => {
                      const deadlineInfo = getDeadlineInfo(project.endDate);
                      return (
                        <Link key={project.id} href={`/projects/${project.id}`} className="snap-start shrink-0 w-72">
                          <Card className={cn(
                            "h-full border hover:shadow-md transition-all cursor-pointer",
                            deadlineInfo?.color === 'red' ? "border-red-200" :
                              deadlineInfo?.color === 'amber' ? "border-amber-300" :
                                "border-amber-200",
                            starredProjects.has(project.id) && "ring-2 ring-amber-100"
                          )}>
                            {/* Urgent Banner */}
                            {deadlineInfo && deadlineInfo.color === 'amber' && (
                              <div className="bg-red-50 px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-700 rounded-t-lg">
                                <Clock className="w-3 h-3" />
                                <span>{deadlineInfo.text}</span>
                              </div>
                            )}

                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center",
                                  deadlineInfo?.color === 'amber' ? "bg-red-100" : "bg-amber-100"
                                )}>
                                  <FolderKanban className={cn(
                                    "w-5 h-5",
                                    deadlineInfo?.color === 'amber' ? "text-red-600" : "text-amber-600"
                                  )} />
                                </div>
                                {starredProjects.has(project.id) && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                              </div>

                              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{project.name}</h3>
                              <p className="text-xs text-gray-500 line-clamp-2 h-8 mb-3">
                                {project.description || 'Tidak ada deskripsi'}
                              </p>

                              {project.endDate && (
                                <div className={cn(
                                  "flex items-center gap-1 text-xs mb-3 px-2 py-1.5 rounded",
                                  deadlineInfo?.color === 'amber' ? "bg-red-50 text-red-600" :
                                    deadlineInfo?.color === 'blue' ? "bg-blue-50 text-blue-600" :
                                      "bg-gray-50 text-gray-500"
                                )}>
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    Deadline: {new Date(project.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{project.owner.username}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{project._count.tasks}</span>
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
            <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
              <div className="bg-green-50 border-b border-green-200 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div>
                      <h2 className="text-base font-semibold text-green-900">Selesai</h2>
                      <p className="text-xs text-green-700">Sudah selesai</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-green-700">{selesai.length}</span>
                </div>
              </div>
              <div className="p-4">
                {selesai.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Belum ada proyek selesai</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                    {selesai.map((project) => {
                      const deadlineInfo = getDeadlineInfo(project.endDate);
                      return (
                        <Link key={project.id} href={`/projects/${project.id}`} className="snap-start shrink-0 w-72">
                          <Card className={cn(
                            "h-full border hover:shadow-md transition-all cursor-pointer opacity-75 hover:opacity-100",
                            "border-green-200",
                            starredProjects.has(project.id) && "ring-2 ring-green-100"
                          )}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                </div>
                                {starredProjects.has(project.id) && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                              </div>

                              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 line-through">{project.name}</h3>
                              <p className="text-xs text-gray-500 line-clamp-2 h-8 mb-3">
                                {project.description || 'Tidak ada deskripsi'}
                              </p>

                              {project.endDate && (
                                <div className="flex items-center gap-1 text-xs text-green-600 mb-3">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>
                                    Selesai: {new Date(project.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{project.owner.username}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{project._count.tasks}</span>
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
            <h2 className="text-lg font-semibold mb-3">Rencana ({rencana.length})</h2>
            {rencana.map(p => (
              <div key={p.id} className="py-2 border-b">{p.name}</div>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Sekarang ({sekarang.length})</h2>
            {sekarang.map(p => (
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


      {/* --- Dialogs --- */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Proyek' : 'Buat Proyek Baru'}</DialogTitle>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 text-white">
                {editingProject ? 'Simpan Perubahan' : 'Buat Proyek'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Hapus Proyek</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus <span className="font-semibold text-gray-900">{projectToDelete?.name}</span>?
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua tugas terkait.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setProjectToDelete(null)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Hapus Proyek
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
