import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/student/evidence — list all evidence items for authenticated student
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  const { data: evidenceList, error } = await (supabase as any)
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
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    // If table doesn't exist yet in local testing, gracefully return empty list
    return apiSuccess([])
  }

  const formatted = (evidenceList || []).map((ev: any) => ({
    id: ev.id,
    title: ev.title,
    description: ev.description,
    evidenceType: ev.evidence_type,
    url: ev.url,
    documentId: ev.document_id,
    status: ev.status,
    reviewerFeedback: ev.reviewer_feedback,
    submittedAt: ev.submitted_at,
    verifiedAt: ev.verified_at,
    createdAt: ev.created_at,
    updatedAt: ev.updated_at,
    skills: (ev.evidence_skills || []).map((es: any) => ({
      id: es.id,
      skillId: es.skill_id,
      skillName: es.skills?.name || 'Skill',
      category: es.skills?.category || 'Technical',
      claimedLevel: es.student_claimed_level,
      claimDescription: es.student_claim_description,
      verificationStatus: es.verification_status,
      reviewNotes: es.review_notes,
    })),
  }))

  return apiSuccess(formatted)
}

// POST /api/student/evidence — create new evidence (draft or submitted)
export async function POST(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: {
    title?: string
    description?: string
    evidenceType?: string
    url?: string
    documentId?: string
    submitNow?: boolean
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

  const title = String(body.title || '').trim()
  const description = String(body.description || '').trim()
  const evidenceType = body.evidenceType || 'project'
  const url = body.url ? String(body.url).trim() : null
  const skills = Array.isArray(body.skills) ? body.skills : []

  if (!title || title.length < 3) {
    return apiError('VALIDATION_ERROR', 'Title must be at least 3 characters.', 422)
  }

  if (url && !/^https?:\/\/.+/i.test(url)) {
    return apiError('VALIDATION_ERROR', 'URL must start with http:// or https://', 422)
  }

  const status = body.submitNow ? 'submitted' : 'draft'
  const submittedAt = body.submitNow ? new Date().toISOString() : null

  const supabase = await createSupabaseServerClient()

  // 1. Insert evidence
  const { data: evidence, error: evError } = await (supabase as any)
    .from('evidence')
    .insert({
      student_id: user.id,
      title,
      description,
      evidence_type: evidenceType,
      url,
      document_id: body.documentId || null,
      status,
      submitted_at: submittedAt,
    })
    .select()
    .single()

  if (evError || !evidence) {
    return apiError('CREATE_FAILED', 'Could not create evidence entry.', 500)
  }

  // 2. Insert skill claims if any
  if (skills.length > 0) {
    const skillRows = skills.map(s => ({
      evidence_id: evidence.id,
      skill_id: s.skillId,
      student_claimed_level: s.claimedLevel || null,
      student_claim_description: s.claimDescription || null,
      verification_status: 'pending',
    }))

    await (supabase as any).from('evidence_skills').insert(skillRows)
  }

  return apiSuccess(
    {
      id: evidence.id,
      title: evidence.title,
      status: evidence.status,
      submittedAt: evidence.submitted_at,
    },
    201
  )
}
