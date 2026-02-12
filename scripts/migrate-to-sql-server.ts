/**
 * Migration Script: SQLite (Prisma) -> SQL Server (extend_db_ptrj)
 *
 * This script migrates all data from the local SQLite database
 * to the SQL Server database via SQL Gateway API.
 *
 * Run with: bun run scripts/migrate-to-sql-server.ts
 */

import { PrismaClient } from '@prisma/client';
import { sqlGateway } from '../lib/api/sql-gateway';

const prisma = new PrismaClient();

// ==================================================
// HELPER FUNCTIONS
// ==================================================

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

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    error: '\x1b[31m',   // red
    warn: '\x1b[33m',    // yellow
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

// ==================================================
// MIGRATION FUNCTIONS
// ==================================================

async function migrateUsers() {
  log('\n=== Migrating Users ===', 'info');

  const users = await prisma.user.findMany();
  log(`Found ${users.length} users in SQLite`, 'info');

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    // Check if user already exists in SQL Server
    const existing = await sqlGateway.query(
      'SELECT id FROM pm_users WHERE id = @id OR email = @email',
      { id: user.id, email: user.email }
    );

    if (existing.recordset.length > 0) {
      log(`User ${user.email} already exists, skipping...`, 'warn');
      skipped++;
      continue;
    }

    // Insert user into SQL Server
    await sqlGateway.query(`
      INSERT INTO pm_users (id, username, email, password, name, role, avatar_url, created_at, updated_at)
      VALUES (@id, @username, @email, @password, @name, @role, @avatarUrl, @createdAt, @updatedAt)
    `, {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password, // Password is already hashed
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    migrated++;
    log(`✓ Migrated user: ${user.email}`, 'success');
  }

  log(`\nUsers: ${migrated} migrated, ${skipped} skipped`, 'success');
  return users;
}

async function migrateProjects(users: any[]) {
  log('\n=== Migrating Projects ===', 'info');

  const projects = await prisma.project.findMany();
  log(`Found ${projects.length} projects in SQLite`, 'info');

  // Map owner IDs to verify ownership
  const userIds = new Set(users.map(u => u.id));

  let migrated = 0;
  let skipped = 0;

  for (const project of projects) {
    // Check if project already exists
    const existing = await sqlGateway.query(
      'SELECT id FROM pm_projects WHERE id = @id',
      { id: project.id }
    );

    if (existing.recordset.length > 0) {
      log(`Project ${project.name} already exists, skipping...`, 'warn');
      skipped++;
      continue;
    }

    // Verify owner exists
    if (!userIds.has(project.ownerId)) {
      log(`Project ${project.name}: Owner ${project.ownerId} not found, skipping...`, 'warn');
      skipped++;
      continue;
    }

    // Insert project into SQL Server
    await sqlGateway.query(`
      INSERT INTO pm_projects (id, name, description, start_date, end_date, priority, banner_image, status, owner_id, created_at, updated_at)
      VALUES (@id, @name, @description, @startDate, @endDate, @priority, @bannerImage, @status, @ownerId, @createdAt, @updatedAt)
    `, {
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      priority: project.priority,
      bannerImage: project.bannerImage,
      status: project.status,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });

    migrated++;
    log(`✓ Migrated project: ${project.name}`, 'success');
  }

  log(`\nProjects: ${migrated} migrated, ${skipped} skipped`, 'success');
  return projects;
}

async function migrateTaskStatuses(projects: any[]) {
  log('\n=== Migrating Task Statuses ===', 'info');

  const projectIds = new Set(projects.map(p => p.id));
  let migrated = 0;
  let skipped = 0;

  const statuses = await prisma.taskStatus.findMany({
    where: { projectId: { in: Array.from(projectIds) } }
  });

  log(`Found ${statuses.length} task statuses in SQLite`, 'info');

  for (const status of statuses) {
    // Check if status already exists
    const existing = await sqlGateway.query(
      'SELECT id FROM pm_task_statuses WHERE id = @id',
      { id: status.id }
    );

    if (existing.recordset.length > 0) {
      skipped++;
      continue;
    }

    // Insert status into SQL Server
    await sqlGateway.query(`
      INSERT INTO pm_task_statuses (id, name, [order], project_id, created_at, updated_at)
      VALUES (@id, @name, @order, @projectId, @createdAt, @updatedAt)
    `, {
      id: status.id,
      name: status.name,
      order: status.order,
      projectId: status.projectId,
      createdAt: status.createdAt,
      updatedAt: status.updatedAt,
    });

    migrated++;
  }

  log(`Task Statuses: ${migrated} migrated, ${skipped} skipped`, 'success');
  return statuses;
}

async function migrateTasks(projects: any[], statuses: any[]) {
  log('\n=== Migrating Tasks ===', 'info');

  const projectIds = new Set(projects.map(p => p.id));
  const statusIds = new Set(statuses.map(s => s.id));

  const tasks = await prisma.task.findMany({
    where: { projectId: { in: Array.from(projectIds) } }
  });

  log(`Found ${tasks.length} tasks in SQLite`, 'info');

  let migrated = 0;
  let skipped = 0;

  for (const task of tasks) {
    // Check if task already exists
    const existing = await sqlGateway.query(
      'SELECT id FROM pm_tasks WHERE id = @id',
      { id: task.id }
    );

    if (existing.recordset.length > 0) {
      skipped++;
      continue;
    }

    // Verify status exists
    if (!statusIds.has(task.statusId)) {
      log(`Task ${task.title}: Status ${task.statusId} not found, skipping...`, 'warn');
      skipped++;
      continue;
    }

    // Insert task into SQL Server
    await sqlGateway.query(`
      INSERT INTO pm_tasks (id, title, description, priority, due_date, estimated_hours, actual_hours, documentation, progress, last_alert_sent, project_id, status_id, assignee_id, created_at, updated_at)
      VALUES (@id, @title, @description, @priority, @dueDate, @estimatedHours, @actualHours, @documentation, @progress, @lastAlertSent, @projectId, @statusId, @assigneeId, @createdAt, @updatedAt)
    `, {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      documentation: task.documentation,
      progress: task.progress,
      lastAlertSent: task.lastAlertSent,
      projectId: task.projectId,
      statusId: task.statusId,
      assigneeId: task.assigneeId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });

    migrated++;
    log(`✓ Migrated task: ${task.title}`, 'success');
  }

  log(`Tasks: ${migrated} migrated, ${skipped} skipped`, 'success');
  return tasks;
}

async function migrateComments(tasks: any[]) {
  log('\n=== Migrating Comments ===', 'info');

  const taskIds = new Set(tasks.map(t => t.id));
  let migrated = 0;
  let skipped = 0;

  const comments = await prisma.comment.findMany({
    where: { taskId: { in: Array.from(taskIds) } }
  });

  log(`Found ${comments.length} comments in SQLite`, 'info');

  for (const comment of comments) {
    // Check if comment already exists
    const existing = await sqlGateway.query(
      'SELECT id FROM pm_comments WHERE id = @id',
      { id: comment.id }
    );

    if (existing.recordset.length > 0) {
      skipped++;
      continue;
    }

    // Insert comment into SQL Server
    await sqlGateway.query(`
      INSERT INTO pm_comments (id, task_id, user_id, content, created_at, updated_at)
      VALUES (@id, @taskId, @userId, @content, @createdAt, @updatedAt)
    `, {
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    });

    migrated++;
  }

  log(`Comments: ${migrated} migrated, ${skipped} skipped`, 'success');
  return comments;
}

async function migrateAttachments(tasks: any[]) {
  log('\n=== Migrating Attachments ===', 'info');

  const taskIds = new Set(tasks.map(t => t.id));
  let migrated = 0;
  let skipped = 0;

  const attachments = await prisma.attachment.findMany({
    where: { taskId: { in: Array.from(taskIds) } }
  });

  log(`Found ${attachments.length} attachments in SQLite`, 'info');

  for (const attachment of attachments) {
    // Check if attachment already exists
    const existing = await sqlGateway.query(
      'SELECT id FROM pm_attachments WHERE id = @id',
      { id: attachment.id }
    );

    if (existing.recordset.length > 0) {
      skipped++;
      continue;
    }

    // Insert attachment into SQL Server
    await sqlGateway.query(`
      INSERT INTO pm_attachments (id, task_id, file_name, file_url, file_type, file_size, created_at)
      VALUES (@id, @taskId, @fileName, @fileUrl, @fileType, @fileSize, @createdAt)
    `, {
      id: attachment.id,
      taskId: attachment.taskId,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      createdAt: attachment.createdAt,
    });

    migrated++;
  }

  log(`Attachments: ${migrated} migrated, ${skipped} skipped`, 'success');
}

// ==================================================
// MAIN MIGRATION
// ==================================================

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'info');
  log('║   SQLite -> SQL Server Migration Tool                     ║', 'info');
  log('╚════════════════════════════════════════════════════════╝', 'info');

  try {
    // Step 1: Migrate users first (required for foreign keys)
    const users = await migrateUsers();

    // Step 2: Migrate projects (depend on users)
    const projects = await migrateProjects(users);

    // Step 3: Migrate task statuses (depend on projects)
    const statuses = await migrateTaskStatuses(projects);

    // Step 4: Migrate tasks (depend on projects and statuses)
    const tasks = await migrateTasks(projects, statuses);

    // Step 5: Migrate comments (depend on tasks)
    await migrateComments(tasks);

    // Step 6: Migrate attachments (depend on tasks)
    await migrateAttachments(tasks);

    log('\n╔════════════════════════════════════════════════════════╗', 'success');
    log('║   Migration Completed Successfully! ✓                      ║', 'success');
    log('╚════════════════════════════════════════════════════════╝', 'success');
    log('\nYou can now login with your existing credentials!', 'info');

  } catch (error) {
    log('\n✗ Migration failed:', 'error');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
