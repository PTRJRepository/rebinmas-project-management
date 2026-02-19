import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/auth';
import { sqlGateway } from '@/lib/api/sql-gateway';

// GET canvas data from database
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

    const projectResult = await sqlGateway.query(
      'SELECT id, owner_id, canvas_data FROM pm_projects WHERE id = @id',
      { id }
    );

    if (projectResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectResult.recordset[0];

    // Security check: user can only access their own projects or if they're a member
    const memberResult = await sqlGateway.query(
      'SELECT role FROM pm_project_members WHERE project_id = @projectId AND user_id = @userId',
      { projectId: id, userId: session.id }
    );

    if (project.owner_id !== session.id && memberResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse canvas_data from DB
    if (project.canvas_data) {
      try {
        const canvasData = JSON.parse(project.canvas_data);
        return NextResponse.json(canvasData);
      } catch (e) {
        console.error('Error parsing canvas_data:', e);
      }
    }

    // No saved data
    return NextResponse.json({ elements: [], appState: {} });
  } catch (error) {
    console.error('Error fetching canvas:', error);
    return NextResponse.json({ error: 'Failed to fetch canvas' }, { status: 500 });
  }
}

// POST canvas data to database
export async function POST(
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

    // Verify project access (owner or member)
    const projectResult = await sqlGateway.query(
      'SELECT owner_id FROM pm_projects WHERE id = @id',
      { id }
    );

    if (projectResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectResult.recordset[0];

    const memberResult = await sqlGateway.query(
      'SELECT role FROM pm_project_members WHERE project_id = @projectId AND user_id = @userId',
      { projectId: id, userId: session.id }
    );

    if (project.owner_id !== session.id && memberResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Save canvas data to database
    const canvasJson = JSON.stringify({
      elements: body.elements || [],
      appState: body.appState || {},
    });

    await sqlGateway.query(
      'UPDATE pm_projects SET canvas_data = @canvasData WHERE id = @id',
      { canvasData: canvasJson, id }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving canvas:', error);
    return NextResponse.json({ error: 'Failed to save canvas' }, { status: 500 });
  }
}
