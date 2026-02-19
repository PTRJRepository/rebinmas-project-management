/**
 * Users API - Using SQL Server via SQL Gateway API
 *
 * All user operations use the SQL Server database (extend_db_ptrj)
 * via the SQL Gateway API instead of local SQLite.
 */

import { sqlGateway } from './sql-gateway';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const result = await sqlGateway.query(
    'SELECT id, username, email, name, role, avatar_url, created_at, updated_at FROM pm_users ORDER BY username ASC'
  );
  
  return result.recordset.map((row: any) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    role: row.role,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await sqlGateway.query(
    'SELECT id, username, email, name, role, avatar_url, created_at, updated_at FROM pm_users WHERE id = @id',
    { id }
  );
  
  if (result.recordset.length === 0) return null;
  
  const row = result.recordset[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    role: row.role,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
