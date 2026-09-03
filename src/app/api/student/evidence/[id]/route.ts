import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/student/evidence/[id] — get single evidence details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid evidence ID.', 400)

  const supabase = await createSupabaseServerClient()

  const { data: ev, error } = await (supabase as any)
    .from('evidence')
    .select(`
      id, title, description, evidence_type, url, document_id, status,
      reviewer_feedback, submitted_at, verified_at, created_at, updated_at,
      evidence_skills(
        id, skill_id, student_claimed_level, student_claim_description,
        verification_status, review_notes,
        skills(id, name, category)
      )
    `)
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (error || !ev) return apiError('NOT_FOUND', 'Evidence not found.', 404)

  return apiSuccess(ev)
}

// PATCH /api/student/evidence/[id] — update evidence (only allowed if draft, rejected, or needs_clarification)
export async function PATCH(
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
    .select('id, status, student_id')
    .eq('id', id)
    .single()

  if (!existing || existing.student_id !== user.id) {
    return apiError('NOT_FOUND', 'Evidence not found.', 404)
  }

  if (existing.status === 'verified') {
    return apiError('FORBIDDEN', 'Verified evidence cannot be directly modified.', 403)
  }

  let body: {
    title?: string
    description?: string
    evidenceType?: string
    url?: string
    skills?: {
      skillId: string
      claimedLevel?: number
      claimDescription?: string
    }[]
  }

  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const updates: any = { updated_at: new Date().toISOString() }
  if (body.title) updates.title = String(body.title).trim()
  if (body.description !== undefined) updates.description = String(body.description).trim()
  if (body.evidenceType) updates.evidence_type = body.evidenceType
  if (body.url !== undefined) {
    const url = body.url ? String(body.url).trim() : null
    if (url && !/^https?:\/\/.+/i.test(url)) {
      return apiError('VALIDATION_ERROR', 'URL must start with http:// or https://', 422)
    }
    updates.url = url
  }

  const { data: updated, error: updateError } = await (supabase as any)
    .from('evidence')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateError) return apiError('UPDATE_FAILED', 'Could not update evidence.', 500)

  // Update skills if provided
  if (Array.isArray(body.skills)) {
    // Delete existing links
    await (supabase as any).from('evidence_skills').delete().eq('evidence_id', id)

    // Insert new links
    if (body.skills.length > 0) {
      const skillRows = body.skills.map(s => ({
        evidence_id: id,
        skill_id: s.skillId,
        student_claimed_level: s.claimedLevel || null,
        student_claim_description: s.claimDescription || null,
        verification_status: 'pending',
      }))
      await (supabase as any).from('evidence_skills').insert(skillRows)
    }
  }

  return apiSuccess(updated)
}

// DELETE /api/student/evidence/[id] — delete draft or archived evidence
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid evidence ID.', 400)

  const supabase = await createSupabaseServerClient()

  const { data: existing } = await (supabase as any)
    .from('evidence')
    .select('id, status, student_id')
    .eq('id', id)
    .single()

  if (!existing || existing.student_id !== user.id) {
    return apiError('NOT_FOUND', 'Evidence not found.', 404)
  }

  if (existing.status === 'verified') {
    return apiError('FORBIDDEN', 'Verified evidence cannot be deleted directly.', 403)
  }

  const { error } = await (supabase as any)
    .from('evidence')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) return apiError('DELETE_FAILED', 'Could not delete evidence.', 500)

  return apiSuccess({ deleted: true })
}
