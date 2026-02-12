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
import { syncData, pushToServer, pullFromServer } from '@/lib/sync/sql-sync';
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
    const { direction = 'both', tables = ['users', 'projects', 'tasks', 'statuses', 'comments'] } = body;

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
    const validTables = ['users', 'projects', 'tasks', 'statuses', 'comments'];
    const invalidTables = tables.filter((t: string) => !validTables.includes(t));
    if (invalidTables.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid tables: ${invalidTables.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Perform sync
    let result;
    switch (direction) {
      case 'push':
        result = await pushToServer();
        break;
      case 'pull':
        result = await pullFromServer();
        break;
      case 'both':
        result = await syncData({ direction: 'both', tables });
        break;
    }

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Sync operation returned no result',
      });
    }

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Sync failed',
      },
      { status: 500 }
    );
  }
}
