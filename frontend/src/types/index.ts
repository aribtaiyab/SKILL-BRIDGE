import { Database, UserRole, VerificationStatus, GapStatus, ApplicationStatus, WorkMode } from './database'

export * from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type StudentProfile = Database['public']['Tables']['student_profiles']['Row']
export type CareerTarget = Database['public']['Tables']['career_targets']['Row']
export type Skill = Database['public']['Tables']['skills']['Row']
export type StudentSkill = Database['public']['Tables']['student_skills']['Row']
export type SkillGap = Database['public']['Tables']['skill_gaps']['Row']
export type Assessment = Database['public']['Tables']['assessments']['Row']
export type AssessmentQuestion = Database['public']['Tables']['assessment_questions']['Row']
export type AssessmentOption = Database['public']['Tables']['assessment_options']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Certification = Database['public']['Tables']['certifications']['Row']
export type Opportunity = Database['public']['Tables']['opportunities']['Row']
export type OpportunitySkill = Database['public']['Tables']['opportunity_skills']['Row']
export type OpportunityMatch = Database['public']['Tables']['opportunity_matches']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type ApplicationStatusHistory = Database['public']['Tables']['application_status_history']['Row']
export type InstitutionAnalytics = Database['public']['Tables']['institution_analytics']['Row']
export type IndustrySkillDemand = Database['public']['Tables']['industry_skill_demand']['Row']

// Extended UI View Models
export interface SkillOverviewItem {
  id?: string
  name: string
  req: number
  val: number
  status: 'gap' | 'near' | 'ready'
  verification?: string
  category?: string
}

export interface SkillCategoryGroup {
  category: string
  skills: {
    id?: string
    name: string
    score: number
    level: string
    status: 'gap' | 'improve' | 'ready'
    verification: string
  }[]
}

export interface CareerTargetOption {
  id: string
  name: string
  slug: string
  match: number
  opps: number
  description?: string
}

export interface OpportunityCardItem {
  id: string
  role: string
  company: string
  match: number
  type: string
  location: string
  duration: string
  deadline: string
  skills: {
    name: string
    met: boolean
  }[]
}

export interface ApplicationTimelineItem {
  status: string
  date: string
  completed: boolean
}

export interface ApplicationCardItem {
  id: string
  opportunityId: string
  role: string
  company: string
  status: string
  dateApplied: string
  lastUpdate: string
  match: number
  feedback?: string
  timeline: ApplicationTimelineItem[]
}

export interface StudentDashboardData {
  studentName: string
  careerTarget: string
  readinessPercentage: number
  priorityGap: {
    skillName: string
    currentScore: number
    targetScore: number
    description: string
  }
  skills: SkillOverviewItem[]
  topMatches: {
    role: string
    company: string
    match: number
    type: string
  }[]
  recentActivity: {
    text: string
    time: string
    type: string
  }[]
}
