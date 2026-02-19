/**
 * Debug Script: Check Project Access
 *
 * Run with: bun run scripts/debug-project-access.ts
 */

import 'dotenv/config';
import { sqlGateway } from '../lib/api/sql-gateway';

const PROJECT_ID = 'proj_mlqbyncqp9w7csgbia'; // Projek isnin
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

    // Check project exists
    console.log('=== CHECKING PROJECT ===');
    const projectResult = await sqlGateway.query(
      'SELECT * FROM pm_projects WHERE id = @id',
      { id: PROJECT_ID }
    );
    
    if (projectResult.recordset.length === 0) {
      console.log('❌ Project NOT FOUND in database!');
      return;
    }
    
    const project = projectResult.recordset[0];
    console.log('✓ Project found:');
    console.log(`  ID: ${project.id}`);
    console.log(`  Name: ${project.name}`);
    console.log(`  Owner ID: ${project.owner_id}`);
    console.log(`  Created: ${project.created_at}`);

    // Check project members
    console.log('\n=== CHECKING PROJECT MEMBERS ===');
    const membersResult = await sqlGateway.query(
      'SELECT pm.*, u.username, u.email, u.name FROM pm_project_members pm LEFT JOIN pm_users u ON pm.user_id = u.id WHERE pm.project_id = @projectId',
      { projectId: PROJECT_ID }
    );
    
    console.log(`Found ${membersResult.recordset.length} member(s):`);
    for (const member of membersResult.recordset) {
      console.log(`  - ${member.username} (${member.email}) - Role: ${member.role}`);
    }

    // Check tasks
    console.log('\n=== CHECKING TASKS ===');
    const tasksResult = await sqlGateway.query(
      'SELECT * FROM pm_tasks WHERE project_id = @projectId',
      { projectId: PROJECT_ID }
    );
    
    console.log(`Found ${tasksResult.recordset.length} task(s):`);
    for (const task of tasksResult.recordset) {
      console.log(`  - ${task.title} (Status: ${task.status_id})`);
    }

    // Check statuses
    console.log('\n=== CHECKING STATUSES ===');
    const statusesResult = await sqlGateway.query(
      'SELECT * FROM pm_task_statuses WHERE project_id = @projectId ORDER BY [order]',
      { projectId: PROJECT_ID }
    );
    
    console.log(`Found ${statusesResult.recordset.length} status(es):`);
    for (const status of statusesResult.recordset) {
      console.log(`  - ${status.name} (Order: ${status.order})`);
    }

    // Get all users for testing
    console.log('\n=== ALL USERS ===');
    const usersResult = await sqlGateway.query(
      'SELECT id, username, email, name, role FROM pm_users'
    );
    
    console.log('Users in database:');
    for (const user of usersResult.recordset) {
      const isOwner = user.id === project.owner_id;
      const isMember = membersResult.recordset.find(m => m.user_id === user.id);
      console.log(`  - ${user.username} (${user.email})${isOwner ? ' [OWNER]' : ''}${isMember ? ` [MEMBER: ${isMember.role}]` : ''}`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
