import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { matchStudentToOpportunity, MatchableOpportunity, getDeadlineStatus } from '@/lib/intelligence/matching'
import { StudentSkillScore } from '@/lib/intelligence/engine'

// GET /api/student/opportunities/saved
// Returns the authenticated student's saved opportunities with current live readiness.

export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  // 1. Fetch saved opportunities with full opportunity data
  const { data: savedData, error: savedError } = await (supabase as any)
    .from('saved_opportunities')
    .select(`
      id, saved_at,
      opportunities(
        id, title, opportunity_type, location, work_mode, duration, deadline, status,
        industry_profiles(organization_name),
        opportunity_skills(minimum_level, importance, skills(id, name))
      )
    `)
    .eq('student_id', user.id)
    .order('saved_at', { ascending: false })

  if (savedError) return apiError('FETCH_FAILED', 'Could not retrieve saved opportunities.', 500)

  // 2. Fetch student skills for live readiness computation
  let studentSkills: StudentSkillScore[] = []
  const { data: dbSkills } = await (supabase as any)
    .from('student_skills')
    .select('skill_id, current_level, skills(id, name)')
    .eq('student_id', user.id)

  if (dbSkills && dbSkills.length > 0) {
    studentSkills = dbSkills.map((s: any) => ({
      skillId: s.skill_id,
      skillName: s.skills?.name || '',
      currentLevel: s.current_level || 0,
    }))
  }

  // 3. Compute live readiness for each saved opportunity
  const results = (savedData || [])
    .filter((row: any) => row.opportunities) // guard against deleted opportunities
    .map((row: any) => {
      const opp = row.opportunities
      const matchable: MatchableOpportunity = {
        id: opp.id,
        title: opp.title,
        companyName: opp.industry_profiles?.organization_name || 'Organization',
        opportunityType: opp.opportunity_type || 'Internship',
        location: opp.location || 'Remote',
        workMode: opp.work_mode || 'hybrid',
        duration: opp.duration || null,
        deadline: opp.deadline || null,
        status: opp.status,
        skills: (opp.opportunity_skills || []).map((os: any) => ({
          skillId: os.skills?.id || 'skill',
          skillName: os.skills?.name || 'Skill',
          minimumLevel: os.minimum_level || 60,
          importance: os.importance || 'High',
        })),
      }

      const readiness = matchStudentToOpportunity(matchable, studentSkills)
      const ds = getDeadlineStatus(opp.deadline)

      return {
        saveId: row.id,
        savedAt: row.saved_at,
        id: opp.id,
        title: opp.title,
        company: matchable.companyName,
        type: matchable.opportunityType,
        location: matchable.location,
        workMode: matchable.workMode,
        duration: matchable.duration,
        deadline: opp.deadline,
        deadlineLabel: ds.label,
        isDeadlineSoon: ds.isSoon,
        isDeadlinePassed: ds.isPassed,
        status: opp.status,
        matchPercentage: readiness.matchPercentage,
        readinessCategory: readiness.readinessCategory,
        skillsMetCount: readiness.skillsMetCount,
        totalSkillsCount: readiness.totalSkillsCount,
        mainBlocker: readiness.mainBlocker,
        skills: readiness.skills.map(s => ({
          name: s.skillName,
          met: s.met,
          currentLevel: s.currentLevel,
          requiredLevel: s.requiredLevel,
        })),
      }
    })

  return apiSuccess(results)
}
