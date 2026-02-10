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
        dot: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]',
        badge: 'bg-slate-800/60 text-slate-300 border-slate-600/50 ring-1 ring-slate-500/30',
        accent: 'bg-gradient-to-r from-slate-500 to-slate-600 shadow-[0_0_12px_rgba(100,116,139,0.4)]',
        gradient: 'from-slate-500 to-slate-600'
    },
    progress: {
        dot: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]',
        badge: 'bg-sky-900/60 text-cyan-400 border-cyan-500/40 ring-1 ring-cyan-400/30 shadow-[0_0_8px_rgba(34,211,238,0.2)]',
        accent: 'bg-gradient-to-r from-cyan-400 to-sky-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]',
        gradient: 'from-cyan-400 to-sky-500'
    },
    review: {
        dot: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.7)]',
        badge: 'bg-purple-900/60 text-purple-400 border-purple-500/40 ring-1 ring-purple-400/30 shadow-[0_0_8px_rgba(192,132,252,0.2)]',
        accent: 'bg-gradient-to-r from-purple-400 to-pink-500 shadow-[0_0_15px_rgba(192,132,252,0.5)]',
        gradient: 'from-purple-400 to-pink-500'
    },
    done: {
        dot: 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]',
        badge: 'bg-green-900/60 text-green-400 border-green-500/40 ring-1 ring-green-400/30 shadow-[0_0_8px_rgba(74,222,128,0.2)]',
        accent: 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_15px_rgba(74,222,128,0.5)]',
        gradient: 'from-green-400 to-emerald-500'
    }
};

export function KanbanHeader({ name, count, statusColor }: KanbanHeaderProps) {
    const colors = statusColors[statusColor];

    return (
        <div className="mb-3">
            {/* Top Border Accent with Glow */}
            <div className={cn("h-1 rounded-t-lg transition-all duration-300", colors.accent)} />

            {/* Header Content with Glassmorphism */}
            <div className={cn(
                "glass-panel rounded-b-lg p-3 flex items-center justify-between"
            )}>
                {/* Column Name with Status Indicator */}
                <div className="flex items-center gap-2">
                    {/* Status Indicator Dot with Glow */}
                    <div className={cn("w-2.5 h-2.5 rounded-full transition-all duration-300", colors.dot)} />

                    {/* Column Name */}
                    <span className="font-semibold text-sm text-sky-100 uppercase tracking-wide heading-glow">
                        {name}
                    </span>
                </div>

                {/* Task Count Badge with Neon Effect */}
                <div className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all duration-300",
                    colors.badge
                )}>
                    {count}
                </div>
            </div>
        </div>
    );
}
