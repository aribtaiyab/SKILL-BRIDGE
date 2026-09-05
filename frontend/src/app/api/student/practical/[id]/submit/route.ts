import { NextRequest, NextResponse } from 'next/server'
import { LEVEL_2_PRACTICAL_CHALLENGES } from '@/lib/assessments-seed'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizeScore } from '@/lib/intelligence/engine'

const SKILL_NAME_TO_UUID: Record<string, string> = {
  'node.js & express': '40000000-0000-0000-0000-000000000001',
  'postgresql / sql': '40000000-0000-0000-0000-000000000003',
  'algorithm & backend logic': '40000000-0000-0000-0000-000000000002',
  'react': '40000000-0000-0000-0000-000000000006',
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { submission = "" } = body

    const challenge =
      LEVEL_2_PRACTICAL_CHALLENGES.find(c => c.id === id) ||
      LEVEL_2_PRACTICAL_CHALLENGES[0]

    const testResult = challenge.testCheck(submission)
    const score = normalizeScore(testResult.score)
    const passed = testResult.passed

    const skillKey = challenge.skill.toLowerCase().trim()
    let canonicalSkillId = SKILL_NAME_TO_UUID[skillKey] || '40000000-0000-0000-0000-000000000001'

    let previousScore: number | null = null

    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Query skill ID if possible
        const { data: dbSkill } = await (supabase as any)
          .from('skills')
          .select('id')
          .ilike('name', `%${challenge.skill.split(' ')[0]}%`)
          .maybeSingle()

        if (dbSkill?.id) {
          canonicalSkillId = dbSkill.id
        }

        // Fetch prior score
        const { data: existingSkill } = await (supabase as any)
          .from('student_skills')
          .select('current_level')
          .eq('student_id', user.id)
          .eq('skill_id', canonicalSkillId)
          .maybeSingle()

        if (existingSkill) {
          previousScore = existingSkill.current_level
        }

        if (passed) {
          // 1. Elevate student_skills to practical_verified
          await (supabase as any)
            .from('student_skills')
            .upsert({
              student_id: user.id,
              skill_id: canonicalSkillId,
              current_level: score,
              verified_level: score,
              verification_status: 'practical_verified',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'student_id,skill_id' })

          // 2. Insert into skill_scores
          await (supabase as any)
            .from('skill_scores')
            .insert({
              student_id: user.id,
              skill_id: canonicalSkillId,
              score,
              source: 'practical',
              recorded_at: new Date().toISOString(),
            })

          // 3. Record verification record
          await (supabase as any)
            .from('verification_records')
            .insert({
              student_id: user.id,
              skill_id: canonicalSkillId,
              verification_type: 'practical',
              verified_level: score,
              verification_source: 'SkillBridge Practical Challenge',
              notes: `Completed practical challenge: ${challenge.title}`,
              verified_at: new Date().toISOString(),
            })

          // 4. Record in reassessments if prior score existed
          if (previousScore !== null) {
            await (supabase as any)
              .from('reassessments')
              .insert({
                student_id: user.id,
                skill_id: canonicalSkillId,
                previous_score: previousScore,
                new_score: score,
                recorded_at: new Date().toISOString(),
              })
          }

          // 5. Append to progress_history
          await (supabase as any)
            .from('progress_history')
            .insert({
              student_id: user.id,
              skill_id: canonicalSkillId,
              score,
              source: 'practical',
              recorded_at: new Date().toISOString(),
            })
        }
      }
    } catch (dbErr) {
      console.warn('Database persistence note on practical submission:', dbErr)
    }

    return NextResponse.json({
      success: true,
      data: {
        challengeId: challenge.id,
        title: challenge.title,
        skill: challenge.skill,
        passed,
        score,
        feedback: testResult.feedback,
        previousScore,
        improvement: previousScore !== null ? Math.max(score - previousScore, 0) : 0,
        verificationStatus: passed ? 'Practical Verified' : 'Needs Work',
        newBadge: passed ? 'practical_verified' : undefined,
      },
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Error submitting practical challenge',
    }, { status: 500 })
  }
}
