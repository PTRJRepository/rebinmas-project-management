import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, getProjectWithTasks, updateProject, deleteProject } from '@/lib/api/projects';
import { getCurrentUser } from '@/app/actions/auth';
import { checkProjectAccess } from '@/lib/api/project-members';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check project access using ownership-based access control
    const access = await checkProjectAccess(id, session.id);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Forbidden', reason: access.reason }, { status: 403 });
    }

    // Use getProjectWithTasks to include statuses and tasks
    const project = await getProjectWithTasks(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check project access - require OWNER role to edit
    const access = await checkProjectAccess(id, session.id, 'OWNER');
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Forbidden', reason: access.reason }, { status: 403 });
    }

    const existingProject = await getProjectById(id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Convert date strings to Date objects
    const updateData: any = {
      name: body.name,
      description: body.description,
      bannerImage: body.bannerImage,
      priority: body.priority || 'MEDIUM',
    };

    if (body.startDate) {
      updateData.startDate = new Date(body.startDate);
    }

    if (body.endDate) {
      updateData.endDate = new Date(body.endDate);
    }

    // Handle status field (null = auto by date)
    if (body.status !== undefined) {
      updateData.status = body.status || null;
    }

    const project = await updateProject(id, updateData);
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check project access - require OWNER role to delete
    const access = await checkProjectAccess(id, session.id, 'OWNER');
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Forbidden', reason: access.reason }, { status: 403 });
    }

    const existingProject = await getProjectById(id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
