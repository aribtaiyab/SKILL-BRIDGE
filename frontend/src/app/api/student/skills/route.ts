import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await (supabase as any)
        .from('student_skills')
        .select('*, skills(id, name, slug, category, description)')
        .eq('student_id', user.id)

      if (!error && data) {
        return NextResponse.json({ success: true, data })
      }
    }
  } catch (err) {
    console.warn('Database error querying student_skills:', err)
  }

  // If user is unauthenticated or has no skills recorded yet, return empty list
  return NextResponse.json({ success: true, data: [] })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { skill_id, self_declared_level = 50 } = body

    if (!skill_id) {
      return NextResponse.json({ success: false, error: 'skill_id is required' }, { status: 400 })
    }

    const declaredLevel = Math.max(0, Math.min(100, Number(self_declared_level) || 50))

    // Check existing verification status to prevent accidental downgrade
    const { data: existing } = await (supabase as any)
      .from('student_skills')
      .select('verification_status, verified_level, current_level')
      .eq('student_id', user.id)
      .eq('skill_id', skill_id)
      .maybeSingle()

    const status = existing && existing.verification_status !== 'self_declared'
      ? existing.verification_status
      : 'self_declared'

    const verified = existing ? existing.verified_level : 0
    const current = existing && existing.verification_status !== 'self_declared'
      ? existing.current_level
      : declaredLevel

    const { data: saved, error } = await (supabase as any)
      .from('student_skills')
      .upsert({
        student_id: user.id,
        skill_id,
        self_declared_level: declaredLevel,
        current_level: current,
        verified_level: verified,
        verification_status: status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,skill_id' })
      .select('*, skills(id, name, category)')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: saved || {
        skill_id,
        current_level: current,
        verified_level: verified,
        verification_status: status,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to save skill' }, { status: 500 })
  }
}
