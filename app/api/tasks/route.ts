import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask } from '@/lib/api/tasks';
import { getCurrentUser } from '@/app/actions/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const statusId = searchParams.get('statusId') || undefined;
    const assigneeId = searchParams.get('assigneeId') || undefined;

    const tasks = await getTasks({
      projectId,
      statusId,
      assigneeId,
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
