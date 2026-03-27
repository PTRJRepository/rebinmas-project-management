import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Calendar, X, User, Clock, FileText, Zap, LayoutGrid, List } from 'lucide-react'
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

type LayoutMode = 'compact' | 'normal' | 'detailed'

export function TicketPrintPreview({ tasks, onClose, projectName }: TicketPrintPreviewProps) {
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('compact')

    // Add body class on mount, remove on unmount
    useEffect(() => {
        document.body.classList.add('ticket-printing')
        return () => {
            document.body.classList.remove('ticket-printing')
        }
    }, [])

    if (!tasks || tasks.length === 0) return null

    // Chunk tasks based on layout mode
    const getTasksPerPage = () => {
        switch (layoutMode) {
            case 'compact': return 4 // 2x2 grid - most paper efficient
            case 'normal': return 3 // 2 columns, flexible rows
            case 'detailed': return 2 // 1 column, full details
            default: return 4
        }
    }

    const tasksPerPage = getTasksPerPage()
    const chunks: Task[][] = []
    for (let i = 0; i < tasks.length; i += tasksPerPage) {
        chunks.push(tasks.slice(i, i + tasksPerPage))
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
                    style={{ width: `${width}px`, height: '30px' }}
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
                            {tasks.length} tickets • {layoutMode === 'compact' ? '4 per page (Most Efficient)' : layoutMode === 'normal' ? '3 per page' : '2 per page (Detailed)'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Layout Mode Selector */}
                    <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                        <Button
                            variant={layoutMode === 'compact' ? 'default' : 'ghost'}
                            size="sm"
                            className={`h-8 px-3 gap-1 ${layoutMode === 'compact' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                            onClick={() => setLayoutMode('compact')}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="text-xs font-bold">Compact (4/pg)</span>
                        </Button>
                        <Button
                            variant={layoutMode === 'normal' ? 'default' : 'ghost'}
                            size="sm"
                            className={`h-8 px-3 gap-1 ${layoutMode === 'normal' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                            onClick={() => setLayoutMode('normal')}
                        >
                            <List className="w-4 h-4" />
                            <span className="text-xs font-bold">Normal (3/pg)</span>
                        </Button>
                        <Button
                            variant={layoutMode === 'detailed' ? 'default' : 'ghost'}
                            size="sm"
                            className={`h-8 px-3 gap-1 ${layoutMode === 'detailed' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                            onClick={() => setLayoutMode('detailed')}
                        >
                            <FileText className="w-4 h-4" />
                            <span className="text-xs font-bold">Detailed (2/pg)</span>
                        </Button>
                    </div>
                    <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg border border-white/20">
                        <p className="text-xs font-bold text-slate-300">Pages</p>
                        <p className="text-xl font-black text-white">{chunks.length}</p>
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
                        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:px-4 print:py-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center font-black text-lg print:w-8 print:h-8 print:text-base">
                                    T
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Project Work Order</p>
                                    <h1 className="text-lg font-black print:text-base">{projectName}</h1>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Page</p>
                                <p className="text-xl font-black print:text-lg">{pageIndex + 1} / {chunks.length}</p>
                            </div>
                        </div>

                        {/* Tickets Grid - Dynamic based on layout mode */}
                        <div className={`flex-1 ${
                            layoutMode === 'compact' 
                                ? 'grid grid-cols-2 gap-2 p-2' 
                                : layoutMode === 'normal'
                                ? 'flex flex-col gap-3 p-3'
                                : 'flex flex-col gap-4 p-4'
                        } print:gap-1 print:p-1`}>
                            {chunk.map((task) => {
                                const priorityConfig = getPrintPriorityConfig(task.priority)
                                
                                // Compact layout - 4 tickets per page (2x2 grid)
                                if (layoutMode === 'compact') {
                                    return (
                                        <div key={task.id} className="bg-white border-2 border-slate-800 rounded-lg p-3 relative overflow-hidden break-inside-avoid">
                                            {/* Top decorative bar */}
                                            <div className={`absolute top-0 left-0 right-0 h-1.5 ${priorityConfig.bg}`} />
                                            
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-2 pt-1.5">
                                                <div>
                                                    <p className="text-[7px] text-slate-400 font-bold uppercase">Task ID</p>
                                                    <p className="text-sm font-black text-slate-900">{task.id.substring(0, 8).toUpperCase()}</p>
                                                </div>
                                                <div className={`${priorityConfig.bg} ${priorityConfig.text} px-2 py-0.5 rounded flex items-center gap-1`}>
                                                    {getPriorityIcon(task.priority)}
                                                    <span className="text-[7px] font-black uppercase">{priorityConfig.label}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Title */}
                                            <h3 className="text-sm font-bold text-slate-900 leading-tight mb-2 line-clamp-2">{task.title}</h3>
                                            
                                            {/* Description - truncated */}
                                            {task.description && (
                                                <p className="text-[9px] text-slate-600 mb-2 line-clamp-2">{task.description}</p>
                                            )}
                                            
                                            {/* Meta info */}
                                            <div className="flex items-center justify-between gap-2 text-[8px]">
                                                {task.dueDate && (
                                                    <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-1 rounded">
                                                        <Calendar className="w-2.5 h-2.5" />
                                                        <span className="font-medium">{new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                                    </div>
                                                )}
                                                {task.assignee && (
                                                    <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-1 rounded">
                                                        <User className="w-2.5 h-2.5" />
                                                        <span className="font-medium truncate max-w-[80px]">{task.assignee.name.split(' ')[0]}</span>
                                                    </div>
                                                )}
                                                {task.estimatedHours && (
                                                    <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-1 rounded">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        <span className="font-medium">{task.estimatedHours}h</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Barcode */}
                                            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex items-center gap-2">
                                                <div className="flex items-end gap-0.5 flex-1">
                                                    {generateBarcode(task.id)}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                
                                // Normal layout - 3 tickets per page
                                if (layoutMode === 'normal') {
                                    return (
                                        <div key={task.id} className="bg-white border-2 border-slate-800 rounded-xl p-4 relative overflow-hidden break-inside-avoid flex gap-3">
                                            {/* Main ticket */}
                                            <div className="flex-1">
                                                <div className={`absolute top-0 left-0 right-0 h-2 ${priorityConfig.bg}`} />
                                                
                                                <div className="flex items-start justify-between mb-3 pt-2">
                                                    <div>
                                                        <p className="text-[8px] text-slate-400 font-bold uppercase">Task ID</p>
                                                        <p className="text-base font-black text-slate-900">{task.id.substring(0, 8).toUpperCase()}</p>
                                                    </div>
                                                    <div className={`${priorityConfig.bg} ${priorityConfig.text} px-2.5 py-1 rounded-lg flex items-center gap-1.5`}>
                                                        {getPriorityIcon(task.priority)}
                                                        <span className="text-[8px] font-black uppercase">{priorityConfig.label}</span>
                                                    </div>
                                                </div>
                                                
                                                <h3 className="text-base font-bold text-slate-900 leading-tight mb-2">{task.title}</h3>
                                                
                                                {task.description && (
                                                    <p className="text-[10px] text-slate-600 mb-3 line-clamp-2">{task.description}</p>
                                                )}
                                                
                                                <div className="flex items-center gap-3 text-[9px]">
                                                    {task.dueDate && (
                                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded">
                                                            <Calendar className="w-3 h-3" />
                                                            <span className="font-medium">{new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                    )}
                                                    {task.assignee && (
                                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded">
                                                            <User className="w-3 h-3" />
                                                            <span className="font-medium">{task.assignee.name}</span>
                                                        </div>
                                                    )}
                                                    {task.estimatedHours && (
                                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded">
                                                            <Clock className="w-3 h-3" />
                                                            <span className="font-medium">{task.estimatedHours}h</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Stub */}
                                            <div className="w-20 bg-slate-50 border-l-2 border-dashed border-slate-300 pl-3 flex flex-col justify-center">
                                                <p className="text-[7px] text-slate-400 font-bold uppercase mb-2">Quick Info</p>
                                                <div className="space-y-1.5">
                                                    <div>
                                                        <p className="text-[7px] text-slate-500">Priority</p>
                                                        <div className={`${priorityConfig.bg} ${priorityConfig.text} px-1.5 py-0.5 rounded text-[7px] font-black uppercase inline-block`}>{priorityConfig.label}</div>
                                                    </div>
                                                    {task.dueDate && (
                                                        <div>
                                                            <p className="text-[7px] text-slate-500">Deadline</p>
                                                            <p className="text-[8px] font-bold">{new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                                        </div>
                                                    )}
                                                    {task.assignee && (
                                                        <div>
                                                            <p className="text-[7px] text-slate-500">Assignee</p>
                                                            <p className="text-[8px] font-bold truncate">{task.assignee.name.split(' ')[0]}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                
                                // Detailed layout - 2 tickets per page
                                return (
                                    <div key={task.id} className="bg-white border-2 border-slate-800 rounded-2xl p-5 relative overflow-hidden break-inside-avoid">
                                        <div className={`absolute top-0 left-0 right-0 h-2 ${priorityConfig.bg}`} />
                                        
                                        <div className="flex items-start justify-between mb-4 pt-2">
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Task ID</p>
                                                <p className="text-lg font-black text-slate-900">{task.id.substring(0, 8).toUpperCase()}</p>
                                            </div>
                                            <div className={`${priorityConfig.bg} ${priorityConfig.text} px-3 py-1.5 rounded-lg flex items-center gap-1.5`}>
                                                {getPriorityIcon(task.priority)}
                                                <span className="text-[9px] font-black uppercase">{priorityConfig.label}</span>
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-3">{task.title}</h3>
                                        
                                        {/* Output / Tujuan */}
                                        {task.description && (
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Zap className="w-4 h-4 text-slate-600" />
                                                    <p className="text-[8px] text-slate-600 font-black uppercase">Output / Tujuan</p>
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed">{task.description}</p>
                                            </div>
                                        )}
                                        
                                        <div className="grid grid-cols-3 gap-3 mb-4">
                                            {task.dueDate && (
                                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                        <p className="text-[8px] text-slate-400 font-black uppercase">Deadline</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            )}
                                            {task.assignee && (
                                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <User className="w-3.5 h-3.5 text-slate-500" />
                                                        <p className="text-[8px] text-slate-400 font-black uppercase">Assignee</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900 truncate">{task.assignee.name}</p>
                                                </div>
                                            )}
                                            {task.estimatedHours && (
                                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                        <p className="text-[8px] text-slate-400 font-black uppercase">Est. Hours</p>
                                                    </div>
                                                    <p className="text-lg font-black text-slate-900">{task.estimatedHours}h</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Barcode */}
                                        <div className="pt-3 border-t-2 border-dashed border-slate-200 flex items-center gap-4">
                                            <div className="flex items-end gap-0.5">
                                                {generateBarcode(task.id)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[8px] text-slate-400 font-mono">REBINMAS-{task.id.substring(0, 8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-100 border-t border-slate-300 px-6 py-2.5 flex items-center justify-between print:px-4 print:py-2">
                            <p className="text-[10px] text-slate-500">
                                Generated: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] font-bold text-slate-700">REBINMAS SCHEDULE TRACKER</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    return createPortal(content, document.body)
}
