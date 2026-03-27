import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Calendar, X, User, Clock, FileText, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPriorityIcon } from '@/components/KanbanTask'

interface Task {
    id: string
    title: string
    description?: string | null
    priority: string
    statusId: string
    dueDate: Date | null
    estimatedHours?: number | null
    assignee?: {
        id: string
        username: string
        name: string
        avatarUrl?: string | null
    } | null
}

interface TicketPrintPreviewProps {
    tasks: Task[]
    onClose: () => void
    projectName: string
}

export function TicketPrintPreview({ tasks, onClose, projectName }: TicketPrintPreviewProps) {
    // Add body class on mount, remove on unmount
    useEffect(() => {
        document.body.classList.add('ticket-printing')
        return () => {
            document.body.classList.remove('ticket-printing')
        }
    }, [])

    if (!tasks || tasks.length === 0) return null

    // Chunk tasks into groups of 2 for strict "2 tickets per page" formatting
    const chunks: Task[][] = []
    for (let i = 0; i < tasks.length; i += 2) {
        chunks.push(tasks.slice(i, i + 2))
    }

    // Priority colors for print
    const getPrintPriorityConfig = (priority: string) => {
        switch (priority) {
            case 'CRITICAL': return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', label: 'CRITICAL' }
            case 'HIGH': return { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600', label: 'HIGH' }
            case 'MEDIUM': return { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600', label: 'MEDIUM' }
            case 'LOW': return { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-500', label: 'LOW' }
            default: return { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-500', label: 'NORMAL' }
        }
    }

    // Generate a simple barcode-like pattern from task ID
    const generateBarcode = (id: string) => {
        const bars = []
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        for (let i = 0; i < 12; i++) {
            const width = ((hash * (i + 1)) % 3) + 1
            bars.push(
                <div
                    key={i}
                    className="bg-slate-900"
                    style={{ width: `${width}px`, height: '40px' }}
                />
            )
        }
        return bars
    }

    const content = (
        <div className="ticket-print-root fixed inset-0 z-[9999] bg-slate-800 text-black overflow-y-auto pb-20 print:pb-0 print:bg-white print:overflow-visible">
            <style type="text/css">
                {`
                    @media print {
                        @page { size: A4 landscape; margin: 0; }
                        
                        /* When ticket-printing class is on body, hide everything else */
                        body.ticket-printing > *:not(.ticket-print-root) {
                            display: none !important;
                            visibility: hidden !important;
                        }
                        
                        /* Make the ticket root visible and properly positioned */
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
                        
                        /* Ensure colors print correctly */
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
                        
                        /* Hide action bar during print */
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
                            <FileText className="w-5 h-5 text-sky-400" />
                            Print Work Tickets
                        </h2>
                        <p className="text-xs text-slate-400">
                            {tasks.length} tickets selected • 2 per page (A4 Landscape)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg border border-white/20">
                        <p className="text-xs font-bold text-slate-300">Selected Tasks</p>
                        <p className="text-xl font-black text-white">{tasks.length}</p>
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
                        {/* Header - Project Info */}
                        <div className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center font-black text-xl">
                                    T
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Project Work Order</p>
                                    <h1 className="text-xl font-black">{projectName}</h1>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Page</p>
                                <p className="text-2xl font-black">{pageIndex + 1} / {chunks.length}</p>
                            </div>
                        </div>

                        {/* Tickets Grid - 2 per row */}
                        <div className="flex-1 flex items-stretch gap-0 px-4 py-4">
                            {chunk.map((task, idx) => {
                                const priorityConfig = getPrintPriorityConfig(task.priority)

                                return (
                                    <div key={task.id} className="flex-1 flex">
                                        {/* Main Ticket Body */}
                                        <div className="flex-1 bg-white border-2 border-slate-900 rounded-l-2xl p-5 flex flex-col relative overflow-hidden">
                                            {/* Top decorative bar */}
                                            <div className={`absolute top-0 left-0 right-0 h-2 ${priorityConfig.bg}`} />

                                            {/* Ticket Header */}
                                            <div className="flex items-start justify-between mb-4 pt-2">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Task ID</p>
                                                    <p className="text-lg font-black text-slate-900">{task.id.substring(0, 8).toUpperCase()}</p>
                                                </div>
                                                <div className={`${priorityConfig.bg} ${priorityConfig.text} px-3 py-1.5 rounded-lg flex items-center gap-1.5`}>
                                                    {getPriorityIcon(task.priority)}
                                                    <span className="text-[10px] font-black uppercase">{priorityConfig.label}</span>
                                                </div>
                                            </div>

                                            {/* Task Title */}
                                            <div className="mb-4 flex-1">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Task Title</p>
                                                <h2 className="text-lg font-black text-slate-900 leading-tight">{task.title}</h2>
                                            </div>

                                            {/* Output / Tujuan */}
                                            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 mb-4 flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center">
                                                        <Zap className="w-4 h-4 text-white" />
                                                    </div>
                                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Output / Tujuan</p>
                                                </div>
                                                {task.description ? (
                                                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">
                                                        {task.description}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-slate-400 italic">Tidak ada deskripsi</p>
                                                )}
                                            </div>

                                            {/* Info Grid */}
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                        <p className="text-[9px] text-slate-400 font-black uppercase">Deadline</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {task.dueDate
                                                            ? new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                                            : '-'}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <User className="w-3.5 h-3.5 text-slate-500" />
                                                        <p className="text-[9px] text-slate-400 font-black uppercase">Assignee</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900 truncate">
                                                        {task.assignee?.name || '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Estimated Hours */}
                                            {task.estimatedHours && (
                                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                        <p className="text-[9px] text-slate-400 font-black uppercase">Est. Hours</p>
                                                    </div>
                                                    <p className="text-lg font-black text-slate-900">{task.estimatedHours}h</p>
                                                </div>
                                            )}

                                            {/* Barcode */}
                                            <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-200 flex items-center gap-4">
                                                <div className="flex items-end gap-0.5">
                                                    {generateBarcode(task.id)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[8px] text-slate-400 font-mono">REBINMAS-{task.id.substring(0, 8).toUpperCase()}</p>
                                                </div>
                                            </div>

                                            {/* Corner decoration */}
                                            <div className="absolute top-0 right-0 w-16 h-16 opacity-5">
                                                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                                                    <polygon points="0,0 100,0 100,100" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Perforated Edge */}
                                        <div className="w-8 flex flex-col items-center justify-center bg-white relative">
                                            {/* Dashed line */}
                                            <div className="absolute inset-y-0 left-0 border-l-2 border-dashed border-slate-300" />
                                            {/* Cutout circles */}
                                            <div className="absolute -left-2 w-4 h-4 rounded-full bg-white border-2 border-slate-300" style={{ top: '30%' }} />
                                            <div className="absolute -left-2 w-4 h-4 rounded-full bg-white border-2 border-slate-300" style={{ top: '50%' }} />
                                            <div className="absolute -left-2 w-4 h-4 rounded-full bg-white border-2 border-slate-300" style={{ top: '70%' }} />
                                        </div>

                                        {/* Ticket Stub (right side) */}
                                        <div className="w-28 bg-slate-100 border-2 border-slate-300 border-l-0 rounded-r-xl p-3 flex flex-col">
                                            <div className="text-center mb-3 pb-3 border-b-2 border-slate-300">
                                                <p className="text-[8px] text-slate-500 font-bold uppercase">Stub</p>
                                                <p className="text-xs font-black text-slate-900 mt-1">WORK ORDER</p>
                                            </div>
                                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Priority</p>
                                                <div className={`${priorityConfig.bg} ${priorityConfig.text} px-2 py-1 rounded text-[9px] font-black uppercase mb-3`}>
                                                    {priorityConfig.label}
                                                </div>

                                                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Deadline</p>
                                                <p className="text-[10px] font-black text-slate-900 mb-3">
                                                    {task.dueDate
                                                        ? new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                                        : '-'}
                                                </p>

                                                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Assignee</p>
                                                <p className="text-[10px] font-black text-slate-900 truncate w-full">
                                                    {task.assignee?.name?.split(' ')[0] || '-'}
                                                </p>
                                            </div>
                                            <div className="mt-auto pt-3 border-t-2 border-slate-300 text-center">
                                                <p className="text-[7px] text-slate-400 uppercase font-bold">Keep this stub</p>
                                            </div>
                                        </div>

                                        {/* Spacer between tickets (except last in row) */}
                                        {idx === 0 && (
                                            <div className="w-4" />
                                        )}
                                    </div>
                                )
                            })}

                            {/* Empty slot if odd number */}
                            {chunk.length === 1 && (
                                <div className="flex-1" />
                            )}
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-100 border-t border-slate-300 px-8 py-3 flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                                Generated: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-xs font-bold text-slate-700">REBINMAS SCHEDULE TRACKER</p>
                            <p className="text-xs text-slate-500"> Confidential</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    return createPortal(content, document.body)
}
