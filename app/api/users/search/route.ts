import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/auth';
import { sqlGateway } from '@/lib/api/sql-gateway';

/**
 * GET /api/users/search?q=query
 *
 * Search for users by email or username.
 * Used for adding members to projects.
 *
 * Query parameters:
 * - q: Search query (email or username)
 * - limit: Maximum number of results (default: 10)
 *
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    // Search users by email or username
    const result = await sqlGateway.query(
      `SELECT TOP (@limit)
        id, username, email, name, avatar_url, role
       FROM pm_users
       WHERE username LIKE @query
          OR email LIKE @query
          OR name LIKE @query
       ORDER BY
         CASE WHEN email = @exactQuery THEN 1 ELSE 2 END,
         username`,
      {
        query: `%${query.trim()}%`,
        exactQuery: query.trim(),
        limit: Math.min(limit, 50), // Cap at 50 results
      }
    );

    const users = result.recordset.map((row: any) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatar_url,
      role: row.role,
    }));

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
