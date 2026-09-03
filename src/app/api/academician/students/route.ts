import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/academician/students — fetch students in the academician's institution
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  // 1. Verify academician profile
  const { data: acadProfile } = await (supabase as any)
    .from('academician_profiles')
    .select('profile_id, institution_id, department_id')
    .eq('profile_id', user.id)
    .single()

  if (!acadProfile) return apiError('FORBIDDEN', 'Academician profile required.', 403)

  // 2. Fetch students in the institution
  const { data: students, error } = await (supabase as any)
    .from('student_profiles')
    .select(`
      profile_id,
      profiles!inner(id, full_name, email),
      career_targets(careers(title)),
      student_skills(current_level, verification_status)
    `)
    .eq('institution_id', acadProfile.institution_id)

  if (error || !students) {
    return apiSuccess([])
  }

  const formatted = students.map((s: any) => {
    const skills = s.student_skills || []
    const avgScore = skills.length > 0
      ? Math.round(skills.reduce((acc: number, curr: any) => acc + (curr.current_level || 0), 0) / skills.length)
      : 70

    const verifiedCount = skills.filter((sk: any) => sk.verification_status && sk.verification_status !== 'self_declared').length
    const career = s.career_targets?.[0]?.careers?.title || 'Full Stack Engineer'

    let status = 'On Track'
    if (avgScore >= 80) status = 'High Readiness'
    else if (avgScore < 65) status = 'Needs Support'

    return {
      id: s.profile_id,
      name: s.profiles?.full_name || 'Student Candidate',
      email: s.profiles?.email || '',
      career,
      readiness: avgScore,
      priorityGap: skills.length > 0 ? 'Core Foundations' : 'Assessment Pending',
      verifiedSkills: verifiedCount,
      status,
    }
  })

  return apiSuccess(formatted)
}
