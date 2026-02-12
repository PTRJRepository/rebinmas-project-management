/**
 * Tasks API - Using SQL Gateway API (SQL Server)
 *
 * All task operations now use the SQL Server database (extend_db_ptrj)
 * via the SQL Gateway API instead of local SQLite.
 *
 * SECURITY: Only SERVER_PROFILE_1 and extend_db_ptrj are used for write operations.
 */

import { sqlGateway } from './sql-gateway';

// Helper functions from projects.ts
function toCamelCase<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase) as T;

  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(obj[key]);
  }
  return result;
}

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}${random}`;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate?: Date | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  documentation?: string | null;
  progress: number;
  lastAlertSent?: Date | null;
  projectId: string;
  statusId: string;
  assigneeId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
  project?: {
    id: string;
    name: string;
  };
  status?: {
    id: string;
    name: string;
    order: number;
  };
  assignee?: {
    id: string;
    username: string;
    name: string;
    email: string;
  } | null;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    username: string;
    name: string;
  };
}

export async function getTasks(filters?: {
  projectId?: string;
  statusId?: string;
  assigneeId?: string;
  userId?: string;
}) {
  let sql = `
    SELECT
      t.id, t.title, t.description, t.priority, t.due_date, t.estimated_hours, t.actual_hours,
      t.documentation, t.progress, t.last_alert_sent, t.project_id, t.status_id, t.assignee_id,
      t.created_at, t.updated_at,
      p.id as proj_id,
      p.name as project_name,
      ts.id as status_id_ref,
      ts.name as status_name,
      ts.[order] as status_order,
      u.id as assignee_id_ref,
      u.username as assignee_username,
      u.name as assignee_name,
      u.email as assignee_email
    FROM pm_tasks t
    LEFT JOIN pm_projects p ON t.project_id = p.id
    LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
    LEFT JOIN pm_users u ON t.assignee_id = u.id
    WHERE 1=1
  `;

  const params: any = {};

  if (filters?.projectId) {
    sql += ` AND t.project_id = @projectId`;
    params.projectId = filters.projectId;
  }

  if (filters?.statusId) {
    sql += ` AND t.status_id = @statusId`;
    params.statusId = filters.statusId;
  }

  if (filters?.assigneeId) {
    sql += ` AND t.assignee_id = @assigneeId`;
    params.assigneeId = filters.assigneeId;
  }

  // If userId is provided, only fetch tasks from projects owned by that user
  if (filters?.userId) {
    sql += ` AND p.owner_id = @userId`;
    params.userId = filters.userId;
  }

  sql += ` ORDER BY t.created_at DESC`;

  const result = await sqlGateway.query(sql, params);

  // Map results to Task type
  return result.recordset.map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    dueDate: row.due_date,
    estimatedHours: row.estimated_hours,
    actualHours: row.actual_hours,
    documentation: row.documentation,
    progress: row.progress,
    lastAlertSent: row.last_alert_sent,
    projectId: row.project_id,
    statusId: row.status_id,
    assigneeId: row.assignee_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    project: {
      id: row.proj_id,
      name: row.project_name,
    },
    status: {
      id: row.status_id_ref,
      name: row.status_name,
      order: row.status_order,
    },
    assignee: row.assignee_id_ref ? {
      id: row.assignee_id_ref,
      username: row.assignee_username,
      name: row.assignee_name,
      email: row.assignee_email,
    } : null,
  })) as Task[];
}

export async function getTaskById(id: string) {
  const result = await sqlGateway.query(`
    SELECT
      t.id, t.title, t.description, t.priority, t.due_date, t.estimated_hours, t.actual_hours,
      t.documentation, t.progress, t.last_alert_sent, t.project_id, t.status_id, t.assignee_id,
      t.created_at, t.updated_at,
      p.id as proj_id,
      p.name as project_name,
      ts.id as status_id_ref,
      ts.name as status_name,
      ts.[order] as status_order,
      u.id as assignee_id_ref,
      u.username as assignee_username,
      u.name as assignee_name,
      u.email as assignee_email
    FROM pm_tasks t
    LEFT JOIN pm_projects p ON t.project_id = p.id
    LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
    LEFT JOIN pm_users u ON t.assignee_id = u.id
    WHERE t.id = @id
  `, { id });

  if (result.recordset.length === 0) return null;

  const row = result.recordset[0];

  // Get comments for the task
  const commentsResult = await sqlGateway.query(`
    SELECT
      c.id, c.task_id, c.user_id, c.content, c.created_at, c.updated_at,
      u.id as comment_user_id,
      u.username as user_username,
      u.name as user_name
    FROM pm_comments c
    LEFT JOIN pm_users u ON c.user_id = u.id
    WHERE c.task_id = @taskId
    ORDER BY c.created_at DESC
  `, { taskId: id });

  const comments = commentsResult.recordset.map((c: any) => ({
    id: c.id,
    taskId: c.task_id,
    userId: c.user_id,
    content: c.content,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    user: {
      id: c.comment_user_id,
      username: c.user_username,
      name: c.user_name,
    },
  }));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    dueDate: row.due_date,
    estimatedHours: row.estimated_hours,
    actualHours: row.actual_hours,
    documentation: row.documentation,
    progress: row.progress,
    lastAlertSent: row.last_alert_sent,
    projectId: row.project_id,
    statusId: row.status_id,
    assigneeId: row.assignee_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    project: {
      id: row.proj_id,
      name: row.project_name,
    },
    status: {
      id: row.status_id_ref,
      name: row.status_name,
      order: row.status_order,
    },
    assignee: row.assignee_id_ref ? {
      id: row.assignee_id_ref,
      username: row.assignee_username,
      name: row.assignee_name,
      email: row.assignee_email,
    } : null,
    comments,
  } as Task;
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority: string;
  dueDate?: Date;
  estimatedHours?: number;
  projectId: string;
  statusId: string;
  assigneeId?: string;
}) {
  const id = generateId('task');
  const now = new Date();

  await sqlGateway.query(`
    INSERT INTO pm_tasks (id, title, description, priority, due_date, estimated_hours, project_id, status_id, assignee_id, progress, created_at, updated_at)
    VALUES (@id, @title, @description, @priority, @dueDate, @estimatedHours, @projectId, @statusId, @assigneeId, @progress, @createdAt, @updatedAt)
  `, {
    id,
    title: data.title,
    description: data.description || null,
    priority: data.priority || 'MEDIUM',
    dueDate: data.dueDate || null,
    estimatedHours: data.estimatedHours || null,
    projectId: data.projectId,
    statusId: data.statusId,
    assigneeId: data.assigneeId || null,
    progress: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Return the created task with relations
  return getTaskById(id);
}

export async function updateTask(id: string, data: Partial<Task>) {
  const updates: string[] = [];
  const params: any = { id };

  if (data.title !== undefined) {
    updates.push('title = @title');
    params.title = data.title;
  }
  if (data.description !== undefined) {
    updates.push('description = @description');
    params.description = data.description;
  }
  if (data.priority !== undefined) {
    updates.push('priority = @priority');
    params.priority = data.priority;
  }
  if (data.dueDate !== undefined) {
    updates.push('due_date = @dueDate');
    params.dueDate = data.dueDate;
  }
  if (data.estimatedHours !== undefined) {
    updates.push('estimated_hours = @estimatedHours');
    params.estimatedHours = data.estimatedHours;
  }
  if (data.actualHours !== undefined) {
    updates.push('actual_hours = @actualHours');
    params.actualHours = data.actualHours;
  }
  if (data.documentation !== undefined) {
    updates.push('documentation = @documentation');
    params.documentation = data.documentation;
  }
  if (data.progress !== undefined) {
    updates.push('progress = @progress');
    params.progress = data.progress;
  }
  if (data.statusId !== undefined) {
    updates.push('status_id = @statusId');
    params.statusId = data.statusId;
  }
  if (data.assigneeId !== undefined) {
    updates.push('assignee_id = @assigneeId');
    params.assigneeId = data.assigneeId;
  }

  updates.push('updated_at = @updatedAt');
  params.updatedAt = new Date();

  if (updates.length > 0) {
    await sqlGateway.query(`
      UPDATE pm_tasks
      SET ${updates.join(', ')}
      WHERE id = @id
    `, params);
  }

  return getTaskById(id);
}

export async function updateTaskStatus(id: string, statusId: string) {
  return updateTask(id, { statusId });
}

export async function deleteTask(id: string) {
  await sqlGateway.query('DELETE FROM pm_tasks WHERE id = @id', { id });
}
