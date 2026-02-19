/**
 * Cleanup Script: Remove All Duplicate Projects by Name
 *
 * This script finds and removes duplicate projects with the same name,
 * keeping only the oldest one for each unique name.
 *
 * Run with: bun run scripts/cleanup-all-duplicate-projects.ts
 */

import 'dotenv/config';
import { sqlGateway } from '../lib/api/sql-gateway';

const API_BASE_URL = process.env.API_QUERY_URL || 'http://10.0.0.110:8001';
const API_TOKEN = process.env.API_TOKEN;

if (!API_TOKEN) {
  console.error('ERROR: API_TOKEN is not set');
  process.exit(1);
}

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

async function deleteProject(projectId: string, projectName: string): Promise<void> {
  // Delete attachments (via tasks)
  const tasksResult = await sqlGateway.query(
    'SELECT id FROM pm_tasks WHERE project_id = @projectId',
    { projectId }
  );
  
  for (const task of tasksResult.recordset) {
    await sqlGateway.query('DELETE FROM pm_attachments WHERE task_id = @taskId', { taskId: task.id });
    await sqlGateway.query('DELETE FROM pm_comments WHERE task_id = @taskId', { taskId: task.id });
  }

  // Delete tasks
  await sqlGateway.query('DELETE FROM pm_tasks WHERE project_id = @projectId', { projectId });

  // Delete task statuses
  await sqlGateway.query('DELETE FROM pm_task_statuses WHERE project_id = @projectId', { projectId });

  // Delete project members
  await sqlGateway.query('DELETE FROM pm_project_members WHERE project_id = @projectId', { projectId });

  // Delete the project
  await sqlGateway.query('DELETE FROM pm_projects WHERE id = @id', { id: projectId });
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'info');
  log('║   Cleanup: Remove All Duplicate Projects by Name         ║', 'info');
  log('╚════════════════════════════════════════════════════════╝', 'info');

  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const health = await healthResponse.json();
    log(`\nAPI Gateway Status: ${health.status}`, 'success');

    // Get all projects
    log('\n[Step 1] Finding all projects...', 'info');
    const projectsResult = await sqlGateway.query(
      'SELECT id, name, owner_id, created_at FROM pm_projects ORDER BY name, created_at ASC'
    );
    
    const allProjects = projectsResult.recordset;
    log(`Found ${allProjects.length} total projects`, 'info');

    // Group by name (case-insensitive)
    const projectsByName = new Map<string, any[]>();
    for (const project of allProjects) {
      const normalizedName = project.name.toLowerCase().trim();
      if (!projectsByName.has(normalizedName)) {
        projectsByName.set(normalizedName, []);
      }
      projectsByName.get(normalizedName)!.push(project);
    }

    // Find duplicates
    log('\n[Step 2] Finding duplicates...', 'info');
    const duplicates: any[] = [];
    const toKeep: any[] = [];

    for (const [name, projects] of projectsByName) {
      if (projects.length > 1) {
        log(`\n  Found duplicate: "${projects[0].name}" (${projects.length} projects)`, 'warn');
        // Keep the oldest (first)
        toKeep.push(projects[0]);
        log(`    ✓ Keep: ${projects[0].name} (${projects[0].id}) - Created: ${projects[0].created_at}`, 'success');
        // Mark rest for deletion
        for (let i = 1; i < projects.length; i++) {
          duplicates.push(projects[i]);
          log(`    ✗ Delete: ${projects[i].name} (${projects[i].id}) - Created: ${projects[i].created_at}`, 'warn');
        }
      }
    }

    if (duplicates.length === 0) {
      log('\nNo duplicate projects found.', 'info');
      return;
    }

    log(`\n[Step 3] Deleting ${duplicates.length} duplicate project(s)...`, 'warn');

    let deletedCount = 0;
    let errorCount = 0;

    for (const project of duplicates) {
      try {
        log(`\n  Deleting: ${project.name} (${project.id})`, 'info');
        await deleteProject(project.id, project.name);
        log(`    ✓ Deleted successfully`, 'success');
        deletedCount++;
      } catch (error: any) {
        log(`    ✗ Error: ${error.message}`, 'error');
        errorCount++;
      }
    }

    // Summary
    log('\n╔════════════════════════════════════════════════════════╗', 'success');
    log('║   Cleanup Completed Successfully! ✓                      ║', 'success');
    log('╚════════════════════════════════════════════════════════╝', 'success');
    log(`\nSummary:`, 'info');
    log(`  - Unique projects kept: ${toKeep.length}`, 'success');
    log(`  - Duplicates deleted: ${deletedCount}`, deletedCount > 0 ? 'success' : 'info');
    log(`  - Errors: ${errorCount}`, errorCount > 0 ? 'error' : 'info');
    log(`  - Remaining total: ${allProjects.length - deletedCount}`, 'info');

  } catch (error: any) {
    log('\n╔════════════════════════════════════════════════════════╗', 'error');
    log('║   Cleanup Failed! ✗                                      ║', 'error');
    log('╚════════════════════════════════════════════════════════╝', 'error');
    log(`\nError: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

main();
