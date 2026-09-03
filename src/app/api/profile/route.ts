import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/profile — returns the current user's profile
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (error || !profile) return apiError('NOT_FOUND', 'Profile not found.', 404)

  return apiSuccess(profile)
}

// PATCH /api/profile — updates current user's profile
export async function PATCH(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: { full_name?: string; avatar_url?: string }
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  // Validate — only allow safe fields
  const allowedFields: Record<string, unknown> = {}
  if (body.full_name !== undefined) {
    const name = String(body.full_name).trim()
    if (name.length < 2 || name.length > 100) {
      return apiError('VALIDATION_ERROR', 'Full name must be between 2 and 100 characters.', 422)
    }
    allowedFields.full_name = name
  }
  if (body.avatar_url !== undefined) {
    allowedFields.avatar_url = String(body.avatar_url)
  }

  if (Object.keys(allowedFields).length === 0) {
    return apiError('VALIDATION_ERROR', 'No valid fields provided to update.', 422)
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as any)
    .from('profiles')
    .update({ ...allowedFields, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select('id, full_name, email, role, avatar_url')
    .single()

  if (error) return apiError('UPDATE_FAILED', 'Could not update profile. Please try again.', 500)

  return apiSuccess(data)
}
