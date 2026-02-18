import { NextRequest, NextResponse } from 'next/server'
import { getProjectMembersAction, addProjectMemberAction } from '@/app/actions/project'

// GET /api/projects/[id]/members - Get project members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getProjectMembersAction(id)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Access denied' ? 403 : 400 }
      )
    }
    
    return NextResponse.json({ success: true, data: result.data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/members - Add project member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    formData.append('projectId', id)
    
    const result = await addProjectMemberAction(formData)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('Unauthorized') ? 403 : 400 }
      )
    }
    
    return NextResponse.json({ success: true, data: result.data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
