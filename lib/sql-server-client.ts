/**
 * SQL Server Client via API Gateway
 * Client ini menggantikan Prisma Client untuk koneksi ke SQL Server
 * melalui SQL Gateway API di http://10.0.0.110:8001
 */

const API_BASE_URL = process.env.API_QUERY_URL || 'http://10.0.0.110:8001';
const API_TOKEN = process.env.API_TOKEN;
const SERVER_PROFILE = 'SERVER_PROFILE_1';
const DATABASE_NAME = 'extend_db_ptrj';

interface QueryResult<T = any> {
  success: boolean;
  data?: {
    recordset: T[];
    rowsAffected: number[];
  };
  error?: string;
}

interface SqlServerClient {
  // User operations
  user: {
    findUnique: (args: { where: { id?: string; email?: string } }) => Promise<any>;
    findMany: (args?: { where?: { email?: string } }) => Promise<any[]>;
    create: (args: { data: any }) => Promise<any>;
    update: (args: { where: { id: string }; data: any }) => Promise<any>;
    delete: (args: { where: { id: string } }) => Promise<void>;
  };
  // Project operations
  project: {
    findUnique: (args: { where: { id: string } }) => Promise<any>;
    findMany: (args?: { where?: { ownerId?: string; status?: string } }) => Promise<any[]>;
    create: (args: { data: any }) => Promise<any>;
    update: (args: { where: { id: string }; data: any }) => Promise<any>;
    delete: (args: { where: { id: string } }) => Promise<void>;
  };
  // Task operations
  task: {
    findUnique: (args: { where: { id: string } }) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    create: (args: { data: any }) => Promise<any>;
    update: (args: { where: { id: string }; data: any }) => Promise<any>;
    delete: (args: { where: { id: string } }) => Promise<void>;
  };
  // TaskStatus operations
  taskStatus: {
    findMany: (args?: { where?: { projectId?: string } }) => Promise<any[]>;
    create: (args: { data: any }) => Promise<any>;
  };
  // Comment operations
  comment: {
    findMany: (args?: any) => Promise<any[]>;
    create: (args: { data: any }) => Promise<any>;
  };
  // Attachment operations
  attachment: {
    findMany: (args?: any) => Promise<any[]>;
    create: (args: { data: any }) => Promise<any>;
  };
  // Raw query
  $queryRaw: (query: string, params?: any[]) => Promise<any[]>;
  $executeRaw: (query: string, params?: any[]) => Promise<{ rowsAffected: number }>;
}

async function executeQuery<T = any>(sql: string, params?: Record<string, any>): Promise<QueryResult<T>> {
  const response = await fetch(`${API_BASE_URL}/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_TOKEN || '',
    },
    body: JSON.stringify({
      sql,
      server: SERVER_PROFILE,
      database: DATABASE_NAME,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

// Column name mapping from Prisma (camelCase) to SQL Server (snake_case)
function toDbColumns(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const columnMap: Record<string, string> = {
    avatarUrl: 'avatar_url',
    projectsOwned: 'projects_owned', // not a column
    tasksAssigned: 'tasks_assigned', // not a column
    bannerImage: 'banner_image',
    startDate: 'start_date',
    endDate: 'end_date',
    ownerId: 'owner_id',
    projectId: 'project_id',
    assigneeId: 'assignee_id',
    statusId: 'status_id',
    dueDate: 'due_date',
    estimatedHours: 'estimated_hours',
    actualHours: 'actual_hours',
    lastAlertSent: 'last_alert_sent',
    fileName: 'file_name',
    fileUrl: 'file_url',
    fileType: 'file_type',
    fileSize: 'file_size',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const dbKey = columnMap[key] || key;
    // Handle dates
    if (value instanceof Date) {
      result[dbKey] = value.toISOString();
    } else {
      result[dbKey] = value;
    }
  }
  return result;
}

// Column name mapping from SQL Server (snake_case) to Prisma (camelCase)
function fromDbColumns(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const columnMap: Record<string, string> = {
    avatar_url: 'avatarUrl',
    banner_image: 'bannerImage',
    start_date: 'startDate',
    end_date: 'endDate',
    owner_id: 'ownerId',
    project_id: 'projectId',
    assignee_id: 'assigneeId',
    status_id: 'statusId',
    due_date: 'dueDate',
    estimated_hours: 'estimatedHours',
    actual_hours: 'actualHours',
    last_alert_sent: 'lastAlertSent',
    file_name: 'fileName',
    file_url: 'fileUrl',
    file_type: 'fileType',
    file_size: 'fileSize',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  };

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const jsKey = columnMap[key] || key;
    result[jsKey] = value;
  }
  return result;
}

// User operations
const userOperations = {
  async findUnique(args: { where: { id?: string; email?: string } }) {
    let sql = 'SELECT TOP 1 * FROM pm_users WHERE ';
    const params: any = {};

    if (args.where.id) {
      sql += '[id] = @id';
      params.id = args.where.id;
    } else if (args.where.email) {
      sql += '[email] = @email';
      params.email = args.where.email;
    }

    const result = await executeQuery(sql, params);
    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    return null;
  },

  async findMany(args?: { where?: { email?: string } }) {
    let sql = 'SELECT * FROM pm_users';
    const params: any = {};

    if (args?.where?.email) {
      sql += ' WHERE [email] = @email';
      params.email = args.where.email;
    }

    const result = await executeQuery(sql, params);
    if (result.success) {
      return result.data?.recordset.map(fromDbColumns) || [];
    }
    return [];
  },

  async create(args: { data: any }) {
    const data = toDbColumns(args.data);
    const columns = Object.keys(data).map(k => `[${k}]`).join(', ');
    const values = Object.keys(data).map(k => `@${k}`).join(', ');

    const sql = `INSERT INTO pm_users (${columns}) OUTPUT INSERTED.* VALUES (${values})`;
    const result = await executeQuery(sql, data);

    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    throw new Error('Failed to create user');
  },

  async update(args: { where: { id: string }; data: any }) {
    const data = toDbColumns(args.data);
    const setClause = Object.keys(data).map(k => `[${k}] = @${k}`).join(', ');
    data.id = args.where.id;

    const sql = `UPDATE pm_users SET ${setClause} OUTPUT INSERTED.* WHERE [id] = @id`;
    const result = await executeQuery(sql, data);

    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    throw new Error('Failed to update user');
  },

  async delete(args: { where: { id: string } }) {
    const sql = 'DELETE FROM pm_users WHERE [id] = @id';
    await executeQuery(sql, { id: args.where.id });
  },
};

// Project operations
const projectOperations = {
  async findUnique(args: { where: { id: string } }) {
    const sql = 'SELECT TOP 1 * FROM pm_projects WHERE [id] = @id';
    const result = await executeQuery(sql, { id: args.where.id });

    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    return null;
  },

  async findMany(args?: { where?: { ownerId?: string; status?: string } }) {
    let sql = 'SELECT * FROM pm_projects';
    const params: any = {};
    const conditions: string[] = [];

    if (args?.where?.ownerId) {
      conditions.push('[owner_id] = @ownerId');
      params.ownerId = args.where.ownerId;
    }
    if (args?.where?.status) {
      conditions.push('[status] = @status');
      params.status = args.where.status;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await executeQuery(sql, params);
    if (result.success) {
      return result.data?.recordset.map(fromDbColumns) || [];
    }
    return [];
  },

  async create(args: { data: any }) {
    const data = toDbColumns(args.data);
    const columns = Object.keys(data).map(k => `[${k}]`).join(', ');
    const values = Object.keys(data).map(k => `@${k}`).join(', ');

    const sql = `INSERT INTO pm_projects (${columns}) OUTPUT INSERTED.* VALUES (${values})`;
    const result = await executeQuery(sql, data);

    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    throw new Error('Failed to create project');
  },

  async update(args: { where: { id: string }; data: any }) {
    const data = toDbColumns(args.data);
    const setClause = Object.keys(data).map(k => `[${k}] = @${k}`).join(', ');
    data.id = args.where.id;

    const sql = `UPDATE pm_projects SET ${setClause} OUTPUT INSERTED.* WHERE [id] = @id`;
    const result = await executeQuery(sql, data);

    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    throw new Error('Failed to update project');
  },

  async delete(args: { where: { id: string } }) {
    const sql = 'DELETE FROM pm_projects WHERE [id] = @id';
    await executeQuery(sql, { id: args.where.id });
  },
};

// Task operations
const taskOperations = {
  async findUnique(args: { where: { id: string } }) {
    const sql = 'SELECT TOP 1 * FROM pm_tasks WHERE [id] = @id';
    const result = await executeQuery(sql, { id: args.where.id });

    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    return null;
  },

  async findMany(args?: any) {
    let sql = 'SELECT * FROM pm_tasks';
    const params: any = {};
    const conditions: string[] = [];

    if (args?.where?.projectId) {
      conditions.push('[project_id] = @projectId');
      params.projectId = args.where.projectId;
    }
    if (args?.where?.statusId) {
      conditions.push('[status_id] = @statusId');
      params.statusId = args.where.statusId;
    }
    if (args?.include?.status && args.where.projectId) {
      // Join with task_statuses
      sql = `SELECT t.*, s.name as status_name FROM pm_tasks t
             JOIN pm_task_statuses s ON t.status_id = s.id
             WHERE t.[project_id] = @projectId`;
    }

    if (conditions.length > 0 && !args?.include?.status) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await executeQuery(sql, params);
    if (result.success) {
      return result.data?.recordset.map(fromDbColumns) || [];
    }
    return [];
  },

  async create(args: { data: any }) {
    const data = toDbColumns(args.data);
    const columns = Object.keys(data).map(k => `[${k}]`).join(', ');
    const values = Object.keys(data).map(k => `@${k}`).join(', ');

    const sql = `INSERT INTO pm_tasks (${columns}) OUTPUT INSERTED.* VALUES (${values})`;
    const result = await executeQuery(sql, data);

    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    throw new Error('Failed to create task');
  },

  async update(args: { where: { id: string }; data: any }) {
    const data = toDbColumns(args.data);
    const setClause = Object.keys(data).map(k => `[${k}] = @${k}`).join(', ');
    data.id = args.where.id;

    const sql = `UPDATE pm_tasks SET ${setClause} OUTPUT INSERTED.* WHERE [id] = @id`;
    const result = await executeQuery(sql, data);

    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    throw new Error('Failed to update task');
  },

  async delete(args: { where: { id: string } }) {
    const sql = 'DELETE FROM pm_tasks WHERE [id] = @id';
    await executeQuery(sql, { id: args.where.id });
  },
};

// TaskStatus operations
const taskStatusOperations = {
  async findMany(args?: { where?: { projectId?: string } }) {
    let sql = 'SELECT * FROM pm_task_statuses';
    const params: any = {};

    if (args?.where?.projectId) {
      sql += ' WHERE [project_id] = @projectId';
      params.projectId = args.where.projectId;
    }
    sql += ' ORDER BY [order] ASC';

    const result = await executeQuery(sql, params);
    if (result.success) {
      return result.data?.recordset.map(fromDbColumns) || [];
    }
    return [];
  },

  async create(args: { data: any }) {
    const data = toDbColumns(args.data);
    const columns = Object.keys(data).map(k => `[${k}]`).join(', ');
    const values = Object.keys(data).map(k => `@${k}`).join(', ');

    const sql = `INSERT INTO pm_task_statuses (${columns}) OUTPUT INSERTED.* VALUES (${values})`;
    const result = await executeQuery(sql, data);

    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    throw new Error('Failed to create task status');
  },
};

// Comment operations
const commentOperations = {
  async findMany(args?: any) {
    let sql = 'SELECT * FROM pm_comments';
    const params: any = {};

    if (args?.where?.taskId) {
      sql += ' WHERE [task_id] = @taskId';
      params.taskId = args.where.taskId;
    }
    sql += ' ORDER BY [created_at] DESC';

    const result = await executeQuery(sql, params);
    if (result.success) {
      return result.data?.recordset.map(fromDbColumns) || [];
    }
    return [];
  },

  async create(args: { data: any }) {
    const data = toDbColumns(args.data);
    const columns = Object.keys(data).map(k => `[${k}]`).join(', ');
    const values = Object.keys(data).map(k => `@${k}`).join(', ');

    const sql = `INSERT INTO pm_comments (${columns}) OUTPUT INSERTED.* VALUES (${values})`;
    const result = await executeQuery(sql, data);

    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    throw new Error('Failed to create comment');
  },
};

// Attachment operations
const attachmentOperations = {
  async findMany(args?: any) {
    let sql = 'SELECT * FROM pm_attachments';
    const params: any = {};

    if (args?.where?.taskId) {
      sql += ' WHERE [task_id] = @taskId';
      params.taskId = args.where.taskId;
    }

    const result = await executeQuery(sql, params);
    if (result.success) {
      return result.data?.recordset.map(fromDbColumns) || [];
    }
    return [];
  },

  async create(args: { data: any }) {
    const data = toDbColumns(args.data);
    const columns = Object.keys(data).map(k => `[${k}]`).join(', ');
    const values = Object.keys(data).map(k => `@${k}`).join(', ');

    const sql = `INSERT INTO pm_attachments (${columns}) OUTPUT INSERTED.* VALUES (${values})`;
    const result = await executeQuery(sql, data);

    if (result.success && result.data?.recordset.length > 0) {
      return fromDbColumns(result.data.recordset[0]);
    }
    throw new Error('Failed to create attachment');
  },
};

// Raw query operations
async function queryRaw(query: string, params?: any[]): Promise<any[]> {
  const result = await executeQuery(query, {});
  if (result.success) {
    return result.data?.recordset.map(fromDbColumns) || [];
  }
  return [];
}

async function executeRaw(query: string, params?: any[]): Promise<{ rowsAffected: number }> {
  const result = await executeQuery(query, {});
  if (result.success) {
    return { rowsAffected: result.data?.rowsAffected[0] || 0 };
  }
  return { rowsAffected: 0 };
}

// Export the client
export const sqlServerClient: SqlServerClient = {
  user: userOperations,
  project: projectOperations,
  task: taskOperations,
  taskStatus: taskStatusOperations,
  comment: commentOperations,
  attachment: attachmentOperations,
  $queryRaw: queryRaw,
  $executeRaw: executeRaw,
};

// Type exports
export type { SqlServerClient };

// Helper function to get client (singleton pattern)
let clientInstance: SqlServerClient | null = null;

export function getSqlServerClient(): SqlServerClient {
  if (!clientInstance) {
    clientInstance = sqlServerClient;
  }
  return clientInstance;
}

// Default export
export default sqlServerClient;
