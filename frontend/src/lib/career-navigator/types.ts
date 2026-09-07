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
  followUpQuestion: z.object({
    questionText: z.string(),
    options: z.array(z.string()).min(2),
  }).nullable().optional(),
})

export type CareerNavigatorAIOutput = z.infer<typeof CareerNavigatorOutputSchema>

export interface CareerNavigatorResponse {
  success: boolean
  data: {
    sessionId?: string
    intent: CareerNavigatorIntent
    headline: string
    summary: string
    recommendation: {
      type: 'single' | 'hybrid' | 'explore'
      careerSlug?: string
      careerName?: string
      confidence: number
      reason: string
    }
    comparison: CareerComparisonItem[]
    why: string[]
    strengths: string[]
    gaps: Array<{
      careerName: string
      skills: string[]
    }>
    nextSteps: string[]
    bridgeMilestones: string[]
    recommendedActionRoute: string
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
  }
  error?: string
}
