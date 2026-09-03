import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { matchStudentToOpportunity, MatchableOpportunity } from '@/lib/intelligence/matching'
import { StudentSkillScore } from '@/lib/intelligence/engine'

// GET /api/industry/candidates
// Returns candidates matched to the requesting industry user's published opportunities.
// Only shows permitted fields: name, institution, skill match, verification status.
// Private data (email, full assessment details) is not exposed here.

export async function GET(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  const { searchParams } = new URL(request.url)
  const opportunityId = searchParams.get('opportunity_id') || ''
  const minMatch = Math.max(0, parseInt(searchParams.get('min_match') || '0'))

  // 1. Fetch this industry user's published opportunities
  let oppQuery = (supabase as any)
    .from('opportunities')
    .select(`
      id, title, opportunity_type,
      opportunity_skills(minimum_level, importance, skills(id, name))
    `)
    .eq('industry_id', user.id)
    .eq('status', 'published')

  if (opportunityId) oppQuery = oppQuery.eq('id', opportunityId)

  const { data: oppData, error: oppError } = await oppQuery
  if (oppError) return apiError('FETCH_FAILED', 'Could not retrieve opportunities.', 500)
  if (!oppData || oppData.length === 0) return apiSuccess([])

  // 2. Fetch applications for these opportunities with student profiles and skill data
  const opportunityIds = oppData.map((o: any) => o.id)

  const { data: appsData, error: appsError } = await (supabase as any)
    .from('applications')
    .select(`
      id, current_status, applied_at,
      opportunity_id,
      student_id,
      profiles!inner(id, full_name),
      student_profiles(institution_id, institutions(name))
    `)
    .in('opportunity_id', opportunityIds)
    .neq('current_status', 'withdrawn')
    .order('applied_at', { ascending: false })

  if (appsError) return apiError('FETCH_FAILED', 'Could not retrieve candidates.', 500)

  if (!appsData || appsData.length === 0) return apiSuccess([])

  // 3. Fetch skill data for all student applicants in bulk
  const studentIds = [...new Set<string>(appsData.map((a: any) => a.student_id))]

  const { data: allStudentSkills } = await (supabase as any)
    .from('student_skills')
    .select('student_id, skill_id, current_level, verification_status, skills(id, name)')
    .in('student_id', studentIds)

  // Group skills by student_id
  const skillsByStudent = new Map<string, StudentSkillScore[]>()
  for (const row of allStudentSkills || []) {
    if (!skillsByStudent.has(row.student_id)) {
      skillsByStudent.set(row.student_id, [])
    }
    skillsByStudent.get(row.student_id)!.push({
      skillId: row.skill_id,
      skillName: row.skills?.name || '',
      currentLevel: row.current_level || 0,
      verificationStatus: row.verification_status || 'self_declared',
    })
  }

  // Build opportunity map for lookup
  const opportunityMap = new Map<string, any>()
  for (const opp of oppData) {
    opportunityMap.set(opp.id, opp)
  }

  // 4. Compute readiness for each applicant against their applied opportunity
  const results = appsData
    .map((app: any) => {
      const opp = opportunityMap.get(app.opportunity_id)
      if (!opp) return null

      const studentSkills = skillsByStudent.get(app.student_id) || []

      const matchable: MatchableOpportunity = {
        id: opp.id,
        title: opp.title,
        companyName: '',
        opportunityType: opp.opportunity_type || 'Internship',
        location: '',
        workMode: 'hybrid',
        duration: null,
        deadline: null,
        status: 'published',
        skills: (opp.opportunity_skills || []).map((os: any) => ({
          skillId: os.skills?.id || 'skill',
          skillName: os.skills?.name || 'Skill',
          minimumLevel: os.minimum_level || 60,
          importance: os.importance || 'High',
        })),
      }

      const readiness = matchStudentToOpportunity(matchable, studentSkills)

      if (readiness.matchPercentage < minMatch) return null

      return {
        applicationId: app.id,
        applicationStatus: app.current_status,
        appliedAt: app.applied_at,
        candidate: {
          // Permitted: name + institution only (no email, no contact)
          id: app.profiles?.id,
          name: app.profiles?.full_name || 'Candidate',
          institution: app.student_profiles?.institutions?.name || 'Not specified',
        },
        opportunity: {
          id: opp.id,
          title: opp.title,
          type: opp.opportunity_type,
        },
        readiness: {
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
        },
      }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.readiness.matchPercentage - a.readiness.matchPercentage)

  return apiSuccess(results)
}
