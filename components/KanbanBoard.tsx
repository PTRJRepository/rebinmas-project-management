'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent } from '@/components/ui/card'
import { updateTaskStatus } from '@/app/actions/task'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, AlertCircle, CheckCircle2, Circle, Plus, MoreHorizontal } from 'lucide-react'
import { KanbanTask } from '@/components/KanbanTask'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTask } from '@/app/actions/task'
import { Loader2, X } from 'lucide-react'

interface Task {
    id: string
    title: string
    description?: string | null
    priority: string
    statusId: string
    dueDate?: Date | null
    estimatedHours?: number | null
    assignee?: {
        id: string
        username: string
        avatarUrl?: string | null
    } | null
}

interface Status {
    id: string
    name: string
}

interface KanbanBoardProps {
    initialTasks: Task[]
    statuses: Status[]
    projectId: string
}

// Column header colors
const getColumnStyles = (index: number, total: number) => {
    // Professional gradients
    const gradients = [
        'from-blue-600 to-indigo-600',
        'from-purple-600 to-pink-600',
        'from-orange-500 to-red-500',
        'from-teal-500 to-emerald-600'
    ];

    // Cycle through gradients if more columns than gradients
    const gradient = gradients[index % gradients.length];

    if (index === total - 1) return 'from-green-600 to-emerald-700'; // Done column always green
    return gradient;
}

export default function KanbanBoard({ initialTasks, statuses, projectId }: KanbanBoardProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [addingToStatusId, setAddingToStatusId] = useState<string | null>(null)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return
        if (destination.droppableId === source.droppableId && destination.index === source.index) return

        const newStatusId = destination.droppableId

        // Optimistic update
        const updatedTasks = tasks.map(task =>
            task.id === draggableId ? { ...task, statusId: newStatusId } : task
        )
        setTasks(updatedTasks)

        // Server update
        await updateTaskStatus(draggableId, newStatusId, projectId)
    }

    const handleCreateTask = async (statusId: string) => {
        if (!newTaskTitle.trim()) return

        setIsCreating(true)
        const formData = new FormData()
        formData.append('title', newTaskTitle)
        formData.append('projectId', projectId)
        formData.append('statusId', statusId)
        formData.append('priority', 'MEDIUM') // Default

        const result = await createTask(formData)

        if (result.success && result.data) {
            setTasks([result.data as Task, ...tasks])
            setNewTaskTitle('')
            setAddingToStatusId(null)
        }
        setIsCreating(false)
    }

    const cancelAdd = () => {
        setAddingToStatusId(null)
        setNewTaskTitle('')
    }

    const getTasksByStatus = (statusId: string) => {
        return tasks.filter(task => task.statusId === statusId)
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-6 overflow-x-auto pb-6">
                {statuses.map((status, index) => {
                    const statusTasks = getTasksByStatus(status.id)
                    const isAdding = addingToStatusId === status.id

                    return (
                        <div key={status.id} className="flex-shrink-0 w-80 flex flex-col">
                            {/* Column Header */}
                            <div className={cn(
                                "mb-3 rounded-lg p-3 shadow-md text-white flex items-center justify-between bg-gradient-to-r",
                                getColumnStyles(index, statuses.length)
                            )}>
                                <div className="flex items-center gap-2 font-semibold">
                                    <span className="text-sm uppercase tracking-wider opacity-90">{status.name}</span>
                                </div>
                                <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold">
                                    {statusTasks.length}
                                </span>
                            </div>

                            {/* Droppable Area */}
                            <Droppable droppableId={status.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={cn(
                                            "flex-1 rounded-xl p-2 min-h-[500px] transition-colors duration-200",
                                            snapshot.isDraggingOver ? "bg-blue-50/50 ring-2 ring-blue-200" : "bg-gray-100/50"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            {statusTasks.map((task, index) => (
                                                <KanbanTask key={task.id} task={task} index={index} projectId={projectId} statuses={statuses} />
                                            ))}
                                            {provided.placeholder}
                                        </div>

                                        {/* Quick Add Interface */}
                                        {isAdding ? (
                                            <div className="mt-2 p-3 bg-white rounded-lg shadow-sm border border-blue-200 animate-in fade-in zoom-in-95 duration-200">
                                                <Input
                                                    autoFocus
                                                    placeholder="What needs to be done?"
                                                    value={newTaskTitle}
                                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleCreateTask(status.id)
                                                        if (e.key === 'Escape') cancelAdd()
                                                    }}
                                                    className="mb-2"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleCreateTask(status.id)}
                                                        disabled={isCreating}
                                                    >
                                                        {isCreating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                                        Add
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={cancelAdd}
                                                        disabled={isCreating}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                className="w-full mt-2 text-gray-500 hover:text-gray-900 justify-start hover:bg-gray-200/50"
                                                onClick={() => {
                                                    setAddingToStatusId(status.id)
                                                    setNewTaskTitle('')
                                                }}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Task
                                            </Button>
                                        )}

                                        {/* Empty State (only show if no tasks AND not adding) */}
                                        {statusTasks.length === 0 && !isAdding && !snapshot.isDraggingOver && (
                                            <div
                                                className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg m-1 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => setAddingToStatusId(status.id)}
                                            >
                                                <div className="bg-gray-100 p-3 rounded-full mb-3">
                                                    <Circle className="h-6 w-6 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-medium">No tasks yet</p>
                                                <p className="text-xs text-gray-400 mt-1">Click to add one</p>
                                            </div>
                                        )}

                                    </div>
                                )}
                            </Droppable>
                        </div>
                    )
                })}
            </div>
        </DragDropContext>
    )
}
