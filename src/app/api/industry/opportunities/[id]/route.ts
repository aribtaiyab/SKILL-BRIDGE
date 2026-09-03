import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/industry/opportunities/[id] — get own opportunity detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid opportunity ID.', 400)

  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as any)
    .from('opportunities')
    .select(`
      id, title, description, opportunity_type, location, duration,
      deadline, spots_available, status, created_at,
      opportunity_skills(minimum_level, importance, skills(id, name, category))
    `)
    .eq('id', id)
    .eq('industry_id', user.id)
    .single()

  if (error || !data) return apiError('NOT_FOUND', 'Opportunity not found.', 404)

  return apiSuccess(data)
}

// PATCH /api/industry/opportunities/[id] — update or publish own opportunity
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid opportunity ID.', 400)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const supabase = await createSupabaseServerClient()

  // Verify ownership
  const { data: existingData } = await (supabase as any)
    .from('opportunities')
    .select('industry_id, status')
    .eq('id', id)
    .single()

  const existing = existingData as { industry_id?: string; status?: string } | null
  if (!existing) return apiError('NOT_FOUND', 'Opportunity not found.', 404)
  if (existing.industry_id !== user.id) return apiError('FORBIDDEN', 'Permission denied.', 403)

  // Don't allow editing archived opportunities
  if (existing.status === 'archived' && body.status !== 'draft') {
    return apiError('FORBIDDEN', 'Archived opportunities cannot be edited.', 403)
  }

  const allowedFields: Record<string, unknown> = {}
  const ALLOWED_KEYS = [
    'title', 'description', 'opportunity_type', 'location', 'duration',
    'deadline', 'spots_available', 'status'
  ]

  for (const key of ALLOWED_KEYS) {
    if (body[key] !== undefined) allowedFields[key] = body[key]
  }

  if (Object.keys(allowedFields).length === 0) {
    return apiError('VALIDATION_ERROR', 'No valid fields to update.', 422)
  }

  // Validate status transitions
  const VALID_STATUSES = ['draft', 'published', 'closed', 'archived']
  if (allowedFields.status && !VALID_STATUSES.includes(String(allowedFields.status))) {
    return apiError('VALIDATION_ERROR', `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 422)
  }

  const { data, error } = await (supabase as any)
    .from('opportunities')
    .update({ ...allowedFields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('industry_id', user.id)
    .select()
    .single()

  if (error) return apiError('UPDATE_FAILED', 'Could not update opportunity.', 500)

  return apiSuccess(data)
}
