import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import {
  evaluateCareerReadiness,
  SkillRequirement,
  StudentSkillScore,
} from '@/lib/intelligence/engine'

// GET /api/student/readiness — live career readiness evaluation
export async function GET(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { searchParams } = new URL(request.url)
  const careerIdParam = searchParams.get('career_id')

  const supabase = await createSupabaseServerClient()

  // 1. Get student profile with target career
  let targetCareerId = careerIdParam
  let careerName = ''

  const { data: studentProfile } = await (supabase as any)
    .from('student_profiles')
    .select('target_career_id, career_targets(id, name)')
    .eq('profile_id', user.id)
    .single()

  if (!targetCareerId && studentProfile?.target_career_id) {
    targetCareerId = studentProfile.target_career_id
    careerName = studentProfile.career_targets?.name || ''
  }

  // If user has not chosen a target career yet
  if (!targetCareerId) {
    return apiSuccess({
      hasTargetCareer: false,
      careerId: null,
      careerName: null,
      readinessPercentage: 0,
      readinessCategory: 'Not Assessed',
      readinessVariant: 'secondary',
      priorityGap: null,
      requirements: [],
      skills: [],
      strengths: [],
      nearReadySkills: [],
      criticalGaps: [],
      unassessedSkills: [],
      isAssessed: false,
      explanation: {
        summary: 'Choose a target career to begin measuring your skill benchmarks.',
        strengthsText: [],
        nearReadyText: [],
        criticalText: [],
        recommendedAction: 'Select your target career track to view industry requirements.',
      },
    })
  }

  // 2. Fetch career requirements from career_target_skills
  let requirements: SkillRequirement[] = []

  const { data: dbReqs } = await (supabase as any)
    .from('career_target_skills')
    .select(`
      required_level, importance,
      skills(id, name, category),
      career_targets(name)
    `)
    .eq('career_target_id', targetCareerId)

  if (dbReqs && dbReqs.length > 0) {
    careerName = dbReqs[0].career_targets?.name || careerName || 'Target Career'
    requirements = dbReqs.map((r: any) => ({
      skillId: r.skills?.id || 'skill',
      skillName: r.skills?.name || 'Skill',
      category: r.skills?.category || 'Technical',
      requiredLevel: r.required_level || 70,
      importance: r.importance || 'High',
    }))
  } else {
    // If no specific skills mapped yet in database
    careerName = careerName || 'Target Career'
  }

  // 3. Fetch student's measured skills (strictly from DB, no fake defaults)
  let studentSkills: StudentSkillScore[] = []

  const { data: dbSkills } = await (supabase as any)
    .from('student_skills')
    .select('skill_id, current_level, verification_status, skills(name, category)')
    .eq('student_id', user.id)

  if (dbSkills && dbSkills.length > 0) {
    studentSkills = dbSkills.map((s: any) => ({
      skillId: s.skill_id,
      skillName: s.skills?.name,
      currentLevel: s.current_level,
      verificationStatus: s.verification_status,
    }))
  }

  // 4. Compute deterministic evaluation
  const result = evaluateCareerReadiness(careerName, requirements, studentSkills)

  const isAssessed = studentSkills.length > 0

  return apiSuccess({
    hasTargetCareer: true,
    careerId: targetCareerId,
    ...result,
    isAssessed,
  })
}
