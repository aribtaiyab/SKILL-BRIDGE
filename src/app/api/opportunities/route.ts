import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/opportunities — public listing of published opportunities
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const type = searchParams.get('type') || ''
  const location = searchParams.get('location') || ''
  const workMode = searchParams.get('work_mode') || ''
  const sort = searchParams.get('sort') || 'newest' // newest | deadline
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  const supabase = await createSupabaseServerClient()

  // Sort order
  const sortColumn = sort === 'deadline' ? 'deadline' : 'created_at'
  const sortAsc = sort === 'deadline'

  let query = (supabase as any)
    .from('opportunities')
    .select(`
      id, title, description, opportunity_type, location, work_mode, duration,
      deadline, spots_available, created_at,
      industry_profiles(organization_name, industry_type),
      opportunity_skills(minimum_level, importance, skills(id, name))
    `, { count: 'exact' })
    .eq('status', 'published')
    .order(sortColumn, { ascending: sortAsc })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }
  if (type && type !== 'All Types') {
    query = query.eq('opportunity_type', type)
  }
  if (location) {
    query = query.ilike('location', `%${location}%`)
  }
  if (workMode && workMode !== 'all') {
    query = query.eq('work_mode', workMode)
  }

  const { data, error, count } = await query

  if (error) return apiError('FETCH_FAILED', 'Could not retrieve opportunities.', 500)

  return apiSuccess({
    opportunities: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    }
  })
}
