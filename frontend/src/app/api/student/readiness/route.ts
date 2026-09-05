import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CAREER_BENCHMARK_PROFILES } from '@/lib/benchmarks'
import {
  evaluateCareerReadiness,
  SkillRequirement,
  StudentSkillScore,
} from '@/lib/intelligence/engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const careerIdParam = searchParams.get('career_id')

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    let targetCareerId = careerIdParam
    let targetCareerName = 'Frontend Developer'

    // 1. Resolve Target Career ID
    if (user && !targetCareerId) {
      const { data: profile } = await (supabase as any)
        .from('student_profiles')
        .select('target_career_id, career_targets(id, name, slug)')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (profile?.target_career_id) {
        targetCareerId = profile.target_career_id
        if (profile.career_targets?.name) {
          targetCareerName = profile.career_targets.name
        }
      }
    }

    // Default to first benchmark profile if no target chosen
    if (!targetCareerId) {
      const defaultProfile = CAREER_BENCHMARK_PROFILES.find(c => c.slug === 'frontend') || CAREER_BENCHMARK_PROFILES[0]
      targetCareerId = defaultProfile.id
      targetCareerName = defaultProfile.name
    }

    // 2. Fetch Requirements from Database
    let requirements: SkillRequirement[] = []

    try {
      const { data: dbReqs } = await (supabase as any)
        .from('career_target_skills')
        .select('skill_id, required_level, importance, skills(id, name, slug, category)')
        .eq('career_target_id', targetCareerId)

      if (dbReqs && dbReqs.length > 0) {
        requirements = dbReqs.map((r: any) => ({
          skillId: r.skill_id,
          skillName: r.skills?.name || 'Skill',
          category: r.skills?.category || 'Technical',
          requiredLevel: r.required_level,
          importance: r.importance || 'High',
        }))
      }
    } catch (err) {
      console.warn('Database error loading career requirements:', err)
    }

    // Fallback requirements from benchmarks if DB unseeded
    if (requirements.length === 0) {
      const benchmark = CAREER_BENCHMARK_PROFILES.find(
        c => c.id === targetCareerId || c.slug === targetCareerId
      ) || CAREER_BENCHMARK_PROFILES[0]

      targetCareerName = benchmark.name
      requirements = Object.entries(benchmark.skills).map(([name, b], idx) => ({
        skillId: `skill-${benchmark.slug}-${idx + 1}`,
        skillName: name,
        category: 'Technical',
        requiredLevel: b.required,
        importance: b.weight >= 0.3 ? 'High' : b.weight >= 0.2 ? 'Medium' : 'Low',
      }))
    }

    // 3. Fetch Real Student Scores from student_skills
    const studentSkills: StudentSkillScore[] = []

    if (user) {
      try {
        const { data: dbSkills } = await (supabase as any)
          .from('student_skills')
          .select('skill_id, current_level, verified_level, verification_status, updated_at, skills(name)')
          .eq('student_id', user.id)

        if (dbSkills && dbSkills.length > 0) {
          dbSkills.forEach((s: any) => {
            studentSkills.push({
              skillId: s.skill_id,
              skillName: s.skills?.name,
              currentLevel: s.current_level || 0,
              verificationStatus: s.verification_status || 'self_declared',
              lastAssessedAt: s.updated_at,
            })
          })
        }
      } catch (err) {
        console.warn('Database error loading student skills:', err)
      }
    }

    // 4. Calculate authoritative career readiness
    const readinessResult = evaluateCareerReadiness(
      targetCareerName,
      requirements,
      studentSkills
    )

    readinessResult.careerId = targetCareerId
    readinessResult.careerName = targetCareerName

    return NextResponse.json({
      success: true,
      data: readinessResult,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to calculate career readiness',
    }, { status: 500 })
  }
}
