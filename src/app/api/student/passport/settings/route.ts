import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// PATCH /api/student/passport/settings — update passport visibility and headline
export async function PATCH(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: {
    isPublic?: boolean
    headline?: string
    bio?: string
    showSkills?: boolean
    showProjects?: boolean
    showCertifications?: boolean
    showReadiness?: boolean
  }

  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const supabase = await createSupabaseServerClient()

  const updates: any = { updated_at: new Date().toISOString() }
  if (body.isPublic !== undefined) updates.is_public = Boolean(body.isPublic)
  if (body.headline !== undefined) updates.headline = String(body.headline).trim().slice(0, 255)
  if (body.bio !== undefined) updates.bio = String(body.bio).trim().slice(0, 1000)
  if (body.showSkills !== undefined) updates.show_skills = Boolean(body.showSkills)
  if (body.showProjects !== undefined) updates.show_projects = Boolean(body.showProjects)
  if (body.showCertifications !== undefined) updates.show_certifications = Boolean(body.showCertifications)
  if (body.showReadiness !== undefined) updates.show_readiness = Boolean(body.showReadiness)

  const { data, error } = await (supabase as any)
    .from('passport_settings')
    .update(updates)
    .eq('student_id', user.id)
    .select()
    .single()

  if (error) return apiError('UPDATE_FAILED', 'Could not update passport settings.', 500)

  return apiSuccess({
    shareToken: data.share_token,
    isPublic: data.is_public,
    headline: data.headline,
    bio: data.bio,
    showSkills: data.show_skills,
    showProjects: data.show_projects,
    showCertifications: data.show_certifications,
    showReadiness: data.show_readiness,
  })
}
