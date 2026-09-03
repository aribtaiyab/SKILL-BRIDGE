import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'

// POST /api/opportunities/[id]/save — save an opportunity
// DELETE /api/opportunities/[id]/save — unsave an opportunity

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid opportunity ID.', 400)

  const supabase = await createSupabaseServerClient()

  // Verify opportunity exists and is published
  const { data: opp } = await (supabase as any)
    .from('opportunities')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!opp) return apiError('NOT_FOUND', 'Opportunity not found.', 404)
  if (opp.status !== 'published') return apiError('NOT_AVAILABLE', 'Opportunity is not available.', 409)

  const { error } = await (supabase as any)
    .from('saved_opportunities')
    .insert({ student_id: user.id, opportunity_id: id })

  if (error) {
    if (error.code === '23505') {
      return apiError('DUPLICATE', 'Opportunity already saved.', 409)
    }
    return apiError('SAVE_FAILED', 'Could not save opportunity.', 500)
  }

  return apiSuccess({ saved: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid opportunity ID.', 400)

  const supabase = await createSupabaseServerClient()

  const { error } = await (supabase as any)
    .from('saved_opportunities')
    .delete()
    .eq('student_id', user.id)
    .eq('opportunity_id', id)

  if (error) return apiError('UNSAVE_FAILED', 'Could not unsave opportunity.', 500)

  return apiSuccess({ saved: false })
}
