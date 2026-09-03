import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/industry/applications — applications to own opportunities only
export async function GET(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  const { searchParams } = new URL(request.url)
  const opportunityId = searchParams.get('opportunity_id')
  const status = searchParams.get('status')

  // Base query — joins through opportunities to ensure we only see applications for our opportunities
  let query = (supabase as any)
    .from('applications')
    .select(`
      id, current_status, applied_at, updated_at,
      opportunities!inner(id, title, industry_id),
      profiles!inner(id, full_name, email)
    `)
    .eq('opportunities.industry_id', user.id)
    .order('applied_at', { ascending: false })

  if (opportunityId) query = query.eq('opportunity_id', opportunityId)
  if (status) query = query.eq('current_status', status)

  const { data, error } = await query

  if (error) {
    // If table doesn't have records or query fails, return clean empty
    return apiSuccess([])
  }

  const formatted = (data || []).map((row: any) => ({
    id: row.id,
    status: row.current_status || 'applied',
    created_at: row.applied_at || new Date().toISOString(),
    opportunities: row.opportunities,
    profiles: row.profiles,
  }))

  return apiSuccess(formatted)
}
