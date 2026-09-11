import { NextRequest, NextResponse } from 'next/server'

export interface ComparisonOption {
  option: string
  learningCurve?: string
  marketDemand?: string
  pros: string[]
  cons: string[]
  bestFor?: string
}

export interface RoadmapStage {
  stage: string
  title: string
  description?: string
  topics: string[]
  projects: string[]
}

export interface ContextSection {
  title: string
  content: string
}

export interface StructuredCareerResponse {
  question: string
  headline: string
  answer: string
  recommendation: string
  intent: string
  sections: ContextSection[]
  comparison: ComparisonOption[]
  roadmap: RoadmapStage[]
  next_steps: string[]
  what_to_avoid: string[]
  follow_up_questions: string[]
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Normalizes any value into a clean, guaranteed string array.
 * Gracefully handles strings, comma-separated items, newline bullets, objects, nulls, and undefined.
 */
export function toStringArray(val: unknown): string[] {
  if (!val) return []
  
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (typeof item === 'number' || typeof item === 'boolean') return String(item)
        if (typeof item === 'object' && item !== null) {
          // If object has a text, name, title, or value property, extract it
          const record = item as Record<string, unknown>
          const candidate = record.text || record.name || record.title || record.value || record.point || record.desc
          if (typeof candidate === 'string') return candidate.trim()
          return JSON.stringify(item)
        }
        return ''
      })
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
  }

  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return []

    // If string contains multiple bullet points or newlines, split them
    if (trimmed.includes('\n')) {
      return trimmed
        .split('\n')
        .map(line => line.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(line => line.length > 0)
    }

    // If comma-separated list
    if (trimmed.includes(',') && !trimmed.includes('{')) {
      const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean)
      if (parts.length > 1) return parts
    }

    return [trimmed]
  }

  if (typeof val === 'object' && val !== null) {
    const values = Object.values(val as Record<string, unknown>)
    return values
      .map(v => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean)
  }

  return []
}

/**
 * Recursively normalizes and guarantees the shape of a StructuredCareerResponse.
 */
export function normalizeCareerNavigatorResponse(raw: unknown, queryText: string): StructuredCareerResponse {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  // Normalize sections
  const rawSections = Array.isArray(obj.sections) ? obj.sections : []
  const sections: ContextSection[] = rawSections
    .filter((sec): sec is Record<string, unknown> => typeof sec === 'object' && sec !== null)
    .map((sec) => ({
      title: typeof sec.title === 'string' ? sec.title.trim() : 'Overview',
      content: typeof sec.content === 'string' ? sec.content.trim() : (typeof sec.description === 'string' ? sec.description.trim() : ''),
    }))
    .filter(sec => sec.title.length > 0 || sec.content.length > 0)

  // Normalize comparison options
  const rawComparison = Array.isArray(obj.comparison)
    ? obj.comparison
    : Array.isArray(obj.options)
    ? obj.options
    : Array.isArray(obj.comparisons)
    ? obj.comparisons
    : []

  const comparison: ComparisonOption[] = rawComparison
    .filter((opt): opt is Record<string, unknown> => typeof opt === 'object' && opt !== null)
    .map((opt) => {
      const optName = typeof opt.option === 'string'
        ? opt.option.trim()
        : typeof opt.name === 'string'
        ? opt.name.trim()
        : typeof opt.title === 'string'
        ? opt.title.trim()
        : 'Option'

      return {
        option: optName,
        learningCurve: typeof opt.learningCurve === 'string' ? opt.learningCurve.trim() : undefined,
        marketDemand: typeof opt.marketDemand === 'string' ? opt.marketDemand.trim() : undefined,
        pros: toStringArray(opt.pros),
        cons: toStringArray(opt.cons),
        bestFor: typeof opt.bestFor === 'string' ? opt.bestFor.trim() : (typeof opt.target === 'string' ? opt.target.trim() : undefined),
      }
    })

  // Normalize roadmap stages
  const rawRoadmap = Array.isArray(obj.roadmap)
    ? obj.roadmap
    : Array.isArray(obj.stages)
    ? obj.stages
    : Array.isArray(obj.steps)
    ? obj.steps
    : []

  const roadmap: RoadmapStage[] = rawRoadmap
    .filter((stage): stage is Record<string, unknown> => typeof stage === 'object' && stage !== null)
    .map((stg, idx) => {
      const stageName = typeof stg.stage === 'string'
        ? stg.stage.trim()
        : typeof stg.phase === 'string'
        ? stg.phase.trim()
        : `Stage ${idx + 1}`

      const stageTitle = typeof stg.title === 'string'
        ? stg.title.trim()
        : typeof stg.name === 'string'
        ? stg.name.trim()
        : 'Milestone'

      return {
        stage: stageName,
        title: stageTitle,
        description: typeof stg.description === 'string' ? stg.description.trim() : undefined,
        topics: toStringArray(stg.topics || stg.skills || stg.concepts),
        projects: toStringArray(stg.projects || stg.practical || stg.tasks),
      }
    })

  const headline = typeof obj.headline === 'string' && obj.headline.trim().length > 0
    ? obj.headline.trim()
    : typeof obj.answer === 'string' && obj.answer.trim().length > 0
    ? obj.answer.trim()
    : 'Career Guidance Overview'

  const answer = typeof obj.answer === 'string' && obj.answer.trim().length > 0
    ? obj.answer.trim()
    : headline

  const recommendation = typeof obj.recommendation === 'string'
    ? obj.recommendation.trim()
    : ''

  const intent = typeof obj.intent === 'string' && obj.intent.trim().length > 0
    ? obj.intent.trim()
    : 'general'

  return {
    question: queryText,
    headline,
    answer,
    recommendation,
    intent,
    sections,
    comparison,
    roadmap,
    next_steps: toStringArray(obj.next_steps || obj.nextSteps || obj.action_items),
    what_to_avoid: toStringArray(obj.what_to_avoid || obj.whatToAvoid || obj.pitfalls),
    follow_up_questions: toStringArray(obj.follow_up_questions || obj.followUpQuestions || obj.suggested_questions),
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const queryText = (body.message || body.query || body.prompt || '').trim()
    const conversationHistory: ConversationMessage[] = Array.isArray(body.conversation)
      ? body.conversation
      : Array.isArray(body.history)
      ? body.history
      : []

    if (!queryText) {
      return NextResponse.json(
        { success: false, error: 'Query message is required' },
        { status: 400 }
      )
    }

    const apiKey = (process.env.GROQ_API_KEY || '').trim()
    if (!apiKey) {
      console.warn('[CareerNavigator] GROQ_API_KEY is not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Groq API key is not configured on the server. Please add GROQ_API_KEY to your server environment.',
        },
        { status: 500 }
      )
    }

    const systemPrompt = `You are Career Navigator, an elite, empathetic expert career mentor for students and early-career technology professionals.

Your job is to help users make practical, realistic career, tech stack, and learning decisions.

CORE RULES:
1. UNDERSTAND CONTEXT DIRECTLY FROM THE USER: Use ONLY the information provided in the user's prompt and conversation history. Never assume or pretend to know external profile scores, skill gaps, or database data.
2. NO FAKE STATS OR CONFIDENCE NUMBERS: Never output fake confidence percentages (e.g., "Confidence: 74%"), fake readiness scores, or fabricated statistics (e.g., "jobs increased 47%"). Discuss market trends qualitatively, realistically, and honestly.
3. BE DECISIVE & PRACTICAL: Never give non-answers like "both are good". If comparing options, explain trade-offs clearly and give a concrete, reasoned recommendation based on the user's situation.
4. SIMPLE LANGUAGE: Use clear, simple, human language without dense academic jargon. Write like an encouraging world-class mentor.
5. IF TOO VAGUE: If the user simply says "What should I do?" or "I am confused", provide a friendly, structured diagnostic response with 2-3 specific follow-up questions to help narrow it down.
6. STRUCTURED JSON OUTPUT: You MUST return ONLY a valid JSON object matching this exact schema:
{
  "headline": "Direct 1-2 sentence core answer or key takeaway",
  "recommendation": "Clear, actionable recommendation verdict",
  "intent": "general",
  "sections": [
    {
      "title": "Section Title",
      "content": "Markdown explanation"
    }
  ],
  "comparison": [
    {
      "option": "Option Name",
      "learningCurve": "Low / Moderate / Steep",
      "marketDemand": "High / Growing / Specialized",
      "pros": ["Clear pro 1", "Clear pro 2"],
      "cons": ["Trade-off 1", "Trade-off 2"],
      "bestFor": "Who should choose this"
    }
  ],
  "roadmap": [
    {
      "stage": "Stage 1",
      "title": "Core Fundamentals",
      "description": "Short explanation of this milestone",
      "topics": ["Topic 1", "Topic 2"],
      "projects": ["Hands-on project 1"]
    }
  ],
  "next_steps": [
    "Actionable step 1",
    "Actionable step 2",
    "Actionable step 3"
  ],
  "what_to_avoid": [
    "Common pitfall to avoid"
  ],
  "follow_up_questions": [
    "Follow-up question 1",
    "Follow-up question 2"
  ]
}

CRITICAL DATA SHAPE RULES:
- "pros", "cons", "topics", "projects", "next_steps", "what_to_avoid", and "follow_up_questions" MUST ALWAYS BE ARRAYS OF STRINGS: string[]. Never return them as a single string, object, or null.
- If comparison is not applicable to the question, return "comparison": [].
- If roadmap is not applicable, return "roadmap": [].`

    const baseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '')
    const groqUrl = `${baseUrl}/chat/completions`

    // Build chat message history
    const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    // Take last 8 messages for contextual awareness without token bloat
    const recentHistory = conversationHistory.slice(-8)
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        formattedMessages.push({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        })
      }
    }

    formattedMessages.push({ role: 'user', content: queryText })

    let response: Response | null = null
    const primaryModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
    const modelsToTry = [
      primaryModel,
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'openai/gpt-oss-120b',
    ].filter((m, i, arr) => arr.indexOf(m) === i)
    let lastErrorText = ''

    for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
      const activeModel = modelsToTry[attempt]
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 25000)

      try {
        const res = await fetch(groqUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: activeModel,
            messages: formattedMessages,
            temperature: 0.3,
            max_tokens: 2048,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (res.ok) {
          response = res
          break
        }

        lastErrorText = await res.text()
        console.warn(`[CareerNavigator] Groq attempt ${attempt + 1} (${activeModel}) returned ${res.status}:`, lastErrorText)

        if (res.status === 429 || res.status === 503) {
          const retryAfter = res.headers.get('retry-after')
          const waitMs = retryAfter ? (parseInt(retryAfter, 10) * 1000 || 3000) : (2500 * (attempt + 1))
          await new Promise(r => setTimeout(r, waitMs))
          continue
        }

        if (lastErrorText.includes('model_not_found') || lastErrorText.includes('does not exist') || lastErrorText.includes('decommissioned')) {
          continue
        }

        continue
      } catch (fetchErr: any) {
        clearTimeout(timeout)
        lastErrorText = fetchErr.message || 'Fetch error'
        console.warn(`[CareerNavigator] Groq attempt ${attempt + 1} (${activeModel}) threw:`, lastErrorText)
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    if (!response || !response.ok) {
      console.error('[CareerNavigator] Groq API execution failed after retries:', lastErrorText)
      return NextResponse.json(
        {
          success: false,
          error: "Career Navigator couldn't process that request right now. Please try again.",
        },
        { status: 502 }
      )
    }

    const data = await response.json()
    const rawContent = data?.choices?.[0]?.message?.content || '{}'

    const cleanJson = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim()

    let parsedResponse: unknown = {}
    try {
      parsedResponse = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('[CareerNavigator] JSON parsing failed on Groq output:', parseError, rawContent)
      return NextResponse.json(
        {
          success: false,
          error: "Career Navigator received an unparseable response from AI. Please try rephrasing your question.",
        },
        { status: 500 }
      )
    }

    // Fully normalize and guarantee deep types
    const structuredOutput = normalizeCareerNavigatorResponse(parsedResponse, queryText)

    return NextResponse.json({
      success: true,
      data: structuredOutput,
    })
  } catch (err: any) {
    console.error('[CareerNavigator API Error]:', err)
    return NextResponse.json(
      {
        success: false,
        error: "Career Navigator couldn't process that request right now. Please check your connection and try again.",
      },
      { status: 500 }
    )
  }
}

