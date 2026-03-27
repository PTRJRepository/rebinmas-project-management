'use client'

import { useState, useEffect, useMemo } from 'react'
import { DragDropContext, DropResult, Droppable } from '@hello-pangea/dnd'
import { updateTaskStatus } from '@/app/actions/task'
import {
    Calendar,
    Plus,
    X,
    Filter,
    ChevronDown,
    LayoutGrid,
    Search,
    ArrowUpDown,
    CheckSquare,
    Trash2,
    Tag,
    Printer,
    FileText,
    Loader2,
    ListFilter
} from 'lucide-react'
import { KanbanTask } from '@/components/KanbanTask'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTask } from '@/app/actions/task'
import { DeadlineAlertBar } from '@/components/notifications/DeadlineAlertBar'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { TaskDetailPanel } from './task/TaskDetailPanel'
import { ProjectPrintPreview } from './task/ProjectPrintPreview'
import { TicketPrintPreview } from './task/TicketPrintPreview'
import { isToday, isTomorrow, isThisWeek, isThisMonth, parseISO } from 'date-fns'
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

interface Status {
    id: string
    name: string
    order: number
}

interface KanbanBoardProps {
    initialTasks: Task[]
    statuses: Status[]
    projectId: string
    projectName?: string
    currentUserId?: string
    onMoveToNext?: (taskId: string) => Promise<void>
}

export default function KanbanBoard({ initialTasks, statuses, projectId, projectName = 'Project', currentUserId, onMoveToNext }: KanbanBoardProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [addingToStatusId, setAddingToStatusId] = useState<string | null>(null)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [groupBy, setGroupBy] = useState<'none' | 'priority' | 'hashtag' | 'date'>('none')
    const [searchQuery, setSearchQuery] = useState('')
    const [filterMyTasks, setFilterMyTasks] = useState(false)
    const [filterHighPriority, setFilterHighPriority] = useState(false)
    const [filteredByDeadlineIds, setFilteredByDeadlineIds] = useState<string[] | null>(null)
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
    const [showPrintPreview, setShowPrintPreview] = useState<'tickets' | 'project' | false>(false)
    const { toast } = useToast()

    useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    // Filtered tasks based on search, chips, and deadline bar
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesMyTasks = !filterMyTasks || task.assignee?.id === currentUserId;
            const matchesHighPriority = !filterHighPriority || (task.priority === 'HIGH' || task.priority === 'CRITICAL');
            const matchesDeadlineFilter = !filteredByDeadlineIds || filteredByDeadlineIds.includes(task.id);

            return matchesSearch && matchesMyTasks && matchesHighPriority && matchesDeadlineFilter;
        })
    }, [tasks, searchQuery, filterMyTasks, filterHighPriority, filteredByDeadlineIds, currentUserId])

    // Grouping logic (Swimlanes)
    const groupedRows = useMemo(() => {
        if (groupBy === 'none') return [{ id: 'all', name: 'Tasks', tasks: filteredTasks }]
        
        if (groupBy === 'priority') {
            const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
            return priorities.map(p => ({
                id: p,
                name: p + ' PRIORITY',
                tasks: filteredTasks.filter(t => t.priority === p)
            }))
        }

        if (groupBy === 'hashtag') {
            const groups: Record<string, Task[]> = {}
            filteredTasks.forEach(task => {
                const match = task.title.match(/#(\w+)/)
                const tag = match ? match[1].toUpperCase() : 'OTHER'
                if (!groups[tag]) groups[tag] = []
                groups[tag].push(task)
            })
            return Object.keys(groups).sort().map(tag => ({
                id: tag,
                name: tag,
                tasks: groups[tag]
            }))
        }

        if (groupBy === 'date') {
            const today: Task[] = []
            const tomorrow: Task[] = []
            const thisWeek: Task[] = []
            const thisMonth: Task[] = []
            const noDate: Task[] = []
            
            filteredTasks.forEach(task => {
                if (!task.dueDate) {
                    noDate.push(task)
                    return
                }
                const date = new Date(task.dueDate)
                if (isToday(date)) today.push(task)
                else if (isTomorrow(date)) tomorrow.push(task)
                else if (isThisWeek(date)) thisWeek.push(task)
                else if (isThisMonth(date)) thisMonth.push(task)
                else noDate.push(task) // Treat further out as other/no urgency for now
            })

            return [
                { id: 'today', name: 'Today', tasks: today },
                { id: 'tomorrow', name: 'Tomorrow', tasks: tomorrow },
                { id: 'week', name: 'This Week', tasks: thisWeek },
                { id: 'month', name: 'This Month', tasks: thisMonth },
                { id: 'nodate', name: 'No Deadline / Later', tasks: noDate },
            ].filter(g => g.tasks.length > 0)
        }

        return []
    }, [filteredTasks, groupBy])

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result
        if (!destination) return
        if (destination.droppableId === source.droppableId && destination.index === source.index) return

        // Destination droppableId is "rowId-statusId"
        const [targetRowId, targetStatusId] = destination.droppableId.split('||')
        
        // Optimistic update
        const updatedTasks = tasks.map(task =>
            task.id === draggableId ? { ...task, statusId: targetStatusId } : task
        )
        setTasks(updatedTasks)

        await updateTaskStatus(draggableId, targetStatusId, projectId)
        
        toast({
            title: "Task moved",
            description: "Task position updated successfully.",
        })
    }

    const handleCreateTask = async (statusId: string) => {
        if (!newTaskTitle.trim()) return
        setIsCreating(true)
        const formData = new FormData()
        formData.append('title', newTaskTitle)
        formData.append('projectId', projectId)
        formData.append('statusId', statusId)
        formData.append('priority', 'MEDIUM')

        const result = await createTask(formData)
        if (result.success && result.data) {
            setTasks([result.data as Task, ...tasks])
            setNewTaskTitle('')
            setAddingToStatusId(null)
        }
        setIsCreating(false)
    }

    const handleToggleSelect = (taskId: string, selected: boolean) => {
        const newSelected = new Set(selectedTaskIds)
        if (selected) newSelected.add(taskId)
        else newSelected.delete(taskId)
        setSelectedTaskIds(newSelected)
    }

    const clearSelection = () => setSelectedTaskIds(new Set())

    // If project print preview is requested
    if (showPrintPreview === 'project') {
        return (
            <TicketPrintPreview
                tasks={tasks}
                projectName={projectName}
                onClose={() => setShowPrintPreview(false)}
            />
        )
    }

    // If ticket print preview is requested, isolate the DOM
    if (showPrintPreview === 'tickets') {
        return (
            <TicketPrintPreview
                tasks={tasks.filter(t => selectedTaskIds.has(t.id))}
                projectName={projectName}
                onClose={() => setShowPrintPreview(false)}
            />
        )
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-220px)] w-full overflow-hidden bg-slate-950/20 relative">
            <DeadlineAlertBar 
                tasks={tasks as any} 
                onFilterTasks={(ids) => setFilteredByDeadlineIds(ids)} 
            />

            {/* Top Filter Bar - Figma Style */}
            <div className="flex flex-col items-start md:flex-row md:items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/95 backdrop-blur-xl sticky top-[68px] z-30 shadow-md">
                <div className="flex items-center gap-6 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                        <Input 
                            placeholder="Filter tasks..." 
                            className="w-64 bg-slate-800/50 border-white/5 pl-10 h-9 text-sm focus-visible:ring-sky-500/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-[1px] bg-white/10 mx-2" />
                        
                        {/* Advanced Filter Chips */}
                        <Badge 
                            variant="outline" 
                            className={cn(
                                "cursor-pointer transition-all",
                                filterMyTasks 
                                    ? "border-sky-500/50 text-sky-400 bg-sky-500/20 hover:bg-sky-500/30" 
                                    : "border-white/10 text-slate-400 hover:bg-white/5"
                            )}
                            onClick={() => setFilterMyTasks(!filterMyTasks)}
                        >
                            My Tasks
                        </Badge>
                        <Badge 
                            variant="outline" 
                            className={cn(
                                "cursor-pointer transition-all",
                                filterHighPriority 
                                    ? "border-amber-500/50 text-amber-400 bg-amber-500/20 hover:bg-amber-500/30" 
                                    : "border-white/10 text-slate-400 hover:bg-white/5"
                            )}
                            onClick={() => setFilterHighPriority(!filterHighPriority)}
                        >
                            High Priority
                        </Badge>
                        <Badge variant="outline" className="border-white/10 text-slate-400 cursor-pointer hover:bg-white/5 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> More Filters
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-white/5">
                        <Button 
                            variant={groupBy === 'none' ? 'default' : 'ghost'} 
                            size="sm" 
                            className={cn(
                                "h-7 text-[10px] font-bold px-3 gap-1.5",
                                groupBy === 'none' ? "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30" : "text-slate-400"
                            )}
                            onClick={() => setGroupBy('none')}
                        >
                            <LayoutGrid className="w-3 h-3" />
                            BOARD
                        </Button>
                        <Button 
                            variant={groupBy === 'hashtag' ? 'default' : 'ghost'} 
                            size="sm" 
                            className={cn(
                                "h-7 text-[10px] font-bold px-3 gap-1.5",
                                groupBy === 'hashtag' ? "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30" : "text-slate-400"
                            )}
                            onClick={() => setGroupBy('hashtag')}
                        >
                            <Tag className="w-3 h-3" />
                            TAGS
                        </Button>
                        <Button 
                            variant={groupBy === 'date' ? 'default' : 'ghost'} 
                            size="sm" 
                            className={cn(
                                "h-7 text-[10px] font-bold px-3 gap-1.5",
                                groupBy === 'date' ? "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30" : "text-slate-400"
                            )}
                            onClick={() => setGroupBy('date')}
                        >
                            <Calendar className="w-3 h-3" />
                            DATE
                        </Button>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10 mx-1" />
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-slate-300 hover:bg-white/10 font-bold h-9 gap-2"
                        onClick={() => setShowPrintPreview('project')}
                    >
                        <FileText className="w-4 h-4" />
                        PRINT PROJECT
                    </Button>
                    <Button
                        size="sm"
                        className="bg-sky-500 hover:bg-sky-600 text-white font-bold h-9 gap-2 shadow-lg shadow-sky-500/20"
                        onClick={() => setAddingToStatusId(statuses[0].id)}
                    >
                        <Plus className="w-4 h-4" />
                        NEW TASK
                    </Button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedTaskIds.size > 0 && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-sky-600 text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 font-medium">
                        <CheckSquare className="w-5 h-5" />
                        <span>{selectedTaskIds.size} selected</span>
                    </div>
                    <div className="h-5 w-[1px] bg-white/30" />
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="hover:bg-white/20 text-white gap-2">
                            <ListFilter className="w-4 h-4" /> Status
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-white/20 text-white gap-2">
                            <ArrowUpDown className="w-4 h-4" /> Priority
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-white/20 text-white gap-2" onClick={() => setShowPrintPreview('tickets')}>
                            <Printer className="w-4 h-4" /> Print Labels
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-red-500/80 text-white gap-2 ml-2">
                            <Trash2 className="w-4 h-4" /> Delete
                        </Button>
                    </div>
                    <div className="h-5 w-[1px] bg-white/30" />
                    <Button size="icon" variant="ghost" onClick={clearSelection} className="hover:bg-white/20 text-white h-8 w-8 rounded-full">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Active Filters Indicator */}
            {(filteredByDeadlineIds || filterMyTasks || filterHighPriority) && (
                <div className="bg-sky-500/10 border-b border-sky-500/20 px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
                            {filteredByDeadlineIds ? `Showing ${filteredTasks.length} tasks with upcoming deadlines` : 'Active filters applied'}
                        </span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            setFilteredByDeadlineIds(null);
                            setFilterMyTasks(false);
                            setFilterHighPriority(false);
                        }}
                        className="h-6 text-[10px] font-black text-sky-400 hover:text-white hover:bg-sky-500/20"
                    >
                        CLEAR ALL FILTERS
                    </Button>
                </div>
            )}

            {/* Kanban Board with Rows (Swimlanes) */}
            <div className="flex-1 w-full p-6 bg-transparent">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex flex-col gap-10 min-w-max pb-20">
                        {groupedRows.map((row) => (
                            <div key={row.id} className="space-y-4">
                                {groupBy !== 'none' && (
                                    <div className="flex items-center gap-4 px-2">
                                        <h3 className="swimlane-header flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
                                            {row.name}
                                        </h3>
                                        <div className="h-[1px] flex-1 bg-white/5" />
                                        <Badge variant="outline" className="border-white/5 text-slate-500 font-bold text-[10px]">
                                            {row.tasks.length} TASKS
                                        </Badge>
                                    </div>
                                )}

                                <div className="flex gap-6">
                                    {statuses.map((status, statusIndex) => {
                                        const statusTasks = row.tasks.filter(t => t.statusId === status.id)
                                        const isAdding = addingToStatusId === status.id && row.id === 'all'

                                        // Status-specific gradient colors
                                        const statusGradients = [
                                            'from-gray-500/5 via-gray-600/5 to-gray-700/5',
                                            'from-blue-500/5 via-blue-600/5 to-blue-700/5',
                                            'from-purple-500/5 via-purple-600/5 to-purple-700/5',
                                            'from-green-500/5 via-green-600/5 to-green-700/5',
                                        ]
                                        const statusGradient = statusGradients[statusIndex % statusGradients.length]

                                        return (
                                            <div key={status.id} className="w-[350px] flex-shrink-0 flex flex-col h-full min-h-[500px]">
                                                {/* Status Column Header with gradient accent */}
                                                {groupedRows.indexOf(row) === 0 && (
                                                    <div className="flex items-center justify-between mb-4 px-4 sticky top-[136px] z-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl py-4 -mt-4 rounded-xl border border-white/10 shadow-xl mx-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-2.5 h-2.5 rounded-full",
                                                                statusIndex === 0 ? "bg-gradient-to-br from-gray-400 to-gray-500 shadow-[0_0_8px_rgba(156,163,175,0.6)]" :
                                                                statusIndex === statuses.length - 1 ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]" :
                                                                statusIndex === statuses.length - 2 ? "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]" :
                                                                "bg-gradient-to-br from-blue-400 to-cyan-500 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                                                            )} />
                                                            <span className="text-xs font-black text-white uppercase tracking-widest drop-shadow-md">{status.name}</span>
                                                            <span className="ml-1 text-[10px] text-slate-400 font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/5">
                                                                {tasks.filter(t => t.statusId === status.id).length}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                                            onClick={() => setAddingToStatusId(status.id)}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}

                                                <Droppable droppableId={`${row.id}||${status.id}`}>
                                                    {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.droppableProps}
                                                                className={cn(
                                                                    "flex-1 rounded-xl transition-colors duration-300 pb-20 px-1 h-full",
                                                                    snapshot.isDraggingOver
                                                                        ? `bg-gradient-to-b ${statusGradient} border border-white/20 shadow-lg shadow-black/20`
                                                                        : "bg-transparent"
                                                                )}
                                                            >
                                                            {isAdding && (
                                                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-sky-500/50 p-4 rounded-xl mb-4 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-sky-500/10">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
                                                                        <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">New Task</span>
                                                                    </div>
                                                                    <input
                                                                        autoFocus
                                                                        value={newTaskTitle}
                                                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') handleCreateTask(status.id)
                                                                            if (e.key === 'Escape') {
                                                                                setAddingToStatusId(null);
                                                                                setNewTaskTitle('');
                                                                            }
                                                                        }}
                                                                        placeholder="Enter new task... (Press Enter)"
                                                                        className="w-full bg-slate-900/80 border border-white/10 text-sm text-white rounded-lg p-3 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all"
                                                                    />
                                                                    <div className="flex justify-end gap-2 mt-3">
                                                                        <Button size="sm" variant="ghost" onClick={() => { setAddingToStatusId(null); setNewTaskTitle(''); }} className="h-8 text-[10px] uppercase font-bold text-slate-400 hover:text-white hover:bg-white/10">Cancel</Button>
                                                                        <Button size="sm" onClick={() => handleCreateTask(status.id)} disabled={isCreating || !newTaskTitle.trim()} className="h-8 text-[10px] uppercase font-bold bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white shadow-lg shadow-sky-500/20">
                                                                            {isCreating ? <><Loader2 className="w-3 h-3 animate-spin" /> Adding...</> : 'Add Task'}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {statusTasks.map((task, taskIndex) => (
                                                                <div
                                                                    key={task.id}
                                                                    onClick={() => setSelectedTaskId(task.id)}
                                                                >
                                                                    <KanbanTask
                                                                        task={task as any}
                                                                        index={taskIndex}
                                                                        projectId={projectId}
                                                                        statuses={statuses}
                                                                        onMoveToNext={onMoveToNext}
                                                                        isSelected={selectedTaskIds.has(task.id)}
                                                                        onToggleSelect={handleToggleSelect}
                                                                    />
                                                                </div>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>

            {/* Task Detail Panel Overlay */}
            <TaskDetailPanel 
                taskId={selectedTaskId} 
                projectId={projectId} 
                projectName={projectName}
                onClose={() => setSelectedTaskId(null)} 
            />
        </div>
    )
}