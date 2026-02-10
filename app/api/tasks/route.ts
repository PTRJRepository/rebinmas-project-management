import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask } from '@/lib/api/tasks';
import { getProjectById } from '@/lib/api/projects';
import { getCurrentUser } from '@/app/actions/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const statusId = searchParams.get('statusId') || undefined;
    const assigneeId = searchParams.get('assigneeId') || undefined;

    // Only fetch tasks from projects owned by the current user
    const tasks = await getTasks({
      projectId,
      statusId,
      assigneeId,
      userId: session.id, // Filter by user's projects
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Security check: verify user owns the project
    const project = await getProjectById(body.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    if (project.ownerId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const task = await createTask({
      title: body.title,
      description: body.description,
      priority: body.priority || 'MEDIUM',
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      estimatedHours: body.estimatedHours,
      projectId: body.projectId,
      statusId: body.statusId,
      assigneeId: body.assigneeId || session.id,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
