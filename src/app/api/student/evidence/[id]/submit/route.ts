import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// POST /api/student/evidence/[id]/submit — submit draft evidence for review
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid evidence ID.', 400)

  const supabase = await createSupabaseServerClient()

  // Verify ownership and status
  const { data: existing } = await (supabase as any)
    .from('evidence')
    .select('id, status, student_id, title')
    .eq('id', id)
    .single()

  if (!existing || existing.student_id !== user.id) {
    return apiError('NOT_FOUND', 'Evidence not found.', 404)
  }

  if (existing.status === 'verified') {
    return apiError('CONFLICT', 'Evidence is already verified.', 409)
  }

  if (existing.status === 'under_review' || existing.status === 'submitted') {
    return apiError('CONFLICT', 'Evidence is already submitted and awaiting review.', 409)
  }

  const { data: updated, error } = await (supabase as any)
    .from('evidence')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return apiError('SUBMIT_FAILED', 'Could not submit evidence.', 500)

  return apiSuccess({
    id: updated.id,
    title: updated.title,
    status: updated.status,
    submittedAt: updated.submitted_at,
  })
}
