import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { InstitutionAnalytics } from '@/types'

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
      const { data } = await supabase
        .from('institution_analytics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(1)
        .single()

      const analytics = data as unknown as InstitutionAnalytics | null

      if (analytics) {
        return {
          cohortName: "CS Dept - Class of 2024",
          totalCohort: analytics.total_students || 120,
          avgReadiness: analytics.overall_readiness || 68,
          needIntervention: analytics.students_needing_intervention || 15,
          internshipReady: analytics.internship_participation || 42,
          criticalGaps: [
            { skill: "REST API Security", affected: "61 students", current: 40, req: 75 },
            { skill: "Node.js Async", affected: "45 students", current: 52, req: 80 },
            { skill: "System Design Basics", affected: "38 students", current: 30, req: 60 }
          ],
          alignmentItems: [
            { skill: "React / Frontend", demand: 90, alignment: 85 },
            { skill: "Python / Data", demand: 85, alignment: 70 },
            { skill: "Cloud Fundamentals", demand: 80, alignment: 40 },
            { skill: "SQL / DB", demand: 75, alignment: 88 },
          ]
        }
      }
    } catch (e) {
      console.warn('Error fetching academician dashboard data:', e)
    }
  }

  // Consistent Phase 1 database-aligned fallback
  return {
    cohortName: "CS Dept - Class of 2024",
    totalCohort: 120,
    avgReadiness: 68,
    needIntervention: 15,
    internshipReady: 42,
    criticalGaps: [
      { skill: "REST API Security", affected: "61 students", current: 40, req: 75 },
      { skill: "Node.js Async", affected: "45 students", current: 52, req: 80 },
      { skill: "System Design Basics", affected: "38 students", current: 30, req: 60 }
    ],
    alignmentItems: [
      { skill: "React / Frontend", demand: 90, alignment: 85 },
      { skill: "Python / Data", demand: 85, alignment: 70 },
      { skill: "Cloud Fundamentals", demand: 80, alignment: 40 },
      { skill: "SQL / DB", demand: 75, alignment: 88 },
    ]
  }
}
