'use client'

import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft, Calendar, Clock, User, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  status: { name: string; order: number }
  dueDate?: string | null
  assignee?: { username: string; name?: string } | null
  estimatedHours?: number | null
  actualHours?: number | null
  progress?: number | null
}

interface TaskStatus {
  id: string
  name: string
  order: number
}

interface Project {
  id: string
  name: string
  description?: string | null
  startDate?: string | null
  endDate?: string | null
  priority: string
  bannerImage?: string | null
  owner: { username: string }
  tasks?: Task[]
  statuses?: TaskStatus[]
}

interface ProjectReportPageProps {
  project: Project
  generatedAt: string
}

export function ProjectReportPage({ project, generatedAt }: ProjectReportPageProps) {
  const handlePrint = () => {
    window.print()
  }

  const getDeadlineInfo = (endDate: string | null) => {
    if (!endDate) return { text: 'Tidak ada deadline', status: 'none' }

    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: 'Terlewat', status: 'overdue', days: Math.abs(diffDays) }
    if (diffDays === 0) return { text: 'Hari ini', status: 'today', days: 0 }
    if (diffDays <= 3) return { text: `${diffDays} hari lagi`, status: 'urgent', days: diffDays }
    if (diffDays <= 7) return { text: `${diffDays} hari lagi`, status: 'soon', days: diffDays }
    return { text: `${diffDays} hari lagi`, status: 'normal', days: diffDays }
  }

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return { label: 'Kritis', color: '#dc2626', bgColor: '#fef2f2' }
      case 'HIGH': return { label: 'Tinggi', color: '#ea580c', bgColor: '#fff7ed' }
      case 'MEDIUM': return { label: 'Sedang', color: '#ca8a04', bgColor: '#fefce8' }
      case 'LOW': return { label: 'Rendah', color: '#16a34a', bgColor: '#f0fdf4' }
      default: return { label: priority, color: '#6b7280', bgColor: '#f9fafb' }
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#16a34a'
    if (progress >= 75) return '#22c55e'
    if (progress >= 50) return '#3b82f6'
    if (progress >= 25) return '#eab308'
    return '#ef4444'
  }

  const tasksByStatus = project.statuses?.map(status => ({
    ...status,
    tasks: project.tasks?.filter(t => t.status.name === status.name) || []
  })) || []

  const totalTasks = project.tasks?.length || 0
  const completedTasks = project.tasks?.filter(t => t.status.name === 'Done').length || 0
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Calculate task statistics
  const taskStats = {
    critical: project.tasks?.filter(t => t.priority === 'CRITICAL').length || 0,
    high: project.tasks?.filter(t => t.priority === 'HIGH').length || 0,
    medium: project.tasks?.filter(t => t.priority === 'MEDIUM').length || 0,
    low: project.tasks?.filter(t => t.priority === 'LOW').length || 0,
    overdue: project.tasks?.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status.name !== 'Done').length || 0,
    totalHours: project.tasks?.reduce((sum, t) => sum + (t.actualHours || t.estimatedHours || 0), 0) || 0
  }

  const priorityInfo = getPriorityInfo(project.priority)
  const deadlineInfo = getDeadlineInfo(project.endDate || null)

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
          [role="navigation"] {
            display: none !important;
          }

          /* Remove all shadows and effects */
          * {
            box-shadow: none !important;
            text-shadow: none !important;
            background-image: none !important;
          }

          /* Ensure white backgrounds */
          .print-bg-white {
            background: white !important;
          }

          /* Force border visibility */
          .print-border {
            border: 1px solid #d1d5db !important;
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

          /* Link handling */
          a {
            color: #1d4ed8 !important;
            text-decoration: underline;
          }

          /* Table styles */
          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            border: 1px solid #d1d5db !important;
            padding: 6px 8px !important;
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
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <Link href={`/projects/${project.id}`} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Kembali ke Project
            </Link>
            <Button onClick={handlePrint} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
              <Printer className="w-4 h-4" />
              Cetak Laporan
            </Button>
          </div>
        </div>

        {/* Report Content Container - Screen View */}
        <div className="max-w-5xl mx-auto p-8 bg-slate-800 min-h-screen">
          {/* Document preview for screen */}
          <div className="bg-white text-gray-900 rounded-lg shadow-xl p-8" style={{ minHeight: '297mm' }}>
            {renderReportContent({
              project, generatedAt, priorityInfo, deadlineInfo,
              tasksByStatus, totalTasks, completedTasks, overallProgress,
              taskStats, getDeadlineInfo, getPriorityInfo, getProgressColor
            })}
          </div>
        </div>
      </div>

      {/* Print Layout - Separate structure for actual printing */}
      <div className="print-only print:block hidden">
        <div className="print-bg-white" style={{ padding: '0' }}>
          {renderReportContent({
            project, generatedAt, priorityInfo, deadlineInfo,
            tasksByStatus, totalTasks, completedTasks, overallProgress,
            taskStats, getDeadlineInfo, getPriorityInfo, getProgressColor
          })}
        </div>
      </div>
    </>
  )
}

// Separate render function to share between screen and print
function renderReportContent({
  project, generatedAt, priorityInfo, deadlineInfo,
  tasksByStatus, totalTasks, completedTasks, overallProgress,
  taskStats, getDeadlineInfo, getPriorityInfo, getProgressColor
}: any) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Report Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '3px solid #1e40af' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e3a8a' }}>
          LAPORAN PROYEK
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 4px 0' }}>
          Sistem Manajemen Proyek Rebinmas
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
          Dicetak: {generatedAt}
        </p>
      </div>

      {/* Project Information */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: priorityInfo.bgColor, border: `2px solid ${priorityInfo.color}`, borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#111827' }}>
              {project.name}
            </h2>
            {project.description && (
              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0, lineHeight: '1.5' }}>
                {project.description}
              </p>
            )}
          </div>
          <div style={{ marginLeft: '20px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: priorityInfo.color,
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '6px',
              fontSize: '13px'
            }}>
              {priorityInfo.label}
            </span>
          </div>
        </div>

        {/* Project Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', fontSize: '13px' }}>
          {project.startDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: '#3b82f6' }} />
              <div>
                <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Mulai</div>
                <div style={{ fontWeight: '600', color: '#111827' }}>
                  {new Date(project.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}
          {project.endDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: deadlineInfo.status === 'overdue' || deadlineInfo.status === 'today' ? '#ef4444' : '#3b82f6' }} />
              <div>
                <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Deadline</div>
                <div style={{ fontWeight: '600', color: deadlineInfo.status === 'overdue' || deadlineInfo.status === 'today' ? '#dc2626' : '#111827' }}>
                  {new Date(project.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} style={{ color: '#3b82f6' }} />
            <div>
              <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Owner</div>
              <div style={{ fontWeight: '600', color: '#111827' }}>{project.owner.username}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ fontWeight: '600', color: '#374151' }}>Progress Keseluruhan</span>
            <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>{overallProgress}%</span>
          </div>
          <div style={{ height: '12px', backgroundColor: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                backgroundColor: getProgressColor(overallProgress),
                width: `${overallProgress}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '30px' }}>
        <StatCard label="Total Tasks" value={totalTasks} color="#3b82f6" />
        <StatCard label="Selesai" value={completedTasks} color="#16a34a" />
        <StatCard label="Terlambat" value={taskStats.overdue} color="#dc2626" />
        <StatCard label="Total Jam" value={`${taskStats.totalHours}h`} color="#8b5cf6" />
        <StatCard label="Prioritas Tinggi" value={taskStats.critical + taskStats.high} color="#f59e0b" />
      </div>

      {/* Tasks by Status */}
      <div className="page-break-before" style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#1e3a8a', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
          DAFTAR TUGAS
        </h3>

        {tasksByStatus.map((statusGroup: any) => (
          <div key={statusGroup.id} style={{ marginBottom: '25px' }} className="avoid-break">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#374151' }}>
                {statusGroup.name}
              </h4>
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#e5e7eb',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#4b5563'
              }}>
                {statusGroup.tasks.length} tugas
              </span>
            </div>

            {statusGroup.tasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {statusGroup.tasks.map((task: any) => {
                  const taskPriority = getPriorityInfo(task.priority)
                  const taskDeadline = getDeadlineInfo(task.dueDate || null)

                  return (
                    <div key={task.id} style={{
                      padding: '12px 15px',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      borderLeft: `4px solid ${taskPriority.color}`
                    }} className="avoid-break">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 6px 0', color: '#111827' }}>
                            {task.title}
                          </h5>
                          {task.description && (
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: '1.4' }}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{
                          padding: '3px 10px',
                          backgroundColor: taskPriority.bgColor,
                          color: taskPriority.color,
                          borderRadius: '4px',
                          fontWeight: '600',
                          fontSize: '11px'
                        }}>
                          {taskPriority.label}
                        </span>
                        {task.assignee && (
                          <span style={{ color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} /> {task.assignee.username}
                          </span>
                        )}
                        {task.estimatedHours && (
                          <span style={{ color: '#4b5563' }}>
                            {task.actualHours || task.estimatedHours}j
                            {task.actualHours && task.estimatedHours && ` / ${task.estimatedHours}j`}
                          </span>
                        )}
                        {task.dueDate && (
                          <span style={{
                            color: taskDeadline.status === 'overdue' || taskDeadline.status === 'today' ? '#dc2626' : '#4b5563',
                            fontWeight: taskDeadline.status === 'overdue' || taskDeadline.status === 'today' ? '600' : '400',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Calendar size={12} />
                            {new Date(task.dueDate).toLocaleDateString('id-ID')}
                            {taskDeadline.status !== 'normal' && (
                              <span style={{ marginLeft: '4px', padding: '2px 6px', backgroundColor: '#fef2f2', borderRadius: '3px' }}>
                                {taskDeadline.text}
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {task.progress !== undefined && task.progress !== null && (
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                            <span style={{ color: '#6b7280' }}>Progress</span>
                            <span style={{ fontWeight: '600', color: '#111827' }}>{task.progress}%</span>
                          </div>
                          <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                backgroundColor: getProgressColor(task.progress),
                                width: `${task.progress}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', padding: '20px', fontStyle: 'italic' }}>
                Tidak ada tugas dalam kategori ini
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Summary Table */}
      <div className="page-break-before" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#1e3a8a', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
          RINGKASAN PRIORITAS
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '10px 15px', textAlign: 'left', fontWeight: '600', border: '1px solid #d1d5db' }}>Prioritas</th>
              <th style={{ padding: '10px 15px', textAlign: 'center', fontWeight: '600', border: '1px solid #d1d5db' }}>Jumlah</th>
              <th style={{ padding: '10px 15px', textAlign: 'center', fontWeight: '600', border: '1px solid #d1d5db' }}>Persentase</th>
            </tr>
          </thead>
          <tbody>
            <SummaryRow label="Kritis" count={taskStats.critical} total={totalTasks} color="#dc2626" />
            <SummaryRow label="Tinggi" count={taskStats.high} total={totalTasks} color="#ea580c" />
            <SummaryRow label="Sedang" count={taskStats.medium} total={totalTasks} color="#ca8a04" />
            <SummaryRow label="Rendah" count={taskStats.low} total={totalTasks} color="#16a34a" />
          </tbody>
        </table>
      </div>

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
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      padding: '15px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      textAlign: 'center',
      borderTop: `3px solid ${color}`
    }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>
        {label}
      </div>
    </div>
  )
}

function SummaryRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <tr>
      <td style={{ padding: '10px 15px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: count > 0 ? color : '#d1d5db'
          }} />
          {label}
        </div>
      </td>
      <td style={{ padding: '10px 15px', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '600' }}>
        {count}
      </td>
      <td style={{ padding: '10px 15px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
        {percentage}%
      </td>
    </tr>
  )
}
