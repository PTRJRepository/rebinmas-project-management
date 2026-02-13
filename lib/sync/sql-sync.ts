/**
 * SQL Server Sync Utility
 *
 * This utility handles bidirectional synchronization between:
 * - Local SQLite database (via Prisma) - uses tables WITHOUT pm_ prefix
 * - Remote SQL Server database (via SQL Gateway API) - uses tables WITH pm_ prefix
 *
 * Primary sync direction: SQL Server -> SQLite (pull)
 * The app uses SQL Server as the primary database when USE_SQL_SERVER=true
 */

import { prisma } from '@/lib/prisma';
import { sqlGateway } from '@/lib/api/sql-gateway';

interface SyncOptions {
  direction?: 'push' | 'pull' | 'both';
  tables?: Array<'users' | 'projects' | 'tasks' | 'statuses' | 'comments' | 'attachments'>;
  dryRun?: boolean;
}

interface SyncResult {
  success: boolean;
  timestamp: Date;
  direction: string;
  tables: {
    name: string;
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
  }[];
  errors: string[];
}

export async function syncData(options: SyncOptions = {}): Promise<SyncResult> {
  const {
    direction = 'pull',
    tables = ['users', 'projects', 'statuses', 'tasks', 'comments', 'attachments'],
    dryRun = false
  } = options;

  const result: SyncResult = {
    success: true,
    timestamp: new Date(),
    direction,
    tables: [],
    errors: [],
  };

  console.log(`🔄 Starting ${direction} sync...`, { tables, dryRun });

  if (direction === 'pull' || direction === 'both') {
    // Pull from SQL Server to SQLite
    if (tables.includes('users')) {
      const userResult = await pullUsers(dryRun);
      result.tables.push(userResult);
    }
    if (tables.includes('projects')) {
      const projectResult = await pullProjects(dryRun);
      result.tables.push(projectResult);
    }
    if (tables.includes('statuses')) {
      const statusResult = await pullTaskStatuses(dryRun);
      result.tables.push(statusResult);
    }
    if (tables.includes('tasks')) {
      const taskResult = await pullTasks(dryRun);
      result.tables.push(taskResult);
    }
    if (tables.includes('comments')) {
      const commentResult = await pullComments(dryRun);
      result.tables.push(commentResult);
    }
    if (tables.includes('attachments')) {
      const attachmentResult = await pullAttachments(dryRun);
      result.tables.push(attachmentResult);
    }
  }

  if (direction === 'push' || direction === 'both') {
    // Push from SQLite to SQL Server
    if (tables.includes('users')) {
      const userResult = await pushUsers(dryRun);
      result.tables.push({ ...userResult, name: userResult.name + '_push' });
    }
    if (tables.includes('projects')) {
      const projectResult = await pushProjects(dryRun);
      result.tables.push({ ...projectResult, name: projectResult.name + '_push' });
    }
    if (tables.includes('statuses')) {
      const statusResult = await pushTaskStatuses(dryRun);
      result.tables.push({ ...statusResult, name: statusResult.name + '_push' });
    }
    if (tables.includes('tasks')) {
      const taskResult = await pushTasks(dryRun);
      result.tables.push({ ...taskResult, name: taskResult.name + '_push' });
    }
    if (tables.includes('comments')) {
      const commentResult = await pushComments(dryRun);
      result.tables.push({ ...commentResult, name: commentResult.name + '_push' });
    }
    if (tables.includes('attachments')) {
      const attachmentResult = await pushAttachments(dryRun);
      result.tables.push({ ...attachmentResult, name: attachmentResult.name + '_push' });
    }
  }

  // Check if any errors occurred
  result.success = result.errors.length === 0;
  result.tables.forEach(t => {
    if (t.errors > 0) result.success = false;
  });

  console.log('✅ Sync completed', result);
  return result;
}

// ==================================================
// PULL FUNCTIONS (SQL Server -> SQLite)
// ==================================================

async function pullUsers(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'users', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const remoteUsers = await sqlGateway.query('SELECT * FROM pm_users');
    console.log(`📋 Found ${remoteUsers.recordset.length} users in SQL Server`);

    for (const user of remoteUsers.recordset) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would pull user: ${user.email}`);
          result.skipped++;
          continue;
        }

        const existingUser = await prisma.user.findUnique({ where: { id: user.id } });

        if (existingUser) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              username: user.username,
              email: user.email,
              password: user.password,
              name: user.name,
              role: user.role,
              avatarUrl: user.avatar_url,
              updatedAt: user.updated_at,
            },
          });
          result.updated++;
        } else {
          await prisma.user.create({
            data: {
              id: user.id,
              username: user.username,
              email: user.email,
              password: user.password,
              name: user.name,
              role: user.role,
              avatarUrl: user.avatar_url,
              createdAt: user.created_at,
              updatedAt: user.updated_at,
            },
          });
          result.inserted++;
        }
      } catch (error) {
        console.error(`Error pulling user ${user.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pullUsers:', error);
    result.errors++;
  }

  return result;
}

async function pullProjects(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'projects', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const remoteProjects = await sqlGateway.query('SELECT * FROM pm_projects');
    console.log(`📋 Found ${remoteProjects.recordset.length} projects in SQL Server`);

    for (const project of remoteProjects.recordset) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would pull project: ${project.name}`);
          result.skipped++;
          continue;
        }

        const existingProject = await prisma.project.findUnique({ where: { id: project.id } });

        if (existingProject) {
          await prisma.project.update({
            where: { id: project.id },
            data: {
              name: project.name,
              description: project.description,
              startDate: project.start_date,
              endDate: project.end_date,
              priority: project.priority,
              bannerImage: project.banner_image,
              status: project.status,
              ownerId: project.owner_id,
              updatedAt: project.updated_at,
            },
          });
          result.updated++;
        } else {
          await prisma.project.create({
            data: {
              id: project.id,
              name: project.name,
              description: project.description,
              startDate: project.start_date,
              endDate: project.end_date,
              priority: project.priority,
              bannerImage: project.banner_image,
              status: project.status,
              ownerId: project.owner_id,
              createdAt: project.created_at,
              updatedAt: project.updated_at,
            },
          });
          result.inserted++;
        }
      } catch (error) {
        console.error(`Error pulling project ${project.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pullProjects:', error);
    result.errors++;
  }

  return result;
}

async function pullTaskStatuses(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'statuses', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const remoteStatuses = await sqlGateway.query('SELECT * FROM pm_task_statuses');
    console.log(`📋 Found ${remoteStatuses.recordset.length} task statuses in SQL Server`);

    for (const status of remoteStatuses.recordset) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would pull status: ${status.name}`);
          result.skipped++;
          continue;
        }

        const existingStatus = await prisma.taskStatus.findUnique({ where: { id: status.id } });

        if (existingStatus) {
          await prisma.taskStatus.update({
            where: { id: status.id },
            data: {
              name: status.name,
              order: status.order,
              projectId: status.project_id,
              updatedAt: status.updated_at,
            },
          });
          result.updated++;
        } else {
          await prisma.taskStatus.create({
            data: {
              id: status.id,
              name: status.name,
              order: status.order,
              projectId: status.project_id,
              createdAt: status.created_at,
              updatedAt: status.updated_at,
            },
          });
          result.inserted++;
        }
      } catch (error) {
        console.error(`Error pulling status ${status.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pullTaskStatuses:', error);
    result.errors++;
  }

  return result;
}

async function pullTasks(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'tasks', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const remoteTasks = await sqlGateway.query('SELECT * FROM pm_tasks');
    console.log(`📋 Found ${remoteTasks.recordset.length} tasks in SQL Server`);

    for (const task of remoteTasks.recordset) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would pull task: ${task.title}`);
          result.skipped++;
          continue;
        }

        const existingTask = await prisma.task.findUnique({ where: { id: task.id } });

        if (existingTask) {
          await prisma.task.update({
            where: { id: task.id },
            data: {
              title: task.title,
              description: task.description,
              priority: task.priority,
              dueDate: task.due_date,
              estimatedHours: task.estimated_hours,
              actualHours: task.actual_hours,
              documentation: task.documentation,
              progress: task.progress,
              lastAlertSent: task.last_alert_sent,
              projectId: task.project_id,
              statusId: task.status_id,
              assigneeId: task.assignee_id,
              updatedAt: task.updated_at,
            },
          });
          result.updated++;
        } else {
          await prisma.task.create({
            data: {
              id: task.id,
              title: task.title,
              description: task.description,
              priority: task.priority,
              dueDate: task.due_date,
              estimatedHours: task.estimated_hours,
              actualHours: task.actual_hours,
              documentation: task.documentation,
              progress: task.progress,
              lastAlertSent: task.last_alert_sent,
              projectId: task.project_id,
              statusId: task.status_id,
              assigneeId: task.assignee_id,
              createdAt: task.created_at,
              updatedAt: task.updated_at,
            },
          });
          result.inserted++;
        }
      } catch (error) {
        console.error(`Error pulling task ${task.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pullTasks:', error);
    result.errors++;
  }

  return result;
}

async function pullComments(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'comments', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const remoteComments = await sqlGateway.query('SELECT * FROM pm_comments');
    console.log(`📋 Found ${remoteComments.recordset.length} comments in SQL Server`);

    for (const comment of remoteComments.recordset) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would pull comment: ${comment.id}`);
          result.skipped++;
          continue;
        }

        const existingComment = await prisma.comment.findUnique({ where: { id: comment.id } });

        if (existingComment) {
          await prisma.comment.update({
            where: { id: comment.id },
            data: {
              taskId: comment.task_id,
              userId: comment.user_id,
              content: comment.content,
              updatedAt: comment.updated_at,
            },
          });
          result.updated++;
        } else {
          await prisma.comment.create({
            data: {
              id: comment.id,
              taskId: comment.task_id,
              userId: comment.user_id,
              content: comment.content,
              createdAt: comment.created_at,
              updatedAt: comment.updated_at,
            },
          });
          result.inserted++;
        }
      } catch (error) {
        console.error(`Error pulling comment ${comment.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pullComments:', error);
    result.errors++;
  }

  return result;
}

async function pullAttachments(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'attachments', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const remoteAttachments = await sqlGateway.query('SELECT * FROM pm_attachments');
    console.log(`📋 Found ${remoteAttachments.recordset.length} attachments in SQL Server`);

    for (const attachment of remoteAttachments.recordset) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would pull attachment: ${attachment.file_name}`);
          result.skipped++;
          continue;
        }

        const existingAttachment = await prisma.attachment.findUnique({ where: { id: attachment.id } });

        if (existingAttachment) {
          await prisma.attachment.update({
            where: { id: attachment.id },
            data: {
              taskId: attachment.task_id,
              fileName: attachment.file_name,
              fileUrl: attachment.file_url,
              fileType: attachment.file_type,
              fileSize: attachment.file_size,
            },
          });
          result.updated++;
        } else {
          await prisma.attachment.create({
            data: {
              id: attachment.id,
              taskId: attachment.task_id,
              fileName: attachment.file_name,
              fileUrl: attachment.file_url,
              fileType: attachment.file_type,
              fileSize: attachment.file_size,
              createdAt: attachment.created_at,
            },
          });
          result.inserted++;
        }
      } catch (error) {
        console.error(`Error pulling attachment ${attachment.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pullAttachments:', error);
    result.errors++;
  }

  return result;
}

// ==================================================
// PUSH FUNCTIONS (SQLite -> SQL Server)
// ==================================================

async function pushUsers(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'users', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const localUsers = await prisma.user.findMany();
    console.log(`📋 Found ${localUsers.length} users in SQLite`);

    for (const user of localUsers) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would push user: ${user.email}`);
          result.skipped++;
          continue;
        }

        // Use MERGE for upsert
        const mergeSql = `
          MERGE INTO pm_users AS target
          USING (SELECT @id AS id, @username AS username, @email AS email, @password AS password, 
                        @name AS name, @role AS role, @avatarUrl AS avatar_url, 
                        @createdAt AS created_at, @updatedAt AS updated_at) AS source
          ON target.id = source.id
          WHEN MATCHED THEN
            UPDATE SET 
              username = source.username,
              email = source.email,
              password = source.password,
              name = source.name,
              role = source.role,
              avatar_url = source.avatar_url,
              updated_at = source.updated_at
          WHEN NOT MATCHED THEN
            INSERT (id, username, email, password, name, role, avatar_url, created_at, updated_at)
            VALUES (source.id, source.username, source.email, source.password, source.name, 
                    source.role, source.avatar_url, source.created_at, source.updated_at)
          OUTPUT $action AS action;
        `;

        const queryResult = await sqlGateway.query(mergeSql, {
          id: user.id,
          username: user.username,
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        const action = queryResult.recordset[0]?.action;
        if (action === 'INSERT') {
          result.inserted++;
        } else if (action === 'UPDATE') {
          result.updated++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        console.error(`Error pushing user ${user.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pushUsers:', error);
    result.errors++;
  }

  return result;
}

async function pushProjects(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'projects', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const localProjects = await prisma.project.findMany();
    console.log(`📋 Found ${localProjects.length} projects in SQLite`);

    for (const project of localProjects) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would push project: ${project.name}`);
          result.skipped++;
          continue;
        }

        const mergeSql = `
          MERGE INTO pm_projects AS target
          USING (SELECT @id AS id, @name AS name, @description AS description, 
                        @startDate AS start_date, @endDate AS end_date, @priority AS priority,
                        @bannerImage AS banner_image, @status AS status, @ownerId AS owner_id,
                        @createdAt AS created_at, @updatedAt AS updated_at) AS source
          ON target.id = source.id
          WHEN MATCHED THEN
            UPDATE SET 
              name = source.name,
              description = source.description,
              start_date = source.start_date,
              end_date = source.end_date,
              priority = source.priority,
              banner_image = source.banner_image,
              status = source.status,
              owner_id = source.owner_id,
              updated_at = source.updated_at
          WHEN NOT MATCHED THEN
            INSERT (id, name, description, start_date, end_date, priority, banner_image, status, owner_id, created_at, updated_at)
            VALUES (source.id, source.name, source.description, source.start_date, source.end_date, 
                    source.priority, source.banner_image, source.status, source.owner_id, 
                    source.created_at, source.updated_at)
          OUTPUT $action AS action;
        `;

        const queryResult = await sqlGateway.query(mergeSql, {
          id: project.id,
          name: project.name,
          description: project.description || null,
          startDate: project.startDate || null,
          endDate: project.endDate || null,
          priority: project.priority,
          bannerImage: project.bannerImage || null,
          status: project.status || null,
          ownerId: project.ownerId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        });

        const action = queryResult.recordset[0]?.action;
        if (action === 'INSERT') {
          result.inserted++;
        } else if (action === 'UPDATE') {
          result.updated++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        console.error(`Error pushing project ${project.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pushProjects:', error);
    result.errors++;
  }

  return result;
}

async function pushTaskStatuses(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'statuses', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const localStatuses = await prisma.taskStatus.findMany();
    console.log(`📋 Found ${localStatuses.length} task statuses in SQLite`);

    for (const status of localStatuses) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would push status: ${status.name}`);
          result.skipped++;
          continue;
        }

        const mergeSql = `
          MERGE INTO pm_task_statuses AS target
          USING (SELECT @id AS id, @name AS name, @order AS [order], @projectId AS project_id,
                        @createdAt AS created_at, @updatedAt AS updated_at) AS source
          ON target.id = source.id
          WHEN MATCHED THEN
            UPDATE SET 
              name = source.name,
              [order] = source.[order],
              project_id = source.project_id,
              updated_at = source.updated_at
          WHEN NOT MATCHED THEN
            INSERT (id, name, [order], project_id, created_at, updated_at)
            VALUES (source.id, source.name, source.[order], source.project_id, source.created_at, source.updated_at)
          OUTPUT $action AS action;
        `;

        const queryResult = await sqlGateway.query(mergeSql, {
          id: status.id,
          name: status.name,
          order: status.order,
          projectId: status.projectId,
          createdAt: status.createdAt,
          updatedAt: status.updatedAt,
        });

        const action = queryResult.recordset[0]?.action;
        if (action === 'INSERT') {
          result.inserted++;
        } else if (action === 'UPDATE') {
          result.updated++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        console.error(`Error pushing status ${status.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pushTaskStatuses:', error);
    result.errors++;
  }

  return result;
}

async function pushTasks(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'tasks', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const localTasks = await prisma.task.findMany();
    console.log(`📋 Found ${localTasks.length} tasks in SQLite`);

    for (const task of localTasks) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would push task: ${task.title}`);
          result.skipped++;
          continue;
        }

        const mergeSql = `
          MERGE INTO pm_tasks AS target
          USING (SELECT @id AS id, @title AS title, @description AS description, 
                        @priority AS priority, @dueDate AS due_date, @estimatedHours AS estimated_hours,
                        @actualHours AS actual_hours, @documentation AS documentation, @progress AS progress,
                        @lastAlertSent AS last_alert_sent, @projectId AS project_id, @statusId AS status_id,
                        @assigneeId AS assignee_id, @createdAt AS created_at, @updatedAt AS updated_at) AS source
          ON target.id = source.id
          WHEN MATCHED THEN
            UPDATE SET 
              title = source.title,
              description = source.description,
              priority = source.priority,
              due_date = source.due_date,
              estimated_hours = source.estimated_hours,
              actual_hours = source.actual_hours,
              documentation = source.documentation,
              progress = source.progress,
              last_alert_sent = source.last_alert_sent,
              project_id = source.project_id,
              status_id = source.status_id,
              assignee_id = source.assignee_id,
              updated_at = source.updated_at
          WHEN NOT MATCHED THEN
            INSERT (id, title, description, priority, due_date, estimated_hours, actual_hours, 
                    documentation, progress, last_alert_sent, project_id, status_id, assignee_id, created_at, updated_at)
            VALUES (source.id, source.title, source.description, source.priority, source.due_date, 
                    source.estimated_hours, source.actual_hours, source.documentation, source.progress,
                    source.last_alert_sent, source.project_id, source.status_id, source.assignee_id,
                    source.created_at, source.updated_at)
          OUTPUT $action AS action;
        `;

        const queryResult = await sqlGateway.query(mergeSql, {
          id: task.id,
          title: task.title,
          description: task.description || null,
          priority: task.priority,
          dueDate: task.dueDate || null,
          estimatedHours: task.estimatedHours || null,
          actualHours: task.actualHours || null,
          documentation: task.documentation || null,
          progress: task.progress,
          lastAlertSent: task.lastAlertSent || null,
          projectId: task.projectId,
          statusId: task.statusId,
          assigneeId: task.assigneeId || null,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        });

        const action = queryResult.recordset[0]?.action;
        if (action === 'INSERT') {
          result.inserted++;
        } else if (action === 'UPDATE') {
          result.updated++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        console.error(`Error pushing task ${task.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pushTasks:', error);
    result.errors++;
  }

  return result;
}

async function pushComments(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'comments', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const localComments = await prisma.comment.findMany();
    console.log(`📋 Found ${localComments.length} comments in SQLite`);

    for (const comment of localComments) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would push comment: ${comment.id}`);
          result.skipped++;
          continue;
        }

        const mergeSql = `
          MERGE INTO pm_comments AS target
          USING (SELECT @id AS id, @taskId AS task_id, @userId AS user_id, @content AS content,
                        @createdAt AS created_at, @updatedAt AS updated_at) AS source
          ON target.id = source.id
          WHEN MATCHED THEN
            UPDATE SET 
              task_id = source.task_id,
              user_id = source.user_id,
              content = source.content,
              updated_at = source.updated_at
          WHEN NOT MATCHED THEN
            INSERT (id, task_id, user_id, content, created_at, updated_at)
            VALUES (source.id, source.task_id, source.user_id, source.content, source.created_at, source.updated_at)
          OUTPUT $action AS action;
        `;

        const queryResult = await sqlGateway.query(mergeSql, {
          id: comment.id,
          taskId: comment.taskId,
          userId: comment.userId,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        });

        const action = queryResult.recordset[0]?.action;
        if (action === 'INSERT') {
          result.inserted++;
        } else if (action === 'UPDATE') {
          result.updated++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        console.error(`Error pushing comment ${comment.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pushComments:', error);
    result.errors++;
  }

  return result;
}

async function pushAttachments(dryRun: boolean): Promise<{ name: string; inserted: number; updated: number; skipped: number; errors: number }> {
  const result = { name: 'attachments', inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const localAttachments = await prisma.attachment.findMany();
    console.log(`📋 Found ${localAttachments.length} attachments in SQLite`);

    for (const attachment of localAttachments) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would push attachment: ${attachment.fileName}`);
          result.skipped++;
          continue;
        }

        const mergeSql = `
          MERGE INTO pm_attachments AS target
          USING (SELECT @id AS id, @taskId AS task_id, @fileName AS file_name, @fileUrl AS file_url,
                        @fileType AS file_type, @fileSize AS file_size, @createdAt AS created_at) AS source
          ON target.id = source.id
          WHEN MATCHED THEN
            UPDATE SET 
              task_id = source.task_id,
              file_name = source.file_name,
              file_url = source.file_url,
              file_type = source.file_type,
              file_size = source.file_size
          WHEN NOT MATCHED THEN
            INSERT (id, task_id, file_name, file_url, file_type, file_size, created_at)
            VALUES (source.id, source.task_id, source.file_name, source.file_url, source.file_type, source.file_size, source.created_at)
          OUTPUT $action AS action;
        `;

        const queryResult = await sqlGateway.query(mergeSql, {
          id: attachment.id,
          taskId: attachment.taskId,
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          createdAt: attachment.createdAt,
        });

        const action = queryResult.recordset[0]?.action;
        if (action === 'INSERT') {
          result.inserted++;
        } else if (action === 'UPDATE') {
          result.updated++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        console.error(`Error pushing attachment ${attachment.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error in pushAttachments:', error);
    result.errors++;
  }

  return result;
}

// ==================================================
// QUICK SYNC FUNCTIONS
// ==================================================

/**
 * Pull all data from SQL Server to SQLite
 */
export async function pullFromServer(dryRun: boolean = false) {
  return syncData({ direction: 'pull', dryRun });
}

/**
 * Push all local changes to SQL Server
 */
export async function pushToServer(dryRun: boolean = false) {
  return syncData({ direction: 'push', dryRun });
}

/**
 * Full bidirectional sync
 */
export async function fullSync(dryRun: boolean = false) {
  return syncData({ direction: 'both', dryRun });
}

/**
 * Sync only specific tables
 */
export async function syncTables(tables: Array<'users' | 'projects' | 'tasks' | 'statuses' | 'comments' | 'attachments'>, direction: 'push' | 'pull' | 'both' = 'pull', dryRun: boolean = false) {
  return syncData({ tables, direction, dryRun });
}
