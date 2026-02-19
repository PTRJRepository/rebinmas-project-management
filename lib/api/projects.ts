/**
 * Project API - Using SQL Gateway API (SQL Server)
 *
 * All data operations now use the SQL Server database (extend_db_ptrj)
 * via the SQL Gateway API instead of local SQLite.
 *
 * SECURITY: Only SERVER_PROFILE_1 and extend_db_ptrj are used for write operations.
 */

import { sqlGateway } from './sql-gateway';
import { PMProject, PMTask, PMTaskStatus, PMUser } from './sql-gateway';

// ==================================================
// HELPER FUNCTIONS
// ==================================================

/**
 * Convert snake_case from SQL Server to camelCase for app
 * Also constructs nested objects for relations like 'owner' from flattened fields
 */
function toCamelCase<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase) as T;
  }

  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(obj[key]);
  }
  return result;
}

/**
 * Special conversion for project data with owner relation
 * Constructs nested 'owner' object from flattened owner_ fields
 */
function toProjectCamelCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(toProjectCamelCase);
  }

  const result: any = {};
  for (const key in obj) {
    // Special handling for owner_id - map to root ownerId AND nested owner.id
    if (key === 'owner_id') {
      result.ownerId = obj[key];
    }

    // Convert owner_* fields to nested owner object
    if (key.startsWith('owner_')) {
      if (!result.owner) {
        result.owner = {};
      }
      const ownerKey = key.substring(6); // Remove 'owner_' prefix
      result.owner[ownerKey] = toCamelCase(obj[key]);
    } else {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
    }
  }
  return result;
}

/**
 * Convert camelCase from app to snake_case for SQL Server
 */
function toSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  const result: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnakeCase(obj[key]);
  }
  return result;
}

/**
 * Generate a unique ID
 */
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}${random}`;
}

// ==================================================
// PROJECT OPERATIONS
// ==================================================

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  bannerImage?: string | null;
  status?: 'SEKARANG' | 'RENCANA' | 'SELESAI' | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  // Computed fields
  owner?: {
    id: string;
    username: string;
    email: string;
    name: string;
  };
  ownerName?: string;
  ownerEmail?: string;
  _count?: {
    tasks: number;
  };
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
  completedAt?: Date | null;
  projectId: string;
  statusId: string;
  assigneeId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
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
  attachments?: Attachment[];
  docs?: TaskDoc[];
}

export interface TaskDoc {
  id: string;
  taskId: string;
  title: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskStatus {
  id: string;
  name: string;
  order: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface Attachment {
  id: string;
  taskId?: string | null;
  projectId?: string | null;
  fileName: string;
  fileUrl: string;
  fileType: string; // 'image', 'document'
  fileSize: number;
  createdAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PM' | 'MEMBER';
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// User with password (for authentication only - never expose to client)
export interface UserWithPassword extends User {
  password: string;
}

// ==================================================
// GET FUNCTIONS
// ==================================================

export async function getProjects(userId?: string, userRole?: string): Promise<Project[]> {
  // If userId is provided, filter by access
  if (userId) {
    // Import the access control function
    const { getAccessibleProjects } = await import('./project-members');
    return getAccessibleProjects(userId, userRole as any);
  }

  // No userId provided - return all projects (for admin/internal use only)
  let sql = `
    SELECT
      p.id, p.name, p.description, p.start_date, p.end_date, p.priority, p.banner_image, p.status, p.owner_id, p.created_at, p.updated_at,
      u.id as user_id,
      u.username as owner_username,
      u.email as owner_email,
      u.name as owner_name,
      COUNT(t.id) as task_count
    FROM pm_projects p
    LEFT JOIN pm_users u ON p.owner_id = u.id
    LEFT JOIN pm_tasks t ON p.id = t.project_id
  `;

  sql += `
    GROUP BY p.id, p.name, p.description, p.start_date, p.end_date, p.priority, p.banner_image, p.status, p.owner_id, p.created_at, p.updated_at, u.id, u.username, u.email, u.name
    ORDER BY p.created_at DESC
  `;

  const finalResult = await sqlGateway.query(sql);

  // Convert to Project type with nested owner object
  const projects = finalResult.recordset.map((row: any) => {
    const owner = {
      id: row.user_id,
      username: row.owner_username,
      email: row.owner_email,
      name: row.owner_name,
    };
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      priority: row.priority,
      bannerImage: row.banner_image,
      status: row.status,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      owner,
      _count: { tasks: row.task_count },
    };
  });

  return projects as Project[];
}

export async function getDeletedProjects(userId?: string): Promise<Project[]> {
  let sql = `
    SELECT
      p.id, p.name, p.description, p.start_date, p.end_date, p.priority, p.banner_image, p.status, p.owner_id, p.created_at, p.updated_at, p.deleted_at,
      u.id as user_id,
      u.username as owner_username,
      u.email as owner_email,
      u.name as owner_name,
      COUNT(t.id) as task_count
    FROM pm_projects p
    LEFT JOIN pm_users u ON p.owner_id = u.id
    LEFT JOIN pm_tasks t ON p.id = t.project_id
    WHERE p.deleted_at IS NOT NULL
  `;

  const params: any = {};
  if (userId) {
    sql += ` AND (p.owner_id = @userId OR EXISTS (SELECT 1 FROM pm_project_members WHERE project_id = p.id AND user_id = @userId))`;
    params.userId = userId;
  }

  sql += `
    GROUP BY p.id, p.name, p.description, p.start_date, p.end_date, p.priority, p.banner_image, p.status, p.owner_id, p.created_at, p.updated_at, p.deleted_at, u.id, u.username, u.email, u.name
    ORDER BY p.deleted_at DESC
  `;

  const finalResult = await sqlGateway.query(sql, params);

  return finalResult.recordset.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    priority: row.priority,
    bannerImage: row.banner_image,
    status: row.status,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    owner: {
      id: row.user_id,
      username: row.owner_username,
      email: row.owner_email,
      name: row.owner_name,
    },
    _count: { tasks: row.task_count },
  })) as Project[];
}

export async function getProjectById(id: string): Promise<Project | null> {
  const sql = `
    SELECT
      p.id, p.name, p.description, p.start_date, p.end_date, p.priority, p.banner_image, p.status, p.owner_id, p.created_at, p.updated_at,
      u.id as user_id,
      u.username as owner_username,
      u.email as owner_email,
      u.name as owner_name
    FROM pm_projects p
    LEFT JOIN pm_users u ON p.owner_id = u.id
    WHERE p.id = @id
  `;

  const result = await sqlGateway.query(sql, { id });
  if (result.recordset.length === 0) return null;

  const row = result.recordset[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    priority: row.priority,
    bannerImage: row.banner_image,
    status: row.status,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    owner: {
      id: row.user_id,
      username: row.owner_username,
      email: row.owner_email,
      name: row.owner_name,
    },
  } as Project;
}

export async function getProjectByIdIncludeDeleted(id: string): Promise<Project | null> {
  const sql = `
    SELECT
      p.id, p.name, p.description, p.start_date, p.end_date, p.priority, p.banner_image, p.status, p.owner_id, p.created_at, p.updated_at, p.deleted_at,
      u.id as user_id,
      u.username as owner_username,
      u.email as owner_email,
      u.name as owner_name
    FROM pm_projects p
    LEFT JOIN pm_users u ON p.owner_id = u.id
    WHERE p.id = @id
  `;

  const result = await sqlGateway.query(sql, { id });
  if (result.recordset.length === 0) return null;

  const row = result.recordset[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    priority: row.priority,
    bannerImage: row.banner_image,
    status: row.status,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    owner: {
      id: row.user_id,
      username: row.owner_username,
      email: row.owner_email,
      name: row.owner_name,
    },
  } as Project;
}

export async function getProjectWithTasks(id: string): Promise<Project & { statuses: TaskStatus[]; tasks: Task[] } | null> {
  // Get project with owner
  const project = await getProjectById(id);
  if (!project) return null;

  // Get statuses
  const statusesResult = await sqlGateway.query(
    'SELECT * FROM pm_task_statuses WHERE project_id = @projectId ORDER BY [order]',
    { projectId: id }
  );

  // Get tasks with status and assignee
  const tasksResult = await sqlGateway.query(`
    SELECT
      t.id, t.title, t.description, t.priority, t.due_date, t.estimated_hours, t.actual_hours,
      t.documentation, t.progress, t.last_alert_sent, t.completed_at, t.project_id, t.status_id, t.assignee_id,
      t.created_at, t.updated_at,
      ts.id as status_id_ref,
      ts.name as status_name,
      ts.[order] as status_order,
      u.id as assignee_id_ref,
      u.username as assignee_username,
      u.name as assignee_name,
      u.email as assignee_email,
      (SELECT COUNT(*) FROM pm_task_docs WHERE task_id = t.id) as doc_count
    FROM pm_tasks t
    LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
    LEFT JOIN pm_users u ON t.assignee_id = u.id
    WHERE t.project_id = @projectId
    ORDER BY t.created_at DESC
  `, { projectId: id });

  // Map tasks with proper structure
  const tasks = tasksResult.recordset.map((row: any) => ({
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
    completedAt: row.completed_at,
    projectId: row.project_id,
    statusId: row.status_id,
    assigneeId: row.assignee_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    docCount: row.doc_count || 0,
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
  }));

  // Convert statuses from snake_case to camelCase
  const statuses = statusesResult.recordset.map((row: any) => ({
    id: row.id,
    name: row.name,
    order: row.order,
    projectId: row.project_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return {
    ...project,
    statuses,
    tasks,
  };
}

// ==================================================
// CREATE FUNCTIONS
// ==================================================

export async function createProject(data: {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  bannerImage?: string;
  priority?: string;
  status?: string | null;
  ownerId: string;
}): Promise<Project> {
  const id = generateId('proj');
  const now = new Date();

  await sqlGateway.query(`
    INSERT INTO pm_projects (id, name, description, start_date, end_date, priority, banner_image, status, owner_id, created_at, updated_at)
    VALUES (@id, @name, @description, @startDate, @endDate, @priority, @bannerImage, @status, @ownerId, @createdAt, @updatedAt)
  `, {
    id,
    name: data.name,
    description: data.description || null,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    priority: data.priority || 'MEDIUM',
    bannerImage: data.bannerImage || null,
    status: data.status || null,
    ownerId: data.ownerId,
    createdAt: now,
    updatedAt: now,
  });

  // Create default statuses
  const defaultStatuses = [
    { name: 'Backlog', order: 0 },
    { name: 'To Do', order: 1 },
    { name: 'In Progress', order: 2 },
    { name: 'Review', order: 3 },
    { name: 'Done', order: 4 },
  ];

  for (const status of defaultStatuses) {
    const statusId = generateId('status');
    await sqlGateway.query(`
      INSERT INTO pm_task_statuses (id, name, [order], project_id, created_at, updated_at)
      VALUES (@id, @name, @order, @projectId, @createdAt, @updatedAt)
    `, {
      id: statusId,
      name: status.name,
      order: status.order,
      projectId: id,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Add the project creator as OWNER in pm_project_members table
  const memberId = generateId('member');
  await sqlGateway.query(`
    INSERT INTO pm_project_members (id, project_id, user_id, role, joined_at)
    VALUES (@id, @projectId, @userId, 'OWNER', @joinedAt)
  `, {
    id: memberId,
    projectId: id,
    userId: data.ownerId,
    joinedAt: now,
  });

  return (await getProjectById(id))!;
}

// ==================================================
// UPDATE FUNCTIONS
// ==================================================

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const updates: string[] = [];
  const params: any = { id };

  if (data.name !== undefined) {
    updates.push('name = @name');
    params.name = data.name;
  }
  if (data.description !== undefined) {
    updates.push('description = @description');
    params.description = data.description;
  }
  if (data.startDate !== undefined) {
    updates.push('start_date = @startDate');
    params.startDate = data.startDate;
  }
  if (data.endDate !== undefined) {
    updates.push('end_date = @endDate');
    params.endDate = data.endDate;
  }
  if (data.priority !== undefined) {
    updates.push('priority = @priority');
    params.priority = data.priority;
  }
  if (data.bannerImage !== undefined) {
    updates.push('banner_image = @bannerImage');
    params.bannerImage = data.bannerImage;
  }
  if (data.status !== undefined) {
    updates.push('status = @status');
    params.status = data.status;
  }

  updates.push('updated_at = @updatedAt');
  params.updatedAt = new Date();

  if (updates.length > 0) {
    await sqlGateway.query(`
      UPDATE pm_projects
      SET ${updates.join(', ')}
      WHERE id = @id
    `, params);
  }

  return (await getProjectById(id))!;
}

// ==================================================
// DELETE FUNCTIONS
// ==================================================

export async function deleteProject(id: string): Promise<void> {
  // Hard delete for SQL Server (no soft delete support)
  await permanentDeleteProject(id);
}

export async function restoreProject(id: string): Promise<void> {
  // Not supported for SQL Server (hard delete only)
  throw new Error('Restore not supported for SQL Server. Use permanent delete.');
}

export async function permanentDeleteProject(id: string): Promise<void> {
  // Delete all tasks (cascades to comments and attachments)
  await sqlGateway.query('DELETE FROM pm_tasks WHERE project_id = @id', { id });

  // Delete all task statuses
  await sqlGateway.query('DELETE FROM pm_task_statuses WHERE project_id = @id', { id });

  // Delete project members
  await sqlGateway.query('DELETE FROM pm_project_members WHERE project_id = @id', { id });

  // Delete the project
  await sqlGateway.query('DELETE FROM pm_projects WHERE id = @id', { id });
}

// ==================================================
// TASK OPERATIONS
// ==================================================

export async function getTasks(projectId: string): Promise<Task[]> {
  const result = await sqlGateway.query(`
    SELECT
      t.id, t.title, t.description, t.priority, t.due_date, t.estimated_hours, t.actual_hours,
      t.documentation, t.progress, t.last_alert_sent, t.completed_at, t.project_id, t.status_id, t.assignee_id,
      t.created_at, t.updated_at,
      p.id as proj_id,
      p.name as project_name,
      ts.id as status_id_ref,
      ts.name as status_name,
      ts.[order] as status_order,
      u.id as assignee_id_ref,
      u.username as assignee_username,
      u.name as assignee_name,
      u.email as assignee_email,
      (SELECT COUNT(*) FROM pm_task_docs WHERE task_id = t.id) as doc_count
    FROM pm_tasks t
    LEFT JOIN pm_projects p ON t.project_id = p.id
    LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
    LEFT JOIN pm_users u ON t.assignee_id = u.id
    WHERE t.project_id = @projectId
    ORDER BY t.created_at DESC
  `, { projectId });

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
    completedAt: row.completed_at,
    projectId: row.project_id,
    statusId: row.status_id,
    assigneeId: row.assignee_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    docCount: row.doc_count || 0,
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

export async function getTaskById(id: string): Promise<Task | null> {
  const result = await sqlGateway.query(`
    SELECT
      t.id, t.title, t.description, t.priority, t.due_date, t.estimated_hours, t.actual_hours,
      t.documentation, t.progress, t.last_alert_sent, t.completed_at, t.project_id, t.status_id, t.assignee_id,
      t.created_at, t.updated_at,
      p.id as proj_id,
      p.name as project_name,
      ts.id as status_id_ref,
      ts.name as status_name,
      ts.[order] as status_order,
      u.id as assignee_id_ref,
      u.username as assignee_username,
      u.name as assignee_name,
      u.email as assignee_email,
      (SELECT COUNT(*) FROM pm_task_docs WHERE task_id = t.id) as doc_count
    FROM pm_tasks t
    LEFT JOIN pm_projects p ON t.project_id = p.id
    LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
    LEFT JOIN pm_users u ON t.assignee_id = u.id
    WHERE t.id = @id
  `, { id });

  if (result.recordset.length === 0) return null;

  const row = result.recordset[0];
  
  // Explicitly map fields to avoid array duplication
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
    completedAt: row.completed_at,
    projectId: row.project_id,
    statusId: row.status_id,
    assigneeId: row.assignee_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    docCount: row.doc_count || 0,
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
    docs: await getTaskDocs(id),
    attachments: await getAttachmentsByTask(id),
  } as Task;
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  estimatedHours?: number;
  projectId: string;
  statusId: string;
  assigneeId?: string;
}): Promise<Task> {
  const id = generateId('task');
  const now = new Date();

  console.log('[createTask API] Creating task:', { id, ...data });

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

  console.log('[createTask API] Fetching created task...');
  const task = await getTaskById(id);
  console.log('[createTask API] Task created:', task);

  return task!;
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
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

    // Auto-set completed_at if status is 'Done'
    const statusResult = await sqlGateway.query('SELECT name FROM pm_task_statuses WHERE id = @statusId', { statusId: data.statusId });
    if (statusResult.recordset.length > 0) {
      const statusName = statusResult.recordset[0].name;
      if (['Done', 'Selesai'].includes(statusName)) {
        updates.push('completed_at = @completedAt');
        params.completedAt = new Date();
      } else {
        updates.push('completed_at = NULL');
      }
    }
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

  return (await getTaskById(id))!;
}

export async function deleteTask(id: string): Promise<void> {
  await sqlGateway.query('DELETE FROM pm_tasks WHERE id = @id', { id });
}

// ==================================================
// TASK STATUS OPERATIONS
// ==================================================

export async function getTaskStatuses(projectId: string): Promise<TaskStatus[]> {
  const result = await sqlGateway.query(
    'SELECT * FROM pm_task_statuses WHERE project_id = @projectId ORDER BY [order]',
    { projectId }
  );
  return toCamelCase<TaskStatus[]>(result.recordset);
}

// ==================================================
// USER OPERATIONS
// ==================================================

export async function getUserById(id: string): Promise<User | null> {
  const result = await sqlGateway.query(
    'SELECT * FROM pm_users WHERE id = @id',
    { id }
  );
  if (result.recordset.length === 0) return null;
  return toCamelCase<User>(result.recordset[0]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sqlGateway.query(
    'SELECT id, username, email, name, role, avatar_url, created_at, updated_at FROM pm_users WHERE email = @email',
    { email }
  );
  if (result.recordset.length === 0) return null;
  return toCamelCase<User>(result.recordset[0]);
}

/**
 * Get user with password for authentication (INTERNAL USE ONLY)
 * Never expose this to the client
 */
export async function getUserWithEmailForAuth(email: string): Promise<UserWithPassword | null> {
  const result = await sqlGateway.query(
    'SELECT * FROM pm_users WHERE email = @email',
    { email }
  );
  if (result.recordset.length === 0) return null;
  return toCamelCase<UserWithPassword>(result.recordset[0]);
}

export async function getAllUsers(): Promise<User[]> {
  const result = await sqlGateway.query(
    'SELECT id, username, email, name, role, avatar_url, created_at, updated_at FROM pm_users ORDER BY username'
  );
  return toCamelCase<User[]>(result.recordset);
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  name: string;
  role?: string;
  avatarUrl?: string;
}): Promise<User> {
  const id = generateId('user');
  const now = new Date();

  await sqlGateway.query(`
    INSERT INTO pm_users (id, username, email, password, name, role, avatar_url, created_at, updated_at)
    VALUES (@id, @username, @email, @password, @name, @role, @avatarUrl, @createdAt, @updatedAt)
  `, {
    id,
    username: data.username,
    email: data.email,
    password: data.password,
    name: data.name,
    role: data.role || 'MEMBER',
    avatarUrl: data.avatarUrl || null,
    createdAt: now,
    updatedAt: now,
  });

  return (await getUserById(id))!;
}

// ==================================================
// COMMENT OPERATIONS
// ==================================================

export async function getCommentsByTask(taskId: string): Promise<Comment[]> {
  const result = await sqlGateway.query(`
    SELECT
      c.*,
      u.id as user_id,
      u.username as user_username,
      u.name as user_name
    FROM pm_comments c
    LEFT JOIN pm_users u ON c.user_id = u.id
    WHERE c.task_id = @taskId
    ORDER BY c.created_at ASC
  `, { taskId });

  return toCamelCase<Comment[]>(result.recordset);
}

export async function createComment(data: {
  taskId: string;
  userId: string;
  content: string;
}): Promise<Comment> {
  const id = generateId('comment');
  const now = new Date();

  await sqlGateway.query(`
    INSERT INTO pm_comments (id, task_id, user_id, content, created_at, updated_at)
    VALUES (@id, @taskId, @userId, @content, @createdAt, @updatedAt)
  `, {
    id,
    taskId: data.taskId,
    userId: data.userId,
    content: data.content,
    createdAt: now,
    updatedAt: now,
  });

  const result = await sqlGateway.query(`
    SELECT
      c.*,
      u.id as user_id,
      u.username as user_username,
      u.name as user_name
    FROM pm_comments c
    LEFT JOIN pm_users u ON c.user_id = u.id
    WHERE c.id = @id
  `, { id });

  return toCamelCase<Comment>(result.recordset[0]);
}

export async function deleteComment(id: string): Promise<void> {
  await sqlGateway.query('DELETE FROM pm_comments WHERE id = @id', { id });
}

// ==================================================
// DASHBOARD STATS
// ==================================================

export async function getProjectDashboardStats(projectId: string) {
  const result = await sqlGateway.query(`
    SELECT
      COUNT(*) as total_tasks,
      SUM(CASE WHEN ts.name = 'Done' THEN 1 ELSE 0 END) as completed_tasks,
      SUM(CASE WHEN t.due_date < GETDATE() AND ts.name != 'Done' THEN 1 ELSE 0 END) as overdue_tasks,
      SUM(ISNULL(t.actual_hours, 0)) as total_hours_spent
    FROM pm_tasks t
    LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
    WHERE t.project_id = @projectId
  `, { projectId });

  const row = result.recordset[0];
  const totalTasks = row.total_tasks || 0;
  const completedTasks = row.completed_tasks || 0;
  const overdueTasks = row.overdue_tasks || 0;
  const totalHoursSpent = row.total_hours_spent || 0;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get tasks by status
  const statusResult = await sqlGateway.query(`
    SELECT ts.name, COUNT(*) as count
    FROM pm_tasks t
    LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
    WHERE t.project_id = @projectId
    GROUP BY ts.name
  `, { projectId });

  const tasksByStatus = statusResult.recordset.map((r: any) => ({
    status: r.name,
    count: r.count,
  }));

  // Fetch recent activities (Recent tasks or updates)
  const activitiesResult = await sqlGateway.query(`
    SELECT TOP 10
      'task' as type,
      t.id,
      t.title as content,
      t.updated_at as date,
      u.username as user_name,
      ts.name as status_name
    FROM pm_tasks t
    LEFT JOIN pm_users u ON t.assignee_id = u.id
    LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
    WHERE t.project_id = @projectId
    ORDER BY t.updated_at DESC
  `, { projectId });

  const recentActivities = activitiesResult.recordset.map((r: any) => ({
    id: r.id,
    type: r.type,
    content: r.content,
    date: r.date,
    userName: r.user_name || 'System',
    statusName: r.status_name,
  }));

  return {
    totalTasks,
    completedTasks,
    progressPercentage,
    overdueTasks,
    totalHoursSpent,
    dueSoonTasks: 0,
    tasksByStatus,
    recentActivities,
  };
}

export async function getGlobalRecentActivities(limit: number = 10) {
  const activitiesResult = await sqlGateway.query(`
    SELECT TOP ${limit}
      'task' as type,
      t.id,
      t.title as content,
      t.updated_at as date,
      u.username as user_name,
      ts.name as status_name,
      p.name as project_name,
      p.id as project_id
    FROM pm_tasks t
    JOIN pm_projects p ON t.project_id = p.id
    LEFT JOIN pm_users u ON t.assignee_id = u.id
    LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
    ORDER BY t.updated_at DESC
  `);

  return activitiesResult.recordset.map((r: any) => ({
    id: r.id,
    type: r.type,
    content: r.content,
    date: r.date,
    userName: r.user_name || 'System',
    statusName: r.status_name,
    projectName: r.project_name,
    projectId: r.project_id
  }));
}

// ==================================================
// ATTACHMENT OPERATIONS (Using pm_task_docs as storage)
// ==================================================

export async function getAttachmentsByProject(projectId: string): Promise<Attachment[]> {
  // Use a special taskId naming convention for project-level assets
  // Use pa_ prefix (short for project assets) to stay under 50 chars
  const projectAssetsTaskId = `pa_${projectId}`;
  const result = await sqlGateway.query(`
    SELECT * FROM pm_task_docs
    WHERE task_id = @taskId AND content LIKE '[FILE]%'
    ORDER BY created_at DESC
  `, { taskId: projectAssetsTaskId });
  
  return result.recordset.map((row: any) => {
    try {
      const jsonStr = row.content.substring(6); // Remove [FILE] prefix
      const meta = JSON.parse(jsonStr);
      return {
        id: row.id,
        taskId: null,
        projectId: projectId,
        fileName: row.title,
        fileUrl: meta.url,
        fileType: meta.type,
        fileSize: meta.size,
        createdAt: row.created_at
      };
    } catch (e) {
      return null;
    }
  }).filter(Boolean) as Attachment[];
}

export async function getAttachmentsByTask(taskId: string): Promise<Attachment[]> {
  const result = await sqlGateway.query(`
    SELECT * FROM pm_task_docs
    WHERE task_id = @taskId AND content LIKE '[FILE]%'
    ORDER BY created_at DESC
  `, { taskId });
  
  return result.recordset.map((row: any) => {
    try {
      const jsonStr = row.content.substring(6); // Remove [FILE] prefix
      const meta = JSON.parse(jsonStr);
      return {
        id: row.id,
        taskId: taskId,
        projectId: null,
        fileName: row.title,
        fileUrl: meta.url,
        fileType: meta.type,
        fileSize: meta.size,
        createdAt: row.created_at
      };
    } catch (e) {
      return null;
    }
  }).filter(Boolean) as Attachment[];
}

export async function createAttachment(data: {
  taskId?: string;
  projectId?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}): Promise<Attachment> {
  const id = generateId('att');
  const now = new Date();
  
  // Use pa_ prefix if only projectId is provided
  let taskId = data.taskId || `pa_${data.projectId}`;
  
  // Safety check for NVARCHAR(50)
  if (taskId.length > 50) {
    taskId = taskId.substring(0, 50);
  }
  
  console.log('[createAttachment API] Creating attachment:', { id, taskId, fileName: data.fileName });

  const content = `[FILE]${JSON.stringify({
    url: data.fileUrl,
    type: data.fileType,
    size: data.fileSize
  })}`;

  try {
    await sqlGateway.query(`
      INSERT INTO pm_task_docs (id, task_id, title, content, created_at, updated_at)
      VALUES (@id, @taskId, @title, @content, @createdAt, @updatedAt)
    `, {
      id,
      taskId,
      title: data.fileName,
      content,
      createdAt: now,
      updatedAt: now,
    });
    console.log('[createAttachment API] SQL Insert successful');
  } catch (err: any) {
    console.error('[createAttachment API] SQL Error:', err.message);
    throw err;
  }

  return {
    id,
    taskId: data.taskId || null,
    projectId: data.projectId || null,
    fileName: data.fileName,
    fileUrl: data.fileUrl,
    fileType: data.fileType,
    fileSize: data.fileSize,
    createdAt: now
  };
}

export async function deleteAttachment(id: string): Promise<void> {
  // Since we're using pm_task_docs, we just delete from there
  await sqlGateway.query('DELETE FROM pm_task_docs WHERE id = @id', { id });
}

// ==================================================
// TASK DOCUMENTATION OPERATIONS
// ==================================================

export async function getTaskDocs(taskId: string): Promise<TaskDoc[]> {
  const result = await sqlGateway.query(`
    SELECT * FROM pm_task_docs
    WHERE task_id = @taskId AND (content IS NULL OR content NOT LIKE '[FILE]%')
    ORDER BY created_at DESC
  `, { taskId });
  return toCamelCase<TaskDoc[]>(result.recordset);
}

export async function createTaskDoc(data: {
  taskId: string;
  title: string;
  content: string;
}): Promise<TaskDoc> {
  const id = generateId('doc');
  const now = new Date();

  await sqlGateway.query(`
    INSERT INTO pm_task_docs (id, task_id, title, content, created_at, updated_at)
    VALUES (@id, @taskId, @title, @content, @createdAt, @updatedAt)
  `, {
    id,
    taskId: data.taskId,
    title: data.title,
    content: data.content,
    createdAt: now,
    updatedAt: now,
  });

  const result = await sqlGateway.query('SELECT * FROM pm_task_docs WHERE id = @id', { id });
  return toCamelCase<TaskDoc>(result.recordset[0]);
}

export async function updateTaskDoc(id: string, data: {
  title?: string;
  content?: string;
}): Promise<TaskDoc> {
  const updates: string[] = [];
  const params: any = { id };

  if (data.title !== undefined) {
    updates.push('title = @title');
    params.title = data.title;
  }
  if (data.content !== undefined) {
    updates.push('content = @content');
    params.content = data.content;
  }

  updates.push('updated_at = @updatedAt');
  params.updatedAt = new Date();

  await sqlGateway.query(`
    UPDATE pm_task_docs
    SET ${updates.join(', ')}
    WHERE id = @id
  `, params);

  const result = await sqlGateway.query('SELECT * FROM pm_task_docs WHERE id = @id', { id });
  return toCamelCase<TaskDoc>(result.recordset[0]);
}

export async function deleteTaskDoc(id: string): Promise<void> {
  await sqlGateway.query('DELETE FROM pm_task_docs WHERE id = @id', { id });
}
