'use client'

import { Button } from '@/components/ui/button'
import { Printer, Loader2, Calendar, Clock, User, CheckCircle } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  status: { name: string }
  dueDate?: string | null
  assignee?: { username: string } | null
  estimatedHours?: number | null
  actualHours?: number | null
}

interface Project {
  id: string
  name: string
  description?: string | null
  startDate?: string | null
  endDate?: string | null
  priority: string
  bannerImage?: string | null
  _count: { tasks: number }
  tasks?: Task[]
}

interface ReportPageProps {
  projects: Project[]
  generatedAt: string
}

export function ReportPage({ projects, generatedAt }: ReportPageProps) {
  const handlePrint = () => {
    window.print()
  }

  const categorizeProjects = (projects: Project[]) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const selesai: Project[] = []
    const sekarang: Project[] = []
    const rencana: Project[] = []

    projects.forEach(project => {
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

  const getDeadlineInfo = (endDate: string | null) => {
    if (!endDate) return { text: 'Tidak ada deadline', status: 'none', color: '#6b7280' }

    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: 'Terlewat', status: 'overdue', color: '#dc2626', days: Math.abs(diffDays) }
    if (diffDays === 0) return { text: 'Hari ini', status: 'today', color: '#ea580c', days: 0 }
    if (diffDays <= 3) return { text: `${diffDays} hari lagi`, status: 'urgent', color: '#dc2626', days: diffDays }
    if (diffDays <= 7) return { text: `${diffDays} hari lagi`, status: 'soon', color: '#f59e0b', days: diffDays }
    return { text: `${diffDays} hari lagi`, status: 'normal', color: '#16a34a', days: diffDays }
  }

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return { label: 'Kritis', color: '#dc2626', bgColor: '#fef2f2', order: 1 }
      case 'HIGH': return { label: 'Tinggi', color: '#ea580c', bgColor: '#fff7ed', order: 2 }
      case 'MEDIUM': return { label: 'Sedang', color: '#ca8a04', bgColor: '#fefce8', order: 3 }
      case 'LOW': return { label: 'Rendah', color: '#16a34a', bgColor: '#f0fdf4', order: 4 }
      default: return { label: priority, color: '#6b7280', bgColor: '#f9fafb', order: 5 }
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Done': return { label: 'Selesai', color: '#16a34a', bgColor: '#f0fdf4' }
      case 'In Progress': return { label: 'Dalam Pengerjaan', color: '#3b82f6', bgColor: '#dbeafe' }
      case 'Review': return { label: 'Review', color: '#8b5cf6', bgColor: '#f3e8ff' }
      case 'To Do': return { label: 'Akan Dikerjakan', color: '#6b7280', bgColor: '#f3f4f6' }
      case 'Backlog': return { label: 'Cadangan', color: '#475569', bgColor: '#f1f5f9' }
      default: return { label: status, color: '#6b7280', bgColor: '#f3f4f6' }
    }
  }

  const { rencana, sekarang, selesai } = categorizeProjects(projects)

  return (
    <>
      {/* Print-specific stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }

          body {
            background: white !important;
            color: #111827 !important;
            font-size: 11pt !important;
            line-height: 1.4 !important;
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

          /* Show print-only elements */
          .print-only-show {
            display: block !important;
          }

          /* Remove all shadows and effects */
          * {
            box-shadow: none !important;
            text-shadow: none !important;
            background-image: none !important;
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
        }
      `}</style>

      {/* Screen Layout */}
      <div className="min-h-screen bg-slate-900 text-slate-100">
        {/* Header - Hidden in print */}
        <div className="no-print bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-sky-100">Laporan Semua Proyek</h1>
              <p className="text-slate-400 text-sm mt-1">Report seluruh proyek Rebinmas</p>
            </div>
            <Button onClick={handlePrint} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
              <Printer className="w-4 h-4" />
              Cetak Laporan
            </Button>
          </div>
        </div>

        {/* Report Content Container - Screen View */}
        <div className="max-w-5xl mx-auto p-8 bg-slate-800 min-h-screen">
          {/* Document preview for screen */}
          <div className="bg-white text-gray-900 rounded-lg shadow-xl p-8">
            {renderReportContent({
              projects, generatedAt, rencana, sekarang, selesai,
              getDeadlineInfo, getPriorityInfo, getStatusInfo
            })}
          </div>
        </div>
      </div>
    </>
  )
}

// Separate render function
function renderReportContent({
  projects, generatedAt, rencana, sekarang, selesai,
  getDeadlineInfo, getPriorityInfo, getStatusInfo
}: any) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Report Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '3px solid #1e40af' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e3a8a' }}>
          LAPORAN SEMUA PROYEK
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 4px 0' }}>
          Sistem Manajemen Proyek Rebinmas
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
          Dicetak: {generatedAt}
        </p>
      </div>

      {/* Summary Section */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#1e3a8a', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
          RINGKASAN
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
          <SummaryCard label="Total Proyek" value={projects.length} color="#3b82f6" />
          <SummaryCard label="Sedang Berjalan" value={sekarang.length} color="#f59e0b" />
          <SummaryCard label="Rencana" value={rencana.length} color="#8b5cf6" />
          <SummaryCard label="Selesai" value={selesai.length} color="#16a34a" />
        </div>
      </div>

      {/* Projects by Category - Sedang Berjalan */}
      {sekarang.length > 0 && (
        <div style={{ marginBottom: '30px' }} className="page-break-before">
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#b45309',
            borderBottom: '3px solid #fcd34d',
            paddingBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Clock size={24} style={{ color: '#f59e0b' }} />
            PROYEK SEDANG BERJALAN ({sekarang.length})
          </h2>
          {sekarang.map((project: Project) => (
            <ProjectCard
              key={project.id}
              project={project}
              getDeadlineInfo={getDeadlineInfo}
              getPriorityInfo={getPriorityInfo}
              getStatusInfo={getStatusInfo}
            />
          ))}
        </div>
      )}

      {/* Projects by Category - Rencana */}
      {rencana.length > 0 && (
        <div style={{ marginBottom: '30px' }} className="page-break-before">
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#7c3aed',
            borderBottom: '3px solid #a78bfa',
            paddingBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Calendar size={24} style={{ color: '#8b5cf6' }} />
            PROYEK RENCANA ({rencana.length})
          </h2>
          {rencana.map((project: Project) => (
            <ProjectCard
              key={project.id}
              project={project}
              getDeadlineInfo={getDeadlineInfo}
              getPriorityInfo={getPriorityInfo}
              getStatusInfo={getStatusInfo}
            />
          ))}
        </div>
      )}

      {/* Projects by Category - Selesai */}
      {selesai.length > 0 && (
        <div style={{ marginBottom: '30px' }} className="page-break-before">
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#15803d',
            borderBottom: '3px solid #86efac',
            paddingBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle size={24} style={{ color: '#16a34a' }} />
            PROYEK SELESAI ({selesai.length})
          </h2>
          {selesai.map((project: Project) => (
            <ProjectCard
              key={project.id}
              project={project}
              getDeadlineInfo={getDeadlineInfo}
              getPriorityInfo={getPriorityInfo}
              getStatusInfo={getStatusInfo}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '2px solid #e5e7eb',
        textAlign: 'center',
        fontSize: '11px',
        color: '#6b7280'
      }} className="avoid-break">
        <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#374151' }}>
          Laporan ini dicetak otomatis dari Sistem Manajemen Proyek Rebinmas
        </p>
        <p style={{ margin: 0 }}>Generated at: {generatedAt}</p>
      </div>
    </div>
  )
}

// Helper Components
function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      textAlign: 'center',
      borderTop: `4px solid ${color}`
    }}>
      <div style={{ fontSize: '36px', fontWeight: 'bold', color, marginBottom: '8px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>
        {label}
      </div>
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  getDeadlineInfo: (endDate: string | null) => any
  getPriorityInfo: (priority: string) => any
  getStatusInfo: (status: string) => any
}

function ProjectCard({ project, getDeadlineInfo, getPriorityInfo, getStatusInfo }: ProjectCardProps) {
  const priorityInfo = getPriorityInfo(project.priority)
  const deadlineInfo = getDeadlineInfo(project.endDate || null)

  return (
    <div style={{
      marginBottom: '20px',
      padding: '20px',
      backgroundColor: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      borderLeft: `5px solid ${priorityInfo.color}`
    }} className="avoid-break">
      {/* Project Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111827' }}>
            {project.name}
          </h3>
          {project.description && (
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
              {project.description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: '15px' }}>
          <span style={{
            padding: '6px 14px',
            backgroundColor: priorityInfo.color,
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            {priorityInfo.label}
          </span>
          <span style={{
            padding: '6px 14px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            fontWeight: '600',
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            {project._count.tasks} Tugas
          </span>
        </div>
      </div>

      {/* Project Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px', fontSize: '12px' }}>
        {project.startDate && (
          <div>
            <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Mulai</div>
            <div style={{ fontWeight: '600', color: '#111827' }}>
              {new Date(project.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        )}
        {project.endDate && (
          <div>
            <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Deadline</div>
            <div style={{ fontWeight: '600', color: '#111827' }}>
              {new Date(project.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        )}
        <div>
          <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Status Deadline</div>
          <div style={{ fontWeight: '600', color: deadlineInfo.color }}>
            {deadlineInfo.text}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {project.tasks && project.tasks.length > 0 && (
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📋</span> Daftar Tugas
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {project.tasks.map((task) => {
              const taskPriority = getPriorityInfo(task.priority)
              const taskStatus = getStatusInfo(task.status.name)
              const taskDeadline = getDeadlineInfo(task.dueDate || null)

              return (
                <div key={task.id} style={{
                  padding: '10px 12px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${taskPriority.color}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0', color: '#111827' }}>
                        {task.title}
                      </h5>
                    </div>
                    {task.dueDate && (
                      <div style={{ fontSize: '11px', color: taskDeadline.color, fontWeight: '500' }}>
                        {new Date(task.dueDate).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: taskStatus.bgColor,
                      color: taskStatus.color,
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {taskStatus.label}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: taskPriority.bgColor,
                      color: taskPriority.color,
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {taskPriority.label}
                    </span>
                    {task.assignee && (
                      <span style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <User size={11} /> {task.assignee.username}
                      </span>
                    )}
                    {task.estimatedHours && (
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        Est: {task.estimatedHours}j
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
