import { NextRequest, NextResponse } from 'next/server';
import { getStatuses, createStatus } from '@/lib/api/statuses';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    
    const statuses = await getStatuses(projectId);
    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json({ error: 'Failed to fetch statuses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const status = await createStatus({
      name: body.name,
      order: body.order,
      projectId: body.projectId,
    });
    
    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    console.error('Error creating status:', error);
    return NextResponse.json({ error: 'Failed to create status' }, { status: 500 });
  }
}
