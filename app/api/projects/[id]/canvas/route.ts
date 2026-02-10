import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/auth';
import { prisma } from '@/lib/prisma';

// GET canvas data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, ownerId: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check localStorage first
    const localStorageKey = `canvas-${id}`;
    const localData = typeof window !== 'undefined'
      ? localStorage.getItem(localStorageKey)
      : null;

    if (localData) {
      return NextResponse.json(JSON.parse(localData));
    }

    return NextResponse.json({ elements: [], appState: {} });
  } catch (error) {
    console.error('Error fetching canvas:', error);
    return NextResponse.json({ error: 'Failed to fetch canvas' }, { status: 500 });
  }
}

// POST canvas data
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

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project || project.ownerId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Store canvas data in the description as a JSON metadata
    // or create a separate canvas data table
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        // Store canvas metadata in description (append if exists)
        description: project.description
          ? project.description + '\n\n[CANVAS_DATA:' + JSON.stringify({
              elements: body.elements,
              appState: body.appState,
              updatedAt: body.updatedAt
            }) + ']'
          : '[CANVAS_DATA:' + JSON.stringify({
              elements: body.elements,
              appState: body.appState,
              updatedAt: body.updatedAt
            }) + ']'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving canvas:', error);
    return NextResponse.json({ error: 'Failed to save canvas' }, { status: 500 });
  }
}
