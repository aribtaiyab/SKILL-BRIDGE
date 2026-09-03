import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// PATCH /api/student/certifications/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid certification ID.', 400)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const supabase = await createSupabaseServerClient()

  // Ownership check
  const { data: existingData } = await (supabase as any)
    .from('certifications')
    .select('student_id')
    .eq('id', id)
    .single()

  const existing = existingData as { student_id?: string } | null
  if (!existing) return apiError('NOT_FOUND', 'Certification not found.', 404)
  if (existing.student_id !== user.id) return apiError('FORBIDDEN', 'Permission denied.', 403)

  const allowedFields: Record<string, unknown> = {}
  if (body.name !== undefined) allowedFields.name = String(body.name).trim()
  if (body.issuing_organization !== undefined) allowedFields.issuing_organization = String(body.issuing_organization).trim()
  if (body.issue_date !== undefined) allowedFields.issue_date = body.issue_date || null
  if (body.expiry_date !== undefined) allowedFields.expiry_date = body.expiry_date || null
  if (body.credential_url !== undefined) allowedFields.credential_url = body.credential_url || null

  const { data, error } = await (supabase as any)
    .from('certifications')
    .update(allowedFields)
    .eq('id', id)
    .eq('student_id', user.id)
    .select()
    .single()

  if (error) return apiError('UPDATE_FAILED', 'Could not update certification.', 500)

  return apiSuccess(data)
}

// DELETE /api/student/certifications/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid certification ID.', 400)

  const supabase = await createSupabaseServerClient()

  const { data: existingData } = await (supabase as any)
    .from('certifications')
    .select('student_id')
    .eq('id', id)
    .single()

  const existing = existingData as { student_id?: string } | null
  if (!existing) return apiError('NOT_FOUND', 'Certification not found.', 404)
  if (existing.student_id !== user.id) return apiError('FORBIDDEN', 'Permission denied.', 403)

  const { error } = await (supabase as any)
    .from('certifications')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) return apiError('DELETE_FAILED', 'Could not delete certification.', 500)

  return apiSuccess({ deleted: true })
}
