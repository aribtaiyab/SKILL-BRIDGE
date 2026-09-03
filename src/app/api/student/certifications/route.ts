import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/student/certifications
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as any)
    .from('certifications')
    .select('id, name, issuing_organization, issue_date, expiry_date, credential_url, verification_status')
    .eq('student_id', user.id)
    .order('issue_date', { ascending: false })

  if (error) return apiError('FETCH_FAILED', 'Could not retrieve certifications.', 500)

  return apiSuccess(data || [])
}

// POST /api/student/certifications
export async function POST(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: {
    name?: string
    issuing_organization?: string
    issue_date?: string
    expiry_date?: string
    credential_url?: string
  }

  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const name = String(body.name || '').trim()
  const org = String(body.issuing_organization || '').trim()

  if (!name || name.length < 2) {
    return apiError('VALIDATION_ERROR', 'Certification name is required.', 422)
  }
  if (!org || org.length < 2) {
    return apiError('VALIDATION_ERROR', 'Issuing organization is required.', 422)
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as any)
    .from('certifications')
    .insert({
      student_id: user.id,
      name,
      issuing_organization: org,
      issue_date: body.issue_date || null,
      expiry_date: body.expiry_date || null,
      credential_url: body.credential_url || null,
      verification_status: 'self_declared',
    })
    .select()
    .single()

  if (error) return apiError('CREATE_FAILED', 'Could not add certification.', 500)

  return apiSuccess(data, 201)
}
