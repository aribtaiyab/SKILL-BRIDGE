import { getSupabasePublic } from '../config/supabase.js'
import { isSupabaseConfigured } from '../config/env.js'

const supabase = getSupabasePublic()

export interface IndustryDashboardStats {
  activeOpportunities: number
  matchedCandidates: number
  avgVerifiedSkillLevel: number
  recentApplications: number
  candidates: {
    name: string
    role: string
    match: number
    skills: string[]
  }[]
  inDemandSkills: {
    skill: string
    demand: string
    trend: 'up' | 'flat' | 'down'
  }[]
}

interface RawDemandRow {
  demand_percentage: number
  trend: string
  skills: {
    name: string
  } | null
}

export async function getIndustryDashboardData(): Promise<IndustryDashboardStats> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { count: oppCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      const { data } = await supabase
        .from('industry_skill_demand')
        .select('demand_percentage, trend, skills(name)')
        .limit(5)

      const demandData = data as unknown as RawDemandRow[] | null

      const formattedDemand = (demandData || []).map((d) => {
        const name = d.skills?.name || 'Skill'
        const level = d.demand_percentage >= 85 ? 'High' : 'Medium'
        return {
          skill: name,
          demand: level,
          trend: (d.trend as 'up' | 'flat' | 'down') || 'up'
        }
      })

      return {
        activeOpportunities: oppCount || 12,
        matchedCandidates: 48,
        avgVerifiedSkillLevel: 76,
        recentApplications: 6,
        candidates: [
          { name: "Sarah Jenkins", role: "Backend Developer Internship", match: 91, skills: ["Node.js", "PostgreSQL", "REST APIs"] },
          { name: "Michael Chen", role: "Frontend Developer Internship", match: 88, skills: ["React", "TypeScript", "Tailwind"] },
          { name: "David Rodriguez", role: "Backend Developer Internship", match: 85, skills: ["Node.js", "SQL", "Git"] },
          { name: "Emily Wang", role: "Data Science Internship", match: 82, skills: ["Python", "SQL", "Pandas"] }
        ],
        inDemandSkills: formattedDemand.length > 0 ? formattedDemand : [
          { skill: "React", demand: "High", trend: "up" },
          { skill: "Node.js", demand: "High", trend: "up" },
          { skill: "PostgreSQL", demand: "Medium", trend: "flat" },
          { skill: "TypeScript", demand: "Medium", trend: "up" },
          { skill: "AWS Basic", demand: "Medium", trend: "flat" },
        ]
      }
    } catch (e) {
      console.warn('Error fetching industry dashboard data:', e)
    }
  }

  // Consistent Phase 1 database-aligned fallback
  return {
    activeOpportunities: 12,
    matchedCandidates: 48,
    avgVerifiedSkillLevel: 76,
    recentApplications: 6,
    candidates: [
      { name: "Sarah Jenkins", role: "Backend Developer Internship", match: 91, skills: ["Node.js", "PostgreSQL", "REST APIs"] },
      { name: "Michael Chen", role: "Frontend Developer Internship", match: 88, skills: ["React", "TypeScript", "Tailwind"] },
      { name: "David Rodriguez", role: "Backend Developer Internship", match: 85, skills: ["Node.js", "SQL", "Git"] },
      { name: "Emily Wang", role: "Data Science Internship", match: 82, skills: ["Python", "SQL", "Pandas"] }
    ],
    inDemandSkills: [
      { skill: "React", demand: "High", trend: "up" },
      { skill: "Node.js", demand: "High", trend: "up" },
      { skill: "PostgreSQL", demand: "Medium", trend: "flat" },
      { skill: "TypeScript", demand: "Medium", trend: "up" },
      { skill: "AWS Basic", demand: "Medium", trend: "flat" },
    ]
  }
}
