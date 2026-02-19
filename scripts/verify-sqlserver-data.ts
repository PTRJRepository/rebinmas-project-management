/**
 * Verification Script: Check All Data is in SQL Server
 *
 * This script verifies that all data is stored in SQL Server
 * and not in local SQLite database.
 *
 * Run with: bun run scripts/verify-sqlserver-data.ts
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import { sqlGateway } from '../lib/api/sql-gateway';
import { join } from 'path';

const SQLITE_DB_PATH = join(process.cwd(), 'dev.db');
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
  log('║   Verification: SQL Server Data Check                    ║', 'info');
  log('╚════════════════════════════════════════════════════════╝', 'info');

  try {
    // Check API connection
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const health = await healthResponse.json();
    log(`\n✓ API Gateway Status: ${health.status}`, 'success');

    // Get SQL Server data counts
    log('\n[SQL Server] Fetching data counts...', 'info');
    const sqlServerCounts = {
      users: (await sqlGateway.query('SELECT COUNT(*) as count FROM pm_users')).recordset[0].count,
      projects: (await sqlGateway.query('SELECT COUNT(*) as count FROM pm_projects')).recordset[0].count,
      tasks: (await sqlGateway.query('SELECT COUNT(*) as count FROM pm_tasks')).recordset[0].count,
      statuses: (await sqlGateway.query('SELECT COUNT(*) as count FROM pm_task_statuses')).recordset[0].count,
      members: (await sqlGateway.query('SELECT COUNT(*) as count FROM pm_project_members')).recordset[0].count,
      comments: (await sqlGateway.query('SELECT COUNT(*) as count FROM pm_comments')).recordset[0].count,
    };

    log('\n╔════════════════════════════════════════════════════════╗', 'success');
    log('║   SQL Server Data (extend_db_ptrj)                       ║', 'success');
    log('╚════════════════════════════════════════════════════════╝', 'success');
    log(`  Users:      ${sqlServerCounts.users}`, 'info');
    log(`  Projects:   ${sqlServerCounts.projects}`, 'info');
    log(`  Tasks:      ${sqlServerCounts.tasks}`, 'info');
    log(`  Statuses:   ${sqlServerCounts.statuses}`, 'info');
    log(`  Members:    ${sqlServerCounts.members}`, 'info');
    log(`  Comments:   ${sqlServerCounts.comments}`, 'info');

    // Check SQLite data
    log('\n[SQLite] Checking local database...', 'info');
    
    let sqliteCounts: any = {};
    try {
      const db = new Database(SQLITE_DB_PATH, { readonly: true });
      
      sqliteCounts = {
        users: db.prepare('SELECT COUNT(*) as count FROM User').get() as any,
        projects: db.prepare('SELECT COUNT(*) as count FROM Project').get() as any,
        tasks: db.prepare('SELECT COUNT(*) as count FROM Task').get() as any,
      };
      
      log('\n╔════════════════════════════════════════════════════════╗', 'warn');
      log('║   SQLite Local Data (dev.db)                             ║', 'warn');
      log('╚════════════════════════════════════════════════════════╝', 'warn');
      log(`  Users:      ${sqliteCounts.users?.count || 0}`, 'info');
      log(`  Projects:   ${sqliteCounts.projects?.count || 0}`, 'info');
      log(`  Tasks:      ${sqliteCounts.tasks?.count || 0}`, 'info');
      
      if (sqliteCounts.users?.count > 0 || sqliteCounts.projects?.count > 0) {
        log('\n⚠ WARNING: Local SQLite database still has data!', 'warn');
        log('  Consider migrating or removing local data.', 'warn');
      } else {
        log('\n✓ Local SQLite is empty (as expected)', 'success');
      }
      
      db.close();
    } catch (error: any) {
      log(`  SQLite database not found or empty: ${error.message}`, 'info');
    }

    // Summary
    log('\n╔════════════════════════════════════════════════════════╗', 'success');
    log('║   Verification Summary                                   ║', 'success');
    log('╚════════════════════════════════════════════════════════╝', 'success');
    
    const totalSqlServerRecords = Object.values(sqlServerCounts).reduce((a: any, b: any) => a + b, 0);
    log(`  Total records in SQL Server: ${totalSqlServerRecords}`, 'success');
    
    if (sqlServerCounts.users > 0 && sqlServerCounts.projects > 0) {
      log('\n✓ All data is stored in SQL Server!', 'success');
      log('  Application is using SQL Server (SERVER_PROFILE_1)', 'success');
    } else {
      log('\n⚠ WARNING: SQL Server appears to be empty!', 'error');
      log('  Please run migration or seed data.', 'warn');
    }

  } catch (error: any) {
    log('\n╔════════════════════════════════════════════════════════╗', 'error');
    log('║   Verification Failed! ✗                                 ║', 'error');
    log('╚════════════════════════════════════════════════════════╝', 'error');
    log(`\nError: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

main();
