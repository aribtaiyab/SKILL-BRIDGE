import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/industry/opportunities/[id]/applications
// Returns applications for a specific opportunity owned by the requesting industry user.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid opportunity ID.', 400)

  const supabase = await createSupabaseServerClient()

  // Verify ownership first
  const { data: oppData } = await (supabase as any)
    .from('opportunities')
    .select('id, industry_id, title')
    .eq('id', id)
    .single()

  const opp = oppData as { id: string; industry_id: string; title: string } | null
  if (!opp) return apiError('NOT_FOUND', 'Opportunity not found.', 404)
  if (opp.industry_id !== user.id) return apiError('FORBIDDEN', 'Permission denied.', 403)

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status') || ''

  let query = (supabase as any)
    .from('applications')
    .select(`
      id, current_status, applied_at, updated_at,
      profiles!inner(id, full_name, email),
      application_readiness_snapshots(readiness_percentage, skills_met, total_skills, created_at)
    `)
    .eq('opportunity_id', id)
    .order('applied_at', { ascending: false })

  if (statusFilter) query = query.eq('current_status', statusFilter)

  const { data, error } = await query

  if (error) return apiError('FETCH_FAILED', 'Could not retrieve applications.', 500)

  const formatted = (data || []).map((row: any) => ({
    id: row.id,
    status: row.current_status,
    appliedAt: row.applied_at,
    updatedAt: row.updated_at,
    opportunityId: id,
    opportunityTitle: opp.title,
    candidate: {
      id: row.profiles?.id,
      name: row.profiles?.full_name || 'Candidate',
      email: row.profiles?.email || '',
    },
    readinessSnapshot: row.application_readiness_snapshots?.[0]
      ? {
          readinessPercentage: row.application_readiness_snapshots[0].readiness_percentage,
          skillsMet: row.application_readiness_snapshots[0].skills_met,
          totalSkills: row.application_readiness_snapshots[0].total_skills,
          snapshotAt: row.application_readiness_snapshots[0].created_at,
        }
      : null,
  }))

  return apiSuccess(formatted)
}
