import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface DeclaredSkillItem {
  skillId?: string
  skill_id?: string
  familiarityLevel?: string | number
  familiarity_level?: string | number
  selfDeclaredLevel?: number
  self_declared_level?: number
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const targetCareerId = body.career_target_id || body.careerTargetId
    const rawSkills = body.declared_skills || body.declaredSkills || []

    if (!Array.isArray(rawSkills) || rawSkills.length === 0) {
      return NextResponse.json({ success: false, error: 'declaredSkills array is required' }, { status: 400 })
    }

    // Optionally update target_career_id in student_profiles
    if (targetCareerId) {
      await (supabase as any)
        .from('student_profiles')
        .update({ target_career_id: targetCareerId, updated_at: new Date().toISOString() })
        .eq('profile_id', user.id)
    }

    // Fetch existing skills to avoid downgrading verified levels
    const { data: existingSkills } = await (supabase as any)
      .from('student_skills')
      .select('skill_id, verification_status, verified_level, current_level')
      .eq('student_id', user.id)

    const existingMap = new Map<string, any>()
    if (existingSkills) {
      existingSkills.forEach((s: any) => existingMap.set(s.skill_id, s))
    }

    const upsertRows = []

    for (const item of rawSkills as DeclaredSkillItem[]) {
      const skillId = item.skillId || item.skill_id
      if (!skillId) continue

      const existing = existingMap.get(skillId)
      const declaredLevel = Math.max(0, Math.min(100, Number(item.selfDeclaredLevel ?? item.self_declared_level ?? item.familiarityLevel ?? item.familiarity_level) || 50))

      if (existing && existing.verification_status && existing.verification_status !== 'self_declared') {
        // Keep verified level and status, only update self_declared_level
        upsertRows.push({
          student_id: user.id,
          skill_id: skillId,
          self_declared_level: declaredLevel,
          current_level: existing.current_level,
          verified_level: existing.verified_level,
          verification_status: existing.verification_status,
          updated_at: new Date().toISOString(),
        })
      } else {
        // Self-declared skills receive verified_level = 0
        upsertRows.push({
          student_id: user.id,
          skill_id: skillId,
          self_declared_level: declaredLevel,
          current_level: declaredLevel,
          verified_level: 0,
          verification_status: 'self_declared',
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (upsertRows.length > 0) {
      const { error: upsertErr } = await (supabase as any)
        .from('student_skills')
        .upsert(upsertRows, { onConflict: 'student_id,skill_id' })

      if (upsertErr) {
        console.error('Error saving declared skills to database:', upsertErr)
        throw new Error('Failed to record self-declared skills')
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        declaredCount: upsertRows.length,
        message: 'Skills self-declared successfully. SkillBridge will assess them instead of trusting self-declaration.',
      },
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Error recording declared skills',
    }, { status: 500 })
  }
}
