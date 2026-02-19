/**
 * Statuses API - Using SQL Server via SQL Gateway API
 *
 * All task status operations use the SQL Server database (extend_db_ptrj)
 * via the SQL Gateway API instead of local SQLite.
 */

import { sqlGateway } from './sql-gateway';

export interface TaskStatus {
  id: string;
  name: string;
  order: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all statuses, optionally filtered by project
 */
export async function getStatuses(projectId?: string): Promise<TaskStatus[]> {
  const sql = projectId 
    ? 'SELECT * FROM pm_task_statuses WHERE project_id = @projectId ORDER BY [order]'
    : 'SELECT * FROM pm_task_statuses ORDER BY [order]';
  
  const params = projectId ? { projectId } : {};
  const result = await sqlGateway.query(sql, params);
  
  return result.recordset.map((row: any) => ({
    id: row.id,
    name: row.name,
    order: row.order,
    projectId: row.project_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

/**
 * Get status by ID
 */
export async function getStatusById(id: string): Promise<TaskStatus | null> {
  const result = await sqlGateway.query(
    'SELECT * FROM pm_task_statuses WHERE id = @id',
    { id }
  );
  
  if (result.recordset.length === 0) return null;
  
  const row = result.recordset[0];
  return {
    id: row.id,
    name: row.name,
    order: row.order,
    projectId: row.project_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Create a new status
 */
export async function createStatus(data: {
  name: string;
  order: number;
  projectId: string;
}): Promise<TaskStatus> {
  const id = `status_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
  const now = new Date();
  
  await sqlGateway.query(`
    INSERT INTO pm_task_statuses (id, name, [order], project_id, created_at, updated_at)
    VALUES (@id, @name, @order, @projectId, @createdAt, @updatedAt)
  `, {
    id,
    name: data.name,
    order: data.order,
    projectId: data.projectId,
    createdAt: now,
    updatedAt: now
  });
  
  return (await getStatusById(id))!;
}

/**
 * Update a status
 */
export async function updateStatus(id: string, data: Partial<TaskStatus>): Promise<TaskStatus> {
  const updates: string[] = [];
  const params: any = { id };
  
  if (data.name !== undefined) {
    updates.push('name = @name');
    params.name = data.name;
  }
  if (data.order !== undefined) {
    updates.push('[order] = @order');
    params.order = data.order;
  }
  
  updates.push('updated_at = @updatedAt');
  params.updatedAt = new Date();
  
  if (updates.length > 0) {
    await sqlGateway.query(`
      UPDATE pm_task_statuses
      SET ${updates.join(', ')}
      WHERE id = @id
    `, params);
  }
  
  return (await getStatusById(id))!;
}

/**
 * Delete a status
 */
export async function deleteStatus(id: string): Promise<void> {
  await sqlGateway.query(
    'DELETE FROM pm_task_statuses WHERE id = @id',
    { id }
  );
}
