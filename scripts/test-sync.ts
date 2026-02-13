/**
 * Test Sync Script
 * 
 * This script tests the sync functionality from SQLite to SQL Server.
 * Run with: npx ts-node scripts/test-sync.ts
 */

import { config } from 'dotenv';
config({ path: '.env' });

import { prisma } from '../lib/prisma';
import { sqlGateway } from '../lib/api/sql-gateway';

async function testConnection() {
    console.log('\n📡 Testing connections...\n');

    // Test SQLite connection
    try {
        const userCount = await prisma.user.count();
        const projectCount = await prisma.project.count();
        const taskCount = await prisma.task.count();
        const statusCount = await prisma.taskStatus.count();

        console.log('✅ SQLite Connection: OK');
        console.log(`   - Users: ${userCount}`);
        console.log(`   - Projects: ${projectCount}`);
        console.log(`   - Tasks: ${taskCount}`);
        console.log(`   - Task Statuses: ${statusCount}`);
    } catch (error: any) {
        console.log('❌ SQLite Connection: FAILED');
        console.log(`   Error: ${error.message}`);
    }

    // Test SQL Server connection
    try {
        const healthCheck = await sqlGateway.healthCheck();
        if (healthCheck) {
            const usersResult = await sqlGateway.query('SELECT COUNT(*) as count FROM pm_users');
            const projectsResult = await sqlGateway.query('SELECT COUNT(*) as count FROM pm_projects');
            const tasksResult = await sqlGateway.query('SELECT COUNT(*) as count FROM pm_tasks');
            const statusesResult = await sqlGateway.query('SELECT COUNT(*) as count FROM pm_task_statuses');

            console.log('\n✅ SQL Server Connection: OK');
            console.log(`   - Users: ${usersResult.recordset[0].count}`);
            console.log(`   - Projects: ${projectsResult.recordset[0].count}`);
            console.log(`   - Tasks: ${tasksResult.recordset[0].count}`);
            console.log(`   - Task Statuses: ${statusesResult.recordset[0].count}`);
        } else {
            console.log('\n❌ SQL Server Connection: FAILED (health check failed)');
        }
    } catch (error: any) {
        console.log('\n❌ SQL Server Connection: FAILED');
        console.log(`   Error: ${error.message}`);
    }
}

async function compareData() {
    console.log('\n📊 Comparing data between SQLite and SQL Server...\n');

    try {
        // Get SQLite data
        const sqliteProjects = await prisma.project.findMany({
            include: { _count: { select: { tasks: true } } }
        });

        // Get SQL Server data
        const sqlServerProjects = await sqlGateway.query(`
      SELECT p.id, p.name, p.status, p.owner_id, COUNT(t.id) as task_count
      FROM pm_projects p
      LEFT JOIN pm_tasks t ON p.id = t.project_id
      GROUP BY p.id, p.name, p.status, p.owner_id
    `);

        console.log('Projects comparison:');
        console.log('─'.repeat(80));

        // Create a map of SQL Server projects
        const sqlProjectsMap = new Map(
            sqlServerProjects.recordset.map((p: any) => [p.id, p])
        );

        for (const sqliteProject of sqliteProjects) {
            const sqlProject = sqlProjectsMap.get(sqliteProject.id);

            if (!sqlProject) {
                console.log(`\n❌ Project "${sqliteProject.name}" (${sqliteProject.id})`);
                console.log(`   SQLite: EXISTS (${sqliteProject._count.tasks} tasks)`);
                console.log(`   SQL Server: NOT FOUND - NEEDS SYNC`);
            } else {
                const match = sqliteProject.name === sqlProject.name &&
                    sqliteProject.status === sqlProject.status &&
                    sqliteProject._count.tasks === sqlProject.task_count;

                if (match) {
                    console.log(`\n✅ Project "${sqliteProject.name}" (${sqliteProject.id})`);
                    console.log(`   Both databases match`);
                } else {
                    console.log(`\n⚠️  Project "${sqliteProject.name}" (${sqliteProject.id})`);
                    console.log(`   SQLite: status=${sqliteProject.status}, tasks=${sqliteProject._count.tasks}`);
                    console.log(`   SQL Server: status=${sqlProject.status}, tasks=${sqlProject.task_count}`);
                    console.log(`   NEEDS SYNC`);
                }
            }
        }

        // Check for projects in SQL Server but not in SQLite
        for (const sqlProject of sqlServerProjects.recordset) {
            if (!sqliteProjects.find(p => p.id === sqlProject.id)) {
                console.log(`\nℹ️  Project "${sqlProject.name}" (${sqlProject.id})`);
                console.log(`   SQLite: NOT FOUND`);
                console.log(`   SQL Server: EXISTS (${sqlProject.task_count} tasks)`);
                console.log(`   This project exists only in SQL Server`);
            }
        }

    } catch (error: any) {
        console.log(`Error comparing data: ${error.message}`);
    }
}

async function runDryRunSync() {
    console.log('\n🔄 Running DRY RUN sync (no changes will be made)...\n');

    try {
        const { syncData } = await import('../lib/sync/sql-sync');
        const result = await syncData({ dryRun: true });

        console.log('\nDry Run Results:');
        console.log('─'.repeat(80));

        for (const table of result.tables) {
            console.log(`\n${table.name}:`);
            console.log(`   Would insert: ${table.inserted}`);
            console.log(`   Would update: ${table.updated}`);
            console.log(`   Would skip: ${table.skipped}`);
            if (table.errors > 0) {
                console.log(`   Errors: ${table.errors}`);
            }
        }

        console.log('\n' + '─'.repeat(80));
        console.log(`Success: ${result.success}`);
        if (result.errors.length > 0) {
            console.log('Errors:', result.errors);
        }

    } catch (error: any) {
        console.log(`Error running dry run: ${error.message}`);
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       SQLite to SQL Server Sync Test Utility               ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    await testConnection();
    await compareData();
    await runDryRunSync();

    console.log('\n✨ Test complete!\n');

    process.exit(0);
}

main().catch(console.error);
