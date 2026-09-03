import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { rankOpportunitiesForStudent, MatchableOpportunity, getDeadlineStatus } from '@/lib/intelligence/matching'
import { StudentSkillScore } from '@/lib/intelligence/engine'

// GET /api/student/opportunities/recommended
// Returns opportunities ranked by deterministic readiness + relevance for the authenticated student.

export async function GET(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { searchParams } = new URL(request.url)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

  const supabase = await createSupabaseServerClient()

  // 1. Fetch published opportunities with required skills
  const { data: oppsData, error: oppsError } = await (supabase as any)
    .from('opportunities')
    .select(`
      id, title, opportunity_type, location, work_mode, duration, deadline, status,
      industry_profiles(organization_name),
      opportunity_skills(minimum_level, importance, skills(id, name))
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(100) // fetch more, then rank and slice

  if (oppsError) return apiError('FETCH_FAILED', 'Could not retrieve opportunities.', 500)

  // 2. Fetch student's current skill scores
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

  // 3. Fetch student's saved opportunity IDs
  const { data: savedData } = await (supabase as any)
    .from('saved_opportunities')
    .select('opportunity_id')
    .eq('student_id', user.id)

  const savedIds = new Set<string>((savedData || []).map((s: any) => s.opportunity_id))

  // 4. Fetch student's applied opportunity IDs
  const { data: appliedData } = await (supabase as any)
    .from('applications')
    .select('opportunity_id')
    .eq('student_id', user.id)

  const appliedIds = new Set<string>((appliedData || []).map((a: any) => a.opportunity_id))

  // 5. Build MatchableOpportunity list
  const opportunities: MatchableOpportunity[] = (oppsData || []).map((opp: any) => ({
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
      skillId: os.skills?.id || os.skill_id || 'skill',
      skillName: os.skills?.name || 'Skill',
      minimumLevel: os.minimum_level || 60,
      importance: os.importance || 'High',
    })),
  }))

  // 6. Rank opportunities deterministically
  const ranked = rankOpportunitiesForStudent(opportunities, studentSkills)

  // 7. Format response
  const results = ranked.slice(0, limit).map(r => {
    const ds = getDeadlineStatus(r.opportunity.deadline)
    return {
      id: r.opportunity.id,
      title: r.opportunity.title,
      company: r.opportunity.companyName,
      type: r.opportunity.opportunityType,
      location: r.opportunity.location,
      workMode: r.opportunity.workMode,
      duration: r.opportunity.duration,
      deadline: r.opportunity.deadline,
      deadlineLabel: ds.label,
      isDeadlineSoon: r.isDeadlineSoon,
      isDeadlinePassed: r.isDeadlinePassed,
      matchPercentage: r.readiness.matchPercentage,
      readinessCategory: r.readiness.readinessCategory,
      skillsMetCount: r.readiness.skillsMetCount,
      totalSkillsCount: r.readiness.totalSkillsCount,
      mainBlocker: r.readiness.mainBlocker,
      skills: r.readiness.skills.map(s => ({
        name: s.skillName,
        met: s.met,
        currentLevel: s.currentLevel,
        requiredLevel: s.requiredLevel,
        gap: s.gap,
      })),
      isSaved: savedIds.has(r.opportunity.id),
      hasApplied: appliedIds.has(r.opportunity.id),
    }
  })

  return apiSuccess(results)
}
