import { z } from 'zod'

// ─── Difficulty & Types Controlled Vocabularies ──────────────────────────────
export const DifficultyLevelSchema = z.enum(['Beginner', 'Developing', 'Intermediate', 'Advanced'])
export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>

export const QuestionTypeSchema = z.enum(['multiple_choice', 'code_reasoning', 'debugging', 'architecture'])
export type QuestionType = z.infer<typeof QuestionTypeSchema>

// ─── Structured Student AI Context ───────────────────────────────────────────
export interface StudentAIContext {
  student: {
    id: string
    name: string
    education?: string
    targetCareer: string
  }
  readiness: {
    overallPercentage: number
    category: string
    priorityGapSkill: string | null
    priorityGapPoints: number
  }
  skills: {
    id: string
    name: string
    currentScore: number
    requiredScore: number
    gap: number
    importance: string
    status: 'ready' | 'needs_improvement' | 'critical'
    verificationStatus: string
  }[]
  reassessments: {
    skillName: string
    previousScore: number
    newScore: number
    recordedAt: string
  }[]
  opportunity?: {
    id: string
    title: string
    company: string
    type: string
    requiredSkills: { name: string; minLevel: number }[]
    readinessPercentage: number
  } | null
}

// ─── Diagnostic Zod Schema & Types ───────────────────────────────────────────
export const DiagnosticOutputSchema = z.object({
  skill: z.string(),
  summary: z.string(),
  currentScore: z.number(),
  targetScore: z.number(),
  gap: z.number(),
  weakAreas: z.array(z.string()),
  strengths: z.array(z.string()),
  commonMistakes: z.array(z.string()),
  prerequisites: z.array(z.string()),
  recommendedSequence: z.array(z.string()),
  nextAction: z.object({
    title: z.string(),
    description: z.string(),
    estimatedMinutes: z.number(),
  }),
  confidence: z.enum(['high', 'medium', 'low']),
})
export type DiagnosticOutput = z.infer<typeof DiagnosticOutputSchema>

// ─── Learning Plan Zod Schema & Types ─────────────────────────────────────────
export const LearningStepSchema = z.object({
  stepNumber: z.number(),
  stepType: z.enum(['understand', 'learn', 'practice', 'build', 'reassess']),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number(),
  keyConcept: z.string(),
  careerRelevance: z.string(),
  isCompleted: z.boolean().default(false),
})
export type LearningStep = z.infer<typeof LearningStepSchema>

export const LearningPlanSchema = z.object({
  id: z.string().optional(),
  skill: z.string(),
  careerTarget: z.string(),
  initialScore: z.number(),
  targetScore: z.number(),
  estimatedTotalHours: z.number(),
  summary: z.string(),
  steps: z.array(LearningStepSchema),
})
export type LearningPlan = z.infer<typeof LearningPlanSchema>

// ─── Practice Generator Zod Schema & Types ───────────────────────────────────
export const PracticeOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
})

export const PracticeQuestionSafeSchema = z.object({
  id: z.string(),
  skill: z.string(),
  subskill: z.string(),
  difficulty: DifficultyLevelSchema,
  questionType: QuestionTypeSchema,
  objective: z.string(),
  questionText: z.string(),
  codeSnippet: z.string().optional(),
  options: z.array(PracticeOptionSchema).optional(),
})
export type PracticeQuestionSafe = z.infer<typeof PracticeQuestionSafeSchema>

export const PracticeFeedbackSchema = z.object({
  practiceId: z.string(),
  isCorrect: z.boolean(),
  score: z.number(),
  explanation: z.string(),
  missedConcept: z.string().optional(),
  correctAnswerSummary: z.string(),
  recommendedFollowup: z.string(),
})
export type PracticeFeedback = z.infer<typeof PracticeFeedbackSchema>

// ─── Coach Message & Chat Types ──────────────────────────────────────────────
export const CoachMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().optional(),
  suggestedQuestions: z.array(z.string()).optional(),
})
export type CoachMessage = z.infer<typeof CoachMessageSchema>
