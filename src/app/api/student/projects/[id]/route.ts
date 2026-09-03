import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// PATCH /api/student/projects/[id] — update own project
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params

  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid project ID.', 400)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const supabase = await createSupabaseServerClient()

  // Verify ownership
  const { data: existingData } = await (supabase as any)
    .from('projects')
    .select('student_id')
    .eq('id', id)
    .single()

  const existing = existingData as { student_id?: string } | null
  if (!existing) return apiError('NOT_FOUND', 'Project not found.', 404)
  if (existing.student_id !== user.id) return apiError('FORBIDDEN', 'You do not have permission to modify this project.', 403)

  // Only allow safe updates
  const allowedFields: Record<string, unknown> = {}
  if (body.title !== undefined) allowedFields.title = String(body.title).trim()
  if (body.description !== undefined) allowedFields.description = String(body.description).trim()
  if (body.github_url !== undefined) allowedFields.github_url = body.github_url || null
  if (body.project_url !== undefined) allowedFields.project_url = body.project_url || null
  if (body.technologies !== undefined) allowedFields.technologies = Array.isArray(body.technologies) ? body.technologies : []
  if (body.start_date !== undefined) allowedFields.start_date = body.start_date || null
  if (body.end_date !== undefined) allowedFields.end_date = body.end_date || null

  if (Object.keys(allowedFields).length === 0) {
    return apiError('VALIDATION_ERROR', 'No valid fields to update.', 422)
  }

  const { data, error } = await (supabase as any)
    .from('projects')
    .update({ ...allowedFields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('student_id', user.id)
    .select()
    .single()

  if (error) return apiError('UPDATE_FAILED', 'Could not update project.', 500)

  return apiSuccess(data)
}

// DELETE /api/student/projects/[id] — delete own project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid project ID.', 400)

  const supabase = await createSupabaseServerClient()

  // Verify ownership before deleting
  const { data: existingData } = await (supabase as any)
    .from('projects')
    .select('student_id')
    .eq('id', id)
    .single()

  const existing = existingData as { student_id?: string } | null
  if (!existing) return apiError('NOT_FOUND', 'Project not found.', 404)
  if (existing.student_id !== user.id) return apiError('FORBIDDEN', 'You do not have permission to delete this project.', 403)

  const { error } = await (supabase as any)
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) return apiError('DELETE_FAILED', 'Could not delete project.', 500)

  return apiSuccess({ deleted: true })
}
