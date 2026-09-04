import { NextRequest, NextResponse } from 'next/server'
import { LEVEL_1_KNOWLEDGE_ASSESSMENTS } from '@/lib/assessments-seed'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const assessment =
    LEVEL_1_KNOWLEDGE_ASSESSMENTS.find(a => a.id === id) ||
    LEVEL_1_KNOWLEDGE_ASSESSMENTS[0]

  const safeQuestions = assessment.questions.map(q => ({
    id: q.id,
    questionText: q.questionText,
    questionType: 'multiple_choice',
    points: q.points,
    options: q.options.map(o => ({
      id: o.id,
      optionText: o.optionText,
    })),
  }))

  return NextResponse.json({
    success: true,
    data: {
      attemptId: `attempt-${Date.now()}`,
      title: assessment.title,
      skillName: assessment.skill,
      timeLimit: assessment.timeLimitMinutes,
      questions: safeQuestions,
    },
  })
}
