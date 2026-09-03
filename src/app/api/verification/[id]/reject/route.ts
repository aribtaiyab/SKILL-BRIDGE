import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// POST /api/verification/[id]/reject — reject submitted evidence with constructive feedback
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid evidence ID.', 400)

  let body: { reason?: string } = {}
  try {
    body = await request.json()
  } catch {
    // Body optional
  }

  const reason = String(body.reason || '').trim()
  if (!reason) {
    return apiError('VALIDATION_ERROR', 'Please provide constructive feedback explaining the rejection.', 422)
  }

  const supabase = await createSupabaseServerClient()

  // Verify reviewer role
  const { data: reviewerProfile } = await (supabase as any)
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!reviewerProfile || !['academician', 'institution'].includes(reviewerProfile.role)) {
    return apiError('FORBIDDEN', 'Only authorized academic reviewers can reject evidence.', 403)
  }

  const now = new Date().toISOString()

  const { data: updated, error } = await (supabase as any)
    .from('evidence')
    .update({
      status: 'rejected',
      reviewer_feedback: reason,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return apiError('UPDATE_FAILED', 'Could not reject evidence.', 500)

  // Mark linked skills as rejected
  await (supabase as any)
    .from('evidence_skills')
    .update({
      verification_status: 'rejected',
      review_notes: reason,
    })
    .eq('evidence_id', id)

  return apiSuccess({
    id: updated.id,
    status: 'rejected',
    feedback: reason,
  })
}
