/**
 * SQL Server Sync Utility
 *
 * This utility handles bidirectional synchronization between:
 * - Local SQLite database (via Prisma)
 * - Remote SQL Server database (via SQL Gateway API)
 *
 * Use cases:
 * - Sync local projects to SQL Server for reporting
 * - Pull external data from SQL Server to local cache
 * - Backup/restore functionality
 */

import { prisma as prismaSQLite } from '@/lib/prisma';
import { sqlGateway, pmQueries, PMUser, PMProject, PMTask } from '@/lib/api/sql-gateway';
import { SqlGatewayError } from '@/lib/api/sql-gateway';

interface SyncOptions {
  direction?: 'push' | 'pull' | 'both';
  tables?: Array<'users' | 'projects' | 'tasks' | 'statuses' | 'comments'>;
  conflictResolution?: 'local' | 'remote' | 'skip';
}

interface SyncResult {
  success: boolean;
  timestamp: Date;
  direction: string;
  tables: {
    name: string;
    pushed: number;
    pulled: number;
    errors: number;
  }[];
  errors: string[];
}

export async function syncData(options: SyncOptions = {}): Promise<SyncResult> {
  const {
    direction = 'both',
    tables = ['users', 'projects', 'tasks', 'statuses', 'comments'],
    conflictResolution = 'skip'
  } = options;

  const result: SyncResult = {
    success: true,
    timestamp: new Date(),
    direction,
    tables: [],
    errors: [],
  };

  console.log('🔄 Starting sync...', { direction, tables });

  // Sync Users
  if (tables.includes('users')) {
    const userResult = await syncUsers(direction, conflictResolution);
    result.tables.push(userResult);
  }

  // Sync Projects
  if (tables.includes('projects')) {
    const projectResult = await syncProjects(direction, conflictResolution);
    result.tables.push(projectResult);
  }

  // Sync Task Statuses
  if (tables.includes('statuses')) {
    const statusResult = await syncTaskStatuses(direction, conflictResolution);
    result.tables.push(statusResult);
  }

  // Sync Tasks
  if (tables.includes('tasks')) {
    const taskResult = await syncTasks(direction, conflictResolution);
    result.tables.push(taskResult);
  }

  // Sync Comments
  if (tables.includes('comments')) {
    const commentResult = await syncComments(direction, conflictResolution);
    result.tables.push(commentResult);
  }

  // Check if any errors occurred
  result.success = result.errors.length === 0;
  result.tables.forEach(t => {
    if (t.errors > 0) result.success = false;
  });

  console.log('✅ Sync completed', result);
  return result;
}

/**
 * Sync users between SQLite and SQL Server
 */
async function syncUsers(
  direction: string,
  conflictResolution: string
): Promise<{ name: string; pushed: number; pulled: number; errors: number }> {
  const result = { name: 'users', pushed: 0, pulled: 0, errors: 0 };

  try {
    // Pull from SQL Server
    if (direction === 'pull' || direction === 'both') {
      const remoteUsers = await pmQueries.users.getAll();
      for (const user of remoteUsers.recordset) {
        try {
          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              username: user.username,
              name: user.name,
              role: user.role,
              avatarUrl: user.avatar_url,
            },
            create: {
              id: user.id,
              username: user.username,
              email: user.email,
              password: (user as any).password || '', // May need separate handling
              name: user.name,
              role: user.role as any,
              avatarUrl: user.avatar_url,
            },
          });
          result.pulled++;
        } catch (error) {
          console.error(`Error syncing user ${user.id}:`, error);
          result.errors++;
        }
      }
    }

    // Push to SQL Server
    if (direction === 'push' || direction === 'both') {
      const localUsers = await prisma.user.findMany();
      for (const user of localUsers) {
        try {
          await pmQueries.users.create({
            id: user.id,
            username: user.username,
            email: user.email,
            password: (user as any).password,
            name: (user as any).name,
            role: user.role as any,
            avatar_url: (user as any).avatarUrl,
          } as any);
          result.pushed++;
        } catch (error: any) {
          if (error.message.includes('UNIQUE constraint')) {
            // User already exists, not an error
            continue;
          }
          console.error(`Error pushing user ${user.id}:`, error);
          result.errors++;
        }
      }
    }
  } catch (error) {
    console.error('Error in syncUsers:', error);
    result.errors++;
  }

  return result;
}

/**
 * Sync projects between SQLite and SQL Server
 */
async function syncProjects(
  direction: string,
  conflictResolution: string
): Promise<{ name: string; pushed: number; pulled: number; errors: number }> {
  const result = { name: 'projects', pushed: 0, pulled: 0, errors: 0 };

  try {
    // Pull from SQL Server
    if (direction === 'pull' || direction === 'both') {
      const remoteProjects = await pmQueries.projects.getAll();
      for (const project of remoteProjects.recordset) {
        try {
          await prisma.project.upsert({
            where: { id: project.id },
            update: {
              name: project.name,
              description: project.description,
              startDate: project.start_date,
              endDate: project.end_date,
              priority: project.priority as any,
              bannerImage: project.banner_image,
              status: project.status as any,
            },
            create: {
              id: project.id,
              name: project.name,
              description: project.description,
              startDate: project.start_date,
              endDate: project.end_date,
              priority: project.priority as any,
              bannerImage: project.banner_image,
              status: project.status as any,
              ownerId: project.owner_id,
            },
          });
          result.pulled++;
        } catch (error) {
          console.error(`Error syncing project ${project.id}:`, error);
          result.errors++;
        }
      }
    }

    // Push to SQL Server
    if (direction === 'push' || direction === 'both') {
      const localProjects = await prisma.project.findMany();
      for (const project of localProjects) {
        try {
          await pmQueries.projects.create({
            id: project.id,
            name: project.name,
            description: project.description,
            start_date: project.startDate,
            end_date: project.endDate,
            priority: project.priority as any,
            banner_image: (project as any).bannerImage,
            status: (project as any).status,
            owner_id: (project as any).ownerId,
          } as any);
          result.pushed++;
        } catch (error: any) {
          if (error.message.includes('PRIMARY KEY constraint')) {
            // Project already exists, could update instead
            continue;
          }
          console.error(`Error pushing project ${project.id}:`, error);
          result.errors++;
        }
      }
    }
  } catch (error) {
    console.error('Error in syncProjects:', error);
    result.errors++;
  }

  return result;
}

/**
 * Sync task statuses between SQLite and SQL Server
 */
async function syncTaskStatuses(
  direction: string,
  conflictResolution: string
): Promise<{ name: string; pushed: number; pulled: number; errors: number }> {
  const result = { name: 'statuses', pushed: 0, pulled: 0, errors: 0 };

  try {
    // Pull from SQL Server
    if (direction === 'pull' || direction === 'both') {
      const localProjects = await prisma.project.findMany({ select: { id: true } });
      for (const project of localProjects) {
        const remoteStatuses = await pmQueries.taskStatuses.getByProject(project.id);
        for (const status of remoteStatuses.recordset) {
          try {
            await prisma.taskStatus.upsert({
              where: { id: status.id },
              update: {
                name: status.name,
                order: status.order,
              },
              create: {
                id: status.id,
                name: status.name,
                order: status.order,
                projectId: status.project_id,
              },
            });
            result.pulled++;
          } catch (error) {
            console.error(`Error syncing status ${status.id}:`, error);
            result.errors++;
          }
        }
      }
    }

    // Push to SQL Server
    if (direction === 'push' || direction === 'both') {
      const localStatuses = await prisma.taskStatus.findMany();
      for (const status of localStatuses) {
        try {
          await sqlGateway.query(
            'INSERT INTO pm_task_statuses (id, name, [order], project_id) VALUES (@id, @name, @order, @project_id)',
            {
              id: status.id,
              name: status.name,
              order: status.order,
              project_id: status.projectId,
            }
          );
          result.pushed++;
        } catch (error: any) {
          if (error.message.includes('PRIMARY KEY constraint')) {
            continue;
          }
          console.error(`Error pushing status ${status.id}:`, error);
          result.errors++;
        }
      }
    }
  } catch (error) {
    console.error('Error in syncTaskStatuses:', error);
    result.errors++;
  }

  return result;
}

/**
 * Sync tasks between SQLite and SQL Server
 */
async function syncTasks(
  direction: string,
  conflictResolution: string
): Promise<{ name: string; pushed: number; pulled: number; errors: number }> {
  const result = { name: 'tasks', pushed: 0, pulled: 0, errors: 0 };

  try {
    // Pull from SQL Server
    if (direction === 'pull' || direction === 'both') {
      const remoteTasks = await pmQueries.tasks.getAll();
      for (const task of remoteTasks.recordset) {
        try {
          await prisma.task.upsert({
            where: { id: task.id },
            update: {
              title: task.title,
              description: task.description,
              priority: task.priority as any,
              dueDate: task.due_date,
              estimatedHours: task.estimated_hours,
              actualHours: task.actual_hours,
              documentation: task.documentation,
              progress: task.progress,
              lastAlertSent: task.last_alert_sent,
              statusId: task.status_id,
              assigneeId: task.assignee_id,
            },
            create: {
              id: task.id,
              title: task.title,
              description: task.description,
              priority: task.priority as any,
              dueDate: task.due_date,
              estimatedHours: task.estimated_hours,
              actualHours: task.actual_hours,
              documentation: task.documentation,
              progress: task.progress,
              lastAlertSent: task.last_alert_sent,
              projectId: task.project_id,
              statusId: task.status_id,
              assigneeId: task.assignee_id,
            },
          });
          result.pulled++;
        } catch (error) {
          console.error(`Error syncing task ${task.id}:`, error);
          result.errors++;
        }
      }
    }

    // Push to SQL Server
    if (direction === 'push' || direction === 'both') {
      const localTasks = await prisma.task.findMany();
      for (const task of localTasks) {
        try {
          await sqlGateway.query(
            `INSERT INTO pm_tasks (id, title, description, priority, due_date, estimated_hours, actual_hours, documentation, progress, last_alert_sent, project_id, status_id, assignee_id)
             VALUES (@id, @title, @description, @priority, @due_date, @estimated_hours, @actual_hours, @documentation, @progress, @last_alert_sent, @project_id, @status_id, @assignee_id)`,
            {
              id: task.id,
              title: task.title,
              description: task.description,
              priority: task.priority,
              due_date: task.dueDate,
              estimated_hours: task.estimatedHours,
              actual_hours: task.actualHours,
              documentation: task.documentation,
              progress: task.progress,
              last_alert_sent: task.lastAlertSent,
              project_id: task.projectId,
              status_id: task.statusId,
              assignee_id: task.assigneeId,
            }
          );
          result.pushed++;
        } catch (error: any) {
          if (error.message.includes('PRIMARY KEY constraint')) {
            continue;
          }
          console.error(`Error pushing task ${task.id}:`, error);
          result.errors++;
        }
      }
    }
  } catch (error) {
    console.error('Error in syncTasks:', error);
    result.errors++;
  }

  return result;
}

/**
 * Sync comments between SQLite and SQL Server
 */
async function syncComments(
  direction: string,
  conflictResolution: string
): Promise<{ name: string; pushed: number; pulled: number; errors: number }> {
  const result = { name: 'comments', pushed: 0, pulled: 0, errors: 0 };

  try {
    // Pull from SQL Server
    if (direction === 'pull' || direction === 'both') {
      // Get all tasks to fetch comments for
      const localTasks = await prisma.task.findMany({ select: { id: true } });
      for (const task of localTasks) {
        const remoteComments = await pmQueries.comments.getByTask(task.id);
        for (const comment of remoteComments.recordset) {
          try {
            await prisma.comment.upsert({
              where: { id: comment.id },
              update: {
                content: comment.content,
              },
              create: {
                id: comment.id,
                taskId: comment.task_id,
                userId: comment.user_id,
                content: comment.content,
              },
            });
            result.pulled++;
          } catch (error) {
            console.error(`Error syncing comment ${comment.id}:`, error);
            result.errors++;
          }
        }
      }
    }

    // Push to SQL Server
    if (direction === 'push' || direction === 'both') {
      const localComments = await prisma.comment.findMany();
      for (const comment of localComments) {
        try {
          await pmQueries.comments.create({
            id: comment.id,
            task_id: comment.taskId,
            user_id: comment.userId,
            content: comment.content,
          });
          result.pushed++;
        } catch (error: any) {
          if (error.message.includes('PRIMARY KEY constraint')) {
            continue;
          }
          console.error(`Error pushing comment ${comment.id}:`, error);
          result.errors++;
        }
      }
    }
  } catch (error) {
    console.error('Error in syncComments:', error);
    result.errors++;
  }

  return result;
}

// ==================================================
// QUICK SYNC FUNCTIONS
// ==================================================

/**
 * Quick push: Push all local changes to SQL Server
 */
export async function pushToServer() {
  return syncData({ direction: 'push' });
}

/**
 * Quick pull: Pull all data from SQL Server to local
 */
export async function pullFromServer() {
  return syncData({ direction: 'pull' });
}

/**
 * Sync only specific tables
 */
export async function syncProjectsOnly() {
  return syncData({ tables: ['projects'], direction: 'both' });
}
