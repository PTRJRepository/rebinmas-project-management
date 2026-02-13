/**
 * API Route for syncing data between local SQLite and SQL Server
 *
 * IMPORTANT SECURITY RESTRICTIONS:
 * - ONLY uses SERVER_PROFILE_1
 * - ONLY writes to extend_db_ptrj database
 * - Other databases are READ-ONLY
 *
 * Methods:
 * - GET: Get sync status
 * - POST: Trigger sync operation
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncData, pullFromServer, pushToServer, fullSync } from '@/lib/sync/sql-sync';
import { sqlGateway } from '@/lib/api/sql-gateway';

export async function GET(request: NextRequest) {
  try {
    // Check connection to SQL Gateway
    const isConnected = await sqlGateway.healthCheck();

    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot connect to SQL Gateway API',
        },
        { status: 503 }
      );
    }

    // Get available servers
    const servers = await sqlGateway.getServers();
    const serverProfile1 = servers.find((s: any) => s.name === 'SERVER_PROFILE_1');

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        server: {
          name: 'SERVER_PROFILE_1',
          host: serverProfile1?.host || '10.0.0.110',
          port: serverProfile1?.port || 1433,
          readOnly: false,
        },
        database: {
          name: 'extend_db_ptrj',
          access: 'READ_WRITE',
        },
        restrictions: [
          'ONLY SERVER_PROFILE_1 is allowed for write operations',
          'ONLY extend_db_ptrj database is allowed for write operations',
          'Other databases (db_ptrj, etc.) are READ-ONLY',
        ],
        syncDirections: {
          pull: 'SQL Server -> SQLite (download data from server)',
          push: 'SQLite -> SQL Server (upload local changes)',
          both: 'Bidirectional sync',
        },
        usage: {
          endpoint: 'POST /api/sync',
          options: {
            direction: 'Sync direction: pull (default), push, or both',
            tables: 'Array of tables to sync: users, projects, tasks, statuses, comments, attachments',
            dryRun: 'Set to true to preview changes without applying them',
          },
          examples: [
            { description: 'Pull all data from SQL Server', body: {} },
            { description: 'Push local changes to SQL Server', body: { direction: 'push' } },
            { description: 'Bidirectional sync', body: { direction: 'both' } },
            { description: 'Pull only projects', body: { tables: ['projects'] } },
            { description: 'Dry run (preview)', body: { dryRun: true } },
          ],
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get sync status',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      direction = 'pull',
      tables = ['users', 'projects', 'tasks', 'statuses', 'comments', 'attachments'],
      dryRun = false
    } = body;

    // Validate direction
    if (!['push', 'pull', 'both'].includes(direction)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid direction. Must be "push", "pull", or "both"',
        },
        { status: 400 }
      );
    }

    // Validate tables
    const validTables = ['users', 'projects', 'tasks', 'statuses', 'comments', 'attachments'];
    const invalidTables = tables.filter((t: string) => !validTables.includes(t));
    if (invalidTables.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid tables: ${invalidTables.join(', ')}. Valid tables are: ${validTables.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Perform sync
    const result = await syncData({ direction, tables, dryRun });

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Sync operation returned no result',
      });
    }

    // Format response for better readability
    const summary = {
      totalInserted: result.tables.reduce((sum, t) => sum + t.inserted, 0),
      totalUpdated: result.tables.reduce((sum, t) => sum + t.updated, 0),
      totalSkipped: result.tables.reduce((sum, t) => sum + t.skipped, 0),
      totalErrors: result.tables.reduce((sum, t) => sum + t.errors, 0),
    };

    return NextResponse.json({
      success: result.success,
      direction: result.direction,
      dryRun,
      timestamp: result.timestamp,
      summary,
      details: result.tables,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Sync failed',
      },
      { status: 500 }
    );
  }
}
