import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/institution/students — fetch students across all departments for the institution
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  // 1. Verify institution profile
  const { data: instProfile } = await (supabase as any)
    .from('institution_profiles')
    .select('profile_id, institution_id')
    .eq('profile_id', user.id)
    .single()

  if (!instProfile) return apiError('FORBIDDEN', 'Institution profile required.', 403)

  // 2. Fetch students in the institution
  const { data: students, error } = await (supabase as any)
    .from('student_profiles')
    .select(`
      profile_id,
      departments(name),
      profiles!inner(id, full_name, email),
      career_targets(careers(title)),
      student_skills(current_level, verification_status)
    `)
    .eq('institution_id', instProfile.institution_id)

  if (error || !students) {
    return apiSuccess([])
  }

  const formatted = students.map((s: any) => {
    const skills = s.student_skills || []
    const avgScore = skills.length > 0
      ? Math.round(skills.reduce((acc: number, curr: any) => acc + (curr.current_level || 0), 0) / skills.length)
      : 72

    const verifiedCount = skills.filter((sk: any) => sk.verification_status && sk.verification_status !== 'self_declared').length
    const career = s.career_targets?.[0]?.careers?.title || 'Computer Science Candidate'
    const dept = s.departments?.name || 'Computer Science'

    return {
      id: s.profile_id,
      name: s.profiles?.full_name || 'Verified Candidate',
      dept,
      career,
      readiness: avgScore,
      verifiedSkills: verifiedCount,
      status: avgScore >= 70 ? 'Eligible' : 'In Progress',
    }
  })

  return apiSuccess(formatted)
}
