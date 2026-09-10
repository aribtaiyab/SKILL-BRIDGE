import { z } from 'zod'
import { CareerMarketData } from './market-service'
import { CareerComparisonItem } from './comparison-engine'

export type CareerNavigatorIntent =
  | 'CAREER_COMPARISON'
  | 'CAREER_DISCOVERY'
  | 'CAREER_FIT'
  | 'CAREER_TRANSITION'
  | 'CAREER_MARKET'
  | 'SKILL_CHOICE'
  | 'LEARNING_PRIORITY'
  | 'GENERAL_CAREER'
  | 'CLARIFICATION_REQUIRED'

export interface StudentCareerContext {
  studentId: string
  fullName: string
  targetCareer: string
  targetCareerId?: string
  readinessScore: number
  skills: Array<{
    skillId: string
    name: string
    currentLevel: number
    verifiedLevel: number
    verificationStatus: string
    category: string
  }>
  assessedSkillsCount: number
  topStrengths: string[]
  priorityGapSkill?: string
  priorityGapPoints: number
  criticalGapsCount: number
  hasEvidence: boolean
  matchingOpportunitiesCount: number
  topOpportunityTitle?: string
}

export const CareerNavigatorOutputSchema = z.object({
  intent: z.enum([
    'CAREER_COMPARISON',
    'CAREER_DISCOVERY',
    'CAREER_FIT',
    'CAREER_TRANSITION',
    'CAREER_MARKET',
    'SKILL_CHOICE',
    'LEARNING_PRIORITY',
    'GENERAL_CAREER',
    'CLARIFICATION_REQUIRED',
  ]),
  answer: z.object({
    headline: z.string(),
    summary: z.string(),
  }),
  recommendation: z.object({
    type: z.enum(['single', 'hybrid', 'explore']),
    careerSlug: z.string().optional(),
    careerName: z.string().optional(),
    confidence: z.number().min(0).max(100),
    reason: z.string(),
  }),
  why: z.array(z.string()).min(1).max(6),
  strengths: z.array(z.string()),
  nextSteps: z.array(z.string()).min(1),
  followUpQuestion: z.union([
    z.object({
      questionText: z.string(),
      options: z.array(z.string()).default([]),
    }),
    z.string().transform(q => ({ questionText: q, options: ['Explore more', 'Review skills'] })),
  ]).nullable().optional(),
})

export type CareerNavigatorAIOutput = z.infer<typeof CareerNavigatorOutputSchema>

export interface CareerNavigatorResponse {
  success: boolean
  data: {
    sessionId?: string
    intent: CareerNavigatorIntent | string
    extractedQuery?: {
      intent: string
      subjectA?: string
      subjectB?: string
      currentSkill?: string
      rawQuery: string
    }
    headline: string
    summary: string
    directAnswer?: string
    why?: string[]
    marketOutlook?: {
      available: boolean
      demand?: string
      growth?: string
      opportunityVolume?: string
      entryLevelOpportunity?: string
      industryRelevance?: string
      summary?: string
      note?: string
      skillMomentum?: string[]
    }
    currentFit?: {
      score: number
      targetCareer: string
      fitLevel: string
      summary: string
    }
    skillsHave?: Array<{
      name: string
      level: number
      verificationStatus: string
      isVerified: boolean
    }>
    skillsMissing?: string[]
    skillGaps?: Array<{
      skillName: string
      currentLevel: number
      requiredLevel: number
      deficit: number
    }>
    whatToLearn?: string[]
    roadmap?: {
      day7: string
      day30: string
      day60: string
      day90: string
    }
    finalRecommendation?: string
    recommendation: {
      type?: 'single' | 'hybrid' | 'explore'
      careerSlug?: string
      careerName?: string
      confidence: number
      reason: string
    }
    comparison?: CareerComparisonItem[]
    strengths?: string[]
    gaps?: Array<{
      careerName: string
      skills: string[]
    }>
    nextSteps?: string[]
    bridgeMilestones?: string[]
    recommendedActionRoute?: string
    followUpQuestion?: {
      questionText: string
      options: string[]
    } | null
    marketSummary?: {
      source: string
      freshness: string
      summary: string
      dataAvailable: boolean
    }
    isFromFallback?: boolean
    fallbackNotice?: string | null
  }
  error?: string
}
