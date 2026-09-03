import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// PATCH /api/industry/applications/[id]/status — update application status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid application ID.', 400)

  let body: { status?: string; notes?: string; feedback?: string }
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const newStatus = String(body.status || '').trim()
  const VALID_STATUSES = ['applied', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn']

  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return apiError('VALIDATION_ERROR', `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 422)
  }

  const supabase = await createSupabaseServerClient()

  // Verify that this application is for an opportunity owned by the current industry user
  const { data: applicationData } = await (supabase as any)
    .from('applications')
    .select('id, current_status, opportunities!inner(id, industry_id)')
    .eq('id', id)
    .single()

  const application = applicationData as { id: string; current_status: string; opportunities?: { id: string; industry_id: string } } | null

  if (!application) return apiError('NOT_FOUND', 'Application not found.', 404)

  const opp = application.opportunities
  if (!opp || opp.industry_id !== user.id) {
    return apiError('FORBIDDEN', 'You do not have permission to update this application.', 403)
  }

  // Update application status
  const { data: updated, error: updateError } = await (supabase as any)
    .from('applications')
    .update({
      current_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) return apiError('UPDATE_FAILED', 'Could not update application status.', 500)

  // Record status history
  await (supabase as any)
    .from('application_status_history')
    .insert({
      application_id: id,
      status: newStatus,
      note: body.notes || `Status changed to ${newStatus}`,
      changed_by: user.id,
      changed_at: new Date().toISOString(),
    })

  return apiSuccess(updated)
}
