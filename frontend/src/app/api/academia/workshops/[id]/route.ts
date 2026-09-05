import { NextRequest, NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { id: workshopId } = await params
  const { user, adminSupabase } = auth.context

  try {
    const body = await req.json()
    const { title, description, date, duration, capacity, status } = body

    const updates: Record<string, any> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (date !== undefined) updates.date = new Date(date).toISOString()
    if (duration !== undefined) updates.duration = duration
    if (capacity !== undefined) updates.capacity = Number(capacity)
    if (status !== undefined) updates.status = status

    const { data: updated, error } = await (adminSupabase as any)
      .from('workshops')
      .update(updates)
      .eq('id', workshopId)
      .eq('academician_id', user.id)
      .select()
      .single()

    if (error || !updated) {
      return NextResponse.json({ success: false, error: 'Could not update workshop or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (err: any) {
    console.error('Workshop PATCH error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { id: workshopId } = await params
  const { user, adminSupabase } = auth.context

  try {
    const { error } = await (adminSupabase as any)
      .from('workshops')
      .delete()
      .eq('id', workshopId)
      .eq('academician_id', user.id)

    if (error) {
      return NextResponse.json({ success: false, error: 'Could not delete workshop' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Workshop deleted' })
  } catch (err: any) {
    console.error('Workshop DELETE error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
