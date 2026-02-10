'use client';

import React, { ReactNode } from 'react';
import { Droppable, DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd';
import { KanbanHeader } from './KanbanHeader';
import { cn } from '@/lib/utils';
import { Plus, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type StatusColor = 'backlog' | 'progress' | 'review' | 'done';

interface KanbanColumnProps {
    status: string;
    statusName: string;
    statusColor: StatusColor;
    tasks: any[];
    index: number;
    totalColumns: number;
    onAddTask?: () => void;
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => ReactNode;
}

const getStatusColor = (index: number, total: number): StatusColor => {
    // Map column positions to status colors
    if (index === 0) return 'backlog';
    if (index === total - 1) return 'done';
    if (index === total - 2) return 'review';
    return 'progress';
};

const getEmptyStateMessage = (statusColor: StatusColor): { title: string; subtitle: string } => {
    switch (statusColor) {
        case 'backlog':
            return {
                title: 'No tasks in backlog',
                subtitle: 'Drag tasks here or create new ones'
            };
        case 'progress':
            return {
                title: 'No tasks in progress',
                subtitle: 'Start working on tasks by moving them here'
            };
        case 'review':
            return {
                title: 'Nothing to review',
                subtitle: 'Move completed tasks here for review'
            };
        case 'done':
            return {
                title: 'No completed tasks',
                subtitle: 'Finished tasks will appear here'
            };
        default:
            return {
                title: 'No tasks yet',
                subtitle: 'Click to add one'
            };
    }
};

export function KanbanColumn({
    status,
    statusName,
    statusColor,
    tasks,
    index,
    totalColumns,
    onAddTask,
    children
}: KanbanColumnProps) {
    const emptyState = getEmptyStateMessage(statusColor);
    const isEmpty = tasks.length === 0;

    return (
        <div className="flex flex-col min-w-0 print:w-full print:break-after-page h-full">
            {/* Column Header */}
            <KanbanHeader
                name={statusName}
                count={tasks.length}
                statusColor={statusColor}
            />

            {/* Droppable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={cn(
                                "glass-card rounded-xl p-3 min-h-full transition-all duration-300",
                                snapshot.isDraggingOver && "glass-cyan glow-pulse",
                                "print:bg-white print:rounded-none print:p-0 print:min-h-0 print:border-none"
                            )}
                        >
                            {/* Render children (tasks) */}
                            <div className="flex flex-col">
                                {children(provided, snapshot)}
                            </div>

                            {/* Quick Add Button - Hide on print */}
                            <Button
                                variant="ghost"
                                className="w-full mt-2 text-sky-400 hover:text-cyan-400 justify-start hover:bg-sky-500/10 neon-glow-hover print:hidden"
                                onClick={onAddTask}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Task
                            </Button>

                            {/* Empty State with Context-Aware Message - Hide on print */}
                            {isEmpty && !snapshot.isDraggingOver && (
                                <div
                                    className="flex flex-col items-center justify-center py-12 text-sky-400/60 border-2 border-dashed border-sky-500/20 rounded-xl m-1 cursor-pointer hover:bg-sky-500/5 hover:border-sky-500/40 transition-all duration-300 hover:neon-glow-hover print:hidden"
                                    onClick={onAddTask}
                                >
                                    <div className="bg-slate-800/50 p-3 rounded-full mb-3 ring-1 ring-sky-500/20">
                                        <Circle className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium">{emptyState.title}</p>
                                    <p className="text-xs text-sky-400/40 mt-1">{emptyState.subtitle}</p>
                                </div>
                            )}

                            {/* Empty State Message for Print */}
                            {isEmpty && (
                                <div className="hidden print:block py-4 text-center text-gray-500 border border-gray-300 rounded">
                                    <p className="text-sm">No tasks in this column</p>
                                </div>
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    );
}

export { getStatusColor };
