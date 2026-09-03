import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/applications — student's own applications
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as any)
    .from('applications')
    .select(`
      id, current_status, applied_at, updated_at,
      opportunities(id, title, opportunity_type, location,
        industry_profiles(organization_name)
      ),
      application_readiness_snapshots(readiness_percentage, skills_met, total_skills, snapshot_data, created_at),
      application_status_history(status, note, changed_at)
    `)
    .eq('student_id', user.id)
    .order('applied_at', { ascending: false })

  if (error) return apiError('FETCH_FAILED', 'Could not retrieve applications.', 500)

  const formatted = (data || []).map((row: any) => ({
    id: row.id,
    status: row.current_status,
    created_at: row.applied_at,
    updated_at: row.updated_at,
    opportunities: row.opportunities,
    readinessSnapshot: row.application_readiness_snapshots?.[0] || null,
    timeline: (row.application_status_history || []).sort((a: any, b: any) =>
      new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    ),
  }))

  return apiSuccess(formatted)
}

// POST /api/applications — submit an application
export async function POST(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: { opportunity_id?: string; cover_letter?: string }
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  if (!body.opportunity_id || !isValidUUID(body.opportunity_id)) {
    return apiError('VALIDATION_ERROR', 'Valid opportunity_id is required.', 422)
  }

  const supabase = await createSupabaseServerClient()

  // Verify opportunity is published and accepting applications
  const { data: opportunityData } = await (supabase as any)
    .from('opportunities')
    .select('id, status, deadline, opportunity_skills(minimum_level, importance, skills(id, name))')
    .eq('id', body.opportunity_id)
    .single()

  const opportunity = opportunityData as {
    id: string
    status: string
    deadline: string | null
    opportunity_skills: { minimum_level: number; importance: string; skills: { id: string; name: string } | null }[]
  } | null

  if (!opportunity) return apiError('NOT_FOUND', 'Opportunity not found.', 404)
  if (opportunity.status !== 'published') {
    return apiError('NOT_AVAILABLE', 'This opportunity is no longer accepting applications.', 409)
  }
  if (opportunity.deadline && new Date(opportunity.deadline) < new Date()) {
    return apiError('DEADLINE_PASSED', 'The application deadline for this opportunity has passed.', 409)
  }

  // Check for duplicate application
  const { data: existing } = await (supabase as any)
    .from('applications')
    .select('id')
    .eq('student_id', user.id)
    .eq('opportunity_id', body.opportunity_id)
    .single()

  if (existing) {
    return apiError('DUPLICATE', 'You have already applied for this opportunity.', 409)
  }

  // Create application — student_id from session, not request body
  const { data, error } = await (supabase as any)
    .from('applications')
    .insert({
      student_id: user.id,
      opportunity_id: body.opportunity_id,
      current_status: 'applied',
      applied_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return apiError('CREATE_FAILED', 'Could not submit application. Please try again.', 500)

  // Record status history
  if (data?.id) {
    await (supabase as any)
      .from('application_status_history')
      .insert({
        application_id: data.id,
        status: 'applied',
        note: 'Application submitted',
        changed_by: user.id,
        changed_at: new Date().toISOString(),
      })

    // Persist readiness snapshot at application time (Phase 6)
    try {
      const oppSkills = (opportunity.opportunity_skills || []).map((os: any) => ({
        skillId: os.skills?.id || 'skill',
        skillName: os.skills?.name || 'Skill',
        minimumLevel: os.minimum_level || 60,
        importance: os.importance || 'High',
      }))

      // Fetch student skills for snapshot
      const { data: studentSkillsData } = await (supabase as any)
        .from('student_skills')
        .select('skill_id, current_level, skills(id, name)')
        .eq('student_id', user.id)

      const studentSkills = (studentSkillsData || []).map((s: any) => ({
        skillId: s.skill_id,
        skillName: s.skills?.name || '',
        currentLevel: s.current_level || 0,
      }))

      // Compute readiness using Phase 4 engine
      const { evaluateOpportunityReadiness } = await import('@/lib/intelligence/engine')
      const readinessResult = evaluateOpportunityReadiness(
        { id: opportunity.id, title: 'Opportunity', companyName: '', skills: oppSkills },
        studentSkills
      )

      await (supabase as any)
        .from('application_readiness_snapshots')
        .insert({
          application_id: data.id,
          readiness_percentage: readinessResult.matchPercentage,
          skills_met: readinessResult.skillsMetCount,
          total_skills: readinessResult.totalSkillsCount,
          snapshot_data: {
            matchPercentage: readinessResult.matchPercentage,
            readinessCategory: readinessResult.readinessCategory,
            skillsMetCount: readinessResult.skillsMetCount,
            totalSkillsCount: readinessResult.totalSkillsCount,
            mainBlocker: readinessResult.mainBlocker,
            skills: readinessResult.skills.map(s => ({
              skillName: s.skillName,
              met: s.met,
              currentLevel: s.currentLevel,
              requiredLevel: s.requiredLevel,
              gap: s.gap,
            })),
          },
        })
    } catch (snapshotErr) {
      // Snapshot failure must never fail the application itself
      console.warn('Readiness snapshot failed (non-critical):', snapshotErr)
    }
  }

  return apiSuccess(data, 201)
}
