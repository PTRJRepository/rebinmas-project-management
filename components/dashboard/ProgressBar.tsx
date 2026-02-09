'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  totalTasks: number;
  completedTasks: number;
}

export function ProgressBar({ progress, totalTasks, completedTasks }: ProgressBarProps) {
  const getColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          Project Progress
        </CardTitle>
        <TrendingUp className="w-4 h-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold">{progress}%</span>
          <span className="text-sm text-gray-500">
            {completedTasks} of {totalTasks} tasks
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={cn('h-3 rounded-full transition-all', getColor(progress))}
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
