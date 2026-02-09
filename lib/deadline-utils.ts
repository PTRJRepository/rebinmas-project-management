// Deadline utility functions for Schedule Tracker 2.0
import {
  differenceInDays,
  differenceInHours,
  format,
  isToday,
  isTomorrow,
  isPast,
  addDays,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from 'date-fns';

/**
 * Represents deadline information for a single task
 */
export interface DeadlineInfo {
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  daysUntilDue: number | null;
  urgency: 'critical' | 'warning' | 'normal' | 'none';
}

/**
 * Represents aggregated deadline alerts across multiple tasks
 */
export interface DeadlineAlert {
  overdueCount: number;
  dueTodayCount: number;
  dueThisWeekCount: number;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueDate: Date;
    urgency: 'critical' | 'warning' | 'normal' | 'none';
    assignee?: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  }>;
}

/**
 * Task interface for deadline calculations
 */
export interface TaskWithDeadline {
  id: string;
  title: string;
  dueDate: Date | null;
  lastAlertSent?: Date | null;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

/**
 * Calculate comprehensive deadline information for a task
 * @param dueDate - The due date of the task (can be null/undefined)
 * @returns DeadlineInfo object with various deadline states and urgency level
 */
export function getDeadlineInfo(dueDate: Date | null | undefined): DeadlineInfo {
  // If no due date is set, return none urgency
  if (!dueDate) {
    return {
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      daysUntilDue: null,
      urgency: 'none',
    };
  }

  const now = new Date();
  const due = new Date(dueDate);
  const daysUntil = differenceInDays(due, now);

  // Calculate urgency based on days until due
  let urgency: 'critical' | 'warning' | 'normal' | 'none';

  if (isPast(due) && !isToday(due)) {
    urgency = 'critical';
  } else if (isToday(due)) {
    urgency = 'critical';
  } else if (daysUntil <= 2) {
    urgency = 'warning';
  } else if (daysUntil <= 7) {
    urgency = 'normal';
  } else {
    urgency = 'none';
  }

  return {
    isOverdue: isPast(due) && !isToday(due),
    isDueToday: isToday(due),
    isDueTomorrow: isTomorrow(due),
    daysUntilDue: daysUntil,
    urgency,
  };
}

/**
 * Calculate aggregated deadline alerts across multiple tasks
 * @param tasks - Array of tasks with deadlines
 * @returns DeadlineAlert object with counts and upcoming task list
 */
export function getDeadlineAlerts(tasks: TaskWithDeadline[]): DeadlineAlert {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

  const overdueCount: number = tasks.filter(task => {
    if (!task.dueDate) return false;
    const info = getDeadlineInfo(task.dueDate);
    return info.isOverdue;
  }).length;

  const dueTodayCount: number = tasks.filter(task => {
    if (!task.dueDate) return false;
    return isToday(new Date(task.dueDate));
  }).length;

  const dueThisWeekCount: number = tasks.filter(task => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    return isWithinInterval(due, { start: weekStart, end: weekEnd });
  }).length;

  // Get upcoming tasks (excluding overdue, sorted by due date)
  const upcomingTasks = tasks
    .filter(task => {
      if (!task.dueDate) return false;
      const info = getDeadlineInfo(task.dueDate);
      return !info.isOverdue && info.urgency !== 'none';
    })
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .map(task => ({
      id: task.id,
      title: task.title,
      dueDate: new Date(task.dueDate!),
      urgency: getDeadlineInfo(task.dueDate).urgency,
      assignee: task.assignee,
    }));

  return {
    overdueCount,
    dueTodayCount,
    dueThisWeekCount,
    upcomingTasks,
  };
}

/**
 * Get CSS classes for deadline display based on urgency
 * @param info - DeadlineInfo object from getDeadlineInfo
 * @returns String of CSS classes for styling
 */
export function getDeadlineClasses(info: DeadlineInfo): string {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium';

  const urgencyClasses = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    none: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return `${baseClasses} ${urgencyClasses[info.urgency]}`;
}

/**
 * Format deadline date in human-readable format
 * @param dueDate - The due date to format (can be null/undefined)
 * @returns Formatted string or null if no due date
 */
export function formatDeadline(dueDate: Date | null | undefined): string | null {
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate);
  const daysUntil = differenceInDays(due, now);

  // Overdue
  if (isPast(due) && !isToday(due)) {
    const daysOverdue = Math.abs(daysUntil);
    return `Overdue by ${daysOverdue}d`;
  }

  // Today
  if (isToday(due)) {
    return 'Today';
  }

  // Tomorrow
  if (isTomorrow(due)) {
    return 'Tomorrow';
  }

  // Within next 7 days
  if (daysUntil > 0 && daysUntil <= 7) {
    return `In ${daysUntil}d`;
  }

  // Otherwise, return formatted date
  return format(due, 'MMM d, yyyy');
}

/**
 * Determine if an alert should be sent based on last alert time and urgency
 * @param lastAlertSent - The timestamp of the last alert (can be null/undefined)
 * @param urgency - The urgency level of the task
 * @returns Boolean indicating if enough time has passed since last alert
 */
export function shouldSendAlert(
  lastAlertSent: Date | null | undefined,
  urgency: 'critical' | 'warning' | 'normal' | 'none'
): boolean {
  // No alert for 'none' urgency
  if (urgency === 'none') return false;

  // If no alert has been sent yet, send one
  if (!lastAlertSent) return true;

  const now = new Date();
  const lastAlert = new Date(lastAlertSent);
  const hoursSinceLastAlert = differenceInHours(now, lastAlert);

  // Define minimum hours between alerts based on urgency
  const alertIntervals = {
    critical: 4,   // 4 hours for critical tasks
    warning: 12,   // 12 hours for warning tasks
    normal: 24,    // 24 hours for normal tasks
    none: Infinity,
  };

  const minHoursBetweenAlerts = alertIntervals[urgency];

  return hoursSinceLastAlert >= minHoursBetweenAlerts;
}

/**
 * Get a list of tasks that need alerts sent
 * @param tasks - Array of tasks to check
 * @returns Array of tasks that should receive alerts
 */
export function getTasksRequiringAlerts(tasks: TaskWithDeadline[]): TaskWithDeadline[] {
  return tasks.filter(task => {
    if (!task.dueDate) return false;

    const info = getDeadlineInfo(task.dueDate);

    // Only check tasks with urgency
    if (info.urgency === 'none') return false;

    return shouldSendAlert(task.lastAlertSent, info.urgency);
  });
}

/**
 * Calculate the next alert time for a task
 * @param lastAlertSent - The timestamp of the last alert (can be null/undefined)
 * @param urgency - The urgency level of the task
 * @returns Date when the next alert should be sent
 */
export function getNextAlertTime(
  lastAlertSent: Date | null | undefined,
  urgency: 'critical' | 'warning' | 'normal' | 'none'
): Date | null {
  // No next alert for 'none' urgency
  if (urgency === 'none') return null;

  const baseTime = lastAlertSent ? new Date(lastAlertSent) : new Date();

  const alertIntervals = {
    critical: 4,   // 4 hours
    warning: 12,   // 12 hours
    normal: 24,    // 24 hours
    none: 0,
  };

  const hoursToAdd = alertIntervals[urgency];
  return addDays(baseTime, hoursToAdd / 24);
}
