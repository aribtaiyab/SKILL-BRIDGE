import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/institution/insights
// Returns aggregated skill gap and readiness analytics for students at this institution.
// Individual student data is never exposed — only cohort-level aggregates.

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

  const institutionId = instProfile.institution_id

  // 2. Get all students at this institution
  const { data: studentData } = await (supabase as any)
    .from('student_profiles')
    .select('profile_id')
    .eq('institution_id', institutionId)

  const studentIds = (studentData || []).map((s: any) => s.profile_id)
  const totalStudents = studentIds.length

  if (totalStudents === 0) {
    return apiSuccess({
      summary: { totalStudents: 0, studentsAssessed: 0, avgReadiness: 0, totalApplications: 0 },
      skillGaps: [],
      demandedSkills: [],
    })
  }

  // 3. Get assessed skills across the cohort (aggregated only)
  const { data: skillsData } = await (supabase as any)
    .from('student_skills')
    .select('skill_id, current_level, skills(name)')
    .in('student_id', studentIds)

  const skillAggregates = new Map<string, { name: string; totalLevel: number; count: number }>()
  for (const row of skillsData || []) {
    const name = row.skills?.name
    if (!name) continue
    const existing = skillAggregates.get(row.skill_id) || { name, totalLevel: 0, count: 0 }
    existing.totalLevel += row.current_level || 0
    existing.count++
    skillAggregates.set(row.skill_id, existing)
  }

  const studentsAssessed = new Set((skillsData || []).map((s: any) => s.student_id)).size

  const skillGaps = [...skillAggregates.entries()].map(([skillId, agg]) => ({
    skillId,
    skillName: agg.name,
    avgLevel: Math.round(agg.totalLevel / agg.count),
    studentCount: agg.count,
  })).sort((a, b) => a.avgLevel - b.avgLevel) // lowest average = biggest gap

  // 4. Applications from institution students
  const { data: appsData } = await (supabase as any)
    .from('applications')
    .select('id, current_status')
    .in('student_id', studentIds)

  const totalApplications = (appsData || []).length
  const selectedApplications = (appsData || []).filter((a: any) => a.current_status === 'selected').length

  // 5. Most-demanded skills across all published opportunities
  const { data: demandData } = await (supabase as any)
    .from('opportunity_skills')
    .select('minimum_level, skills(id, name)')
    .not('skills', 'is', null)

  const demandMap = new Map<string, { name: string; count: number; totalMinLevel: number }>()
  for (const row of demandData || []) {
    const name = row.skills?.name
    if (!name) continue
    const existing = demandMap.get(name) || { name, count: 0, totalMinLevel: 0 }
    existing.count++
    existing.totalMinLevel += row.minimum_level || 60
    demandMap.set(name, existing)
  }

  const demandedSkills = [...demandMap.values()]
    .map(d => ({
      skillName: d.name,
      demandCount: d.count,
      avgRequiredLevel: Math.round(d.totalMinLevel / d.count),
    }))
    .sort((a, b) => b.demandCount - a.demandCount)
    .slice(0, 10)

  return apiSuccess({
    summary: {
      totalStudents,
      studentsAssessed,
      totalApplications,
      selectedApplications,
    },
    skillGaps: skillGaps.slice(0, 10),
    demandedSkills,
  })
}
