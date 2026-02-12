/**
 * Verification Script - Check migrated data in SQL Server
 */

import { sqlGateway } from '../lib/api/sql-gateway';

console.log('\n=== Verifying SQL Server Data ===\n');

// Check users
console.log('1. Checking Users...');
const usersResult = await sqlGateway.query('SELECT id, username, email, name FROM pm_users');
console.log(`   Found ${usersResult.recordset.length} users:`);
usersResult.recordset.forEach((u: any) => {
  console.log(`   - ${u.email} (${u.name})`);
});

// Check projects
console.log('\n2. Checking Projects...');
const projectsResult = await sqlGateway.query(`
  SELECT p.id, p.name, p.owner_id, u.email as owner_email
  FROM pm_projects p
  LEFT JOIN pm_users u ON p.owner_id = u.id
`);
console.log(`   Found ${projectsResult.recordset.length} projects:`);
projectsResult.recordset.forEach((p: any) => {
  console.log(`   - ${p.name} (Owner: ${p.owner_email})`);
});

// Check tasks
console.log('\n3. Checking Tasks...');
const tasksResult = await sqlGateway.query(`
  SELECT t.id, t.title, t.project_id, p.name as project_name
  FROM pm_tasks t
  LEFT JOIN pm_projects p ON t.project_id = p.id
`);
console.log(`   Found ${tasksResult.recordset.length} tasks:`);
tasksResult.recordset.forEach((t: any) => {
  console.log(`   - ${t.title} (Project: ${t.project_name})`);
});

// Check task statuses
console.log('\n4. Checking Task Statuses...');
const statusesResult = await sqlGateway.query(`
  SELECT COUNT(*) as count
  FROM pm_task_statuses
`);
console.log(`   Found ${statusesResult.recordset[0].count} task statuses`);

console.log('\n=== Verification Complete ===\n');
