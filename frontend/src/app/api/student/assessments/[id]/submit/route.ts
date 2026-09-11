import { NextRequest, NextResponse } from 'next/server'
import { LEVEL_1_KNOWLEDGE_ASSESSMENTS, gradeLevel1Assessment } from '@/lib/assessments-seed'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AssessmentAttemptResult } from '@/lib/intelligence/types'
import { normalizeScore } from '@/lib/intelligence/engine'

// Canonical skill ID resolver
const SKILL_NAME_TO_UUID: Record<string, string> = {
  'node.js': '40000000-0000-0000-0000-000000000001',
  'node.js & backend architecture': '40000000-0000-0000-0000-000000000001',
  'rest apis': '40000000-0000-0000-0000-000000000002',
  'sql': '40000000-0000-0000-0000-000000000003',
  'git': '40000000-0000-0000-0000-000000000004',
  'git & version control': '40000000-0000-0000-0000-000000000004',
  'docker': '40000000-0000-0000-0000-000000000005',
  'react': '40000000-0000-0000-0000-000000000006',
  'react.js': '40000000-0000-0000-0000-000000000006',
  'html/css': '40000000-0000-0000-0000-000000000007',
  'python': '40000000-0000-0000-0000-000000000012',
  'javascript': '40000000-0000-0000-0000-000000000015',
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { answers = [], attempt_id } = body

    const assessment =
      LEVEL_1_KNOWLEDGE_ASSESSMENTS.find(a => a.id === id || a.skill.toLowerCase().includes(id.toLowerCase())) ||
      LEVEL_1_KNOWLEDGE_ASSESSMENTS[0]

    const graded = gradeLevel1Assessment(assessment, answers)
    const normalizedScore = normalizeScore(graded.score)
    const passed = normalizedScore >= assessment.passingScore

    // Resolve canonical skill ID
    const lookupKey = assessment.skill.toLowerCase().trim()
    let canonicalSkillId = SKILL_NAME_TO_UUID[lookupKey] || '40000000-0000-0000-0000-000000000001'

    let previousScore: number | null = null
    let attemptUuid = attempt_id

    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Query skill ID from DB if possible
        const { data: dbSkill } = await (supabase as any)
          .from('skills')
          .select('id')
          .ilike('name', `%${assessment.skill.split(' ')[0]}%`)
          .maybeSingle()

        if (dbSkill?.id) {
          canonicalSkillId = dbSkill.id
        }

        // 1. Fetch real previous score for this student and skill
        const { data: existingSkill } = await (supabase as any)
          .from('student_skills')
          .select('current_level, verified_level, verification_status')
          .eq('student_id', user.id)
          .eq('skill_id', canonicalSkillId)
          .maybeSingle()

        if (existingSkill && existingSkill.verification_status !== 'self_declared') {
          previousScore = existingSkill.current_level
        }

        // 2. Update assessment_attempts if valid UUID
        const isAttemptUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attempt_id)
        if (isAttemptUuid) {
          await (supabase as any)
            .from('assessment_attempts')
            .update({
              completed_at: new Date().toISOString(),
              score: normalizedScore,
              percentage: normalizedScore,
              status: 'completed',
            })
            .eq('id', attempt_id)
            .eq('student_id', user.id)
        }

        // 3. Log into skill_scores table
        await (supabase as any)
          .from('skill_scores')
          .insert({
            student_id: user.id,
            skill_id: canonicalSkillId,
            score: normalizedScore,
            source: 'assessment',
            recorded_at: new Date().toISOString(),
          })

        // 4. Update student_skills with assessment_verified
        await (supabase as any)
          .from('student_skills')
          .upsert({
            student_id: user.id,
            skill_id: canonicalSkillId,
            current_level: normalizedScore,
            verified_level: normalizedScore,
            verification_status: 'assessment_verified',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'student_id,skill_id' })

        // 5. If prior score existed, log into reassessments table
        if (previousScore !== null) {
          await (supabase as any)
            .from('reassessments')
            .insert({
              student_id: user.id,
              skill_id: canonicalSkillId,
              previous_score: previousScore,
              new_score: normalizedScore,
              recorded_at: new Date().toISOString(),
            })
        }

        // 6. Append to progress_history
        await (supabase as any)
          .from('progress_history')
          .insert({
            student_id: user.id,
            skill_id: canonicalSkillId,
            score: normalizedScore,
            source: 'assessment',
            recorded_at: new Date().toISOString(),
          })

        // 7. Create ticket in verification_requests
        await (supabase as any)
          .from('verification_requests')
          .insert({
            student_id: user.id,
            student_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
            student_email: user.email || 'student@dtu.ac.in',
            department: 'Computer Science & Engineering',
            skill_name: assessment.skill,
            verification_tier: 'Assessment Verified',
            score: normalizedScore,
            proof_notes: `Completed official benchmarking assessment for ${assessment.skill} scoring ${normalizedScore}/100.`,
            status: 'pending',
            created_at: new Date().toISOString(),
          })
      }
    } catch (dbErr) {
      console.warn('Database persistence note on assessment submission:', dbErr)
    }

    const improvement = previousScore !== null ? normalizedScore - previousScore : 0

    const result: AssessmentAttemptResult = {
      attemptId: attemptUuid || `attempt-${Date.now()}`,
      assessmentId: assessment.id,
      title: assessment.title,
      skillName: assessment.skill,
      totalQuestions: graded.totalQuestions,
      correctCount: graded.correctCount,
      score: normalizedScore,
      percentage: normalizedScore,
      passed,
      previousScore,
      improvement,
      explanationSummary: {
        strengths: passed
          ? [`Demonstrated mastery of core ${assessment.skill} principles and standards.`]
          : [`Completed diagnostic attempt for ${assessment.skill}.`],
        weaknesses: passed
          ? []
          : [`Review edge cases and practical patterns to cross the ${assessment.passingScore}% passing benchmark.`],
        careerImpact: `Your verified score for ${assessment.skill} is now ${normalizedScore}/100, upgrading your verification tier to Assessment Verified.`,
        nextStep: passed
          ? 'Proceed to Level 2 Practical Timed Challenges to earn Practical Verified status in your living Skill Passport.'
          : 'Review recommended concepts with AI Coach and reassess to improve your score.',
      },
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Error submitting assessment',
    }, { status: 500 })
  }
}
