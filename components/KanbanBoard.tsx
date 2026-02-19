'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { updateTaskStatus } from '@/app/actions/task'
import { Calendar, Circle, Plus, X, Filter } from 'lucide-react'
import { KanbanTask } from '@/components/KanbanTask'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTask } from '@/app/actions/task'
import { Loader2 } from 'lucide-react'
import { KanbanColumn, getStatusColor } from '@/components/kanban/KanbanColumn'
import { DeadlineAlertBar } from '@/components/notifications/DeadlineAlertBar'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

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
    lastAlertSent?: Date | null
}

interface Status {
    id: string
    name: string
}

interface KanbanBoardProps {
    initialTasks: Task[]
    statuses: Status[]
    projectId: string
    onMoveToNext?: (taskId: string) => Promise<void>
}

export default function KanbanBoard({ initialTasks, statuses, projectId, onMoveToNext }: KanbanBoardProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [addingToStatusId, setAddingToStatusId] = useState<string | null>(null)

    // Sync state when props change
    useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [filteredTaskIds, setFilteredTaskIds] = useState<string[]>([])
    const { toast } = useToast()

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return
        if (destination.droppableId === source.droppableId && destination.index === source.index) return

        const newStatusId = destination.droppableId
        const oldStatusId = source.droppableId

        // Optimistic update
        const updatedTasks = tasks.map(task =>
            task.id === draggableId ? { ...task, statusId: newStatusId } : task
        )
        setTasks(updatedTasks)

        // Server update
        await updateTaskStatus(draggableId, newStatusId, projectId)

        // Show toast notification
        const task = tasks.find(t => t.id === draggableId)
        const oldStatus = statuses.find(s => s.id === oldStatusId)
        const newStatus = statuses.find(s => s.id === newStatusId)

        toast({
            title: "Task moved",
            description: `"${task?.title}" moved from ${oldStatus?.name} to ${newStatus?.name}`,
        })
    }

    const handleMoveToNext = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) {
            console.error('[KanbanBoard] Task not found for move:', taskId);
            return;
        }

        const currentStatusIndex = statuses.findIndex(s => s.id === task.statusId)
        const nextStatus = currentStatusIndex < statuses.length - 1 ? statuses[currentStatusIndex + 1] : null

        if (!nextStatus) {
            console.log('[KanbanBoard] No next status available');
            return;
        }

        console.log('[KanbanBoard] Moving task to next:', {
            taskId,
            taskTitle: task.title,
            fromStatus: statuses.find(s => s.id === task.statusId)?.name,
            toStatus: nextStatus.name
        });

        // Optimistic update
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, statusId: nextStatus!.id } : t
        )
        setTasks(updatedTasks)

        try {
            // Server update
            const result = await updateTaskStatus(taskId, nextStatus.id, projectId)
            console.log('[KanbanBoard] Move result:', result);

            if (result.success) {
                // Re-sync with server data to ensure consistency
                console.log('[KanbanBoard] Task moved successfully, re-syncing...');
                // Force a re-render by updating state
                setTasks([...updatedTasks]);
            } else {
                console.error('[KanbanBoard] Failed to move task:', result.error);
                // Revert optimistic update on error
                setTasks(tasks);
                toast({
                    title: "Move failed",
                    description: `Failed to move task: ${result.error}`,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('[KanbanBoard] Error moving task:', error);
            // Revert optimistic update on error
            setTasks(tasks);
            toast({
                title: "Error",
                description: "Failed to move task. Please try again.",
                variant: "destructive"
            });
        }

        // Show toast notification
        toast({
            title: "Task moved",
            description: `"${task.title}" moved to ${nextStatus.name}`,
        })
    }

    const handleFilterTasks = (taskIds: string[]) => {
        setFilteredTaskIds(taskIds)
        toast({
            title: "Filter applied",
            description: `Showing ${taskIds.length} urgent tasks`,
        })
    }

    const handleClearFilter = () => {
        setFilteredTaskIds([])
        toast({
            title: "Filter cleared",
            description: "Showing all tasks",
        })
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
        let statusTasks = tasks.filter(task => task.statusId === statusId)

        // Apply filter if active
        if (filteredTaskIds.length > 0) {
            statusTasks = statusTasks.filter(task => filteredTaskIds.includes(task.id))
        }

        console.log(`[KanbanBoard] Tasks for status ${statusId}:`, statusTasks.length);
        return statusTasks
    }

    const isFilterActive = filteredTaskIds.length > 0

    // Use all statuses from the project, but ensure we have the 3 main ones
    // Filter to show only: Planning/To Do/Backlog, In Progress/On Progress, Done/Selesai
    const findStatus = (names: string[]) => {
        for (const name of names) {
            const status = statuses.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
            if (status) return status;
        }
        return null;
    };

    const todoStatus = findStatus(['To Do', 'Backlog', 'Planning']);
    const progressStatus = findStatus(['In Progress', 'On Progress', 'Progress']);
    const doneStatus = findStatus(['Done', 'Selesai', 'Finish']);

    // Only show columns that exist in the project
    const displayStatuses = [
        todoStatus,
        progressStatus,
        doneStatus
    ].filter((s): s is Status => s !== null);

    console.log('[KanbanBoard] Display statuses:', displayStatuses);
    console.log('[KanbanBoard] All statuses:', statuses);
    console.log('[KanbanBoard] Tasks count:', tasks.length);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Deadline Alert Bar */}
            <DeadlineAlertBar
                tasks={tasks.map(t => ({
                    ...t,
                    assignee: t.assignee ? {
                        id: t.assignee.id,
                        name: t.assignee.name || t.assignee.username,
                        avatarUrl: t.assignee.avatarUrl || undefined
                    } : undefined
                }))}
                onFilterTasks={handleFilterTasks}
            />

            {/* Filter Indicator Bar */}
            {isFilterActive && (
                <div className="sticky top-0 z-30 w-full bg-blue-500 text-white px-4 py-2 shadow-md flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            Filtering {filteredTaskIds.length} urgent tasks
                        </span>
                        <Badge variant="secondary" className="bg-blue-600 text-white">
                            {filteredTaskIds.length}
                        </Badge>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleClearFilter}
                        className="text-white hover:bg-blue-600"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Clear Filter
                    </Button>
                </div>
            )}

            {/* Kanban Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-3 gap-6 h-full p-4 overflow-hidden">
                    {displayStatuses.map((status, index) => {
                        const statusTasks = getTasksByStatus(status.id)
                        const isAdding = addingToStatusId === status.id
                        const statusColor = getStatusColor(index, displayStatuses.length)

                        return (
                            <div key={status.id} className="h-full flex flex-col min-h-0">
                                <KanbanColumn
                                    status={status.id}
                                    statusName={status.name}
                                    statusColor={statusColor}
                                    tasks={statusTasks}
                                    index={index}
                                    totalColumns={displayStatuses.length}
                                    onAddTask={() => {
                                        setAddingToStatusId(status.id)
                                        setNewTaskTitle('')
                                    }}
                                >
                                    {(provided, snapshot) => (
                                        <>
                                            {statusTasks.map((task, taskIndex) => (
                                                <KanbanTask
                                                    key={task.id}
                                                    task={task}
                                                    index={taskIndex}
                                                    projectId={projectId}
                                                    statuses={displayStatuses}
                                                    onMoveToNext={handleMoveToNext}
                                                />
                                            ))}
                                            {provided.placeholder}

                                            {/* Quick Add Interface */}
                                            {isAdding && (
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
                                            )}
                                        </>
                                    )}
                                </KanbanColumn>
                            </div>
                        )
                    })}
                </div>
            </DragDropContext>
        </div>
    )
}
