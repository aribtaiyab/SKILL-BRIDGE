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

  const { id: mentorshipId } = await params
  const { user, adminSupabase } = auth.context

  try {
    const body = await req.json()
    const { status, notes, endDate } = body

    const updates: Record<string, any> = {}
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (endDate !== undefined) updates.end_date = endDate

    const { data: updated, error } = await (adminSupabase as any)
      .from('mentorships')
      .update(updates)
      .eq('id', mentorshipId)
      .eq('academician_id', user.id)
      .select()
      .single()

    if (error || !updated) {
      return NextResponse.json({ success: false, error: 'Could not update mentorship or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (err: any) {
    console.error('Mentorship PATCH error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
