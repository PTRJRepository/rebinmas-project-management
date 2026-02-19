/**
 * Cleanup Script: Remove Non-Owner Members
 *
 * This script removes all project members that were added by the fix script,
 * keeping only the project owners.
 *
 * Run with: bun run scripts/cleanup-project-members.ts
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
  log('║   Cleanup: Remove Non-Owner Project Members              ║', 'info');
  log('╚════════════════════════════════════════════════════════╝', 'info');

  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const health = await healthResponse.json();
    log(`\nAPI Gateway Status: ${health.status}`, 'success');

    // Get all projects with their owners
    const projectsResult = await sqlGateway.query(
      'SELECT id, owner_id FROM pm_projects'
    );
    const projects = projectsResult.recordset;
    log(`\nFound ${projects.length} projects`, 'info');

    let removedCount = 0;
    let keptCount = 0;

    for (const project of projects) {
      // Get all members for this project
      const membersResult = await sqlGateway.query(
        'SELECT id, user_id, role FROM pm_project_members WHERE project_id = @projectId',
        { projectId: project.id }
      );
      const members = membersResult.recordset;

      for (const member of members) {
        if (member.user_id === project.owner_id) {
          // Keep owner
          keptCount++;
          log(`  ✓ Keeping owner for project ${project.id}`, 'info');
        } else {
          // Remove non-owner member
          await sqlGateway.query(
            'DELETE FROM pm_project_members WHERE id = @id',
            { id: member.id }
          );
          removedCount++;
          log(`  ✗ Removed member ${member.user_id} from project ${project.id}`, 'warn');
        }
      }
    }

    log('\n╔════════════════════════════════════════════════════════╗', 'success');
    log('║   Cleanup Completed Successfully! ✓                      ║', 'success');
    log('╚════════════════════════════════════════════════════════╝', 'success');
    log(`\nSummary:`, 'info');
    log(`  - Owner records kept: ${keptCount}`, 'success');
    log(`  - Non-owner members removed: ${removedCount}`, 'warn');
    log('\nProject members cleaned up!', 'info');

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
