import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'
import { resolveHigherVerificationStatus, VerificationLevel } from '@/lib/intelligence/verification'

// POST /api/verification/[id]/approve — approve submitted evidence and promote skill verification
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid evidence ID.', 400)

  let body: { notes?: string; skillApprovals?: { skillId: string; approved: boolean; notes?: string }[] } = {}
  try {
    body = await request.json()
  } catch {
    // Body is optional
  }

  const supabase = await createSupabaseServerClient()

  // 1. Verify reviewer authorization
  const { data: reviewerProfile } = await (supabase as any)
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!reviewerProfile || !['academician', 'institution'].includes(reviewerProfile.role)) {
    return apiError('FORBIDDEN', 'Only authorized academic reviewers can verify evidence.', 403)
  }

  // 2. Fetch evidence with linked skills
  const { data: evidence, error: evError } = await (supabase as any)
    .from('evidence')
    .select(`
      id, student_id, title, evidence_type, status,
      evidence_skills(id, skill_id, student_claimed_level, skills(id, name))
    `)
    .eq('id', id)
    .single()

  if (evError || !evidence) return apiError('NOT_FOUND', 'Evidence not found.', 404)

  const now = new Date().toISOString()
  const targetVerificationLevel: VerificationLevel =
    reviewerProfile.role === 'institution' ? 'institution_verified' : 'evidence_verified'

  // 3. Mark evidence as verified
  await (supabase as any)
    .from('evidence')
    .update({
      status: 'verified',
      verified_at: now,
      verified_by: user.id,
      reviewer_feedback: body.notes || 'Verified through academic proof review.',
      updated_at: now,
    })
    .eq('id', id)

  // 4. Update evidence_skills and promote student_skills
  const linkedSkills = evidence.evidence_skills || []

  for (const es of linkedSkills) {
    // Check if individual skill was approved (default true)
    const specificApproval = body.skillApprovals?.find(sa => sa.skillId === es.skill_id)
    const isApproved = specificApproval ? specificApproval.approved : true

    if (isApproved) {
      await (supabase as any)
        .from('evidence_skills')
        .update({
          verification_status: 'verified',
          review_notes: specificApproval?.notes || body.notes || 'Verified',
        })
        .eq('id', es.id)

      // Fetch student's current skill record to resolve hierarchy
      const { data: currentSkill } = await (supabase as any)
        .from('student_skills')
        .select('id, current_level, verification_status')
        .eq('student_id', evidence.student_id)
        .eq('skill_id', es.skill_id)
        .single()

      if (currentSkill) {
        const currentStatus = currentSkill.verification_status || 'self_declared'
        const upgradedStatus = resolveHigherVerificationStatus(currentStatus, targetVerificationLevel)

        await (supabase as any)
          .from('student_skills')
          .update({
            verification_status: upgradedStatus,
            updated_at: now,
          })
          .eq('id', currentSkill.id)

        // Insert audit trail in verification_records
        await (supabase as any).from('verification_records').insert({
          student_id: evidence.student_id,
          skill_id: es.skill_id,
          evidence_id: evidence.id,
          verification_type: evidence.evidence_type,
          verified_level: currentSkill.current_level || 70,
          verified_by: user.id,
          verification_source: `${reviewerProfile.role === 'institution' ? 'Institution' : 'Academician'} Review: ${reviewerProfile.full_name || 'Coordinator'}`,
          notes: body.notes || `Evidence '${evidence.title}' verified`,
          verified_at: now,
        })
      }
    } else {
      await (supabase as any)
        .from('evidence_skills')
        .update({
          verification_status: 'rejected',
          review_notes: specificApproval?.notes || 'Skill claim was not substantiated by evidence',
        })
        .eq('id', es.id)
    }
  }

  return apiSuccess({
    id: evidence.id,
    status: 'verified',
    verifiedAt: now,
    verificationLevel: targetVerificationLevel,
  })
}
