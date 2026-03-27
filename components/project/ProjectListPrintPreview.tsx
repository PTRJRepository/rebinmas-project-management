import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Calendar, X, Building2, Clock, CheckCircle2, Zap, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Project, Task } from '@/lib/api/projects'

interface ProjectListPrintPreviewProps {
    projects: Project[]
    allTasks: Task[]
    onClose: () => void
}

export function ProjectListPrintPreview({ projects, allTasks, onClose }: ProjectListPrintPreviewProps) {
    // Add body class on mount, remove on unmount
    useEffect(() => {
        document.body.classList.add('ticket-printing')
        return () => {
            document.body.classList.remove('ticket-printing')
        }
    }, [])

    if (!projects || projects.length === 0) return null

    // Chunk projects into groups of 2 for strict "2 tickets per page" formatting
    const chunks: Project[][] = []
    for (let i = 0; i < projects.length; i += 2) {
        chunks.push(projects.slice(i, i + 2))
    }

    // Priority colors for print
    const getPrintPriorityConfig = (priority?: string) => {
        if (!priority) return { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-500', label: 'NORMAL' };
        switch (priority.toUpperCase()) {
            case 'CRITICAL': return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', label: 'CRITIS' }
            case 'HIGH': return { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600', label: 'TINGGI' }
            case 'MEDIUM': return { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600', label: 'SEDANG' }
            case 'LOW': return { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-500', label: 'RENDAH' }
            default: return { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-500', label: 'NORMAL' }
        }
    }

    const content = (
        <div className="ticket-print-root fixed inset-0 z-[9999] bg-slate-800 text-black overflow-y-auto pb-20 print:pb-0 print:bg-white print:overflow-visible">
            <style type="text/css">
                {`
                    @media print {
                        @page { size: A4 landscape; margin: 0; }
                        
                        body.ticket-printing > *:not(.ticket-print-root) {
                            display: none !important;
                            visibility: hidden !important;
                        }
                        
                        body.ticket-printing > .ticket-print-root {
                            display: block !important;
                            visibility: visible !important;
                            position: relative !important;
                            width: 100% !important;
                            height: auto !important;
                            overflow: visible !important;
                            background: white !important;
                            z-index: auto !important;
                            padding: 0 !important;
                        }
                        
                        body.ticket-printing {
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        .ticket-print-root,
                        .ticket-print-root * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        .ticket-page { 
                            height: 100vh !important;
                            max-height: 100vh !important;
                            overflow: hidden !important;
                            page-break-after: always; 
                            page-break-inside: avoid;
                            margin: 0 !important;
                        }
                        .ticket-page:last-child { 
                            page-break-after: auto; 
                        }
                        
                        .ticket-action-bar { display: none !important; }
                    }
                `}
            </style>

            {/* Non-printable Action Bar */}
            <div className="ticket-action-bar sticky top-0 left-0 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/10 p-4 flex items-center justify-between shadow-2xl z-50">
                <div className="flex items-center gap-4 text-white">
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 text-slate-300">
                        <X className="w-6 h-6" />
                    </Button>
                    <div>
                        <h2 className="font-bold text-lg leading-tight flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-sky-400" />
                            Print Project Tickets
                        </h2>
                        <p className="text-xs text-slate-400">
                            {projects.length} projects selected • 2 per page (A4 Landscape)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg border border-white/20">
                        <p className="text-xs font-bold text-slate-300">Selected</p>
                        <p className="text-xl font-black text-white">{projects.length}</p>
                    </div>
                    <Button
                        onClick={() => window.print()}
                        size="lg"
                        className="bg-sky-600 hover:bg-sky-500 text-white font-bold gap-2 shadow-lg"
                    >
                        <Printer className="w-5 h-5" />
                        Print Now
                    </Button>
                </div>
            </div>

            {/* Printable Container */}
            <div className="pt-6 print:pt-0 flex flex-col items-center gap-0 print:block">
                {chunks.map((chunk, pageIndex) => (
                    <div
                        key={pageIndex}
                        className="ticket-page w-full min-h-screen bg-white flex flex-col"
                    >
                        <div className="flex-1 flex items-stretch gap-0 px-4 py-4">
                            {chunk.map((project, idx) => {
                                const priorityConfig = getPrintPriorityConfig(project.priority)
                                const projectTasks = allTasks.filter(t => t.projectId === project.id)
                                
                                return (
                                    <div key={project.id} className={`flex-1 flex flex-col p-6 relative ${idx === 0 ? 'border-r-2 border-dashed border-slate-300' : ''}`}>
                                        
                                        {/* Cut Line Hint */}
                                        {idx === 0 && (
                                            <div className="absolute top-1/2 -right-[1.5rem] -translate-y-1/2 rotate-90 text-[8px] tracking-[0.3em] font-black text-slate-300 uppercase whitespace-nowrap opacity-50 flex items-center gap-2">
                                                <span className="w-8 border-t border-slate-300"></span>
                                                Garis Potong
                                                <span className="w-8 border-t border-slate-300"></span>
                                            </div>
                                        )}

                                        {/* Ticket Header */}
                                        <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-slate-100">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-0.5 text-[10px] font-black tracking-wider ${priorityConfig.bg} ${priorityConfig.text} uppercase`}>
                                                        {priorityConfig.label}
                                                    </span>
                                                    {project.status && (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-300 bg-slate-50 uppercase">
                                                            {project.status === 'SEKARANG' ? 'NOW' : project.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 className="text-2xl font-black text-black leading-tight mb-1">
                                                    {project.name}
                                                </h2>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                    {project.owner?.name && (
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" /> {project.owner.name}
                                                        </span>
                                                    )}
                                                    {project.endDate && (
                                                        <span className="flex items-center gap-1 font-bold text-red-600">
                                                            <Calendar className="w-3 h-3" />
                                                            Tenggat: {new Date(project.endDate).toLocaleDateString('id-ID')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-slate-200 ml-4 shrink-0">
                                                <div className="text-center leading-none">
                                                    <div className="text-3xl font-black text-slate-800">{projectTasks.length}</div>
                                                    <div className="text-[8px] font-bold text-slate-500 uppercase mt-1">Tasks</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Project Description (if short) or Task Summary */}
                                        <div className="flex-1 overflow-hidden flex flex-col">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-sky-500" />
                                                Daftar Tugas (Tasks)
                                            </h3>
                                            
                                            {projectTasks.length === 0 ? (
                                                <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm font-bold">
                                                    Belum ada tugas dalam proyek ini
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-2 align-start content-start">
                                                    {projectTasks.slice(0, 12).map((task, tIdx) => (
                                                        <div key={task.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                                                            <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 border-slate-300" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                                                                    {task.title}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                                                                    {task.status?.name && (
                                                                        <span className="truncate max-w-[80px]">[{task.status.name}]</span>
                                                                    )}
                                                                    {task.dueDate && (
                                                                        <span className="text-red-500 flex items-center gap-0.5">
                                                                            <Clock className="w-2.5 h-2.5" /> 
                                                                            {new Date(task.dueDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {projectTasks.length > 12 && (
                                                        <div className="text-xs font-bold text-slate-400 italic mt-2 text-center">
                                                            + {projectTasks.length - 12} tugas lain...
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Ticket Footer details */}
                                        <div className="mt-4 pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                                            <div className="flex gap-1">
                                                <div className="bg-slate-900 w-2 h-8" />
                                                <div className="bg-slate-900 w-4 h-8" />
                                                <div className="bg-slate-900 w-1 h-8" />
                                                <div className="bg-slate-900 w-3 h-8" />
                                                <div className="bg-slate-900 w-2 h-8" />
                                                <div className="bg-slate-900 w-1 h-8" />
                                                <div className="bg-slate-900 w-5 h-8" />
                                                <div className="bg-slate-900 w-2 h-8" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-800">REBINMAS PROJECT MGMT</p>
                                                <p className="text-[10px] font-medium text-slate-400">ID: {project.id.split('_').pop()?.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            
                            {chunk.length === 1 && (
                                <div className="flex-1" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    return createPortal(content, document.body)
}
