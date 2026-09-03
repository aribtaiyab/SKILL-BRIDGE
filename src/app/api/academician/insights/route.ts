import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/academician/insights
// Returns cohort-level insights for the academician's department/institution.

export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  // 1. Verify academician profile and get their institution
  const { data: acadProfile } = await (supabase as any)
    .from('academician_profiles')
    .select('profile_id, institution_id, department_id')
    .eq('profile_id', user.id)
    .single()

  if (!acadProfile) return apiError('FORBIDDEN', 'Academician profile required.', 403)

  const institutionId = acadProfile.institution_id

  // 2. Get students at this institution
  const { data: studentData } = await (supabase as any)
    .from('student_profiles')
    .select('profile_id')
    .eq('institution_id', institutionId)

  const studentIds = (studentData || []).map((s: any) => s.profile_id)
  const totalStudents = studentIds.length

  if (totalStudents === 0) {
    return apiSuccess({
      summary: { totalStudents: 0, studentsAssessed: 0, avgSkillLevel: 0 },
      topSkills: [],
      skillGaps: [],
      industryDemand: [],
    })
  }

  // 3. Aggregate skill data — no individual exposure
  const { data: skillsData } = await (supabase as any)
    .from('student_skills')
    .select('student_id, skill_id, current_level, skills(name)')
    .in('student_id', studentIds)

  const studentsAssessed = new Set((skillsData || []).map((s: any) => s.student_id)).size

  const skillMap = new Map<string, { name: string; totalLevel: number; count: number }>()
  for (const row of skillsData || []) {
    const name = row.skills?.name
    if (!name) continue
    const existing = skillMap.get(row.skill_id) || { name, totalLevel: 0, count: 0 }
    existing.totalLevel += row.current_level || 0
    existing.count++
    skillMap.set(row.skill_id, existing)
  }

  const allSkillAggregates = [...skillMap.values()]
    .map(s => ({
      skillName: s.name,
      avgLevel: Math.round(s.totalLevel / s.count),
      studentCount: s.count,
    }))

  const avgSkillLevel =
    allSkillAggregates.length > 0
      ? Math.round(allSkillAggregates.reduce((sum, s) => sum + s.avgLevel, 0) / allSkillAggregates.length)
      : 0

  const topSkills = [...allSkillAggregates].sort((a, b) => b.avgLevel - a.avgLevel).slice(0, 5)
  const skillGaps = [...allSkillAggregates].sort((a, b) => a.avgLevel - b.avgLevel).slice(0, 5)

  // 4. Industry demand across all published opportunities
  const { data: demandData } = await (supabase as any)
    .from('opportunity_skills')
    .select('minimum_level, skills(name)')
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

  const industryDemand = [...demandMap.values()]
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
      avgSkillLevel,
    },
    topSkills,
    skillGaps,
    industryDemand,
  })
}
