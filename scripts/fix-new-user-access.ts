/**
 * Fix Script: Add All Users to All Projects
 *
 * This script ensures all users have access to all projects by adding them
 * to the pm_project_members table with MEMBER role.
 *
 * Run with: bun run scripts/fix-new-user-access.ts
 */

import 'dotenv/config';
import { sqlGateway } from '../lib/api/sql-gateway';

// Configuration
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

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  owner_id: string;
}

interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
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

async function getAllUsers(): Promise<User[]> {
  const result = await sqlGateway.query(
    'SELECT id, username, email, name, role FROM pm_users'
  );
  return result.recordset as User[];
}

async function getAllProjects(): Promise<Project[]> {
  const result = await sqlGateway.query(
    'SELECT id, name, owner_id FROM pm_projects'
  );
  return result.recordset as Project[];
}

async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const result = await sqlGateway.query(
    'SELECT id, project_id, user_id, role FROM pm_project_members WHERE project_id = @projectId',
    { projectId }
  );
  return result.recordset as ProjectMember[];
}

async function addProjectMember(projectId: string, userId: string, role: string): Promise<void> {
  const id = `member_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
  await sqlGateway.query(
    `INSERT INTO pm_project_members (id, project_id, user_id, role, joined_at, added_by)
     VALUES (@id, @projectId, @userId, @role, GETDATE(), @addedBy)`,
    {
      id,
      projectId,
      userId,
      role,
      addedBy: 'system',
    }
  );
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'info');
  log('║   Fix: Add All Users to All Projects                     ║', 'info');
  log('╚════════════════════════════════════════════════════════╝', 'info');

  try {
    // Check API connection
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const health = await healthResponse.json();
    log(`\nAPI Gateway Status: ${health.status}`, 'success');

    // Get all users
    log('\n[Step 1] Fetching all users...', 'info');
    const users = await getAllUsers();
    log(`Found ${users.length} users`, 'info');

    // Get all projects
    log('\n[Step 2] Fetching all projects...', 'info');
    const projects = await getAllProjects();
    log(`Found ${projects.length} projects`, 'info');

    if (projects.length === 0) {
      log('\nNo projects found. Nothing to do.', 'warn');
      return;
    }

    // Add users to projects
    log('\n[Step 3] Adding users to projects...', 'info');

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const project of projects) {
      log(`\nProcessing project: ${project.name} (${project.id})`, 'info');

      // Get existing members
      const existingMembers = await getProjectMembers(project.id);
      const existingMemberIds = new Set(existingMembers.map(m => m.user_id));

      for (const user of users) {
        // Skip if user is the owner (they already have access)
        if (project.owner_id === user.id) {
          log(`  - ${user.email}: Already owner, skipping`, 'warn');
          skippedCount++;
          continue;
        }

        // Skip if user is already a member
        if (existingMemberIds.has(user.id)) {
          const member = existingMembers.find(m => m.user_id === user.id);
          log(`  - ${user.email}: Already member with role ${member?.role}, skipping`, 'warn');
          skippedCount++;
          continue;
        }

        // Add user as MEMBER
        try {
          await addProjectMember(project.id, user.id, 'MEMBER');
          log(`  ✓ Added ${user.email} as MEMBER`, 'success');
          addedCount++;
        } catch (error: any) {
          log(`  ✗ Error adding ${user.email}: ${error.message}`, 'error');
          errorCount++;
        }
      }
    }

    // Summary
    log('\n╔════════════════════════════════════════════════════════╗', 'success');
    log('║   Fix Completed Successfully! ✓                          ║', 'success');
    log('╚════════════════════════════════════════════════════════╝', 'success');
    log(`\nSummary:`, 'info');
    log(`  - Users added to projects: ${addedCount}`, 'success');
    log(`  - Skipped (already members): ${skippedCount}`, 'warn');
    log(`  - Errors: ${errorCount}`, errorCount > 0 ? 'error' : 'info');
    log('\nAll users can now access all projects!', 'info');

  } catch (error: any) {
    log('\n╔════════════════════════════════════════════════════════╗', 'error');
    log('║   Fix Failed! ✗                                          ║', 'error');
    log('╚════════════════════════════════════════════════════════╝', 'error');
    log(`\nError: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

main();
