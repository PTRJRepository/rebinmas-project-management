'use client';

import { StatCards } from './StatCards';
import { ProgressBar } from './ProgressBar';
import { TaskStatus } from '@prisma/client';

interface DashboardProps {
  stats: {
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;
    overdueTasks: number;
    dueSoonTasks: number;
    tasksByStatus: { status: string; count: number }[];
  };
}

export function Dashboard({ stats }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Project Dashboard</h2>
      </div>
      
      <StatCards stats={stats} />
      
      <ProgressBar
        progress={stats.progressPercentage}
        totalTasks={stats.totalTasks}
        completedTasks={stats.completedTasks}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tasks by Status</h3>
          <div className="space-y-3">
            {stats.tasksByStatus.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-700">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {(stats.overdueTasks > 0 || stats.dueSoonTasks > 0) && (
          <Card className="p-6 border-yellow-200 bg-yellow-50">
            <h3 className="text-lg font-semibold mb-4 text-yellow-800">Attention Required</h3>
            <div className="space-y-2 text-sm">
              {stats.overdueTasks > 0 && (
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>{stats.overdueTasks} task(s) are overdue</span>
                </div>
              )}
              {stats.dueSoonTasks > 0 && (
                <div className="flex items-center gap-2 text-yellow-700">
                  <Clock className="w-4 h-4" />
                  <span>{stats.dueSoonTasks} task(s) due soon</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

import { Card } from '@/components/ui/card';
import { AlertCircle, Clock } from 'lucide-react';
