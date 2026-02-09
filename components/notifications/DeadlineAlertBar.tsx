'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDeadlineAlerts, type TaskWithDeadline } from '@/lib/deadline-utils';

interface DeadlineAlertBarProps {
  tasks: TaskWithDeadline[];
  onFilterTasks?: (taskIds: string[]) => void;
}

export function DeadlineAlertBar({ tasks, onFilterTasks }: DeadlineAlertBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);
  const [alerts, setAlerts] = useState(() => getDeadlineAlerts(tasks));

  // Update alerts when tasks change
  useEffect(() => {
    setAlerts(getDeadlineAlerts(tasks));
  }, [tasks]);

  // Auto-hide if no alerts
  useEffect(() => {
    if (alerts.overdueCount === 0 && alerts.dueTodayCount === 0 && alerts.dueThisWeekCount === 0) {
      setIsVisible(false);
    }
  }, [alerts]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300); // Match animation duration
  };

  const handleViewTasks = () => {
    // Get IDs of all urgent tasks (overdue + due today + due this week)
    const urgentTaskIds = [
      ...alerts.upcomingTasks.map(task => task.id),
      ...tasks.filter(task => {
        if (!task.dueDate) return false;
        const info = task.dueDate ? require('@/lib/deadline-utils').getDeadlineInfo(task.dueDate) : null;
        return info?.isOverdue || info?.isDueToday;
      }).map(task => task.id)
    ];

    if (onFilterTasks && urgentTaskIds.length > 0) {
      onFilterTasks(urgentTaskIds);
    }
  };

  if (!isVisible) return null;

  const hasOverdue = alerts.overdueCount > 0;
  const hasUrgent = alerts.dueTodayCount > 0 || alerts.dueThisWeekCount > 0;
  const totalUrgent = alerts.overdueCount + alerts.dueTodayCount + alerts.dueThisWeekCount;

  // Build alert message
  const getMessage = () => {
    const parts: string[] = [];

    if (alerts.overdueCount > 0) {
      parts.push(`${alerts.overdueCount} overdue`);
    }

    if (alerts.dueTodayCount > 0) {
      parts.push(`${alerts.dueTodayCount} due today`);
    } else if (alerts.dueThisWeekCount > 0) {
      parts.push(`${alerts.dueThisWeekCount} due this week`);
    }

    return parts.join(' • ');
  };

  return (
    <div
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300 ease-in-out',
        isAnimating
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-full'
      )}
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          'w-full px-4 py-3 shadow-md',
          hasOverdue
            ? 'bg-gradient-to-r from-red-500 to-orange-500'
            : 'bg-gradient-to-r from-orange-400 to-amber-400'
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Alert Content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {hasOverdue ? (
              <AlertCircle className="w-5 h-5 text-white flex-shrink-0" aria-hidden="true" />
            ) : (
              <Clock className="w-5 h-5 text-white flex-shrink-0" aria-hidden="true" />
            )}

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white font-semibold text-sm md:text-base truncate">
                {getMessage()}
              </span>
              {totalUrgent > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                  {totalUrgent}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onFilterTasks && (
              <button
                onClick={handleViewTasks}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                aria-label={`View ${totalUrgent} urgent tasks`}
              >
                View Tasks
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="inline-flex items-center justify-center p-1.5 hover:bg-white/20 text-white rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              aria-label="Dismiss deadline alert"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
