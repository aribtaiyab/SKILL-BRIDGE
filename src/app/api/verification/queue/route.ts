import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/verification/queue — fetch pending evidence for academician/institution reviewers
export async function GET(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status') || 'submitted'

  const supabase = await createSupabaseServerClient()

  // Verify reviewer role (academician or institution)
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['academician', 'institution'].includes(profile.role)) {
    return apiError('FORBIDDEN', 'Only authorized academic reviewers can access the verification queue.', 403)
  }

  // Get reviewer institution if available to scope students
  let studentScopeIds: string[] | null = null

  if (profile.role === 'academician') {
    const { data: acadProfile } = await (supabase as any)
      .from('academician_profiles')
      .select('institution_id')
      .eq('profile_id', user.id)
      .single()

    if (acadProfile?.institution_id) {
      const { data: students } = await (supabase as any)
        .from('student_profiles')
        .select('profile_id')
        .eq('institution_id', acadProfile.institution_id)
      studentScopeIds = (students || []).map((s: any) => s.profile_id)
    }
  } else if (profile.role === 'institution') {
    const { data: instProfile } = await (supabase as any)
      .from('institution_profiles')
      .select('institution_id')
      .eq('profile_id', user.id)
      .single()

    if (instProfile?.institution_id) {
      const { data: students } = await (supabase as any)
        .from('student_profiles')
        .select('profile_id')
        .eq('institution_id', instProfile.institution_id)
      studentScopeIds = (students || []).map((s: any) => s.profile_id)
    }
  }

  let query = (supabase as any)
    .from('evidence')
    .select(`
      id, title, description, evidence_type, url, status,
      submitted_at, created_at, reviewer_feedback,
      profiles!inner(id, full_name, email),
      evidence_skills(
        id, skill_id, student_claimed_level, student_claim_description,
        verification_status, review_notes,
        skills(id, name, category)
      )
    `)
    .order('submitted_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  if (studentScopeIds && studentScopeIds.length > 0) {
    query = query.in('student_id', studentScopeIds)
  }

  const { data, error } = await query

  if (error) return apiSuccess([])

  const formatted = (data || []).map((ev: any) => ({
    id: ev.id,
    title: ev.title,
    description: ev.description,
    evidenceType: ev.evidence_type,
    url: ev.url,
    status: ev.status,
    submittedAt: ev.submitted_at,
    reviewerFeedback: ev.reviewer_feedback,
    student: {
      id: ev.profiles?.id,
      name: ev.profiles?.full_name || 'Student',
      email: ev.profiles?.email || '',
    },
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
