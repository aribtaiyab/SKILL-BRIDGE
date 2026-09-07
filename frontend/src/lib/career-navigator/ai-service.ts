/**
 * Career Navigator - Secure Groq AI Service
 *
 * Calls Groq API (openai/gpt-oss-120b) with authoritative deterministic context.
 * Performs strict Zod schema validation.
 * Includes prompt injection defense and deterministic fallback.
 */

import { AI_CONFIG } from '@/lib/ai/config'
import {
  CareerNavigatorAIOutput,
  CareerNavigatorIntent,
  CareerNavigatorOutputSchema,
  StudentCareerContext,
} from './types'
import { CareerComparisonResult } from './comparison-engine'

export class CareerNavigatorAIService {
  /**
   * Classifies the natural language query intent automatically.
   */
  static detectIntent(query: string): CareerNavigatorIntent {
    const q = query.toLowerCase().trim()

    if (
      q.includes('vs') ||
      q.includes(' or ') ||
      q.includes('compare') ||
      q.includes('difference between')
    ) {
      return 'CAREER_COMPARISON'
    }

    if (
      q.includes("don't know") ||
      q.includes('which career') ||
      q.includes('what should i choose') ||
      q.includes('confused') ||
      q.includes('guide me') ||
      q.includes('help me choose')
    ) {
      return 'CAREER_DISCOVERY'
    }

    if (
      q.includes('switch') ||
      q.includes('transition') ||
      q.includes('move from') ||
      q.includes('change career') ||
      q.includes('can i move')
    ) {
      return 'CAREER_TRANSITION'
    }

    if (
      q.includes('market') ||
      q.includes('demand') ||
      q.includes('salary') ||
      q.includes('scope') ||
      q.includes('future') ||
      q.includes('hiring') ||
      q.includes('growth')
    ) {
      return 'CAREER_MARKET'
    }

    if (
      q.includes('java or python') ||
      q.includes('dsa or') ||
      q.includes('learn first') ||
      q.includes('should i learn')
    ) {
      return 'SKILL_CHOICE'
    }

    if (
      q.includes('potential') ||
      q.includes('good for me') ||
      q.includes('am i ready') ||
      q.includes('fits me') ||
      q.includes('fit for')
    ) {
      return 'CAREER_FIT'
    }

    if (
      q.includes('next move') ||
      q.includes('next 3 months') ||
      q.includes('what to learn next') ||
      q.includes('plan')
    ) {
      return 'LEARNING_PRIORITY'
    }

    return 'CAREER_COMPARISON'
  }

  /**
   * Extracts career tracks referenced in the query.
   */
  static extractCareerMentions(query: string, defaultTarget: string): string[] {
    const q = query.toLowerCase()
    const found: string[] = []

    if (q.includes('ai') || q.includes('machine learning') || q.includes('ml') || q.includes('data science')) {
      found.push('ai-ml')
    }
    if (q.includes('frontend') || q.includes('front-end') || q.includes('web development') || q.includes('web dev') || q.includes('ui')) {
      found.push('frontend')
    }
    if (q.includes('backend') || q.includes('back-end') || q.includes('node') || q.includes('server') || q.includes('api')) {
      found.push('backend')
    }
    if (q.includes('full') || q.includes('fullstack') || q.includes('full-stack')) {
      found.push('fullstack')
    }
    if (q.includes('security') || q.includes('cyber') || q.includes('cybersecurity')) {
      found.push('security')
    }
    if (q.includes('devops') || q.includes('cloud')) {
      found.push('devops')
    }
    if (q.includes('data analyst') || q.includes('data analytics') || q.includes('analytics')) {
      found.push('data-analyst')
    }

    if (found.length === 0) {
      // Default: compare student's current target with top complementary field
      const normDefault = defaultTarget.toLowerCase().includes('front') ? 'frontend' : 'backend'
      found.push(normDefault, normDefault === 'frontend' ? 'ai-ml' : 'fullstack')
    } else if (found.length === 1) {
      // If student only mentioned one (e.g. "Do I have potential for AI?"), compare against their active target
      const normDefault = defaultTarget.toLowerCase().includes('front') ? 'frontend' : 'backend'
      if (!found.includes(normDefault)) {
        found.unshift(normDefault)
      } else {
        found.push('ai-ml')
      }
    }

    return found
  }

  /**
   * Generates AI reasoning or deterministic fallback.
   */
  static async explainDecision(
    query: string,
    intent: CareerNavigatorIntent,
    studentContext: StudentCareerContext,
    calcResult: CareerComparisonResult,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<CareerNavigatorAIOutput> {
    // 1. If Groq is not configured or fails, use deterministic explanation
    if (!AI_CONFIG.isLiveProviderConfigured()) {
      return this.buildDeterministicExplanation(query, intent, studentContext, calcResult)
    }

    try {
      const systemPrompt = `You are Career Navigator inside SkillBridge Connect.
Core Positioning: "Don't guess your career. Compare your paths."
Role: Career Decision Engine + AI Explanation Layer.

CRITICAL ARCHITECTURAL CONSTRAINTS:
1. You are NOT a generic motivational chatbot. Never say "Believe in yourself!" or "Anything is possible!".
2. You must NEVER invent student skill scores, readiness percentages, skill gaps, career requirements, or market numbers.
3. The deterministic calculations below are the ABSOLUTE TRUTH provided by SkillBridge backend services.
4. Your job is to explain the tradeoffs, fit differences, and transition difficulty in simple, clear, conversational English (short sentences, bullet points, zero technical jargon).
5. Explain clearly that Market Demand does NOT equal Student Fit. A student may have high fit for Web Dev even if AI has higher market growth.
6. Return ONLY valid JSON adhering strictly to the schema.

AUTHORITATIVE BACKEND CONTEXT:
- Student: ${studentContext.fullName}
- Active Career Target: ${studentContext.targetCareer}
- Current Assessed Readiness: ${studentContext.readinessScore}%
- Verified Strengths: ${studentContext.topStrengths.join(', ') || 'Early stage foundations'}
- Priority Skill Gap: ${studentContext.priorityGapSkill || 'None identified'} (${studentContext.priorityGapPoints} pts deficit)
- Has Verified Project Evidence: ${studentContext.hasEvidence ? 'Yes' : 'No'}
- Matching Opportunities Count: ${studentContext.matchingOpportunitiesCount} (${studentContext.topOpportunityTitle || 'None'})

CALCULATED CAREER COMPARISON:
${JSON.stringify(calcResult, null, 2)}

REQUIRED JSON OUTPUT FORMAT:
{
  "intent": "${intent}",
  "answer": {
    "headline": "${calcResult.headline}",
    "summary": "2-3 short, clear sentences explaining the recommendation based on their real skills vs requirements."
  },
  "recommendation": {
    "type": "${calcResult.recommendationType}",
    "careerSlug": "${calcResult.recommendedCareerSlug || 'frontend'}",
    "careerName": "${calcResult.recommendedCareerName || 'Frontend Developer'}",
    "confidence": ${calcResult.confidence},
    "reason": "${calcResult.recommendationReason}"
  },
  "why": [
    "Reason 1 citing authentic verified strength",
    "Reason 2 explaining lower gap deficit",
    "Reason 3 explaining transition friction or market context"
  ],
  "strengths": ${JSON.stringify(calcResult.comparison[0]?.topStrengths.slice(0, 3) || [])},
  "nextSteps": [
    "Actionable next move 1",
    "Actionable next move 2",
    "Actionable next move 3"
  ],
  "followUpQuestion": null
}`

      // Sanitize user query against prompt injection
      const sanitizedQuery = query.replace(/[<>{}[\]\\]/g, ' ').slice(0, 500)

      const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          temperature: 0.2, // Low temperature for factual precision
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-3),
            { role: 'user', content: sanitizedQuery },
          ],
        }),
        signal: AbortSignal.timeout(AI_CONFIG.timeoutMs),
      })

      if (!response.ok) {
        throw new Error(`Groq API returned HTTP ${response.status}`)
      }

      const raw = await response.json()
      const content = raw.choices?.[0]?.message?.content || '{}'
      const parsed = JSON.parse(content)

      // Validate against strict Zod schema
      return CareerNavigatorOutputSchema.parse(parsed)
    } catch (err) {
      console.warn('[CareerNavigator] Groq AI call failed, falling back to deterministic explanation:', err)
      return this.buildDeterministicExplanation(query, intent, studentContext, calcResult)
    }
  }

  /**
   * Deterministic explanation builder (Zero-crash guarantee).
   */
  static buildDeterministicExplanation(
    _query: string,
    intent: CareerNavigatorIntent,
    studentContext: StudentCareerContext,
    calcResult: CareerComparisonResult
  ): CareerNavigatorAIOutput {
    const top = calcResult.comparison[0]
    const second = calcResult.comparison[1]

    let summary = calcResult.recommendationReason
    if (!summary) {
      summary = `Based on your assessed skills, ${top?.careerName || 'your target track'} has the highest benchmark match (${top?.fitScore || 70}% fit) and lowest gap deficit.`
    }

    return {
      intent,
      answer: {
        headline: calcResult.headline,
        summary,
      },
      recommendation: {
        type: calcResult.recommendationType,
        careerSlug: calcResult.recommendedCareerSlug,
        careerName: calcResult.recommendedCareerName,
        confidence: calcResult.confidence,
        reason: calcResult.recommendationReason,
      },
      why: calcResult.whyReasons.slice(0, 4),
      strengths: top?.topStrengths || studentContext.topStrengths,
      nextSteps: [
        calcResult.nextMove.actionText,
        `Strengthen verified credentials in ${top?.topGaps[0]?.skillName || 'core skills'} to eliminate your priority gap.`,
        `Explore verified internship opportunities in Opportunity Hub.`,
      ],
      followUpQuestion: second ? {
        questionText: `Would you like to see the step-by-step transition roadmap to bridge into ${second.careerName}?`,
        options: ['Yes, show transition roadmap', 'Focus on immediate best fit', 'Compare another career'],
      } : null,
    }
  }
}
