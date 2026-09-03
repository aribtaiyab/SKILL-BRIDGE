import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/industry/opportunities — list own opportunities
export async function GET(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  // Verify the user has an industry profile
  const { data: industryProfile } = await (supabase as any)
    .from('industry_profiles')
    .select('profile_id')
    .eq('profile_id', user.id)
    .single()

  if (!industryProfile) return apiError('FORBIDDEN', 'Industry profile required.', 403)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''

  let query = (supabase as any)
    .from('opportunities')
    .select('id, title, opportunity_type, location, status, deadline, spots_available, created_at')
    .eq('industry_id', user.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) return apiError('FETCH_FAILED', 'Could not retrieve opportunities.', 500)

  return apiSuccess(data || [])
}

// POST /api/industry/opportunities — create a new opportunity
export async function POST(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: {
    title?: string
    description?: string
    type?: string
    opportunity_type?: string
    location?: string
    work_mode?: string
    duration?: string
    stipend?: number
    deadline?: string
    application_deadline?: string
    required_qualifications?: string
    responsibilities?: string
    perks?: string
    spots_available?: number
    skills?: { skill_id: string; required_level?: number; minimum_level?: number; is_mandatory?: boolean }[]
  }

  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const title = String(body.title || '').trim()
  const description = String(body.description || '').trim()

  if (!title || title.length < 5) {
    return apiError('VALIDATION_ERROR', 'Title must be at least 5 characters.', 422)
  }
  if (!description || description.length < 20) {
    return apiError('VALIDATION_ERROR', 'Description must be at least 20 characters.', 422)
  }

  const supabase = await createSupabaseServerClient()

  // Verify industry profile
  const { data: industryProfile } = await (supabase as any)
    .from('industry_profiles')
    .select('profile_id')
    .eq('profile_id', user.id)
    .single()

  if (!industryProfile) return apiError('FORBIDDEN', 'Industry profile required to post opportunities.', 403)

  // Create opportunity — industry_id from session
  const { data: opportunity, error } = await (supabase as any)
    .from('opportunities')
    .insert({
      industry_id: user.id,
      title,
      description,
      opportunity_type: body.opportunity_type || body.type || 'Internship',
      location: body.location || 'Remote',
      duration: body.duration || null,
      deadline: body.deadline || body.application_deadline || null,
      spots_available: body.spots_available || 1,
      status: 'draft',
    })
    .select()
    .single()

  if (error || !opportunity) return apiError('CREATE_FAILED', 'Could not create opportunity.', 500)

  // Add required skills if provided
  if (body.skills && Array.isArray(body.skills) && body.skills.length > 0) {
    const skillRows = body.skills.map(s => ({
      opportunity_id: opportunity.id,
      skill_id: s.skill_id,
      minimum_level: s.minimum_level || s.required_level || 60,
      importance: s.is_mandatory ? 'High' : 'Medium',
    }))

    await (supabase as any).from('opportunity_skills').insert(skillRows)
  }

  return apiSuccess(opportunity, 201)
}
