'use client';

import { StatCards } from './StatCards';
import { ProgressBar } from './ProgressBar';
import { Card } from '@/components/ui/card';
import { TaskStatus } from '@prisma/client';
import { AlertCircle, Clock } from 'lucide-react';

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
        <h2 className="text-2xl font-bold text-slate-100">Project Dashboard</h2>
      </div>
      
      <StatCards stats={stats} />
      
      <ProgressBar
        progress={stats.progressPercentage}
        totalTasks={stats.totalTasks}
        completedTasks={stats.completedTasks}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 glass-card border-slate-800">
          <h3 className="text-lg font-semibold mb-4 text-slate-100">Tasks by Status</h3>
          <div className="space-y-3">
            {stats.tasksByStatus.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-slate-300">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right text-slate-400">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {(stats.overdueTasks > 0 || stats.dueSoonTasks > 0) && (
          <Card className="p-6 border-yellow-500/20 bg-yellow-500/5 glass-card">
            <h3 className="text-lg font-semibold mb-4 text-yellow-200">Attention Required</h3>
            <div className="space-y-2 text-sm">
              {stats.overdueTasks > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{stats.overdueTasks} task(s) are overdue</span>
                </div>
              )}
              {stats.dueSoonTasks > 0 && (
                <div className="flex items-center gap-2 text-yellow-400">
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
