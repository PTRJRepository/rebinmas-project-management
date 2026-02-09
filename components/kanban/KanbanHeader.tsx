'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface KanbanHeaderProps {
    name: string;
    count: number;
    statusColor: 'backlog' | 'progress' | 'review' | 'done';
}

const statusColors = {
    backlog: {
        dot: 'bg-gray-500',
        badge: 'bg-gray-100 text-gray-700 border-gray-200',
        accent: 'bg-gray-500',
        gradient: 'from-gray-500 to-gray-600'
    },
    progress: {
        dot: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        accent: 'bg-blue-500',
        gradient: 'from-blue-500 to-indigo-600'
    },
    review: {
        dot: 'bg-purple-500',
        badge: 'bg-purple-100 text-purple-700 border-purple-200',
        accent: 'bg-purple-500',
        gradient: 'from-purple-500 to-pink-600'
    },
    done: {
        dot: 'bg-green-500',
        badge: 'bg-green-100 text-green-700 border-green-200',
        accent: 'bg-green-500',
        gradient: 'from-green-500 to-emerald-600'
    }
};

export function KanbanHeader({ name, count, statusColor }: KanbanHeaderProps) {
    const colors = statusColors[statusColor];

    return (
        <div className="mb-3">
            {/* Top Border Accent */}
            <div className={cn("h-1 rounded-t-lg", colors.accent)} />

            {/* Header Content */}
            <div className={cn(
                "rounded-b-lg p-3 shadow-sm bg-white border border-gray-200",
                "flex items-center justify-between"
            )}>
                {/* Column Name with Status Indicator */}
                <div className="flex items-center gap-2">
                    {/* Status Indicator Dot */}
                    <div className={cn("w-2 h-2 rounded-full", colors.dot)} />

                    {/* Column Name */}
                    <span className="font-semibold text-sm text-gray-800 uppercase tracking-wide">
                        {name}
                    </span>
                </div>

                {/* Task Count Badge */}
                <div className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold border",
                    colors.badge
                )}>
                    {count}
                </div>
            </div>
        </div>
    );
}
