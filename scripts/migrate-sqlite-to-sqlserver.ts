/**
 * Migration Script: SQLite to SQL Server
 * This script exports data from SQLite and imports to SQL Server via API Gateway
 *
 * Run with: bun run scripts/migrate-sqlite-to-sqlserver.ts
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

// API Gateway Configuration
const API_BASE_URL = process.env.API_QUERY_URL || 'http://10.0.0.110:8001';
const API_TOKEN = process.env.API_TOKEN;
const SERVER_PROFILE = 'SERVER_PROFILE_1';
const DATABASE_NAME = 'extend_db_ptrj';

// Validate environment variables
if (!API_TOKEN) {
  console.error('ERROR: API_TOKEN is not set in environment variables');
  console.error('Please check your .env file');
  process.exit(1);
}

// SQLite Database Path
const SQLITE_DB_PATH = join(process.cwd(), 'dev.db');

interface QueryResult {
  success: boolean;
  data?: {
    recordset: any[];
    rowsAffected: number[];
  };
  error?: string;
}

// Execute query via API Gateway
async function executeQuery(sql: string, params?: Record<string, any>): Promise<QueryResult> {
  console.log(`[SQL Server] Executing: ${sql.substring(0, 100)}...`);

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

  const result = await response.json();
  console.log(`[SQL Server] Result: success=${result.success}, rowsAffected=${result.data?.rowsAffected?.[0] || 0}`);
  return result;
}

// Open SQLite database
function openSQLite(): Database.Database {
  console.log(`[SQLite] Opening database: ${SQLITE_DB_PATH}`);
  const db = new Database(SQLITE_DB_PATH, { readonly: true });
  return db;
}

// Export all data from SQLite
function exportSQLiteData(db: Database.Database) {
  console.log('\n=== Exporting data from SQLite ===\n');

  const data: any = {
    users: [],
    projects: [],
    taskStatuses: [],
    tasks: [],
    comments: [],
    attachments: [],
  };

  // Export users
  console.log('[SQLite] Exporting users...');
  data.users = db.prepare('SELECT * FROM User').all();
  console.log(`[SQLite] Found ${data.users.length} users`);

  // Export projects
  console.log('[SQLite] Exporting projects...');
  data.projects = db.prepare('SELECT * FROM Project').all();
  console.log(`[SQLite] Found ${data.projects.length} projects`);

  // Export task statuses
  console.log('[SQLite] Exporting task statuses...');
  data.taskStatuses = db.prepare('SELECT * FROM TaskStatus').all();
  console.log(`[SQLite] Found ${data.taskStatuses.length} task statuses`);

  // Export tasks
  console.log('[SQLite] Exporting tasks...');
  data.tasks = db.prepare('SELECT * FROM Task').all();
  console.log(`[SQLite] Found ${data.tasks.length} tasks`);

  // Export comments
  console.log('[SQLite] Exporting comments...');
  data.comments = db.prepare('SELECT * FROM Comment').all();
  console.log(`[SQLite] Found ${data.comments.length} comments`);

  // Export attachments
  console.log('[SQLite] Exporting attachments...');
  data.attachments = db.prepare('SELECT * FROM Attachment').all();
  console.log(`[SQLite] Found ${data.attachments.length} attachments`);

  return data;
}

// Convert camelCase to snake_case for SQL Server columns
function toDbColumns(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const columnMap: Record<string, string> = {
    avatarUrl: 'avatar_url',
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
    result[dbKey] = value;
  }
  return result;
}

// Insert data into SQL Server
async function importToSQLServer(data: any) {
  console.log('\n=== Importing data to SQL Server ===\n');

  let successCount = 0;
  let errorCount = 0;

  // Insert users
  console.log('\n[SQL Server] Inserting users...');
  for (const user of data.users) {
    try {
      const dbUser = toDbColumns(user);
      const columns = Object.keys(dbUser).map(k => `[${k}]`).join(', ');
      const placeholders = Object.keys(dbUser).map(k => `@${k}`).join(', ');

      const sql = `
        IF NOT EXISTS (SELECT 1 FROM pm_users WHERE [id] = @id)
        BEGIN
          INSERT INTO pm_users (${columns})
          VALUES (${placeholders})
        END
      `;

      const result = await executeQuery(sql, dbUser);
      if (result.success) {
        successCount++;
      } else {
        console.error(`[SQL Server] Error inserting user ${user.id}:`, result.error);
        errorCount++;
      }
    } catch (e: any) {
      console.error(`[SQL Server] Error inserting user ${user.id}:`, e.message);
      errorCount++;
    }
  }
  console.log(`[SQL Server] Users: ${successCount} inserted`);

  // Insert projects
  console.log('\n[SQL Server] Inserting projects...');
  let projectSuccess = 0;
  for (const project of data.projects) {
    try {
      const dbProject = toDbColumns(project);
      const columns = Object.keys(dbProject).map(k => `[${k}]`).join(', ');
      const placeholders = Object.keys(dbProject).map(k => `@${k}`).join(', ');

      const sql = `
        IF NOT EXISTS (SELECT 1 FROM pm_projects WHERE [id] = @id)
        BEGIN
          INSERT INTO pm_projects (${columns})
          VALUES (${placeholders})
        END
      `;

      const result = await executeQuery(sql, dbProject);
      if (result.success) {
        projectSuccess++;
      } else {
        console.error(`[SQL Server] Error inserting project ${project.id}:`, result.error);
        errorCount++;
      }
    } catch (e: any) {
      console.error(`[SQL Server] Error inserting project ${project.id}:`, e.message);
      errorCount++;
    }
  }
  console.log(`[SQL Server] Projects: ${projectSuccess} inserted`);

  // Insert task statuses
  console.log('\n[SQL Server] Inserting task statuses...');
  let statusSuccess = 0;
  for (const status of data.taskStatuses) {
    try {
      const dbStatus = toDbColumns(status);
      const columns = Object.keys(dbStatus).map(k => `[${k}]`).join(', ');
      const placeholders = Object.keys(dbStatus).map(k => `@${k}`).join(', ');

      const sql = `
        IF NOT EXISTS (SELECT 1 FROM pm_task_statuses WHERE [id] = @id)
        BEGIN
          INSERT INTO pm_task_statuses (${columns})
          VALUES (${placeholders})
        END
      `;

      const result = await executeQuery(sql, dbStatus);
      if (result.success) {
        statusSuccess++;
      } else {
        console.error(`[SQL Server] Error inserting task status ${status.id}:`, result.error);
        errorCount++;
      }
    } catch (e: any) {
      console.error(`[SQL Server] Error inserting task status ${status.id}:`, e.message);
      errorCount++;
    }
  }
  console.log(`[SQL Server] Task Statuses: ${statusSuccess} inserted`);

  // Insert tasks
  console.log('\n[SQL Server] Inserting tasks...');
  let taskSuccess = 0;
  for (const task of data.tasks) {
    try {
      const dbTask = toDbColumns(task);
      const columns = Object.keys(dbTask).map(k => `[${k}]`).join(', ');
      const placeholders = Object.keys(dbTask).map(k => `@${k}`).join(', ');

      const sql = `
        IF NOT EXISTS (SELECT 1 FROM pm_tasks WHERE [id] = @id)
        BEGIN
          INSERT INTO pm_tasks (${columns})
          VALUES (${placeholders})
        END
      `;

      const result = await executeQuery(sql, dbTask);
      if (result.success) {
        taskSuccess++;
      } else {
        console.error(`[SQL Server] Error inserting task ${task.id}:`, result.error);
        errorCount++;
      }
    } catch (e: any) {
      console.error(`[SQL Server] Error inserting task ${task.id}:`, e.message);
      errorCount++;
    }
  }
  console.log(`[SQL Server] Tasks: ${taskSuccess} inserted`);

  // Insert comments
  console.log('\n[SQL Server] Inserting comments...');
  let commentSuccess = 0;
  for (const comment of data.comments) {
    try {
      const dbComment = toDbColumns(comment);
      const columns = Object.keys(dbComment).map(k => `[${k}]`).join(', ');
      const placeholders = Object.keys(dbComment).map(k => `@${k}`).join(', ');

      const sql = `
        IF NOT EXISTS (SELECT 1 FROM pm_comments WHERE [id] = @id)
        BEGIN
          INSERT INTO pm_comments (${columns})
          VALUES (${placeholders})
        END
      `;

      const result = await executeQuery(sql, dbComment);
      if (result.success) {
        commentSuccess++;
      } else {
        console.error(`[SQL Server] Error inserting comment ${comment.id}:`, result.error);
        errorCount++;
      }
    } catch (e: any) {
      console.error(`[SQL Server] Error inserting comment ${comment.id}:`, e.message);
      errorCount++;
    }
  }
  console.log(`[SQL Server] Comments: ${commentSuccess} inserted`);

  // Insert attachments
  console.log('\n[SQL Server] Inserting attachments...');
  let attachmentSuccess = 0;
  for (const attachment of data.attachments) {
    try {
      const dbAttachment = toDbColumns(attachment);
      const columns = Object.keys(dbAttachment).map(k => `[${k}]`).join(', ');
      const placeholders = Object.keys(dbAttachment).map(k => `@${k}`).join(', ');

      const sql = `
        IF NOT EXISTS (SELECT 1 FROM pm_attachments WHERE [id] = @id)
        BEGIN
          INSERT INTO pm_attachments (${columns})
          VALUES (${placeholders})
        END
      `;

      const result = await executeQuery(sql, dbAttachment);
      if (result.success) {
        attachmentSuccess++;
      } else {
        console.error(`[SQL Server] Error inserting attachment ${attachment.id}:`, result.error);
        errorCount++;
      }
    } catch (e: any) {
      console.error(`[SQL Server] Error inserting attachment ${attachment.id}:`, e.message);
      errorCount++;
    }
  }
  console.log(`[SQL Server] Attachments: ${attachmentSuccess} inserted`);

  return { successCount: successCount + projectSuccess + statusSuccess + taskSuccess + commentSuccess + attachmentSuccess, errorCount };
}

// Verify migration
async function verifyMigration(data: any) {
  console.log('\n=== Verifying Migration ===\n');

  const checks = [
    { name: 'users', table: 'pm_users', count: data.users.length },
    { name: 'projects', table: 'pm_projects', count: data.projects.length },
    { name: 'task statuses', table: 'pm_task_statuses', count: data.taskStatuses.length },
    { name: 'tasks', table: 'pm_tasks', count: data.tasks.length },
    { name: 'comments', table: 'pm_comments', count: data.comments.length },
    { name: 'attachments', table: 'pm_attachments', count: data.attachments.length },
  ];

  for (const check of checks) {
    const sql = `SELECT COUNT(*) as count FROM ${check.table}`;
    const result = await executeQuery(sql);
    const actualCount = result.data?.recordset[0]?.count || 0;
    const status = actualCount >= check.count ? '✓' : '✗';
    console.log(`${status} ${check.table.padEnd(20)} Expected: ${check.count}, Actual: ${actualCount}`);
  }
}

// Main migration function
async function migrate() {
  console.log('=== SQLite to SQL Server Migration ===');
  console.log(`API Gateway: ${API_BASE_URL}`);
  console.log(`Server: ${SERVER_PROFILE}, Database: ${DATABASE_NAME}`);
  console.log(`SQLite DB: ${SQLITE_DB_PATH}\n`);

  // Check API connection
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const health = await healthResponse.json();
    console.log(`API Gateway Status: ${health.status}\n`);
  } catch (e) {
    console.error('ERROR: Cannot connect to API Gateway. Please check the API is running.');
    process.exit(1);
  }

  // Export from SQLite
  let sqliteDb: Database.Database | null = null;
  try {
    sqliteDb = openSQLite();
    const data = exportSQLiteData(sqliteDb);

    if (data.users.length === 0 && data.projects.length === 0) {
      console.warn('\nWARNING: No data found in SQLite database. Migration skipped.');
      return;
    }

    // Import to SQL Server
    const stats = await importToSQLServer(data);

    // Verify
    await verifyMigration(data);

    console.log('\n=== Migration Summary ===');
    console.log(`Records imported: ${stats.successCount}`);
    console.log(`Errors: ${stats.errorCount}`);
    console.log('\nMigration complete!');

  } catch (e: any) {
    console.error('\nERROR during migration:', e.message);
    process.exit(1);
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
      console.log('\n[SQLite] Database closed');
    }
  }
}

// Run migration
migrate().catch(console.error);
