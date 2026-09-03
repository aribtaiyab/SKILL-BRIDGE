import { getSupabaseAdmin } from '../config/supabase.js'
import { normalizeScore } from './engine.js'
import { QuestionSafeView, AssessmentAttemptResult, FALLBACK_QUESTIONS } from './types.js'

export type { QuestionSafeView, AssessmentAttemptResult }
export { FALLBACK_QUESTIONS }

// Authoritative correct answers (server-side only, never sent before evaluation)
const AUTHORITATIVE_ANSWER_KEYS: Record<string, string> = {
  q1: 'opt1_2',
  q2: 'opt2_2',
  q3: 'opt3_2',
  q4: 'opt4_2',
  q5: 'opt5_1',
}

/**
 * Starts an assessment attempt.
 * Returns questions WITHOUT is_correct flags.
 */
export async function startAssessment(
  studentId: string,
  assessmentId: string
): Promise<{ attemptId: string; title: string; skillName: string; timeLimit: number; questions: QuestionSafeView[] }> {
  try {
    const supabase = getSupabaseAdmin()

    // 1. Fetch assessment details
    const { data: assessmentData } = await (supabase as any)
      .from('assessments')
      .select('id, title, time_limit, skill_id, skills(id, name)')
      .eq('id', assessmentId)
      .single()

    const title = assessmentData?.title || 'Node.js Fundamentals Assessment'
    const skillName = assessmentData?.skills?.name || 'Node.js'
    const timeLimit = assessmentData?.time_limit || 15

    // 2. Fetch questions and options (EXCLUDING is_correct)
    const { data: rawQuestions } = await (supabase as any)
      .from('assessment_questions')
      .select(`
        id, question_text, question_type, points, order_index,
        assessment_options(id, option_text, order_index)
      `)
      .eq('assessment_id', assessmentId)
      .order('order_index', { ascending: true })

    let questions: QuestionSafeView[] = []
    if (rawQuestions && rawQuestions.length > 0) {
      questions = rawQuestions.map((q: any) => ({
        id: q.id,
        questionText: q.question_text,
        questionType: q.question_type,
        points: q.points,
        orderIndex: q.order_index,
        options: (q.assessment_options || []).map((o: any) => ({
          id: o.id,
          optionText: o.option_text,
          orderIndex: o.order_index,
        })),
      }))
    } else {
      questions = FALLBACK_QUESTIONS
    }

    // 3. Create assessment_attempts row
    const { data: attempt } = await (supabase as any)
      .from('assessment_attempts')
      .insert({
        assessment_id: assessmentId,
        student_id: studentId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    const attemptId = attempt?.id || `attempt-${Date.now()}`

    return {
      attemptId,
      title,
      skillName,
      timeLimit,
      questions,
    }
  } catch {
    return {
      attemptId: `attempt-${Date.now()}`,
      title: 'Node.js Fundamentals Assessment',
      skillName: 'Node.js',
      timeLimit: 15,
      questions: FALLBACK_QUESTIONS,
    }
  }
}

/**
 * Submits an assessment and calculates the deterministic score, updates skill levels,
 * records reassessments, and produces explainable results.
 */
export async function submitAssessment(
  studentId: string,
  attemptId: string,
  assessmentId: string,
  submittedAnswers: { questionId: string; selectedOptionId: string }[]
): Promise<AssessmentAttemptResult> {
  const supabase = getSupabaseAdmin()

  // 1. Fetch real questions with is_correct from DB or fallback
  let totalQuestions = 5
  let correctCount = 0

  try {
    const { data: dbOptions } = await (supabase as any)
      .from('assessment_options')
      .select('id, question_id, is_correct')
      .in(
        'question_id',
        submittedAnswers.map(a => a.questionId)
      )

    const correctMap = new Map<string, string>()
    if (dbOptions && dbOptions.length > 0) {
      dbOptions.forEach((opt: any) => {
        if (opt.is_correct) {
          correctMap.set(opt.question_id, opt.id)
        }
      })
    } else {
      Object.entries(AUTHORITATIVE_ANSWER_KEYS).forEach(([qId, optId]) => {
        correctMap.set(qId, optId)
      })
    }

    totalQuestions = Math.max(submittedAnswers.length, 1)

    // Compare answers securely
    for (const ans of submittedAnswers) {
      const isCorrect = correctMap.get(ans.questionId) === ans.selectedOptionId
      if (isCorrect) correctCount++

      // Record answer in database
      if (!attemptId.startsWith('attempt-')) {
        await (supabase as any).from('assessment_answers').upsert(
          {
            attempt_id: attemptId,
            question_id: ans.questionId,
            selected_option_id: ans.selectedOptionId,
            is_correct: isCorrect,
            points_earned: isCorrect ? 20 : 0,
            answered_at: new Date().toISOString(),
          },
          { onConflict: 'attempt_id,question_id' }
        )
      }
    }
  } catch {
    // Evaluation fallback
    for (const ans of submittedAnswers) {
      if (AUTHORITATIVE_ANSWER_KEYS[ans.questionId] === ans.selectedOptionId) {
        correctCount++
      }
    }
  }

  // Calculate score (0 - 100)
  const score = normalizeScore((correctCount / totalQuestions) * 100)
  const passed = score >= 70

  // 2. Fetch previous score for skill
  let previousScore: number | null = null
  let skillId: string | null = null
  let skillName = 'Node.js'
  let title = 'Node.js Fundamentals Assessment'

  try {
    const { data: assessmentData } = await (supabase as any)
      .from('assessments')
      .select('title, skill_id, skills(id, name)')
      .eq('id', assessmentId)
      .single()

    if (assessmentData) {
      title = assessmentData.title || title
      skillId = assessmentData.skill_id
      skillName = assessmentData.skills?.name || skillName
    }

    if (skillId) {
      const { data: currentSkill } = await (supabase as any)
        .from('student_skills')
        .select('current_level')
        .eq('student_id', studentId)
        .eq('skill_id', skillId)
        .single()

      if (currentSkill) {
        previousScore = currentSkill.current_level
      }
    }
  } catch {}

  const improvement = previousScore !== null ? score - previousScore : 0

  // 3. Update database records: attempt status, student_skills, skill_scores, reassessments, progress_history
  try {
    if (!attemptId.startsWith('attempt-')) {
      await (supabase as any)
        .from('assessment_attempts')
        .update({
          score,
          percentage: score,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
    }

    if (skillId) {
      // Record in skill_scores
      await (supabase as any).from('skill_scores').insert({
        student_id: studentId,
        skill_id: skillId,
        score,
        source: 'assessment',
        recorded_at: new Date().toISOString(),
      })

      // Update student_skills with assessment_verified
      await (supabase as any).from('student_skills').upsert(
        {
          student_id: studentId,
          skill_id: skillId,
          current_level: score,
          verified_level: score,
          verification_status: 'assessment_verified',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,skill_id' }
      )

      // Record in reassessments if prior score existed
      if (previousScore !== null) {
        await (supabase as any).from('reassessments').insert({
          student_id: studentId,
          skill_id: skillId,
          previous_score: previousScore,
          new_score: score,
          recorded_at: new Date().toISOString(),
        })
      }

      // Record in progress_history
      await (supabase as any).from('progress_history').insert({
        student_id: studentId,
        skill_id: skillId,
        score,
        source: 'assessment',
        recorded_at: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.warn('Database update error in submitAssessment:', err)
  }

  // 4. Generate explainable assessment summary
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (score >= 80) {
    strengths.push('Strong grasp of core architectural concepts and async event loop execution.')
    strengths.push('Demonstrated mastery of stream processing and non-blocking I/O.')
  } else if (score >= 60) {
    strengths.push('Solid understanding of general asynchronous patterns and standard module APIs.')
    weaknesses.push('Review error-first callback conventions vs Promise rejection propagation.')
  } else {
    weaknesses.push('Fundamental async control flow needs dedicated review.')
    weaknesses.push('Practice stream buffering and event emitter mechanics.')
  }

  const careerImpact = improvement >= 0
    ? `Your verified score increased by ${improvement} points, raising your Backend Developer readiness.`
    : `Your score is ${Math.abs(improvement)} points below your previous benchmark. We recommend reviewing weak areas before re-testing.`

  const nextStep = score >= 75
    ? `Take on a practical assessment challenge to advance from Assessment Verified to Practical Verified.`
    : `Complete targeted exercises on asynchronous error handling to close remaining gaps.`

  return {
    attemptId,
    assessmentId,
    title,
    skillName,
    totalQuestions,
    correctCount,
    score,
    percentage: score,
    passed,
    previousScore,
    improvement,
    explanationSummary: {
      strengths,
      weaknesses,
      careerImpact,
      nextStep,
    },
  }
}
