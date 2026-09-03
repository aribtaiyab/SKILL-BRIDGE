import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// POST /api/verification/[id]/clarify — request clarification on evidence
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid evidence ID.', 400)

  let body: { message?: string } = {}
  try {
    body = await request.json()
  } catch {
    // Body optional
  }

  const message = String(body.message || '').trim()
  if (!message) {
    return apiError('VALIDATION_ERROR', 'Please specify what clarification or additional proof is needed.', 422)
  }

  const supabase = await createSupabaseServerClient()

  // Verify reviewer role
  const { data: reviewerProfile } = await (supabase as any)
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!reviewerProfile || !['academician', 'institution'].includes(reviewerProfile.role)) {
    return apiError('FORBIDDEN', 'Only authorized academic reviewers can request clarification.', 403)
  }

  const now = new Date().toISOString()

  const { data: updated, error } = await (supabase as any)
    .from('evidence')
    .update({
      status: 'needs_clarification',
      reviewer_feedback: message,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return apiError('UPDATE_FAILED', 'Could not request clarification.', 500)

  return apiSuccess({
    id: updated.id,
    status: 'needs_clarification',
    feedback: message,
  })
}
