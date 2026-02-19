/**
 * Cleanup Script: Remove Duplicate "Projek isnin" Projects
 *
 * This script removes duplicate "Projek isnin" projects, keeping only one.
 *
 * Run with: bun run scripts/cleanup-duplicate-isnin-projects.ts
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

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'info');
  log('║   Cleanup: Remove Duplicate "Projek isnin" Projects      ║', 'info');
  log('╚════════════════════════════════════════════════════════╝', 'info');

  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const health = await healthResponse.json();
    log(`\nAPI Gateway Status: ${health.status}`, 'success');

    // Get all "Projek isnin" projects
    log('\n[Step 1] Finding "Projek isnin" projects...', 'info');
    const projectsResult = await sqlGateway.query(
      `SELECT id, name, owner_id, created_at 
       FROM pm_projects 
       WHERE LOWER(name) LIKE '%projek isnin%' 
       ORDER BY created_at ASC`
    );
    
    const isninProjects = projectsResult.recordset;
    log(`Found ${isninProjects.length} "Projek isnin" projects`, 'warn');

    if (isninProjects.length === 0) {
      log('\nNo duplicate "Projek isnin" projects found.', 'info');
      return;
    }

    // Keep the first one (oldest), delete the rest
    const projectToKeep = isninProjects[0];
    const projectsToDelete = isninProjects.slice(1);

    log(`\n[Step 2] Planning cleanup:`, 'info');
    log(`  ✓ Keep: ${projectToKeep.name} (${projectToKeep.id})`, 'success');
    log(`  ✗ Delete: ${projectsToDelete.length} duplicate(s)`, 'warn');

    log('\n[Step 3] Deleting duplicate projects...', 'info');

    let deletedCount = 0;
    let errorCount = 0;

    for (const project of projectsToDelete) {
      try {
        // Delete in order: attachments -> comments -> tasks -> task_statuses -> project_members -> project
        log(`\n  Deleting project: ${project.name} (${project.id})`, 'info');

        // Delete attachments (via tasks)
        const tasksResult = await sqlGateway.query(
          'SELECT id FROM pm_tasks WHERE project_id = @projectId',
          { projectId: project.id }
        );
        
        for (const task of tasksResult.recordset) {
          await sqlGateway.query('DELETE FROM pm_attachments WHERE task_id = @taskId', { taskId: task.id });
          await sqlGateway.query('DELETE FROM pm_comments WHERE task_id = @taskId', { taskId: task.id });
        }

        // Delete tasks
        await sqlGateway.query('DELETE FROM pm_tasks WHERE project_id = @projectId', { projectId: project.id });

        // Delete task statuses
        await sqlGateway.query('DELETE FROM pm_task_statuses WHERE project_id = @projectId', { projectId: project.id });

        // Delete project members
        await sqlGateway.query('DELETE FROM pm_project_members WHERE project_id = @projectId', { projectId: project.id });

        // Delete the project
        await sqlGateway.query('DELETE FROM pm_projects WHERE id = @id', { id: project.id });

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
    log(`  - Project kept: ${projectToKeep.name} (${projectToKeep.id})`, 'success');
    log(`  - Projects deleted: ${deletedCount}`, deletedCount > 0 ? 'success' : 'info');
    log(`  - Errors: ${errorCount}`, errorCount > 0 ? 'error' : 'info');

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
