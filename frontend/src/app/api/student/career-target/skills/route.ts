import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CAREER_BENCHMARK_PROFILES } from '@/lib/benchmarks'

export interface CareerSkillItem {
  skillId: string
  skillName: string
  category: string
  requiredLevel: number
  importance: 'High' | 'Medium' | 'Low'
  weight: number
  selfDeclaredScore: number
  verifiedScore: number
  status: 'ready' | 'improve' | 'critical'
  isAssessed: boolean
  attemptCount: number
  latestScore: number | null
}

// Local persistent store for server-side persistence
const sessionStudentSkills = new Map<string, Map<string, any>>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const careerIdParam = searchParams.get('career_id')

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const studentId = user?.id || request.headers.get('x-student-id') || (request.headers.get('x-demo-mode') === 'true' ? 'test-student-career-target' : 'default-student-session')

    let targetCareerId = careerIdParam

    if (user && !targetCareerId) {
      const { data: profile } = await (supabase as any)
        .from('student_profiles')
        .select('target_career_id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (profile?.target_career_id) {
        targetCareerId = profile.target_career_id
      }
    }

    if (!targetCareerId) {
      const defaultProfile = CAREER_BENCHMARK_PROFILES.find(c => c.slug === 'fullstack') || CAREER_BENCHMARK_PROFILES[0]
      targetCareerId = defaultProfile.id
    }

    // Match career benchmark
    const benchmark = CAREER_BENCHMARK_PROFILES.find(
      c => c.id === targetCareerId || c.slug === targetCareerId
    ) || CAREER_BENCHMARK_PROFILES[0]

    // Fetch skills for career target from database
    let requiredSkills: any[] = []
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetCareerId)
      let resolvedId = targetCareerId

      if (!isUuid) {
        const { data: ct } = await (supabase as any)
          .from('career_targets')
          .select('id')
          .eq('slug', targetCareerId)
          .maybeSingle()
        if (ct?.id) resolvedId = ct.id
      }

      const { data: dbReqs } = await (supabase as any)
        .from('career_target_skills')
        .select('skill_id, required_level, importance, skills(id, name, slug, category, description)')
        .eq('career_target_id', resolvedId)

      if (dbReqs && Array.isArray(dbReqs) && dbReqs.length > 0) {
        requiredSkills = dbReqs.map((r: any) => ({
          skillId: r.skill_id,
          skillName: r.skills?.name || 'Skill',
          category: r.skills?.category || 'Technical',
          requiredLevel: r.required_level,
          importance: (r.importance === 'Medium' || r.importance === 'Low' ? r.importance : 'High') as 'High' | 'Medium' | 'Low',
          weight: r.importance === 'High' ? 0.15 : r.importance === 'Medium' ? 0.10 : 0.05,
        }))
      }
    } catch (err) {
      console.warn('DB error reading career_target_skills:', err)
    }

    // Fallback to benchmark skills if DB empty
    if (requiredSkills.length === 0) {
      requiredSkills = Object.entries(benchmark.skills).map(([name, b], idx) => ({
        skillId: b.skillId || `skill-${benchmark.slug}-${idx + 1}`,
        skillName: name,
        category: b.category || 'Engineering',
        requiredLevel: b.required,
        importance: (b.priority || (b.weight >= 0.1 ? 'High' : 'Medium')) as 'High' | 'Medium' | 'Low',
        weight: b.weight,
      }))
    }

    // Fetch student's existing skills
    const studentSkillsMap = new Map<string, any>()
    const studentSkillsNameMap = new Map<string, any>()

    // 1. First populate from session store for this studentId
    const localUserMap = sessionStudentSkills.get(studentId)
    if (localUserMap) {
      localUserMap.forEach((s, k) => {
        studentSkillsMap.set(k, s)
        if (s.skills?.name) studentSkillsNameMap.set(s.skills.name.toLowerCase().trim(), s)
        if (s.skillName) studentSkillsNameMap.set(s.skillName.toLowerCase().trim(), s)
      })
    }

    // 2. Query Supabase if user exists and merge
    if (user) {
      try {
        const { data: dbSkills } = await (supabase as any)
          .from('student_skills')
          .select('skill_id, self_declared_level, current_level, verified_level, verification_status, skills(name)')
          .eq('student_id', user.id)

        if (dbSkills && Array.isArray(dbSkills)) {
          dbSkills.forEach((s: any) => {
            studentSkillsMap.set(s.skill_id, s)
            if (s.skills?.name) {
              studentSkillsNameMap.set(s.skills.name.toLowerCase().trim(), s)
            }
          })
        }
      } catch (err) {
        console.warn('DB error reading student_skills:', err)
      }
    }

    // Map required skills to output shape
    const skillsList: CareerSkillItem[] = requiredSkills.map(req => {
      const studentSkill =
        studentSkillsMap.get(req.skillId) ||
        studentSkillsNameMap.get(req.skillName.toLowerCase().trim())

      const selfScore = studentSkill?.self_declared_level ?? 0
      const isVerified =
        studentSkill &&
        studentSkill.verification_status &&
        studentSkill.verification_status !== 'self_declared' &&
        (studentSkill.verified_level > 0 || studentSkill.current_level > 0)

      const verifiedScore = isVerified ? (studentSkill.verified_level || studentSkill.current_level || 0) : 0
      const effectiveScore = verifiedScore > 0 ? verifiedScore : selfScore

      let status: 'ready' | 'improve' | 'critical' = 'critical'
      const gap = Math.max(req.requiredLevel - effectiveScore, 0)
      if (gap === 0 && effectiveScore >= req.requiredLevel) {
        status = 'ready'
      } else if (gap <= 15) {
        status = 'improve'
      } else {
        status = 'critical'
      }

      return {
        skillId: req.skillId,
        skillName: req.skillName,
        category: req.category,
        requiredLevel: req.requiredLevel,
        importance: req.importance,
        weight: req.weight,
        selfDeclaredScore: selfScore,
        verifiedScore: verifiedScore,
        status,
        isAssessed: !!isVerified,
        attemptCount: isVerified ? 1 : 0,
        latestScore: verifiedScore > 0 ? verifiedScore : null,
      }
    })

    return NextResponse.json({
      success: true,
      career: {
        id: benchmark.id,
        name: benchmark.name,
        slug: benchmark.slug,
        description: benchmark.description,
      },
      skills: skillsList,
      data: skillsList,
    })
  } catch (err: any) {
    console.error('Error in GET /api/student/career-target/skills:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch career skills' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const studentId = user?.id || request.headers.get('x-student-id') || (request.headers.get('x-demo-mode') === 'true' ? 'test-student-career-target' : 'default-student-session')

    const body = await request.json()
    const careerTargetId = body.careerTargetId || body.career_target_id
    const skills = body.skills || []

    if (!Array.isArray(skills)) {
      return NextResponse.json(
        { success: false, error: 'skills array is required' },
        { status: 400 }
      )
    }

    if (!sessionStudentSkills.has(studentId)) {
      sessionStudentSkills.set(studentId, new Map())
    }
    const userLocalMap = sessionStudentSkills.get(studentId)!

    for (const item of skills) {
      const skillId = item.skillId || item.skill_id
      if (!skillId) continue
      const selfScore = Math.max(0, Math.min(100, Number(item.selfScore ?? item.self_score ?? item.selfDeclaredScore) || 0))
      const existing = userLocalMap.get(skillId)

      userLocalMap.set(skillId, {
        skill_id: skillId,
        skillName: item.skillName || 'Skill',
        self_declared_level: selfScore,
        current_level: existing && existing.verification_status !== 'self_declared' ? existing.current_level : selfScore,
        verified_level: existing ? existing.verified_level : 0,
        verification_status: existing ? existing.verification_status : 'self_declared',
      })
    }

    if (user) {
      // 1. Update target career in student_profiles
      if (careerTargetId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(careerTargetId)
        let resolvedCareerUuid = careerTargetId
        if (!isUuid) {
          const matched = CAREER_BENCHMARK_PROFILES.find(c => c.slug === careerTargetId || c.id === careerTargetId)
          if (matched) resolvedCareerUuid = matched.id
        }

        try {
          await (supabase as any)
            .from('student_profiles')
            .upsert({
              profile_id: user.id,
              target_career_id: resolvedCareerUuid,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'profile_id' })
        } catch (err) {
          console.warn('Could not save target_career_id to profile:', err)
        }
      }

      // 2. Fetch existing skills to prevent downgrading verified scores
      const { data: existingSkills } = await (supabase as any)
        .from('student_skills')
        .select('skill_id, verification_status, verified_level, current_level')
        .eq('student_id', user.id)

      const existingMap = new Map<string, any>()
      if (existingSkills) {
        existingSkills.forEach((s: any) => existingMap.set(s.skill_id, s))
      }

      const upsertRows = []
      for (const item of skills) {
        const skillId = item.skillId || item.skill_id
        if (!skillId) continue

        const selfScore = Math.max(0, Math.min(100, Number(item.selfScore ?? item.self_score ?? item.selfDeclaredScore) || 0))
        const existing = existingMap.get(skillId)

        if (existing && existing.verification_status && existing.verification_status !== 'self_declared') {
          // Preserve verified status
          upsertRows.push({
            student_id: user.id,
            skill_id: skillId,
            self_declared_level: selfScore,
            current_level: existing.current_level,
            verified_level: existing.verified_level,
            verification_status: existing.verification_status,
            updated_at: new Date().toISOString(),
          })
        } else {
          // Self-declared skill
          upsertRows.push({
            student_id: user.id,
            skill_id: skillId,
            self_declared_level: selfScore,
            current_level: selfScore,
            verified_level: 0,
            verification_status: 'self_declared',
            updated_at: new Date().toISOString(),
          })
        }
      }

      if (upsertRows.length > 0) {
        try {
          await (supabase as any)
            .from('student_skills')
            .upsert(upsertRows, { onConflict: 'student_id,skill_id' })
        } catch (err) {
          console.warn('Error saving self-declared skills to database:', err)
        }
      }
    }

    // Diagnostic breakdown
    const strongSkills: any[] = []
    const moderateSkills: any[] = []
    const weakSkills: any[] = []
    const criticalGaps: any[] = []

    skills.forEach((s: any) => {
      const score = Number(s.selfScore ?? 0)
      const skillName = s.skillName || 'Skill'
      if (score >= 75) {
        strongSkills.push({ skillId: s.skillId, skillName, score })
      } else if (score >= 50) {
        moderateSkills.push({ skillId: s.skillId, skillName, score })
      } else {
        weakSkills.push({ skillId: s.skillId, skillName, score })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Self-declared ratings saved successfully.',
      diagnostic: {
        strongSkills,
        moderateSkills,
        weakSkills,
        criticalGaps,
      },
    })
  } catch (err: any) {
    console.error('Error in POST /api/student/career-target/skills:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save self scores' },
      { status: 500 }
    )
  }
}
