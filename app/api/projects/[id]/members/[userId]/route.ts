import { NextRequest, NextResponse } from 'next/server'
import { removeProjectMemberAction, updateMemberRoleAction } from '@/app/actions/project'

// DELETE /api/projects/[id]/members/[userId] - Remove project member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params
    const result = await removeProjectMemberAction(id, userId)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('Unauthorized') ? 403 : 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/members/[userId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params
    const body = await request.json()
    const { role } = body
    
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      )
    }
    
    const result = await updateMemberRoleAction(id, userId, role)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('Unauthorized') ? 403 : 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
