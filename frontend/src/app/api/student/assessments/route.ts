import { NextResponse } from 'next/server'
import {
  LEVEL_1_KNOWLEDGE_ASSESSMENTS,
  LEVEL_2_PRACTICAL_CHALLENGES,
} from '@/lib/assessments-seed'

export async function GET() {
  const formattedAssessments = LEVEL_1_KNOWLEDGE_ASSESSMENTS.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    time_limit: a.timeLimitMinutes,
    total_questions: a.totalQuestions,
    passing_score: a.passingScore,
    skills: { id: `skill-${a.id}`, name: a.skill },
    difficulty: a.difficulty,
  }))

  return NextResponse.json({
    success: true,
    data: formattedAssessments,
    level1: LEVEL_1_KNOWLEDGE_ASSESSMENTS,
    level2: LEVEL_2_PRACTICAL_CHALLENGES.map(p => ({
      id: p.id,
      title: p.title,
      skill: p.skill,
      type: p.type,
      difficulty: p.difficulty,
      timeLimitMinutes: p.timeLimitMinutes,
      objective: p.objective,
      instructions: p.instructions,
      initialCode: p.initialCode,
    })),
  })
}
