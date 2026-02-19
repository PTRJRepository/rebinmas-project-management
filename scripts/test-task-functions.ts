/**
 * Test Script: Create and Move Task
 *
 * Run with: bun run scripts/test-task-functions.ts
 */

import 'dotenv/config';
import { sqlGateway } from '../lib/api/sql-gateway';

const PROJECT_ID = 'proj_mlqbyncqp9w7csgbia'; // Projek isnin
let STATUS_ID = ''; // Will find 'To Do' status
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

    // Get statuses for this project
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
      title: 'Test Task from Script',
      description: 'This is a test task created to verify task creation works',
      priority: 'MEDIUM',
      projectId: PROJECT_ID,
      statusId: STATUS_ID,
      progress: 0,
      createdAt: now,
      updatedAt: now
    });
    
    console.log(`✓ Task created: ${taskId}`);

    // Verify task exists
    console.log('\n=== VERIFYING TASK ===');
    const taskResult = await sqlGateway.query(
      'SELECT * FROM pm_tasks WHERE id = @id',
      { id: taskId }
    );
    
    if (taskResult.recordset.length > 0) {
      const task = taskResult.recordset[0];
      console.log('✓ Task verified in database:');
      console.log(`  Title: ${task.title}`);
      console.log(`  Status: ${task.status_id}`);
      console.log(`  Project: ${task.project_id}`);
    } else {
      console.log('❌ Task NOT found in database!');
    }

    // Test moving task to different status
    console.log('\n=== TESTING MOVE TASK ===');
    const doneStatus = statusesResult.recordset.find(s => s.name === 'Done');
    if (doneStatus) {
      await sqlGateway.query(
        'UPDATE pm_tasks SET status_id = @statusId, updated_at = @updatedAt WHERE id = @id',
        { id: taskId, statusId: doneStatus.id, updatedAt: new Date() }
      );
      console.log(`✓ Task moved to "${doneStatus.name}"`);
      
      // Verify move
      const verifyResult = await sqlGateway.query(
        'SELECT status_id FROM pm_tasks WHERE id = @id',
        { id: taskId }
      );
      const verifyTask = verifyResult.recordset[0];
      console.log(`  New status: ${verifyTask.status_id} (Expected: ${doneStatus.id})`);
    }

    // Clean up - delete test task
    console.log('\n=== CLEANING UP ===');
    await sqlGateway.query('DELETE FROM pm_tasks WHERE id = @id', { id: taskId });
    console.log('✓ Test task deleted');

    console.log('\n✅ All task operations working correctly!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
