import { getSupabasePublic } from '../config/supabase.js'
import { isSupabaseConfigured } from '../config/env.js'
import { StudentDashboardData, SkillOverviewItem, CareerTargetOption, SkillCategoryGroup } from '../types/index.js'
import { calculateOverallReadiness } from '../intelligence/engine.js'

const supabase = getSupabasePublic()

const DEFAULT_STUDENT_ID = '00000000-0000-0000-0000-000000000001'

interface RawProfileRow {
  full_name: string
}

interface RawStudentProfileRow {
  target_career_id: string | null
  career_targets: {
    name: string
  } | null
}

interface RawGapRow {
  skill_id: string
  required_score: number
  current_score: number
  gap_score: number
  priority: string
  status: string
  skills: {
    name: string
  } | null
}

interface RawMatchRow {
  match_percentage: number
  opportunities: {
    title: string
    opportunity_type: string
    industry_profiles: {
      organization_name: string
    } | null
  } | null
}

interface RawCareerRow {
  id: string
  name: string
  slug: string
  description: string | null
}

interface RawStudentSkillRow {
  current_level: number
  verification_status: string
  skills: {
    id: string
    name: string
    category: string
  } | null
}

export async function getStudentDashboardData(studentId: string = DEFAULT_STUDENT_ID): Promise<StudentDashboardData> {
  if (isSupabaseConfigured()) {
    try {
      const { data: profileData } = await (supabase as any)
        .from('profiles')
        .select('full_name')
        .eq('id', studentId)
        .single()

      const { data: studentProfileData } = await (supabase as any)
        .from('student_profiles')
        .select('target_career_id, career_targets(name)')
        .eq('profile_id', studentId)
        .single()

      const { data: gapsData } = await (supabase as any)
        .from('skill_gaps')
        .select('skill_id, required_score, current_score, gap_score, priority, status, skills(name)')
        .eq('student_id', studentId)
        .order('gap_score', { ascending: false })

      const { data: matchesData } = await (supabase as any)
        .from('opportunity_matches')
        .select('match_percentage, opportunities(title, opportunity_type, industry_profiles(organization_name))')
        .eq('student_id', studentId)
        .order('match_percentage', { ascending: false })
        .limit(4)

      const profile = profileData as unknown as RawProfileRow | null
      const studentProfile = studentProfileData as unknown as RawStudentProfileRow | null
      const gaps = gapsData as unknown as RawGapRow[] | null
      const matches = matchesData as unknown as RawMatchRow[] | null

      if (profile && studentProfile) {
        const priorityGapRow = gaps?.[0]
        const careerTargetName = studentProfile.career_targets?.name || 'Not Set'

        const skillsOverview: SkillOverviewItem[] = (gaps || []).map((g) => {
          const name = g.skills?.name || 'Skill'
          return {
            name,
            req: g.required_score,
            val: g.current_score,
            status: g.status === 'ready' ? 'ready' : g.gap_score <= 5 ? 'near' : 'gap'
          }
        })

        const reqs = (gaps || []).map(g => ({
          skillId: g.skill_id,
          skillName: g.skills?.name || 'Skill',
          requiredLevel: g.required_score,
          importance: g.priority || 'High',
        }))

        const studentScores = (gaps || []).map(g => ({
          skillId: g.skill_id,
          skillName: g.skills?.name || 'Skill',
          currentLevel: g.current_score,
        }))

        const dynamicReadiness = reqs.length > 0 ? calculateOverallReadiness(reqs, studentScores) : 0

        const topMatches = (matches || []).map((m) => ({
          role: m.opportunities?.title || 'Role',
          company: m.opportunities?.industry_profiles?.organization_name || 'Organization',
          match: m.match_percentage,
          type: m.opportunities?.opportunity_type || 'Internship'
        }))

        return {
          studentName: profile.full_name,
          careerTarget: careerTargetName,
          readinessPercentage: dynamicReadiness,
          priorityGap: {
            skillName: priorityGapRow?.skills?.name || 'None',
            currentScore: priorityGapRow?.current_score || 0,
            targetScore: priorityGapRow?.required_score || 0,
            description: priorityGapRow ? `Your ${priorityGapRow.skills?.name || 'skill'} score is ${priorityGapRow.current_score} (Target: ${priorityGapRow.required_score}).` : 'Choose a target career and complete an assessment to see your skill gaps.'
          },
          skills: skillsOverview,
          topMatches,
          recentActivity: []
        }
      }
    } catch (err) {
      console.warn('Error fetching student dashboard data from Supabase:', err)
    }
  }

  return {
    studentName: 'Student',
    careerTarget: 'Not Set',
    readinessPercentage: 0,
    priorityGap: {
      skillName: 'None',
      currentScore: 0,
      targetScore: 0,
      description: 'Choose a target career and complete an assessment to see your skill gaps.'
    },
    skills: [],
    topMatches: [],
    recentActivity: []
  }
}

export async function getCareerTargets(): Promise<CareerTargetOption[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await (supabase as any)
        .from('career_targets')
        .select('id, name, slug, description')
        .eq('is_active', true)
        .order('name', { ascending: true })

      const rows = data as unknown as RawCareerRow[] | null
      if (rows && rows.length > 0) {
        return rows.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          match: 0,
          opps: 0,
          description: c.description || undefined,
        }))
      }
    } catch (err) {
      console.warn('Error fetching career targets from Supabase:', err)
    }
  }

  return []
}

export async function getStudentSkillsCategories(studentId: string = DEFAULT_STUDENT_ID): Promise<SkillCategoryGroup[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await (supabase as any)
        .from('student_skills')
        .select(`
          current_level,
          verification_status,
          skills (
            id,
            name,
            category
          )
        `)
        .eq('student_id', studentId)

      const rows = data as unknown as RawStudentSkillRow[] | null

      if (rows && rows.length > 0) {
        const groups: Record<string, { id?: string; name: string; score: number; level: string; status: 'gap' | 'improve' | 'ready'; verification: string }[]> = {}

        rows.forEach((row) => {
          const cat = row.skills?.category || 'Technical Competencies'
          if (!groups[cat]) groups[cat] = []

          let badge = 'Self-Declared'
          if (row.verification_status === 'assessment_verified') badge = 'Assessment'
          if (row.verification_status === 'practical_verified') badge = 'Practical'
          if (row.verification_status === 'evidence_verified') badge = 'Verified Evidence'
          if (row.verification_status === 'institution_verified') badge = 'Institution Verified'

          const score = row.current_level
          const status = score >= 75 ? 'ready' : score >= 60 ? 'improve' : 'gap'

          groups[cat].push({
            id: row.skills?.id,
            name: row.skills?.name || 'Skill',
            score,
            level: `${score}/100`,
            status,
            verification: badge
          })
        })

        return Object.entries(groups).map(([category, skills]) => ({
          category,
          skills
        }))
      }
    } catch (err) {
      console.warn('Error fetching student skills from Supabase:', err)
    }
  }

  return []
}
