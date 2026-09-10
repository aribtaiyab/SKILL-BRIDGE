import { z } from 'zod'

export const CareerNavigatorVerificationTierSchema = z.enum([
  'Self Declared',
  'Assessment Verified',
  'Practical Verified',
  'Evidence Verified',
  'Academically Verified',
])

export const CareerNavigatorSkillHaveSchema = z.object({
  name: z.string(),
  level: z.number().min(0).max(100),
  verificationTier: CareerNavigatorVerificationTierSchema.default('Self Declared'),
  isVerified: z.boolean().default(false),
})

export const CareerNavigatorSkillGapSchema = z.object({
  skill: z.string(),
  currentLevel: z.number().nullable().optional(),
  requiredLevel: z.number(),
  gap: z.number(),
  priority: z.enum(['Critical', 'Needs Improvement', 'Ready']).default('Needs Improvement'),
  status: z.enum(['Unassessed', 'Assessed']).default('Assessed'),
})

export const CareerNavigatorMarketOutlookSchema = z.object({
  available: z.boolean().default(true),
  demand: z.string().default(''),
  growth: z.string().default(''),
  opportunityVolume: z.string().default(''),
  entryLevelOpportunity: z.string().default(''),
  skillMomentum: z.array(z.string()).default([]),
  industryRelevance: z.string().default(''),
  summary: z.string().default(''),
  note: z.string().optional(),
})

export const CareerNavigatorCurrentFitSchema = z.object({
  score: z.number().min(0).max(100).default(0),
  targetCareer: z.string().default(''),
  fitLevel: z.string().default(''),
  summary: z.string().default(''),
})

export const CareerNavigatorRoadmapSchema = z.object({
  day7: z.string().default(''),
  day30: z.string().default(''),
  day60: z.string().default(''),
  day90: z.string().default(''),
}).nullable()

export const CareerNavigatorOutputSchema = z.object({
  intent: z.enum(['DISCOVER', 'COMPARE', 'TRANSITION', 'FIT', 'MARKET', 'LEARN']).default('DISCOVER'),
  extractedQuery: z.object({
    subjectA: z.string().optional(),
    subjectB: z.string().optional(),
    currentSkill: z.string().optional(),
    targetDomain: z.string().optional(),
  }).optional(),
  headline: z.string(),
  summary: z.string(),
  directAnswer: z.string(),
  why: z.array(z.string()).default([]),
  marketOutlook: CareerNavigatorMarketOutlookSchema,
  currentFit: CareerNavigatorCurrentFitSchema,
  skillsHave: z.array(CareerNavigatorSkillHaveSchema).default([]),
  skillsMissing: z.array(z.string()).default([]),
  skillGaps: z.array(CareerNavigatorSkillGapSchema).default([]),
  whatToLearn: z.array(z.string()).default([]),
  roadmap: CareerNavigatorRoadmapSchema.optional(),
  finalRecommendation: z.string(),
  recommendation: z.object({
    careerName: z.string().default(''),
    confidence: z.number().min(0).max(100).default(70),
    reason: z.string().default(''),
  }).optional(),
  comparison: z.array(z.object({
    name: z.string(),
    fitScore: z.number().min(0).max(100).default(0),
    demandOutlook: z.string().default(''),
    transitionDifficulty: z.string().default(''),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
  })).optional(),
})

export type CareerNavigatorOutput = z.infer<typeof CareerNavigatorOutputSchema>
