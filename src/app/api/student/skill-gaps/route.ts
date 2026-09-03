import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import {
  evaluateCareerReadiness,
  SkillRequirement,
  StudentSkillScore,
} from '@/lib/intelligence/engine'

// GET /api/student/skill-gaps — priority-ranked skill gaps
export async function GET(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { searchParams } = new URL(request.url)
  const careerId = searchParams.get('career_id')

  const supabase = await createSupabaseServerClient()

  let targetCareerId = careerId
  let careerName = 'Backend Developer'

  if (!targetCareerId) {
    const { data: studentProfile } = await (supabase as any)
      .from('student_profiles')
      .select('target_career_id, career_targets(id, name)')
      .eq('profile_id', user.id)
      .single()

    targetCareerId = studentProfile?.target_career_id || null
    careerName = studentProfile?.career_targets?.name || careerName
  }

  let requirements: SkillRequirement[] = [
    { skillId: 's1', skillName: 'Node.js', category: 'Backend', requiredLevel: 80, importance: 'High' },
    { skillId: 's2', skillName: 'REST APIs', category: 'Backend', requiredLevel: 75, importance: 'High' },
    { skillId: 's3', skillName: 'SQL', category: 'Database', requiredLevel: 70, importance: 'High' },
    { skillId: 's4', skillName: 'Git', category: 'DevOps', requiredLevel: 60, importance: 'Medium' },
  ]

  if (targetCareerId) {
    const { data: dbReqs } = await (supabase as any)
      .from('career_target_skills')
      .select(`
        required_level, importance,
        skills(id, name, category),
        career_targets(name)
      `)
      .eq('career_target_id', targetCareerId)

    if (dbReqs && dbReqs.length > 0) {
      careerName = dbReqs[0].career_targets?.name || careerName
      requirements = dbReqs.map((r: any) => ({
        skillId: r.skills?.id || 'skill',
        skillName: r.skills?.name || 'Skill',
        category: r.skills?.category || 'Technical',
        requiredLevel: r.required_level || 70,
        importance: r.importance || 'High',
      }))
    }
  }

  let studentSkills: StudentSkillScore[] = [
    { skillId: 's1', skillName: 'Node.js', currentLevel: 45, verificationStatus: 'assessment_verified' },
    { skillId: 's2', skillName: 'REST APIs', currentLevel: 60, verificationStatus: 'assessment_verified' },
    { skillId: 's3', skillName: 'SQL', currentLevel: 75, verificationStatus: 'practical_verified' },
    { skillId: 's4', skillName: 'Git', currentLevel: 70, verificationStatus: 'self_declared' },
  ]

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

  const evaluation = evaluateCareerReadiness(careerName, requirements, studentSkills)

  return apiSuccess({
    careerName,
    priorityGap: evaluation.priorityGap,
    criticalGaps: evaluation.criticalGaps,
    nearReadySkills: evaluation.nearReadySkills,
    readySkills: evaluation.strengths,
    allGaps: evaluation.skills,
    summary: evaluation.explanation,
  })
}
