import { z } from 'zod'

export const CareerNavigatorRecommendationSchema = z.object({
  type: z.enum(['career', 'hybrid', 'skills', 'explore', 'unknown']).default('career'),
  careerSlug: z.string().default(''),
  careerName: z.string().default(''),
  confidence: z.number().min(0).max(100).default(70),
  reason: z.string().default(''),
})

export const CareerNavigatorComparisonItemSchema = z.object({
  careerId: z.string().optional(),
  careerName: z.string(),
  careerSlug: z.string(),
  fitScore: z.number().min(0).max(100),
  skillGapLevel: z.string(),
  marketOutlook: z.string(),
  transitionDifficulty: z.string(),
  missingSkills: z.array(z.string()).default([]),
})

export const CareerNavigatorOutputSchema = z.object({
  intent: z.enum([
    'CAREER_COMPARISON',
    'CAREER_DISCOVERY',
    'CAREER_TRANSITION',
    'CAREER_MARKET',
    'SKILL_CHOICE',
    'CAREER_FIT',
    'LEARNING_PRIORITY',
  ]).default('CAREER_COMPARISON'),
  headline: z.string(),
  summary: z.string(),
  recommendation: CareerNavigatorRecommendationSchema,
  comparison: z.array(CareerNavigatorComparisonItemSchema).default([]),
  why: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  market: z.object({
    available: z.boolean().default(true),
    summary: z.string().default(''),
    sources: z.array(z.string()).default([]),
  }).optional(),
  nextSteps: z.array(z.string()).default([]),
  followUpQuestion: z.string().nullable().optional(),
})

export type CareerNavigatorOutput = z.infer<typeof CareerNavigatorOutputSchema>
