/**
 * SQL Gateway API Client Library
 *
 * This library provides a convenient interface to interact with the SQL Gateway API
 * for querying external SQL Server databases.
 *
 * API Documentation: dokumentasi/api_query.md
 * API URL: http://10.0.0.110:8001
 *
 * @example
 * ```ts
 * import { sqlGateway } from '@/lib/api/sql-gateway';
 *
 * // Get all projects
 * const projects = await sqlGateway.query<Project>(
 *   'SELECT * FROM pm_projects ORDER BY created_at DESC'
 * );
 *
 * // Insert with parameters
 * await sqlGateway.query(
 *   'INSERT INTO pm_tasks (title, project_id) VALUES (@title, @projectId)',
 *   { title: 'New Task', projectId: 'proj-123' }
 * );
 * ```
 */

interface QueryOptions {
  server?: string;
  database?: string;
}

interface QueryResult<T = any> {
  recordset: T[];
  rowsAffected: number[];
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  server?: string;
  db?: string;
  execution_ms?: number;
}

interface BatchQueryResult {
  results: QueryResult[];
  transactionCommitted: boolean;
}

// ==================================================
// CONFIGURATION
// =================================================-

const CONFIG = {
  API_URL: process.env.SQL_GATEWAY_URL || process.env.API_QUERY_URL || 'http://10.0.0.110:8001',
  API_TOKEN: process.env.SQL_GATEWAY_TOKEN || process.env.API_TOKEN || '2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6',
  DEFAULT_SERVER: process.env.SQL_GATEWAY_SERVER || 'SERVER_PROFILE_1',
  DEFAULT_DATABASE: process.env.SQL_GATEWAY_DATABASE || 'extend_db_ptrj',
};

// Available databases based on documentation
export const DATABASES = {
  // Read-only databases
  DB_PTRJ: 'db_ptrj',
  DB_PTRJ_MILL: 'db_ptrj_mill',
  // Read-write database
  EXTEND_DB_PTRJ: 'extend_db_ptrj',
} as const;

// ==================================================
// SQL GATEWAY CLIENT CLASS
// ==================================================

class SqlGatewayClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: typeof CONFIG) {
    this.baseUrl = config.API_URL;
    this.apiKey = config.API_TOKEN;
  }

  /**
   * Execute a single SQL query
   *
   * @param sql - SQL query string
   * @param params - Optional parameters for prepared statements
   * @param options - Optional server and database selection
   * @returns Query result with recordset
   *
   * @example
   * ```ts
   * // Simple SELECT
   * const users = await client.query<User>('SELECT * FROM pm_users');
   *
   * // With parameters
   * const user = await client.query<User>(
   *   'SELECT * FROM pm_users WHERE email = @email',
   *   { email: 'user@example.com' }
   * );
   *
   * // Specific server/database
   * const data = await client.query(
   *   'SELECT * FROM HR_EMPLOYEE',
   *   {},
   *   { server: 'SERVER_PROFILE_2', database: 'db_ptrj' }
   * );
   * ```
   */
  async query<T = any>(
    sql: string,
    params?: Record<string, any>,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          sql,
          server: options?.server || CONFIG.DEFAULT_SERVER,
          database: options?.database || CONFIG.DEFAULT_DATABASE,
          params,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<QueryResult<T>> = await response.json();

      if (!result.success) {
        throw new SqlGatewayError(result.error || 'Query failed', {
          sql,
          server: options?.server || CONFIG.DEFAULT_SERVER,
          database: options?.database || CONFIG.DEFAULT_DATABASE,
        });
      }

      return result.data!;
    } catch (error: any) {
      console.error('[SqlGatewayClient] Query Error:', error.message);
      if (error.message.includes('fetch failed')) {
        console.error('[SqlGatewayClient] NETWORK ERROR: Cannot reach API Gateway at', this.baseUrl);
        console.error('[SqlGatewayClient] Please check if the production server has access to this IP.');
      }
      throw error;
    }
  }

  /**
   * Execute multiple SQL queries in a single transaction
   *
   * @param queries - Array of query objects with sql and optional params
   * @param options - Optional server and database selection
   * @returns Array of query results
   *
   * @example
   * ```ts
   * const results = await client.batchQuery([
   *   { sql: 'INSERT INTO logs (message) VALUES (@msg)', params: { msg: 'Start' } },
   *   { sql: 'UPDATE counters SET value = value + 1' },
   *   { sql: 'INSERT INTO logs (message) VALUES (\'End\')' }
   * ]);
   * // All queries succeed or all fail (transaction)
   * ```
   */
  async batchQuery(
    queries: Array<{ sql: string; params?: Record<string, any> }>,
    options?: QueryOptions
  ): Promise<QueryResult[]> {
    const response = await fetch(`${this.baseUrl}/v1/query/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        server: options?.server || CONFIG.DEFAULT_SERVER,
        database: options?.database || CONFIG.DEFAULT_DATABASE,
        queries,
      }),
    });

    const result: ApiResponse<BatchQueryResult> = await response.json();

    if (!result.success) {
      throw new SqlGatewayError(result.error || 'Batch query failed', {
        server: options?.server || CONFIG.DEFAULT_SERVER,
        database: options?.database || CONFIG.DEFAULT_DATABASE,
      });
    }

    return result.data!.results;
  }

  /**
   * Test connection to the SQL Gateway API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Get list of available server profiles
   */
  async getServers(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/v1/servers`, {
      headers: { 'x-api-key': this.apiKey },
    });

    const data = await response.json();
    return data.success ? data.data.servers : [];
  }

  /**
   * Get list of databases for a specific server
   */
  async getDatabases(server?: string): Promise<string[]> {
    const response = await fetch(
      `${this.baseUrl}/v1/databases?server=${server || CONFIG.DEFAULT_SERVER}`,
      {
        headers: { 'x-api-key': this.apiKey },
      }
    );

    const data = await response.json();
    return data.success ? data.data.databases : [];
  }
}

// ==================================================
// ERROR CLASS
// ==================================================

export class SqlGatewayError extends Error {
  public readonly sql?: string;
  public readonly server?: string;
  public readonly database?: string;

  constructor(message: string, options?: { sql?: string; server?: string; database?: string }) {
    super(message);
    this.name = 'SqlGatewayError';
    this.sql = options?.sql;
    this.server = options?.server;
    this.database = options?.database;
  }
}

// ==================================================
// SINGLETON INSTANCE
// =================================================-

export const sqlGateway = new SqlGatewayClient(CONFIG);

// ==================================================
// PROJECT MANAGEMENT QUERIES
// =================================================-

/**
 * Predefined queries for Project Management tables
 */
export const pmQueries = {
  // User queries
  users: {
    getAll: () => sqlGateway.query<PMUser>('SELECT id, username, email, name, role, avatar_url FROM pm_users ORDER BY username'),
    getById: (id: string) => sqlGateway.query<PMUser>('SELECT * FROM pm_users WHERE id = @id', { id }),
    getByEmail: (email: string) => sqlGateway.query<PMUser>('SELECT * FROM pm_users WHERE email = @email', { email }),
    create: (data: Partial<PMUser>) => sqlGateway.query(
      'INSERT INTO pm_users (id, username, email, password, name, role, avatar_url) VALUES (@id, @username, @email, @password, @name, @role, @avatar_url)',
      data as any
    ),
  },

  // Project queries
  projects: {
    getAll: () => sqlGateway.query<PMProject>(`
      SELECT p.*, u.username as owner_name, u.email as owner_email
      FROM pm_projects p
      LEFT JOIN pm_users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `),
    getById: (id: string) => sqlGateway.query<PMProject>('SELECT * FROM pm_projects WHERE id = @id', { id }),
    getByOwner: (ownerId: string) => sqlGateway.query<PMProject>('SELECT * FROM pm_projects WHERE owner_id = @ownerId ORDER BY created_at DESC', { ownerId }),
    create: (data: Partial<PMProject>) => sqlGateway.query(
      'INSERT INTO pm_projects (id, name, description, start_date, end_date, priority, banner_image, status, owner_id) VALUES (@id, @name, @description, @start_date, @end_date, @priority, @banner_image, @status, @owner_id)',
      data as any
    ),
  },

  // Task queries
  tasks: {
    getAll: () => sqlGateway.query<PMTask>(`
      SELECT t.*, ts.name as status_name, p.name as project_name, u.username as assignee_name
      FROM pm_tasks t
      LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
      LEFT JOIN pm_projects p ON t.project_id = p.id
      LEFT JOIN pm_users u ON t.assignee_id = u.id
      ORDER BY t.created_at DESC
    `),
    getById: (id: string) => sqlGateway.query<PMTask>('SELECT * FROM pm_tasks WHERE id = @id', { id }),
    getByProject: (projectId: string) => sqlGateway.query<PMTask>(`
      SELECT t.*, ts.name as status_name, u.username as assignee_name
      FROM pm_tasks t
      LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
      LEFT JOIN pm_users u ON t.assignee_id = u.id
      WHERE t.project_id = @projectId
      ORDER BY t.created_at DESC
    `, { projectId }),
    create: (data: Partial<PMTask>) => sqlGateway.query(
      'INSERT INTO pm_tasks (id, title, description, priority, due_date, estimated_hours, project_id, status_id, assignee_id) VALUES (@id, @title, @description, @priority, @due_date, @estimated_hours, @project_id, @status_id, @assignee_id)',
      data as any
    ),
  },

  // Task Status queries
  taskStatuses: {
    getByProject: (projectId: string) => sqlGateway.query<PMTaskStatus>('SELECT * FROM pm_task_statuses WHERE project_id = @projectId ORDER BY [order]', { projectId }),
  },

  // Comment queries
  comments: {
    getByTask: (taskId: string) => sqlGateway.query<PMComment>(`
      SELECT c.*, u.username, u.name as user_name
      FROM pm_comments c
      LEFT JOIN pm_users u ON c.user_id = u.id
      WHERE c.task_id = @taskId
      ORDER BY c.created_at ASC
    `, { taskId }),
    create: (data: Partial<PMComment>) => sqlGateway.query(
      'INSERT INTO pm_comments (id, task_id, user_id, content) VALUES (@id, @task_id, @user_id, @content)',
      data as any
    ),
  },
};

// ==================================================
// TYPE DEFINITIONS
// ==================================================

export interface PMUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PM' | 'MEMBER';
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
  // Computed fields
  owner_name?: string;
  owner_email?: string;
}

export interface PMProject {
  id: string;
  name: string;
  description: string | null;
  start_date: Date | null;
  end_date: Date | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  banner_image: string | null;
  status: 'SEKARANG' | 'RENCANA' | 'SELESAI' | null;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
  // Computed fields
  owner_name?: string;
  owner_email?: string;
}

export interface PMTask {
  id: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  due_date: Date | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  documentation: string | null;
  progress: number;
  last_alert_sent: Date | null;
  project_id: string;
  status_id: string;
  assignee_id: string | null;
  created_at: Date;
  updated_at: Date;
  // Computed fields
  status_name?: string;
  project_name?: string;
  assignee_name?: string;
}

export interface PMTaskStatus {
  id: string;
  name: string;
  order: number;
  project_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface PMComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  // Computed fields
  username?: string;
  user_name?: string;
}

export interface PMAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'document';
  file_size: number;
  created_at: Date;
}

// Export types
export type { QueryOptions, QueryResult, ApiResponse };
