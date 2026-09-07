import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CareerNavigatorContextBuilder } from '@/lib/career-navigator/context-builder'
import { CareerComparisonEngine } from '@/lib/career-navigator/comparison-engine'
import { CareerNavigatorAIService } from '@/lib/career-navigator/ai-service'
import { CareerNavigatorResponse } from '@/lib/career-navigator/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const queryText = (body.message || body.query || body.prompt || '').trim()
    const { history = [], preferredFields, goal } = body

    if (!queryText) {
      return NextResponse.json(
        { success: false, error: 'Query message is required' },
        { status: 400 }
      )
    }

    const message = queryText

    // 1. Authenticate user (or support guest/demo exploration)
    let userId = '00000000-0000-0000-0000-000000000001'
    let supabase: any = null
    try {
      supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        userId = user.id
      }
    } catch {
      // Demo fallback
    }

    // 2. Retrieve authoritative student context
    const studentContext = await CareerNavigatorContextBuilder.buildContext(userId)
    const engineSkills = CareerNavigatorContextBuilder.toEngineSkills(studentContext)

    // 3. Classify intent & identify candidate careers to compare
    const intent = CareerNavigatorAIService.detectIntent(message)
    const candidateSlugs = CareerNavigatorAIService.extractCareerMentions(message, studentContext.targetCareer)

    // 4. Run deterministic comparison engine
    const engine = new CareerComparisonEngine()
    const calcResult = await engine.compareCareers(candidateSlugs, engineSkills, {
      preferredFields,
      goal,
    })

    // 5. Generate AI reasoning using Google Gemini (or deterministic fallback)
    const aiOutput = await CareerNavigatorAIService.explainDecision(
      message,
      intent,
      studentContext,
      calcResult,
      history
    )

    // 6. Record decision to database (async / non-blocking)
    let savedSessionId = undefined
    if (supabase && userId !== '00000000-0000-0000-0000-000000000001') {
      try {
        const { data: decisionRow } = await supabase
          .from('career_navigator_decisions')
          .insert({
            student_id: userId,
            question: message,
            intent,
            recommended_career_slug: aiOutput.recommendation.careerSlug || calcResult.recommendedCareerSlug,
            recommended_career_name: aiOutput.recommendation.careerName || calcResult.recommendedCareerName,
            confidence: aiOutput.recommendation.confidence,
            comparison_data: calcResult.comparison,
            why_reasons: aiOutput.why,
            market_snapshot: calcResult.comparison[0]?.marketData || {},
          })
          .select('id')
          .maybeSingle()

        savedSessionId = decisionRow?.id
      } catch (dbErr) {
        console.warn('[CareerNavigator] Could not persist decision history:', dbErr)
      }
    }

    const primaryMarket = calcResult.comparison[0]?.marketData

    const responseData: CareerNavigatorResponse = {
      success: true,
      data: {
        sessionId: savedSessionId,
        intent,
        headline: aiOutput.answer.headline || calcResult.headline,
        summary: aiOutput.answer.summary || calcResult.recommendationReason,
        recommendation: {
          type: aiOutput.recommendation.type,
          careerSlug: aiOutput.recommendation.careerSlug || calcResult.recommendedCareerSlug,
          careerName: aiOutput.recommendation.careerName || calcResult.recommendedCareerName,
          confidence: aiOutput.recommendation.confidence,
          reason: aiOutput.recommendation.reason || calcResult.recommendationReason,
        },
        comparison: calcResult.comparison,
        why: aiOutput.why,
        strengths: aiOutput.strengths,
        gaps: calcResult.missingSkillsForTopGap,
        nextSteps: aiOutput.nextSteps,
        bridgeMilestones: calcResult.nextMove.bridgeSequence,
        recommendedActionRoute: calcResult.nextMove.recommendedActionRoute,
        followUpQuestion: aiOutput.followUpQuestion,
        marketSummary: primaryMarket ? {
          source: primaryMarket.source,
          freshness: primaryMarket.freshness,
          summary: primaryMarket.summary,
          dataAvailable: primaryMarket.marketDataAvailable,
        } : undefined,
      },
    }

    return NextResponse.json(responseData)
  } catch (err: any) {
    console.error('[CareerNavigator API Error]:', err)
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to process career analysis',
      },
      { status: 500 }
    )
  }
}
