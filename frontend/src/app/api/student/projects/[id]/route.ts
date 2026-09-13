import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.technologies !== undefined) {
      updates.technologies = Array.isArray(body.technologies)
        ? body.technologies
        : typeof body.technologies === 'string'
        ? body.technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
        : []
    }
    if (body.github_url !== undefined) updates.github_url = body.github_url
    if (body.project_url !== undefined) updates.project_url = body.project_url

    await (supabase as any)
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('student_id', user.id)

    return NextResponse.json({ success: true, message: 'Project updated' })
  } catch (err: any) {
    console.error('Error updating student project:', err)
    return NextResponse.json({ success: false, error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await (supabase as any)
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('student_id', user.id)

    return NextResponse.json({ success: true, message: 'Project deleted' })
  } catch (err: any) {
    console.error('Error deleting student project:', err)
    return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 })
  }
}
