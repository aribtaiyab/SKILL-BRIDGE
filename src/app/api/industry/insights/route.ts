import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/industry/insights
// Returns real aggregate analytics for the industry user's opportunities.
// Only queries from real DB data — no invented numbers.

export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  // 1. Verify industry profile
  const { data: industryProfile } = await (supabase as any)
    .from('industry_profiles')
    .select('profile_id, organization_name')
    .eq('profile_id', user.id)
    .single()

  if (!industryProfile) return apiError('FORBIDDEN', 'Industry profile required.', 403)

  // 2. Fetch own opportunities
  const { data: oppsData } = await (supabase as any)
    .from('opportunities')
    .select('id, title, opportunity_type, status, created_at, opportunity_skills(minimum_level, importance, skills(id, name))')
    .eq('industry_id', user.id)

  const opps = oppsData || []
  const publishedOpps = opps.filter((o: any) => o.status === 'published')
  const draftOpps = opps.filter((o: any) => o.status === 'draft')

  // 3. Fetch applications for own opportunities
  const ownOppIds = opps.map((o: any) => o.id).filter(Boolean)

  let totalApplications = 0
  const applicationsByStatus: Record<string, number> = {}
  let avgReadinessAtApplication = 0

  if (ownOppIds.length > 0) {
    const { data: appsData } = await (supabase as any)
      .from('applications')
      .select('id, current_status, application_readiness_snapshots(readiness_percentage)')
      .in('opportunity_id', ownOppIds)

    const apps = appsData || []
    totalApplications = apps.length

    for (const app of apps) {
      const status = app.current_status || 'applied'
      applicationsByStatus[status] = (applicationsByStatus[status] || 0) + 1
    }

    // Average readiness at application time from snapshots
    const snapshots = apps
      .flatMap((a: any) => a.application_readiness_snapshots || [])
      .map((s: any) => s.readiness_percentage)
      .filter((p: number) => typeof p === 'number')

    avgReadinessAtApplication =
      snapshots.length > 0
        ? Math.round(snapshots.reduce((sum: number, p: number) => sum + p, 0) / snapshots.length)
        : 0
  }

  // 4. Skill demand analytics: which skills appear most in own opportunities
  const skillDemandMap = new Map<string, { name: string; count: number; totalMinLevel: number }>()

  for (const opp of opps) {
    for (const os of opp.opportunity_skills || []) {
      const name = os.skills?.name
      if (!name) continue
      const existing = skillDemandMap.get(name) || { name, count: 0, totalMinLevel: 0 }
      existing.count++
      existing.totalMinLevel += os.minimum_level || 60
      skillDemandMap.set(name, existing)
    }
  }

  const skillDemandList = [...skillDemandMap.values()]
    .map(s => ({
      skillName: s.name,
      demandCount: s.count,
      avgRequiredLevel: Math.round(s.totalMinLevel / s.count),
    }))
    .sort((a, b) => b.demandCount - a.demandCount)
    .slice(0, 10)

  return apiSuccess({
    summary: {
      totalOpportunities: opps.length,
      publishedOpportunities: publishedOpps.length,
      draftOpportunities: draftOpps.length,
      totalApplications,
      avgReadinessAtApplication,
    },
    applicationsByStatus,
    skillDemand: skillDemandList,
    opportunities: opps.map((o: any) => ({
      id: o.id,
      title: o.title,
      type: o.opportunity_type,
      status: o.status,
    })),
  })
}
