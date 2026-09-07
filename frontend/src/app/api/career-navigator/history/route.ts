import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { data, error } = await (supabase as any)
      .from('career_navigator_decisions')
      .select('id, question, intent, recommended_career_name, recommended_career_slug, confidence, why_reasons, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.warn('[CareerNavigator History] Warning:', error.message)
      return NextResponse.json({ success: true, data: [] })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: any) {
    console.error('[CareerNavigator History Error]:', err)
    return NextResponse.json({ success: false, error: err.message, data: [] }, { status: 500 })
  }
}
