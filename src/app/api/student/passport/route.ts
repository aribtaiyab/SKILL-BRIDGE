import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { getVerificationBadgeInfo, VerificationLevel } from '@/lib/intelligence/verification'
import crypto from 'crypto'

// GET /api/student/passport — complete verified skill passport for student
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  // 1. Get or create passport settings with unique share token
  let { data: settings } = await (supabase as any)
    .from('passport_settings')
    .select('*')
    .eq('student_id', user.id)
    .single()

  if (!settings) {
    const shareToken = crypto.randomBytes(16).toString('hex')
    const { data: newSettings } = await (supabase as any)
      .from('passport_settings')
      .insert({
        student_id: user.id,
        share_token: shareToken,
        is_public: false,
        show_skills: true,
        show_projects: true,
        show_certifications: true,
        show_readiness: true,
      })
      .select()
      .single()
    settings = newSettings
  }

  // 2. Fetch student profile and institution
  const { data: studentProfile } = await (supabase as any)
    .from('student_profiles')
    .select(`
      id, department_id,
      institutions(name)
    `)
    .eq('profile_id', user.id)
    .single()

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  // 3. Fetch student skills with verification status
  const { data: studentSkills } = await (supabase as any)
    .from('student_skills')
    .select(`
      id, current_level, verification_status, last_assessed_at,
      skills(id, name, category)
    `)
    .eq('student_id', user.id)
    .order('current_level', { ascending: false })

  // 4. Fetch verified evidence count per skill
  const { data: evidenceSkills } = await (supabase as any)
    .from('evidence_skills')
    .select(`
      skill_id,
      evidence!inner(id, title, status, evidence_type, url)
    `)
    .eq('evidence.student_id', user.id)
    .eq('evidence.status', 'verified')
    .eq('verification_status', 'verified')

  const proofCountMap = new Map<string, number>()
  const proofItemsMap = new Map<string, { id: string; title: string; type: string; url?: string }[]>()

  for (const es of evidenceSkills || []) {
    const count = proofCountMap.get(es.skill_id) || 0
    proofCountMap.set(es.skill_id, count + 1)

    const list = proofItemsMap.get(es.skill_id) || []
    list.push({
      id: es.evidence.id,
      title: es.evidence.title,
      type: es.evidence.evidence_type,
      url: es.evidence.url,
    })
    proofItemsMap.set(es.skill_id, list)
  }

  // 5. Fetch projects
  const { data: projects } = await (supabase as any)
    .from('projects')
    .select('id, title, description, project_url, github_url, technologies, created_at')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  // 6. Fetch certifications
  const { data: certs } = await (supabase as any)
    .from('certifications')
    .select('id, name, issuing_organization, issue_date, credential_url, verification_status')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  // 7. Fetch audit trail (verification records)
  const { data: auditRecords } = await (supabase as any)
    .from('verification_records')
    .select(`
      id, verification_type, verified_level, verification_source, notes, verified_at,
      skills(name)
    `)
    .eq('student_id', user.id)
    .order('verified_at', { ascending: false })
    .limit(10)

  // 8. Fetch target career readiness
  const { data: targetData } = await (supabase as any)
    .from('career_targets')
    .select(`
      id,
      careers(id, title)
    `)
    .eq('student_id', user.id)
    .single()

  const formattedSkills = (studentSkills || []).map((s: any) => {
    const vStatus = (s.verification_status || 'self_declared') as VerificationLevel
    const badgeInfo = getVerificationBadgeInfo(vStatus)
    const proofCount = proofCountMap.get(s.skills?.id) || 0
    const proofItems = proofItemsMap.get(s.skills?.id) || []

    return {
      id: s.id,
      skillId: s.skills?.id,
      name: s.skills?.name || 'Skill',
      category: s.skills?.category || 'Technical',
      currentLevel: s.current_level || 0,
      verificationStatus: vStatus,
      verificationBadge: {
        label: badgeInfo.label,
        shortLabel: badgeInfo.shortLabel,
        variant: badgeInfo.variant,
        description: badgeInfo.description,
      },
      proofCount,
      proofItems,
    }
  })

  return apiSuccess({
    profile: {
      name: profile?.full_name || 'Student',
      email: profile?.email || '',
      institution: studentProfile?.institutions?.name || 'Academic Institution',
      targetCareer: targetData?.careers?.title || 'Full Stack Engineer',
    },
    settings: {
      shareToken: settings?.share_token,
      isPublic: settings?.is_public || false,
      headline: settings?.headline || '',
      bio: settings?.bio || '',
      showSkills: settings?.show_skills ?? true,
      showProjects: settings?.show_projects ?? true,
      showCertifications: settings?.show_certifications ?? true,
      showReadiness: settings?.show_readiness ?? true,
    },
    skills: formattedSkills,
    projects: projects || [],
    certifications: certs || [],
    auditRecords: (auditRecords || []).map((ar: any) => ({
      id: ar.id,
      skillName: ar.skills?.name || 'Skill',
      verificationType: ar.verification_type,
      verifiedLevel: ar.verified_level,
      source: ar.verification_source,
      notes: ar.notes,
      verifiedAt: ar.verified_at,
    })),
  })
}
