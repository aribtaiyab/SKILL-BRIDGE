import { NextRequest, NextResponse } from 'next/server'
import { LEVEL_1_KNOWLEDGE_ASSESSMENTS } from '@/lib/assessments-seed'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Check if assessment exists in database
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (isUuid) {
      const { data: dbAssessment } = await (supabase as any)
        .from('assessments')
        .select('id, title, time_limit, skill_id, skills(id, name)')
        .eq('id', id)
        .maybeSingle()

      if (dbAssessment) {
        const { data: rawQuestions } = await (supabase as any)
          .from('assessment_questions')
          .select(`
            id, question_text, question_type, points, order_index,
            assessment_options(id, option_text, order_index)
          `)
          .eq('assessment_id', id)
          .order('order_index', { ascending: true })

        if (rawQuestions && rawQuestions.length > 0) {
          let attemptId = `attempt-${Date.now()}`
          if (user) {
            const { data: attempt } = await (supabase as any)
              .from('assessment_attempts')
              .insert({
                assessment_id: id,
                student_id: user.id,
                status: 'in_progress',
                started_at: new Date().toISOString(),
              })
              .select('id')
              .single()

            if (attempt?.id) attemptId = attempt.id
          }

          const questions = rawQuestions.map((q: any) => ({
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

          return NextResponse.json({
            success: true,
            data: {
              attemptId,
              title: dbAssessment.title,
              skillName: dbAssessment.skills?.name || 'Technical Competency',
              timeLimit: dbAssessment.time_limit || 15,
              questions,
            },
          })
        }
      }
    }

    // 2. Canonical local assessments matching
    const assessment =
      LEVEL_1_KNOWLEDGE_ASSESSMENTS.find(a => a.id === id || a.skill.toLowerCase().includes(id.toLowerCase())) ||
      LEVEL_1_KNOWLEDGE_ASSESSMENTS[0]

    let attemptId = `attempt-${Date.now()}`
    if (user) {
      // Store attempt in assessment_attempts table
      try {
        const { data: attempt } = await (supabase as any)
          .from('assessment_attempts')
          .insert({
            assessment_id: '50000000-0000-0000-0000-000000000001',
            student_id: user.id,
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (attempt?.id) attemptId = attempt.id
      } catch {
        // Fallback in-memory attemptId
      }
    }

    const safeQuestions = assessment.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionType: 'multiple_choice',
      points: q.points,
      orderIndex: q.orderIndex,
      options: q.options.map(o => ({
        id: o.id,
        optionText: o.optionText,
      })),
    }))

    return NextResponse.json({
      success: true,
      data: {
        attemptId,
        title: assessment.title,
        skillName: assessment.skill,
        timeLimit: assessment.timeLimitMinutes,
        questions: safeQuestions,
      },
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Error starting assessment',
    }, { status: 500 })
  }
}
