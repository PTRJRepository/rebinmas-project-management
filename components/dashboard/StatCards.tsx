'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  overdueTasks: number;
  dueSoonTasks: number;
  tasksByStatus: { status: string; count: number }[];
}

interface StatCardsProps {
  stats: DashboardStats;
}

export function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: ListTodo,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      value: stats.completedTasks,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Overdue',
      value: stats.overdueTasks,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      highlight: stats.overdueTasks > 0,
    },
    {
      title: 'Due Soon',
      value: stats.dueSoonTasks,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      highlight: stats.dueSoonTasks > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={cn(
            'transition-all',
            card.highlight && 'ring-2 ring-red-300'
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={cn('p-2 rounded-lg', card.bgColor)}>
              <card.icon className={cn('w-4 h-4', card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
