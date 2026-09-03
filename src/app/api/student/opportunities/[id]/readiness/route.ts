import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'
import { evaluateOpportunityReadiness, StudentSkillScore } from '@/lib/intelligence/engine'

// GET /api/student/opportunities/[id]/readiness — opportunity-specific readiness
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  const supabase = await createSupabaseServerClient()

  // 1. Fetch opportunity & required skills
  let oppData = {
    id,
    title: 'Backend Developer Internship',
    companyName: 'TechFlow Solutions',
    skills: [
      { skillId: 's1', skillName: 'Node.js', minimumLevel: 80, importance: 'High' },
      { skillId: 's2', skillName: 'REST APIs', minimumLevel: 75, importance: 'High' },
      { skillId: 's3', skillName: 'SQL', minimumLevel: 70, importance: 'High' },
      { skillId: 's4', skillName: 'Git', minimumLevel: 60, importance: 'Medium' },
    ],
  }

  if (isValidUUID(id)) {
    const { data: dbOpp } = await (supabase as any)
      .from('opportunities')
      .select(`
        id, title,
        industry_profiles(organization_name),
        opportunity_skills(minimum_level, importance, skills(id, name))
      `)
      .eq('id', id)
      .single()

    if (dbOpp) {
      oppData = {
        id: dbOpp.id,
        title: dbOpp.title,
        companyName: dbOpp.industry_profiles?.organization_name || 'Host Company',
        skills: (dbOpp.opportunity_skills || []).map((os: any) => ({
          skillId: os.skills?.id || 'skill',
          skillName: os.skills?.name || 'Skill',
          minimumLevel: os.minimum_level || 60,
          importance: os.importance || 'High',
        })),
      }
    }
  }

  // 2. Fetch student's measured skills (strictly from DB)
  let studentSkills: StudentSkillScore[] = []

  const { data: dbSkills } = await (supabase as any)
    .from('student_skills')
    .select('skill_id, current_level, skills(name)')
    .eq('student_id', user.id)

  if (dbSkills && dbSkills.length > 0) {
    studentSkills = dbSkills.map((s: any) => ({
      skillId: s.skill_id,
      skillName: s.skills?.name,
      currentLevel: s.current_level,
    }))
  }

  // 3. Compute opportunity readiness
  const result = evaluateOpportunityReadiness(oppData, studentSkills)

  return apiSuccess(result)
}
