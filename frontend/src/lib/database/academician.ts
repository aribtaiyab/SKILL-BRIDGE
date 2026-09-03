import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

export interface AcademicianDashboardStats {
  cohortName: string
  totalCohort: number
  avgReadiness: number
  needIntervention: number
  internshipReady: number
  criticalGaps: {
    skill: string
    affected: string
    current: number
    req: number
  }[]
  alignmentItems: {
    skill: string
    demand: number
    alignment: number
  }[]
}

export async function getAcademicianDashboardData(): Promise<AcademicianDashboardStats> {
  if (isSupabaseConfigured()) {
    try {
      // 1. Query student skills
      const { data: skillsData } = await supabase
        .from('student_skills')
        .select('student_id, skill_id, current_level, skills(name)')

      const studentIds = new Set((skillsData || []).map((s: any) => s.student_id))
      const totalCohort = studentIds.size

      if (totalCohort > 0) {
        const skillAggMap = new Map<string, { name: string; total: number; count: number }>()
        for (const row of (skillsData || []) as any[]) {
          const name = row.skills?.name
          if (!name) continue
          const existing = skillAggMap.get(name) || { name, total: 0, count: 0 }
          existing.total += row.current_level || 0
          existing.count++
          skillAggMap.set(name, existing)
        }

        const gaps: AcademicianDashboardStats['criticalGaps'] = []
        let totalScoreSum = 0
        let totalScoreCount = 0
        let needIntervention = 0

        skillAggMap.forEach((val) => {
          const avg = Math.round(val.total / val.count)
          totalScoreSum += avg
          totalScoreCount++
          const req = 75
          if (avg < req) {
            gaps.push({
              skill: val.name,
              affected: `${val.count}/${totalCohort} (${Math.round((val.count / totalCohort) * 100)}%)`,
              current: avg,
              req,
            })
            if (req - avg >= 15) {
              needIntervention += val.count
            }
          }
        })

        const avgReadiness = totalScoreCount > 0 ? Math.round(totalScoreSum / totalScoreCount) : 0

        return {
          cohortName: "Academic Department Cohort",
          totalCohort,
          avgReadiness,
          needIntervention: Math.min(totalCohort, needIntervention),
          internshipReady: Math.max(0, totalCohort - needIntervention),
          criticalGaps: gaps.slice(0, 5),
          alignmentItems: [
            { skill: "Core Programming", demand: 90, alignment: avgReadiness },
            { skill: "System Architecture", demand: 85, alignment: Math.max(0, avgReadiness - 10) },
          ],
        }
      }
    } catch (e) {
      console.warn('Error fetching academician dashboard data:', e)
    }
  }

  // Honest empty state when no data exists
  return {
    cohortName: "Academic Department Cohort",
    totalCohort: 0,
    avgReadiness: 0,
    needIntervention: 0,
    internshipReady: 0,
    criticalGaps: [],
    alignmentItems: [],
  }
}
