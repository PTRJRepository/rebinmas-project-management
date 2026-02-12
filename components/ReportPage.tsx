'use client'

import { Button } from '@/components/ui/button'
import { Printer, Calendar, Clock, User, CheckCircle, AlertTriangle, BarChart3, FileText, MessageSquare, Paperclip } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskData {
  id: string
  title: string
  description?: string | null
  priority: string
  progress: number
  status: { name: string; order: number }
  dueDate?: string | null
  assignee?: { username: string; name?: string } | null
  estimatedHours?: number | null
  actualHours?: number | null
  createdAt: string
  commentsCount: number
  attachmentsCount: number
}

interface StatusData {
  id: string
  name: string
  order: number
}

interface ProjectData {
  id: string
  name: string
  description?: string | null
  startDate?: string | null
  endDate?: string | null
  priority: string
  bannerImage?: string | null
  status?: string | null
  owner: { username: string; name?: string }
  statuses: StatusData[]
  _count: { tasks: number }
  overallProgress: number
  totalTasks: number
  completedTasks: number
  tasks: TaskData[]
}

interface ReportPageProps {
  projects: ProjectData[]
  generatedAt: string
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ReportPage({ projects, generatedAt }: ReportPageProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Print-specific stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.2cm 1.5cm;
          }

          body {
            background: white !important;
            color: #111827 !important;
            font-size: 10pt !important;
            line-height: 1.35 !important;
          }

          /* Hide all non-print elements */
          .no-print,
          nav,
          aside,
          button,
          [role="navigation"],
          .print-only-hide {
            display: none !important;
          }

          /* Remove all shadows and effects */
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }

          /* Page break controls */
          .page-break-before {
            page-break-before: always !important;
          }

          .page-break-after {
            page-break-after: always !important;
          }

          .avoid-break {
            page-break-inside: avoid !important;
          }

          /* Ensure colors print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Table styles for print */
          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            border: 1px solid #d1d5db !important;
            padding: 5px 8px !important;
          }

          th {
            background: #f3f4f6 !important;
            color: #111827 !important;
            font-weight: 600;
          }
        }
      `}</style>

      {/* Screen Layout */}
      <div className="min-h-screen bg-slate-900 text-slate-100">
        {/* Header - Hidden in print */}
        <div className="no-print bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-sky-100">📊 Laporan Lengkap Semua Proyek</h1>
              <p className="text-slate-400 text-sm mt-1">Report detail seluruh proyek & tugas — siap cetak</p>
            </div>
            <Button onClick={handlePrint} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
              <Printer className="w-4 h-4" />
              Cetak Laporan
            </Button>
          </div>
        </div>

        {/* Report Content Container - Screen View */}
        <div className="max-w-6xl mx-auto p-8 bg-slate-800 min-h-screen">
          <div className="bg-white text-gray-900 rounded-lg shadow-xl p-8">
            <ReportContent projects={projects} generatedAt={generatedAt} />
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Report Content ──────────────────────────────────────────────────────────

function ReportContent({ projects, generatedAt }: { projects: ProjectData[]; generatedAt: string }) {
  const categorizeProjects = (projects: ProjectData[]) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const selesai: ProjectData[] = []
    const sekarang: ProjectData[] = []
    const rencana: ProjectData[] = []

    projects.forEach(project => {
      // Use manual status if set
      if (project.status === 'SELESAI') {
        selesai.push(project)
        return
      }
      if (project.status === 'SEKARANG') {
        sekarang.push(project)
        return
      }
      if (project.status === 'RENCANA') {
        rencana.push(project)
        return
      }

      // Auto-categorize by date
      const startDate = project.startDate ? new Date(project.startDate) : null
      const endDate = project.endDate ? new Date(project.endDate) : null

      if (endDate && endDate < now) {
        selesai.push(project)
      } else if ((!startDate || startDate <= now) && (!endDate || endDate >= now)) {
        sekarang.push(project)
      } else if (startDate && startDate > now) {
        rencana.push(project)
      } else {
        sekarang.push(project)
      }
    })

    return { rencana, sekarang, selesai }
  }

  const { rencana, sekarang, selesai } = categorizeProjects(projects)

  // Global statistics
  const totalProjects = projects.length
  const totalAllTasks = projects.reduce((sum, p) => sum + p.totalTasks, 0)
  const totalCompletedTasks = projects.reduce((sum, p) => sum + p.completedTasks, 0)
  const totalOverdueTasks = projects.reduce((sum, p) => {
    return sum + p.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status.name !== 'Done').length
  }, 0)
  const totalEstimatedHours = projects.reduce((sum, p) => {
    return sum + p.tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  }, 0)
  const totalActualHours = projects.reduce((sum, p) => {
    return sum + p.tasks.reduce((s, t) => s + (t.actualHours || 0), 0)
  }, 0)
  const globalProgress = totalAllTasks > 0 ? Math.round((totalCompletedTasks / totalAllTasks) * 100) : 0

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#111827' }}>
      {/* ═══ COVER / HEADER ═══ */}
      <div style={{ textAlign: 'center', marginBottom: '35px', paddingBottom: '25px', borderBottom: '4px solid #1e40af' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '10px' }}>
          Sistem Manajemen Proyek
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e3a8a' }}>
          LAPORAN LENGKAP SEMUA PROYEK
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>
          Rebinmas — Laporan Kemajuan & Detail Tugas
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
          Dicetak: {generatedAt}
        </p>
      </div>

      {/* ═══ RINGKASAN GLOBAL ═══ */}
      <div style={{ marginBottom: '30px' }}>
        <SectionTitle icon="📊" title="RINGKASAN KESELURUHAN" />

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <SummaryCard label="Total Proyek" value={totalProjects} color="#3b82f6" />
          <SummaryCard label="Sedang Berjalan" value={sekarang.length} color="#f59e0b" />
          <SummaryCard label="Rencana" value={rencana.length} color="#8b5cf6" />
          <SummaryCard label="Selesai" value={selesai.length} color="#16a34a" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <SummaryCard label="Total Tugas" value={totalAllTasks} color="#0ea5e9" />
          <SummaryCard label="Tugas Selesai" value={totalCompletedTasks} color="#22c55e" />
          <SummaryCard label="Tugas Terlambat" value={totalOverdueTasks} color="#ef4444" />
          <SummaryCard label="Progress Global" value={`${globalProgress}%`} color="#6366f1" />
        </div>

        {/* Global Progress Bar */}
        <div style={{ padding: '15px 20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ fontWeight: '600', color: '#374151' }}>Progress Keseluruhan Semua Proyek</span>
            <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '16px' }}>{globalProgress}%</span>
          </div>
          <ProgressBar value={globalProgress} height={14} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
            <span>{totalCompletedTasks} dari {totalAllTasks} tugas selesai</span>
            <span>Est: {totalEstimatedHours}j | Aktual: {totalActualHours}j</span>
          </div>
        </div>
      </div>

      {/* ═══ DAFTAR SEMUA PROYEK (TABEL RINGKASAN) ═══ */}
      <div style={{ marginBottom: '30px' }} className="avoid-break">
        <SectionTitle icon="📋" title="DAFTAR SEMUA PROYEK" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', border: '1px solid #1e3a8a', fontWeight: '600' }}>No</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', border: '1px solid #1e3a8a', fontWeight: '600' }}>Nama Proyek</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', border: '1px solid #1e3a8a', fontWeight: '600' }}>Prioritas</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', border: '1px solid #1e3a8a', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', border: '1px solid #1e3a8a', fontWeight: '600' }}>Tugas</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', border: '1px solid #1e3a8a', fontWeight: '600' }}>Selesai</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', border: '1px solid #1e3a8a', fontWeight: '600' }}>Progress</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', border: '1px solid #1e3a8a', fontWeight: '600' }}>Deadline</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', border: '1px solid #1e3a8a', fontWeight: '600' }}>Owner</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, index) => {
              const priorityInfo = getPriorityInfo(project.priority)
              const deadlineInfo = getDeadlineInfo(project.endDate || null)
              const categoryLabel = getCategoryLabel(project, sekarang, rencana, selesai)

              return (
                <tr key={project.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: '600' }}>{index + 1}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', fontWeight: '600' }}>
                    {project.name}
                    {project.description && (
                      <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '400', marginTop: '2px' }}>
                        {project.description.length > 60 ? project.description.substring(0, 60) + '...' : project.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <span style={{
                      padding: '3px 8px',
                      backgroundColor: priorityInfo.bgColor,
                      color: priorityInfo.color,
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {priorityInfo.label}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <span style={{
                      padding: '3px 8px',
                      backgroundColor: categoryLabel.bgColor,
                      color: categoryLabel.color,
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {categoryLabel.label}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: '600' }}>{project.totalTasks}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: '600', color: '#16a34a' }}>{project.completedTasks}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <div style={{ width: '50px', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: getProgressColor(project.overallProgress), width: `${project.overallProgress}%` }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600' }}>{project.overallProgress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '11px' }}>
                    {project.endDate ? (
                      <div>
                        <div>{new Date(project.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div style={{ color: deadlineInfo.color, fontWeight: '600', fontSize: '10px' }}>{deadlineInfo.text}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', fontSize: '11px' }}>{project.owner.username}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ DETAIL PER PROYEK ═══ */}

      {/* Sedang Berjalan */}
      {sekarang.length > 0 && (
        <div className="page-break-before">
          <CategoryHeader
            icon={<Clock size={22} />}
            title="PROYEK SEDANG BERJALAN"
            count={sekarang.length}
            color="#b45309"
            borderColor="#fcd34d"
          />
          {sekarang.map((project, idx) => (
            <ProjectDetailCard key={project.id} project={project} index={idx + 1} />
          ))}
        </div>
      )}

      {/* Rencana */}
      {rencana.length > 0 && (
        <div className="page-break-before">
          <CategoryHeader
            icon={<Calendar size={22} />}
            title="PROYEK RENCANA"
            count={rencana.length}
            color="#7c3aed"
            borderColor="#a78bfa"
          />
          {rencana.map((project, idx) => (
            <ProjectDetailCard key={project.id} project={project} index={idx + 1} />
          ))}
        </div>
      )}

      {/* Selesai */}
      {selesai.length > 0 && (
        <div className="page-break-before">
          <CategoryHeader
            icon={<CheckCircle size={22} />}
            title="PROYEK SELESAI"
            count={selesai.length}
            color="#15803d"
            borderColor="#86efac"
          />
          {selesai.map((project, idx) => (
            <ProjectDetailCard key={project.id} project={project} index={idx + 1} />
          ))}
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '3px solid #1e40af',
        textAlign: 'center',
        fontSize: '11px',
        color: '#6b7280'
      }} className="avoid-break">
        <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1e3a8a' }}>
          Laporan ini dicetak otomatis dari Sistem Manajemen Proyek Rebinmas
        </p>
        <p style={{ margin: '0 0 4px 0' }}>
          Total: {totalProjects} proyek | {totalAllTasks} tugas | {totalCompletedTasks} selesai | Progress: {globalProgress}%
        </p>
        <p style={{ margin: 0, fontSize: '10px' }}>Generated at: {generatedAt}</p>
      </div>
    </div>
  )
}

// ─── Project Detail Card ─────────────────────────────────────────────────────

function ProjectDetailCard({ project, index }: { project: ProjectData; index: number }) {
  const priorityInfo = getPriorityInfo(project.priority)
  const deadlineInfo = getDeadlineInfo(project.endDate || null)

  // Group tasks by status
  const tasksByStatus = project.statuses.map(status => ({
    ...status,
    tasks: project.tasks.filter(t => t.status.name === status.name)
  }))

  // Task statistics
  const overdueTasks = project.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status.name !== 'Done').length
  const criticalTasks = project.tasks.filter(t => t.priority === 'CRITICAL').length
  const highTasks = project.tasks.filter(t => t.priority === 'HIGH').length
  const totalEstHours = project.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
  const totalActHours = project.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)

  return (
    <div style={{
      marginBottom: '25px',
      padding: '20px',
      backgroundColor: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      borderLeft: `6px solid ${priorityInfo.color}`
    }} className="avoid-break">
      {/* Project Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#111827' }}>
            {index}. {project.name}
          </h3>
          {project.description && (
            <p style={{ fontSize: '13px', color: '#4b5563', margin: 0, lineHeight: '1.5' }}>
              {project.description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: '15px', flexShrink: 0 }}>
          <span style={{
            padding: '6px 14px',
            backgroundColor: priorityInfo.color,
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '6px',
            fontSize: '11px'
          }}>
            {priorityInfo.label}
          </span>
        </div>
      </div>

      {/* Project Info Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '15px',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '3px' }}>Owner</div>
          <div style={{ fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} /> {project.owner.username}
          </div>
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '3px' }}>Mulai</div>
          <div style={{ fontWeight: '600', color: '#111827' }}>
            {project.startDate
              ? new Date(project.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </div>
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '3px' }}>Deadline</div>
          <div style={{ fontWeight: '600', color: deadlineInfo.color || '#111827' }}>
            {project.endDate
              ? new Date(project.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </div>
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '3px' }}>Status Deadline</div>
          <div style={{ fontWeight: '600', color: deadlineInfo.color }}>
            {deadlineInfo.text}
          </div>
        </div>
      </div>

      {/* Progress & Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
        {/* Progress */}
        <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
            <span style={{ fontWeight: '600', color: '#0369a1' }}>Progress</span>
            <span style={{ fontWeight: 'bold', color: '#0c4a6e', fontSize: '16px' }}>{project.overallProgress}%</span>
          </div>
          <ProgressBar value={project.overallProgress} height={10} />
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
            {project.completedTasks} dari {project.totalTasks} tugas selesai
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ padding: '12px', backgroundColor: '#fefce8', borderRadius: '6px', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>Statistik Cepat</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
            <div>
              <span style={{ color: '#6b7280' }}>Terlambat: </span>
              <span style={{ fontWeight: '600', color: overdueTasks > 0 ? '#dc2626' : '#16a34a' }}>{overdueTasks}</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Kritis: </span>
              <span style={{ fontWeight: '600', color: criticalTasks > 0 ? '#dc2626' : '#6b7280' }}>{criticalTasks}</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Prioritas Tinggi: </span>
              <span style={{ fontWeight: '600', color: highTasks > 0 ? '#ea580c' : '#6b7280' }}>{highTasks}</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Jam: </span>
              <span style={{ fontWeight: '600', color: '#374151' }}>{totalActHours || totalEstHours}j</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      {project.tasks.length > 0 && (
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '15px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} /> Daftar Tugas ({project.totalTasks} tugas)
          </h4>

          {/* Tasks grouped by status */}
          {tasksByStatus.map(statusGroup => {
            if (statusGroup.tasks.length === 0) return null

            const statusInfo = getStatusInfo(statusGroup.name)

            return (
              <div key={statusGroup.id} style={{ marginBottom: '15px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  padding: '6px 10px',
                  backgroundColor: statusInfo.bgColor,
                  borderRadius: '4px',
                  borderLeft: `3px solid ${statusInfo.color}`
                }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '600',
                    color: statusInfo.color
                  }}>
                    {statusGroup.tasks.length}
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: '600', width: '5%' }}>#</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: '600', width: '30%' }}>Tugas</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '600', width: '10%' }}>Prioritas</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '600', width: '12%' }}>Progress</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '600', width: '13%' }}>Deadline</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: '600', width: '12%' }}>Assignee</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '600', width: '8%' }}>Jam</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '600', width: '10%' }}>Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusGroup.tasks.map((task, taskIdx) => {
                      const taskPriority = getPriorityInfo(task.priority)
                      const taskDeadline = getDeadlineInfo(task.dueDate || null)

                      return (
                        <tr key={task.id} style={{ backgroundColor: taskIdx % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280' }}>{taskIdx + 1}</td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontWeight: '600', color: '#111827', marginBottom: '2px' }}>{task.title}</div>
                            {task.description && (
                              <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.3' }}>
                                {task.description.length > 80 ? task.description.substring(0, 80) + '...' : task.description}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 6px',
                              backgroundColor: taskPriority.bgColor,
                              color: taskPriority.color,
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}>
                              {taskPriority.label}
                            </span>
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                              <div style={{ width: '35px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', backgroundColor: getProgressColor(task.progress), width: `${task.progress}%` }} />
                              </div>
                              <span style={{ fontSize: '10px', fontWeight: '600' }}>{task.progress}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '10px' }}>
                            {task.dueDate ? (
                              <div>
                                <div>{new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                                {taskDeadline.status !== 'normal' && taskDeadline.status !== 'none' && (
                                  <div style={{ color: taskDeadline.color, fontWeight: '600', fontSize: '9px' }}>{taskDeadline.text}</div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#d1d5db' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontSize: '10px' }}>
                            {task.assignee ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <User size={10} /> {task.assignee.username}
                              </span>
                            ) : (
                              <span style={{ color: '#d1d5db' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '10px' }}>
                            {task.actualHours || task.estimatedHours ? (
                              <span>
                                {task.actualHours ? `${task.actualHours}j` : `~${task.estimatedHours}j`}
                              </span>
                            ) : (
                              <span style={{ color: '#d1d5db' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              {task.commentsCount > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', color: '#6b7280' }}>
                                  <MessageSquare size={10} />{task.commentsCount}
                                </span>
                              )}
                              {task.attachmentsCount > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', color: '#6b7280' }}>
                                  <Paperclip size={10} />{task.attachmentsCount}
                                </span>
                              )}
                              {task.commentsCount === 0 && task.attachmentsCount === 0 && (
                                <span style={{ color: '#d1d5db', fontSize: '10px' }}>—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}

          {/* Priority Summary for this project */}
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Ringkasan Prioritas:</div>
            <div style={{ display: 'flex', gap: '15px', fontSize: '11px' }}>
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(priority => {
                const info = getPriorityInfo(priority)
                const count = project.tasks.filter(t => t.priority === priority).length
                if (count === 0) return null
                return (
                  <span key={priority} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: info.color
                    }} />
                    <span style={{ color: '#374151' }}>{info.label}: <strong>{count}</strong></span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {project.tasks.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', fontSize: '13px', borderTop: '1px solid #e5e7eb' }}>
          Belum ada tugas dalam proyek ini
        </div>
      )}
    </div>
  )
}

// ─── Helper Components ───────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h2 style={{
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: '#1e3a8a',
      borderBottom: '2px solid #dbeafe',
      paddingBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span style={{ fontSize: '20px' }}>{icon}</span> {title}
    </h2>
  )
}

function CategoryHeader({ icon, title, count, color, borderColor }: {
  icon: React.ReactNode
  title: string
  count: number
  color: string
  borderColor: string
}) {
  return (
    <h2 style={{
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '20px',
      marginTop: '10px',
      color,
      borderBottom: `3px solid ${borderColor}`,
      paddingBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      {icon}
      {title} ({count})
    </h2>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{
      padding: '15px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      textAlign: 'center',
      borderTop: `4px solid ${color}`
    }}>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>
        {label}
      </div>
    </div>
  )
}

function ProgressBar({ value, height = 10 }: { value: number; height?: number }) {
  return (
    <div style={{ height: `${height}px`, backgroundColor: '#e5e7eb', borderRadius: `${height / 2}px`, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          backgroundColor: getProgressColor(value),
          width: `${value}%`,
          borderRadius: `${height / 2}px`,
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  )
}

// ─── Utility Functions ───────────────────────────────────────────────────────

function getDeadlineInfo(endDate: string | null) {
  if (!endDate) return { text: 'Tidak ada deadline', status: 'none', color: '#6b7280' }

  const now = new Date()
  const end = new Date(endDate)
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { text: `Terlewat ${Math.abs(diffDays)} hari`, status: 'overdue', color: '#dc2626', days: Math.abs(diffDays) }
  if (diffDays === 0) return { text: 'Hari ini!', status: 'today', color: '#ea580c', days: 0 }
  if (diffDays <= 3) return { text: `${diffDays} hari lagi`, status: 'urgent', color: '#dc2626', days: diffDays }
  if (diffDays <= 7) return { text: `${diffDays} hari lagi`, status: 'soon', color: '#f59e0b', days: diffDays }
  return { text: `${diffDays} hari lagi`, status: 'normal', color: '#16a34a', days: diffDays }
}

function getPriorityInfo(priority: string) {
  switch (priority) {
    case 'CRITICAL': return { label: 'Kritis', color: '#dc2626', bgColor: '#fef2f2', order: 1 }
    case 'HIGH': return { label: 'Tinggi', color: '#ea580c', bgColor: '#fff7ed', order: 2 }
    case 'MEDIUM': return { label: 'Sedang', color: '#ca8a04', bgColor: '#fefce8', order: 3 }
    case 'LOW': return { label: 'Rendah', color: '#16a34a', bgColor: '#f0fdf4', order: 4 }
    default: return { label: priority, color: '#6b7280', bgColor: '#f9fafb', order: 5 }
  }
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'Done': return { label: '✅ Selesai', color: '#16a34a', bgColor: '#f0fdf4' }
    case 'In Progress': return { label: '🔄 Dalam Pengerjaan', color: '#3b82f6', bgColor: '#dbeafe' }
    case 'Review': return { label: '👁️ Review', color: '#8b5cf6', bgColor: '#f3e8ff' }
    case 'To Do': return { label: '📝 Akan Dikerjakan', color: '#6b7280', bgColor: '#f3f4f6' }
    case 'Backlog': return { label: '📦 Cadangan', color: '#475569', bgColor: '#f1f5f9' }
    default: return { label: status, color: '#6b7280', bgColor: '#f3f4f6' }
  }
}

function getProgressColor(progress: number) {
  if (progress >= 100) return '#16a34a'
  if (progress >= 75) return '#22c55e'
  if (progress >= 50) return '#3b82f6'
  if (progress >= 25) return '#eab308'
  return '#ef4444'
}

function getCategoryLabel(project: ProjectData, sekarang: ProjectData[], rencana: ProjectData[], selesai: ProjectData[]) {
  if (sekarang.includes(project)) return { label: 'Berjalan', color: '#b45309', bgColor: '#fef3c7' }
  if (rencana.includes(project)) return { label: 'Rencana', color: '#7c3aed', bgColor: '#ede9fe' }
  if (selesai.includes(project)) return { label: 'Selesai', color: '#15803d', bgColor: '#dcfce7' }
  return { label: '—', color: '#6b7280', bgColor: '#f3f4f6' }
}
