import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { LEVEL_1_KNOWLEDGE_ASSESSMENTS } from '@/lib/assessments-seed'
import { CAREER_BENCHMARK_PROFILES } from '@/lib/benchmarks'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Resolve Skill Data
    let skillName = 'Skill'
    let category = 'Technical'
    let requiredLevel = 75
    let selfDeclaredScore = 0
    let verifiedScore = 0
    let verificationStatus = 'self_declared'
    let isAssessed = false
    let attempts: any[] = []

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      let dbSkill: any = null

      if (isUuid) {
        const { data } = await (supabase as any)
          .from('skills')
          .select('id, name, slug, category, description')
          .eq('id', id)
          .maybeSingle()
        dbSkill = data
      }

      if (dbSkill) {
        skillName = dbSkill.name
        category = dbSkill.category || 'Technical'
      }

      if (user) {
        const { data: userSkill } = await (supabase as any)
          .from('student_skills')
          .select('*')
          .eq('student_id', user.id)
          .eq('skill_id', id)
          .maybeSingle()

        if (userSkill) {
          selfDeclaredScore = userSkill.self_declared_level || 0
          verifiedScore = userSkill.verified_level || 0
          verificationStatus = userSkill.verification_status || 'self_declared'
          isAssessed = verificationStatus !== 'self_declared' && verifiedScore > 0
        }

        // Fetch past attempts if any
        const { data: pastAttempts } = await (supabase as any)
          .from('assessment_attempts')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })

        if (pastAttempts && Array.isArray(pastAttempts)) {
          attempts = pastAttempts.map((a: any, idx: number) => ({
            attemptId: a.id,
            attemptNumber: pastAttempts.length - idx,
            score: a.score || a.percentage || 0,
            passed: (a.score || a.percentage || 0) >= 70,
            submittedAt: a.completed_at || a.created_at,
            verificationStatus: 'assessment_verified',
          }))
        }
      }
    } catch (err) {
      console.warn('DB read fallback in skill detail API:', err)
    }

    // Match canonical assessment
    const norm = skillName.toLowerCase()
    const matchedAssessment =
      LEVEL_1_KNOWLEDGE_ASSESSMENTS.find(a =>
        a.skill.toLowerCase().includes(norm) || norm.includes(a.skill.toLowerCase())
      ) || LEVEL_1_KNOWLEDGE_ASSESSMENTS[0]

    const gap = Math.max(requiredLevel - verifiedScore, 0)

    return NextResponse.json({
      success: true,
      data: {
        skillId: id,
        skillName,
        category,
        targetCareer: 'Full Stack Developer',
        requiredLevel,
        selfDeclaredScore,
        verifiedScore,
        verificationStatus,
        isAssessed,
        gap,
        whyItMatters: `Essential industry standard competency for building scalable, resilient software engineering systems.`,
        testCurriculum: [
          'Core concepts and language syntax',
          'Production patterns and performance architecture',
          'Debugging, error boundaries and integration testing',
        ],
        targetAssessment: {
          id: matchedAssessment.id,
          title: matchedAssessment.title,
          skill: matchedAssessment.skill,
          timeLimitMinutes: matchedAssessment.timeLimitMinutes || 10,
          passingScore: matchedAssessment.passingScore || 70,
        },
        attempts,
      },
    })
  } catch (err: any) {
    console.error('Error in GET /api/student/skills/[id]/detail:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch skill details' },
      { status: 500 }
    )
  }
}
