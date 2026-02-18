import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/api/projects';
import { getCurrentUser } from '@/app/actions/auth';

/**
 * Projects API Route - Using SQL Server via SQL Gateway API
 *
 * All project operations now use SQL Server database (extend_db_ptrj)
 * via SQL Gateway API instead of local SQLite.
 *
 * SECURITY: Only SERVER_PROFILE_1 and extend_db_ptrj are used for write operations.
 *
 * UPDATED: Authentication DISABLED for public access - All projects visible without login!
 */

export async function GET() {
  try {
    // Get current user for ownership-based filtering
    const session = await getCurrentUser();

    // Pass userId and userRole for ownership-based access control
    // If not authenticated, returns empty array
    const projects = await getProjects(session?.id, session?.role);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const project = await createProject({
      name: body.name,
      description: body.description,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      bannerImage: body.bannerImage,
      priority: body.priority || 'MEDIUM',
      status: body.status || null,
      ownerId: session.id,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
