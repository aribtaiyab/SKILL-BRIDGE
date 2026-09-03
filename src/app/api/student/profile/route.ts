import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/student/profile — returns detailed student profile
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as any)
    .from('student_profiles')
    .select(`
      profile_id, education, graduation_year, experience_level,
      target_career_id, onboarding_completed, created_at, updated_at,
      profiles!inner(id, full_name, email, avatar_url, location, bio)
    `)
    .eq('profile_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return apiError('FETCH_FAILED', 'Could not retrieve student profile.', 500)
  }

  return apiSuccess(data || null)
}

// PATCH /api/student/profile — update student-specific profile fields
export async function PATCH(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const supabase = await createSupabaseServerClient()

  const allowedFields: Record<string, unknown> = {}
  const ALLOWED_KEYS = [
    'education', 'graduation_year', 'experience_level', 'target_career_id'
  ]

  for (const key of ALLOWED_KEYS) {
    if (body[key] !== undefined) allowedFields[key] = body[key]
  }

  if (Object.keys(allowedFields).length === 0) {
    return apiError('VALIDATION_ERROR', 'No valid fields to update.', 422)
  }

  const { data, error } = await (supabase as any)
    .from('student_profiles')
    .update({ ...allowedFields, updated_at: new Date().toISOString() })
    .eq('profile_id', user.id)
    .select()
    .single()

  if (error) return apiError('UPDATE_FAILED', 'Could not update student profile.', 500)

  return apiSuccess(data)
}
