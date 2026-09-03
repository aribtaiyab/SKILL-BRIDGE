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
        const careerTargetName = studentProfile.career_targets?.name || 'Backend Developer'

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

        const dynamicReadiness = reqs.length > 0
          ? calculateOverallReadiness(reqs, studentScores)
          : 78

        const topMatches = (matches || []).map((m) => {
          return {
            role: m.opportunities?.title || 'Role',
            company: m.opportunities?.industry_profiles?.organization_name || 'Organization',
            match: m.match_percentage,
            type: m.opportunities?.opportunity_type || 'Internship'
          }
        })

        return {
          studentName: profile.full_name,
          careerTarget: careerTargetName,
          readinessPercentage: dynamicReadiness,
          priorityGap: {
            skillName: priorityGapRow?.skills?.name || 'Node.js',
            currentScore: priorityGapRow?.current_score || 65,
            targetScore: priorityGapRow?.required_score || 80,
            description: `Your ${priorityGapRow?.skills?.name || 'Node.js'} score is ${priorityGapRow?.current_score || 65} (Target: ${priorityGapRow?.required_score || 80}). Addressing this gap will improve your overall readiness and unlock new opportunities.`
          },
          skills: skillsOverview.length > 0 ? skillsOverview : [
            { name: 'Node.js', req: 80, val: 65, status: 'gap' },
            { name: 'REST APIs', req: 75, val: 72, status: 'near' },
            { name: 'SQL', req: 70, val: 82, status: 'ready' },
            { name: 'Git', req: 60, val: 75, status: 'ready' },
          ],
          topMatches: topMatches.length > 0 ? topMatches : [
            { role: 'Backend Intern', company: 'TechFlow Solutions', match: 91, type: 'Internship' },
            { role: 'Junior Developer', company: 'DataSync Inc', match: 85, type: 'Job' },
            { role: 'API Development', company: 'CloudCore', match: 82, type: 'Project' },
            { role: 'Backend Mentorship', company: 'Senior Dev Network', match: 100, type: 'Mentorship' },
          ],
          recentActivity: [
            { text: 'SQL Skill verified through practical assessment', time: '2 days ago', type: 'success' },
            { text: 'Career Target updated to Backend Developer', time: '1 week ago', type: 'warning' },
            { text: 'Improved REST APIs score from 60 to 72', time: '2 weeks ago', type: 'accent' },
            { text: 'Completed Initial Baseline Assessment', time: '1 month ago', type: 'neutral' },
          ]
        }
      }
    } catch (err) {
      console.warn('Error fetching student dashboard data from Supabase:', err)
    }
  }

  // Return genuine empty state if no profile or career found
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
        .select(`
          id,
          name,
          slug,
          description,
          career_target_skills(count)
        `)
        .eq('is_active', true)

      const rows = data as unknown as (RawCareerRow & { career_target_skills: [{ count: number }] })[] | null

      if (rows && rows.length > 0) {
        return rows.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          match: 78,
          opps: 12,
          description: c.description || undefined,
        }))
      }
    } catch (err) {
      console.warn('Error fetching career targets from Supabase:', err)
    }
  }

  // Consistent Phase 1 database-aligned fallback
  return [
    { id: '1', name: 'Backend Developer', slug: 'backend', match: 78, opps: 14, description: 'Server-side logic, databases, APIs, and scalable infrastructure.' },
    { id: '2', name: 'Frontend Developer', slug: 'frontend', match: 62, opps: 9, description: 'User interfaces, responsive layouts, web performance, and client-side architecture.' },
    { id: '3', name: 'Full Stack Engineer', slug: 'fullstack', match: 70, opps: 20, description: 'End-to-end web development spanning databases, servers, and modern UI frameworks.' },
    { id: '4', name: 'Security Analyst', slug: 'security', match: 45, opps: 6, description: 'Threat analysis, vulnerability assessment, cryptography, and network defense.' },
    { id: '5', name: 'DevOps Engineer', slug: 'devops', match: 58, opps: 8, description: 'CI/CD pipelines, containerization, cloud infrastructure, and monitoring.' },
  ]
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
