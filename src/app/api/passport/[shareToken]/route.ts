import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/auth/server'
import { projectPublicPassport } from '@/lib/intelligence/verification'

// GET /api/passport/[shareToken] — privacy-filtered public passport view
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params
  const cleanToken = String(shareToken || '').trim()

  if (!cleanToken || cleanToken.length < 8) {
    return apiError('INVALID_REQUEST', 'Invalid passport share token.', 400)
  }

  const supabase = await createSupabaseServerClient()

  // 1. Fetch passport settings
  const { data: settings } = await (supabase as any)
    .from('passport_settings')
    .select('*')
    .eq('share_token', cleanToken)
    .single()

  if (!settings || !settings.is_public) {
    return apiError('NOT_FOUND', 'This skill passport is private or does not exist.', 404)
  }

  const studentId = settings.student_id

  // 2. Fetch public profile info
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name')
    .eq('id', studentId)
    .single()

  const { data: studentProfile } = await (supabase as any)
    .from('student_profiles')
    .select('institutions(name)')
    .eq('profile_id', studentId)
    .single()

  // 3. Fetch skills
  const { data: studentSkills } = await (supabase as any)
    .from('student_skills')
    .select('current_level, verification_status, skills(id, name, category)')
    .eq('student_id', studentId)
    .order('current_level', { ascending: false })

  // 4. Fetch verified evidence count per skill
  const { data: evidenceSkills } = await (supabase as any)
    .from('evidence_skills')
    .select('skill_id, evidence!inner(id, title, evidence_type, url, status)')
    .eq('evidence.student_id', studentId)
    .eq('evidence.status', 'verified')
    .eq('verification_status', 'verified')

  const proofCountMap = new Map<string, number>()
  for (const es of evidenceSkills || []) {
    const count = proofCountMap.get(es.skill_id) || 0
    proofCountMap.set(es.skill_id, count + 1)
  }

  // 5. Fetch verified projects
  const { data: projects } = await (supabase as any)
    .from('projects')
    .select('title, description, project_url, github_url, technologies')
    .eq('student_id', studentId)

  // 6. Fetch verified certifications
  const { data: certs } = await (supabase as any)
    .from('certifications')
    .select('name, issuing_organization, issue_date, verification_status')
    .eq('student_id', studentId)

  // 7. Format skills
  const skillsList = (studentSkills || []).map((s: any) => ({
    name: s.skills?.name || 'Skill',
    category: s.skills?.category || 'Technical',
    level: s.current_level || 0,
    verification_status: s.verification_status || 'self_declared',
    proof_count: proofCountMap.get(s.skills?.id) || 0,
  }))

  const projectsList = (projects || []).map((p: any) => ({
    title: p.title,
    description: p.description,
    evidence_type: 'project',
    url: p.github_url || p.project_url || null,
    is_verified: true,
    skills: p.technologies || [],
  }))

  const certsList = (certs || []).map((c: any) => ({
    name: c.name,
    issuing_organization: c.issuing_organization,
    issue_date: c.issue_date,
    verification_status: c.verification_status || 'self_declared',
  }))

  // 8. Project safe public output
  const publicView = projectPublicPassport(
    {
      full_name: profile?.full_name || 'Verified Candidate',
      institution_name: studentProfile?.institutions?.name,
    },
    {
      shareToken: settings.share_token,
      headline: settings.headline,
      bio: settings.bio,
      show_skills: settings.show_skills,
      show_projects: settings.show_projects,
      show_certifications: settings.show_certifications,
      show_readiness: settings.show_readiness,
    },
    skillsList,
    projectsList,
    certsList
  )

  return apiSuccess(publicView)
}
