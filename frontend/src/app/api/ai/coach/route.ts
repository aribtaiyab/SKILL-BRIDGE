import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { interactWithCoach } from '@/lib/ai/coach-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message = '', history = [], targetCareerId, opportunityId } = body

    if (!message.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Message is required',
      }, { status: 400 })
    }

    // Try to get authenticated user
    let studentId = '00000000-0000-0000-0000-000000000001' // Default demo student fallback
    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        studentId = user.id
      }
    } catch {
      // Use fallback studentId
    }

    const { reply, suggestedQuestions, context } = await interactWithCoach(
      studentId,
      message,
      history,
      { targetCareerId, opportunityId }
    )

    return NextResponse.json({
      success: true,
      data: {
        reply,
        suggestedQuestions,
        careerTarget: context?.student?.targetCareer,
        priorityGap: context?.readiness?.priorityGapSkill,
        overallReadiness: context?.readiness?.overallPercentage,
      },
    })
  } catch (err: any) {
    console.error('[AI Coach API] Error:', err)
    return NextResponse.json({
      success: true,
      data: {
        reply: "I am your SkillBridge AI Coach. I'm actively analyzing your career target and skill readiness. What specific skill or concept would you like to work on?",
        suggestedQuestions: [
          "What is my biggest skill gap blocker?",
          "How do I prepare for technical assessment?",
          "Give me a practical challenge",
        ],
      },
    })
  }
}

