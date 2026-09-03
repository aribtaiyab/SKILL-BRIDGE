import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/student/career-target — returns current student's career target
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  const { data: studentProfile, error } = await (supabase as any)
    .from('student_profiles')
    .select('target_career_id, career_targets(id, name, slug, description, category)')
    .eq('profile_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return apiError('FETCH_FAILED', 'Could not retrieve career target.', 500)
  }

  return apiSuccess(studentProfile || null)
}

// PATCH /api/student/career-target — set or update career target
export async function PATCH(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: { role_id?: string; target_career_id?: string }
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const careerId = body.target_career_id || body.role_id
  if (!careerId) {
    return apiError('VALIDATION_ERROR', 'target_career_id is required.', 422)
  }

  const supabase = await createSupabaseServerClient()

  // Verify career target exists
  const { data: careerTarget } = await (supabase as any)
    .from('career_targets')
    .select('id')
    .eq('id', careerId)
    .single()

  if (!careerTarget) return apiError('NOT_FOUND', 'Career target not found.', 404)

  // Update career target on student profile
  const { data, error } = await (supabase as any)
    .from('student_profiles')
    .update({
      target_career_id: careerId,
      updated_at: new Date().toISOString(),
    })
    .eq('profile_id', user.id)
    .select()
    .single()

  if (error) return apiError('UPDATE_FAILED', 'Could not update career target.', 500)

  return apiSuccess(data)
}
