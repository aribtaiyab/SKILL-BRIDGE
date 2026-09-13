import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await (supabase as any)
      .from('certifications')
      .delete()
      .eq('id', id)
      .eq('student_id', user.id)

    return NextResponse.json({ success: true, message: 'Certification deleted' })
  } catch (err: any) {
    console.error('Error deleting student certification:', err)
    return NextResponse.json({ success: false, error: 'Failed to delete certification' }, { status: 500 })
  }
}
