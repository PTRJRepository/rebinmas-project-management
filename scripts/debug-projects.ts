/**
 * Debug Script: Check Project Duplication
 *
 * Run with: bun run scripts/debug-projects.ts
 */

import 'dotenv/config';
import { sqlGateway } from '../lib/api/sql-gateway';

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
    console.log(`\nAPI Gateway Status: ${health.status}\n`);

    // Get all projects
    console.log('=== ALL PROJECTS ===');
    const projectsResult = await sqlGateway.query(
      'SELECT id, name, owner_id FROM pm_projects ORDER BY created_at DESC'
    );
    console.log(`Total projects: ${projectsResult.recordset.length}\n`);
    
    for (const project of projectsResult.recordset) {
      console.log(`- ${project.name} (${project.id}) - Owner: ${project.owner_id}`);
    }

    // Get all project members
    console.log('\n=== PROJECT MEMBERS ===');
    const membersResult = await sqlGateway.query(
      `SELECT pm.id, pm.project_id, pm.user_id, pm.role, p.name as project_name
       FROM pm_project_members pm
       INNER JOIN pm_projects p ON pm.project_id = p.id
       ORDER BY pm.project_id`
    );
    console.log(`Total member records: ${membersResult.recordset.length}\n`);
    
    // Group by project
    const projectMembersMap = new Map<string, any[]>();
    for (const member of membersResult.recordset) {
      if (!projectMembersMap.has(member.project_id)) {
        projectMembersMap.set(member.project_id, []);
      }
      projectMembersMap.get(member.project_id)!.push(member);
    }

    for (const [projectId, members] of projectMembersMap) {
      const projectName = members[0].project_name;
      console.log(`\nProject: ${projectName} (${projectId})`);
      console.log(`  Members: ${members.length}`);
      for (const m of members) {
        console.log(`    - ${m.user_id} (${m.role})`);
      }
    }

    // Check for specific project "Isnin" or similar
    console.log('\n=== CHECKING "ISNIN" PROJECTS ===');
    const isninProjects = projectsResult.recordset.filter(p => 
      p.name.toLowerCase().includes('isnin') || 
      p.name.toLowerCase().includes('isni')
    );
    console.log(`Found ${isninProjects.length} "Isnin" projects:\n`);
    
    for (const project of isninProjects) {
      const members = projectMembersMap.get(project.id) || [];
      console.log(`- ${project.name} (${project.id})`);
      console.log(`  Owner: ${project.owner_id}`);
      console.log(`  Members: ${members.length}`);
      for (const m of members) {
        console.log(`    - ${m.user_id} (${m.role})`);
      }
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
