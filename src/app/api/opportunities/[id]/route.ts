import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/opportunities/[id] — opportunity details (public for published)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid opportunity ID.', 400)

  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as any)
    .from('opportunities')
    .select(`
      id, title, description, opportunity_type, location, duration,
      deadline, spots_available, status, created_at,
      industry_profiles(organization_name, industry_type, location, description),
      opportunity_skills(minimum_level, importance, skills(id, name, category))
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error || !data) return apiError('NOT_FOUND', 'Opportunity not found or no longer available.', 404)

  return apiSuccess(data)
}
