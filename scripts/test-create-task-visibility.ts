/**
 * Test Script: Create Task and Verify on Kanban Board
 *
 * Run with: bun run scripts/test-create-task-visibility.ts
 */

import 'dotenv/config';
import { sqlGateway } from '../lib/api/sql-gateway';

const PROJECT_ID = 'proj_mlqbyncqp9w7csgbia'; // Projek isnin
let STATUS_ID = '';
const API_BASE_URL = process.env.API_QUERY_URL || 'http://10.0.0.110:8001';
const API_TOKEN = process.env.API_TOKEN;

if (!API_TOKEN) {
  console.error('ERROR: API_TOKEN is not set');
  process.exit(1);
}

async function main() {
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const health = await healthResponse.json();
    console.log(`\n✓ API Gateway Status: ${health.status}\n`);

    // Get statuses
    console.log('=== GETTING STATUSES ===');
    const statusesResult = await sqlGateway.query(
      'SELECT id, name, [order] FROM pm_task_statuses WHERE project_id = @projectId ORDER BY [order]',
      { projectId: PROJECT_ID }
    );
    
    console.log('Available statuses:');
    for (const status of statusesResult.recordset) {
      console.log(`  - ${status.name} (${status.id})`);
      if (status.name === 'To Do') {
        STATUS_ID = status.id;
      }
    }

    if (!STATUS_ID) {
      console.log('❌ No "To Do" status found!');
      return;
    }

    // Create a test task
    console.log('\n=== CREATING TEST TASK ===');
    const taskId = `task_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
    const now = new Date();
    
    await sqlGateway.query(`
      INSERT INTO pm_tasks (id, title, description, priority, project_id, status_id, progress, created_at, updated_at)
      VALUES (@id, @title, @description, @priority, @projectId, @statusId, @progress, @createdAt, @updatedAt)
    `, {
      id: taskId,
      title: 'Test Task Visibility on Kanban',
      description: 'This task should appear on Kanban board',
      priority: 'MEDIUM',
      projectId: PROJECT_ID,
      statusId: STATUS_ID,
      progress: 0,
      createdAt: now,
      updatedAt: now
    });
    
    console.log(`✓ Task created: ${taskId}`);

    // Fetch task with JOIN (simulating getTaskById)
    console.log('\n=== FETCHING TASK WITH JOIN ===');
    const taskResult = await sqlGateway.query(`
      SELECT
        t.*,
        ts.id as status_id,
        ts.name as status_name,
        ts.[order] as status_order,
        ts.project_id as status_project_id
      FROM pm_tasks t
      LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
      WHERE t.id = @id
    `, { id: taskId });

    if (taskResult.recordset.length > 0) {
      const task = taskResult.recordset[0];
      console.log('✓ Task fetched successfully:');
      console.log(`  ID: ${task.id}`);
      console.log(`  Title: ${task.title}`);
      console.log(`  Status ID: ${task.status_id}`);
      console.log(`  Status Name: ${task.status_name}`);
      console.log(`  Status Order: ${task.status_order}`);
      console.log(`  Project ID: ${task.project_id || task.status_project_id}`);
    } else {
      console.log('❌ Task NOT found!');
    }

    // Fetch all tasks for project (simulating getTasks)
    console.log('\n=== FETCHING ALL PROJECT TASKS ===');
    const allTasksResult = await sqlGateway.query(`
      SELECT
        t.*,
        ts.id as status_id,
        ts.name as status_name,
        ts.[order] as status_order
      FROM pm_tasks t
      LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
      WHERE t.project_id = @projectId
      ORDER BY t.created_at DESC
    `, { projectId: PROJECT_ID });

    console.log(`Found ${allTasksResult.recordset.length} task(s) in project:`);
    for (const task of allTasksResult.recordset) {
      console.log(`  - ${task.title} [${task.status_name}]`);
    }

    // Clean up
    console.log('\n=== CLEANING UP ===');
    await sqlGateway.query('DELETE FROM pm_tasks WHERE id = @id', { id: taskId });
    console.log('✓ Test task deleted');

    console.log('\n✅ Task visibility test completed!');
    console.log('If you see "Task fetched successfully" above, the Kanban board should display the task.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
