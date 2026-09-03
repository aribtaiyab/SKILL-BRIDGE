import { buildStudentAIContext } from './context-builder'
import { defaultAIProvider } from './provider'
import {
  StudentAIContext,
  DiagnosticOutput,
  LearningPlan,
  PracticeQuestionSafe,
  PracticeFeedback,
  CoachMessage,
  DifficultyLevel,
} from './types'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Diagnoses a skill gap based on authoritative student context and Phase 4 metrics.
 */
export async function diagnoseSkillGap(
  studentId: string,
  skillName: string,
  options?: { targetCareerId?: string; opportunityId?: string }
): Promise<{ context: StudentAIContext; diagnosis: DiagnosticOutput }> {
  const context = await buildStudentAIContext(studentId, options)
  const targetSkill = skillName || context.readiness.priorityGapSkill || 'Node.js'
  const diagnosis = await defaultAIProvider.diagnose(context, targetSkill)
  return { context, diagnosis }
}

/**
 * Generates or retrieves a personalized learning plan.
 */
export async function getOrGenerateLearningPlan(
  studentId: string,
  skillName: string,
  options?: { targetCareerId?: string }
): Promise<{ context: StudentAIContext; plan: LearningPlan }> {
  const context = await buildStudentAIContext(studentId, options)
  const targetSkill = skillName || context.readiness.priorityGapSkill || 'Node.js'
  const plan = await defaultAIProvider.createLearningPlan(context, targetSkill)
  return { context, plan }
}

/**
 * Generates a targeted practice challenge.
 */
export async function generatePracticeChallenge(
  studentId: string,
  skillName: string,
  difficulty: DifficultyLevel = 'Intermediate'
): Promise<{ question: PracticeQuestionSafe; serverToken: string }> {
  const context = await buildStudentAIContext(studentId)
  const targetSkill = skillName || context.readiness.priorityGapSkill || 'Node.js'
  const { question, serverAnswer } = await defaultAIProvider.generatePractice(context, targetSkill, difficulty)

  // Store in practice_sessions table or return secure server token
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await (supabase as any)
      .from('practice_sessions')
      .insert({
        student_id: studentId,
        skill_id: context.skills.find(s => s.name.toLowerCase() === targetSkill.toLowerCase())?.id || 's-node',
        subskill: question.subskill,
        difficulty: question.difficulty,
        question_type: question.questionType,
        question_text: question.questionText,
        options: question.options,
        server_correct_answer: serverAnswer,
      })
      .select('id')
      .single()

    const sessionId = data?.id || `practice-${Date.now()}`
    return { question: { ...question, id: sessionId }, serverToken: sessionId }
  } catch {
    return { question, serverToken: Buffer.from(serverAnswer).toString('base64') }
  }
}

/**
 * Evaluates a student practice answer and returns educational feedback.
 */
export async function evaluatePracticeSubmission(
  studentId: string,
  practiceId: string,
  skillName: string,
  studentAnswer: string
): Promise<PracticeFeedback> {
  const context = await buildStudentAIContext(studentId)
  const targetSkill = skillName || context.readiness.priorityGapSkill || 'Node.js'

  let serverAnswer = 'opt_b'

  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await (supabase as any)
      .from('practice_sessions')
      .select('server_correct_answer, question_text')
      .eq('id', practiceId)
      .single()

    if (data?.server_correct_answer) {
      serverAnswer = data.server_correct_answer
    }
  } catch {}

  const feedback = await defaultAIProvider.evaluatePractice(
    context,
    targetSkill,
    'Practice question',
    studentAnswer,
    serverAnswer
  )

  // Update practice record
  try {
    const supabase = await createSupabaseServerClient()
    await (supabase as any)
      .from('practice_sessions')
      .update({
        student_answer: studentAnswer,
        is_correct: feedback.isCorrect,
        feedback_text: feedback.explanation,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', practiceId)
  } catch {}

  return feedback
}

/**
 * Interactive Coach chat.
 */
export async function interactWithCoach(
  studentId: string,
  message: string,
  history: CoachMessage[] = [],
  options?: { targetCareerId?: string; opportunityId?: string }
): Promise<{ reply: string; suggestedQuestions: string[]; context: StudentAIContext }> {
  const context = await buildStudentAIContext(studentId, options)
  const response = await defaultAIProvider.chat(context, message, history)
  return {
    reply: response.reply,
    suggestedQuestions: response.suggestedQuestions,
    context,
  }
}

/**
 * Explain readiness in structured plain-English.
 */
export async function explainCareerReadiness(
  studentId: string,
  options?: { targetCareerId?: string }
): Promise<{
  careerTarget: string
  overallReadiness: number
  category: string
  strengths: string[]
  nearReady: string[]
  criticalGaps: string[]
  priorityGap: { skill: string; gap: number; recommendation: string } | null
  explanation: string
}> {
  const context = await buildStudentAIContext(studentId, options)
  const readySkills = context.skills.filter(s => s.status === 'ready').map(s => s.name)
  const nearReady = context.skills.filter(s => s.status === 'needs_improvement').map(s => `${s.name} (${s.gap} pts)`)
  const critical = context.skills.filter(s => s.status === 'critical').map(s => `${s.name} (${s.gap} pts)`)

  const priority = context.readiness.priorityGapSkill
  const priorityObj = priority
    ? {
        skill: priority,
        gap: context.readiness.priorityGapPoints,
        recommendation: `Focus on closing the ${context.readiness.priorityGapPoints}-point deficit in ${priority} to significantly boost your overall readiness.`,
      }
    : null

  const explanation = `Your Career Readiness for ${context.student.targetCareer} is calculated at ${context.readiness.overallPercentage}%. You have satisfied ${readySkills.length} of ${context.skills.length} core competencies. Closing ${priority || 'the primary gap'} is your highest leverage action.`

  return {
    careerTarget: context.student.targetCareer,
    overallReadiness: context.readiness.overallPercentage,
    category: context.readiness.category,
    strengths: readySkills,
    nearReady,
    criticalGaps: critical,
    priorityGap: priorityObj,
    explanation,
  }
}
