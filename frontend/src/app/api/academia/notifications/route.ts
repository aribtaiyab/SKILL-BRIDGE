import { NextRequest, NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function GET() {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { user, adminSupabase } = auth.context

  try {
    const { data: notifications, error } = await (adminSupabase as any)
      .from('notifications')
      .select('id, title, message, type, link, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      console.warn('Notifications fetch error:', error)
      return NextResponse.json({ success: true, data: [] })
    }

    const unreadCount = (notifications || []).filter((n: any) => !n.read).length

    return NextResponse.json({
      success: true,
      data: notifications || [],
      unreadCount,
    })
  } catch (err: any) {
    console.error('Notifications GET error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { user, adminSupabase } = auth.context

  try {
    const body = await req.json().catch(() => ({}))
    const { id, markAllRead } = body

    if (markAllRead) {
      await (adminSupabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (id) {
      await (adminSupabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id)
      return NextResponse.json({ success: true, message: 'Notification marked as read' })
    }

    return NextResponse.json({ success: false, error: 'Notification ID or markAllRead required' }, { status: 400 })
  } catch (err: any) {
    console.error('Notifications PATCH error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
