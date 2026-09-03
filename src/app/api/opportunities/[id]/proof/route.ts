import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, isValidUUID, apiSuccess, apiError } from '@/lib/auth/server'
import { calculateProofCoverage } from '@/lib/intelligence/verification'

// GET /api/opportunities/[id]/proof — opportunity-specific proof coverage for student
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  if (!isValidUUID(id)) return apiError('INVALID_REQUEST', 'Invalid opportunity ID.', 400)

  const supabase = await createSupabaseServerClient()

  // 1. Fetch opportunity required skills
  const { data: oppData, error: oppError } = await (supabase as any)
    .from('opportunities')
    .select(`
      id, title,
      opportunity_skills(minimum_level, importance, skills(id, name))
    `)
    .eq('id', id)
    .single()

  if (oppError || !oppData) return apiError('NOT_FOUND', 'Opportunity not found.', 404)

  const requiredSkills = (oppData.opportunity_skills || []).map((os: any) => ({
    skillId: os.skills?.id || 'skill',
    skillName: os.skills?.name || 'Skill',
    minimumLevel: os.minimum_level || 60,
  }))

  // 2. Fetch student skills
  const { data: studentSkillsData } = await (supabase as any)
    .from('student_skills')
    .select('skill_id, current_level, verification_status, skills(id, name)')
    .eq('student_id', user.id)

  const studentSkills = (studentSkillsData || []).map((s: any) => ({
    skillId: s.skill_id,
    skillName: s.skills?.name || '',
    currentLevel: s.current_level || 0,
    verificationStatus: s.verification_status || 'self_declared',
  }))

  // 3. Fetch student verified evidence
  const { data: evidenceData } = await (supabase as any)
    .from('evidence')
    .select(`
      id, title, evidence_type, url, status,
      evidence_skills(skill_id, verification_status, skills(name))
    `)
    .eq('student_id', user.id)

  const studentEvidence = (evidenceData || []).map((ev: any) => ({
    id: ev.id,
    title: ev.title,
    evidenceType: ev.evidence_type,
    url: ev.url,
    status: ev.status,
    skillsClaimed: (ev.evidence_skills || []).map((es: any) => ({
      skillId: es.skill_id,
      skillName: es.skills?.name || '',
      verificationStatus: es.verification_status,
    })),
  }))

  // 4. Compute proof coverage deterministically
  const coverage = calculateProofCoverage(requiredSkills, studentSkills, studentEvidence)

  return apiSuccess({
    opportunityId: oppData.id,
    opportunityTitle: oppData.title,
    coverage,
  })
}
