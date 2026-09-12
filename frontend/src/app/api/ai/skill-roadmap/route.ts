import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAIConfig } from '@/lib/ai/config'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CAREER_BENCHMARK_PROFILES } from '@/lib/benchmarks'

export const SkillRoadmapStageSchema = z.object({
  stageNumber: z.number(),
  title: z.string(),
  description: z.string(),
  durationMinutes: z.number().default(45),
  topics: z.array(z.string()).default([]),
  keyTakeaway: z.string().default(''),
  careerRelevance: z.string().default(''),
  isCompleted: z.boolean().default(false),
})

export const SkillRoadmapResponseSchema = z.object({
  skill: z.string(),
  career: z.string(),
  overview: z.string(),
  initialScore: z.number(),
  targetScore: z.number(),
  gap: z.number(),
  estimatedHours: z.number(),
  prerequisites: z.array(z.string()).default([]),
  stages: z.array(SkillRoadmapStageSchema),
  projects: z.array(z.string()).default([]),
  next_step: z.string(),
  source: z.enum(['ai_generated', 'skillbridge_canonical']),
})

export type SkillRoadmapResponse = z.infer<typeof SkillRoadmapResponseSchema>

/**
 * Deterministic SkillBridge Canonical Roadmap Generator
 * Used when AI provider is unconfigured, unreachable, or returns malformed output.
 */
function generateCanonicalRoadmap(
  skillName: string,
  careerName: string,
  currentScore: number,
  targetScore: number
): SkillRoadmapResponse {
  const gap = Math.max(targetScore - currentScore, 0)
  const isHighCurrent = currentScore >= 75
  const isModerate = currentScore >= 50 && currentScore < 75

  const normSkill = skillName.toLowerCase()

  let prerequisites: string[] = ['Basic Programming Foundations', 'Terminal & Git Basics']
  let stages = [
    {
      stageNumber: 1,
      title: `${skillName} Core Syntax & Lifecycle`,
      description: `Understand core execution model, paradigm, and building blocks of ${skillName}.`,
      durationMinutes: 45,
      topics: ['Foundations', 'Syntax Mechanics', 'Standard Library'],
      keyTakeaway: `Solid foundational grasp of ${skillName} architecture`,
      careerRelevance: `Required entry benchmark for ${careerName} engineering roles`,
      isCompleted: isHighCurrent || isModerate,
    },
    {
      stageNumber: 2,
      title: `${skillName} Architecture & Patterns`,
      description: `Master common design patterns, data flow, and error handling in ${skillName}.`,
      durationMinutes: 60,
      topics: ['Design Patterns', 'Error Boundaries', 'Modular Structure'],
      keyTakeaway: `Clean, maintainable architectural structure`,
      careerRelevance: `Prevents critical bugs in production ${careerName} environments`,
      isCompleted: isHighCurrent,
    },
    {
      stageNumber: 3,
      title: `Hands-on Practical Challenges in ${skillName}`,
      description: `Implement and debug practical scenarios under standard industry conditions.`,
      durationMinutes: 60,
      topics: ['Refactoring', 'Unit Testing', 'Algorithmic Drills'],
      keyTakeaway: `Practical coding agility under benchmark constraints`,
      careerRelevance: `Directly tested during technical evaluations`,
      isCompleted: false,
    },
    {
      stageNumber: 4,
      title: `Production Integration Project`,
      description: `Build a realistic feature or service demonstrating end-to-end integration.`,
      durationMinutes: 90,
      topics: ['Full Feature Build', 'API Integration', 'Performance Profiling'],
      keyTakeaway: `Deployable portfolio evidence of practical capability`,
      careerRelevance: `Provides tangible proof for industry recruiters`,
      isCompleted: false,
    },
    {
      stageNumber: 5,
      title: `SkillBridge Verification Assessment`,
      description: `Complete the official benchmark assessment to update your verified score to ${targetScore}+.`,
      durationMinutes: 20,
      topics: ['Timed Benchmark', 'Concept Verification', 'Score Certification'],
      keyTakeaway: `Certified verified status in Skill Passport`,
      careerRelevance: `Unlocks employer matching for ${careerName} positions`,
      isCompleted: false,
    },
  ]

  if (normSkill.includes('react')) {
    prerequisites = ['JavaScript ES6+ (Arrow functions, Destructuring, Promises)', 'HTML5 & CSS3']
    stages[0].topics = ['Components & JSX', 'Props vs State', 'Virtual DOM & Reconciliation']
    stages[1].topics = ['useState & useEffect', 'Custom Hooks', 'Context API & State Management']
    stages[2].topics = ['Component Performance', 'useMemo & useCallback', 'Testing with React Testing Library']
    stages[3].topics = ['Interactive SPA Project', 'REST API Fetching', 'Client Routing']
  } else if (normSkill.includes('node') || normSkill.includes('express')) {
    prerequisites = ['JavaScript Fundamentals', 'Async/Await & Event Loop', 'HTTP Basics']
    stages[0].topics = ['Node.js Event Loop', 'Non-blocking I/O', 'Module System (CommonJS / ESM)']
    stages[1].topics = ['Express Middleware Pipeline', 'RESTful Routing', 'Async Error Handling Middleware']
    stages[2].topics = ['Database Queries & Connection Pooling', 'JWT Authentication', 'Validation (Zod/Joi)']
    stages[3].topics = ['Production REST API Service', 'Rate Limiting & Security Headers', 'Dockerizing']
  } else if (normSkill.includes('sql') || normSkill.includes('database')) {
    prerequisites = ['Relational Data Concepts', 'Basic CLI']
    stages[0].topics = ['SELECT, WHERE, ORDER BY', 'Relational Schemas & Foreign Keys', 'Data Types']
    stages[1].topics = ['INNER, LEFT, FULL JOINs', 'Aggregations & GROUP BY / HAVING', 'Subqueries & CTEs']
    stages[2].topics = ['B-Tree Indexes & EXPLAIN ANALYZE', 'Transactions & ACID Guarantees', 'Normalization']
    stages[3].topics = ['Multi-table E-Commerce Schema', 'Complex Analytical Queries', 'Migration Scripts']
  } else if (normSkill.includes('python')) {
    prerequisites = ['Programming Logic Basics', 'Data Types']
    stages[0].topics = ['Data Structures (Lists, Dicts, Sets)', 'Functions & Comprehensions', 'OOP in Python']
    stages[1].topics = ['Virtual Environments & pip', 'File I/O & Exception Handling', 'Generators & Decorators']
    stages[2].topics = ['Pandas / NumPy Data Processing', 'Writing Unit Tests (pytest)', 'Asyncio Basics']
    stages[3].topics = ['Automated Data Pipeline or Web Service', 'CLI Tooling', 'Clean Architecture']
  }

  return {
    skill: skillName,
    career: careerName,
    overview: `A calibrated 5-stage SkillBridge roadmap to advance your competency in ${skillName} from ${currentScore} to target benchmark ${targetScore} for ${careerName}.`,
    initialScore: currentScore,
    targetScore,
    gap,
    estimatedHours: Math.ceil(stages.reduce((acc, s) => acc + s.durationMinutes, 0) / 60),
    prerequisites,
    stages,
    projects: [
      `Build a functional ${skillName} component or service tailored for ${careerName}.`,
      `Write unit tests and benchmark execution under load.`,
    ],
    next_step: `Begin Stage ${stages.findIndex(s => !s.isCompleted) + 1}: ${stages.find(s => !s.isCompleted)?.title || stages[0].title}`,
    source: 'skillbridge_canonical',
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    let body: any = {}
    try {
      body = await request.json()
    } catch {
      // Empty body
    }

    const skillId = body.skill_id || body.skillId
    const skillName = (body.skill_name || body.skill || body.skillName || 'Skill').trim()
    const careerTargetId = body.career_target_id || body.careerTargetId
    const careerTargetName = (body.career_target_name || body.careerTarget || body.careerName || 'Software Engineer').trim()

    // 1. Authoritative Lookup: Determine student's real skill scores from DB
    let currentScore = 0
    let verifiedScore = 0
    let requiredLevel = 80

    if (user?.id) {
      try {
        const { data: studentSkill } = await (supabase as any)
          .from('student_skills')
          .select('self_declared_level, verified_level, current_level, verification_status')
          .eq('student_id', user.id)
          .or(`skill_id.eq.${skillId || '00000000-0000-0000-0000-000000000000'}`)
          .maybeSingle()

        if (studentSkill) {
          verifiedScore = studentSkill.verified_level || 0
          currentScore = verifiedScore > 0 ? verifiedScore : (studentSkill.self_declared_level || 0)
        }
      } catch (dbErr) {
        console.warn('[Skill Roadmap API] DB student_skills lookup warning:', dbErr)
      }
    }

    // Lookup required level from career benchmarks
    const benchmark = CAREER_BENCHMARK_PROFILES.find(
      c => c.id === careerTargetId || c.slug === careerTargetId || c.name.toLowerCase() === careerTargetName.toLowerCase()
    )
    if (benchmark) {
      const matchSkill = Object.entries(benchmark.skills).find(
        ([name]) => name.toLowerCase() === skillName.toLowerCase()
      )
      if (matchSkill) {
        requiredLevel = matchSkill[1].required
      }
    }

    // Override with client-provided authoritative scores only if valid numeric values provided
    if (typeof body.currentScore === 'number' && currentScore === 0) {
      currentScore = Math.max(0, Math.min(100, body.currentScore))
    }
    if (typeof body.targetScore === 'number') {
      requiredLevel = Math.max(0, Math.min(100, body.targetScore))
    }

    const gap = Math.max(requiredLevel - currentScore, 0)

    // 2. Check if Grok / Groq AI Provider is configured
    const aiConfig = getAIConfig()
    if (aiConfig.isLiveProviderConfigured()) {
      try {
        const systemPrompt = `You are the SkillBridge Connect AI Learning Roadmap Architect.
Your task is to generate a structured, highly actionable learning path for a student targeting the role "${careerTargetName}".
The student's current proficiency in "${skillName}" is ${currentScore}/100 (target: ${requiredLevel}/100, gap: ${gap} pts).

Respond ONLY with a valid JSON object matching this schema:
{
  "skill": "${skillName}",
  "career": "${careerTargetName}",
  "overview": "1-2 sentence tailored summary explaining what this roadmap covers to close the ${gap} pt deficit.",
  "initialScore": ${currentScore},
  "targetScore": ${requiredLevel},
  "gap": ${gap},
  "estimatedHours": 6,
  "prerequisites": ["prerequisite 1", "prerequisite 2"],
  "stages": [
    {
      "stageNumber": 1,
      "title": "Stage title",
      "description": "Short actionable description",
      "durationMinutes": 45,
      "topics": ["topic 1", "topic 2", "topic 3"],
      "keyTakeaway": "Key concept takeaway",
      "careerRelevance": "Why this matters to employers",
      "isCompleted": false
    }
  ],
  "projects": ["Project or feature idea to demonstrate mastery"],
  "next_step": "Specific immediate action for the student"
}
Ensure exactly 4 to 5 structured sequential stages progressing from foundations to production build and benchmark reassessment.`

        const userPrompt = JSON.stringify({
          requestedSkill: skillName,
          careerTarget: careerTargetName,
          studentProficiency: currentScore,
          benchmarkTarget: requiredLevel,
          gap,
        })

        const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${aiConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: aiConfig.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: aiConfig.temperature,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
          }),
          signal: AbortSignal.timeout(aiConfig.timeoutMs),
        })

        if (response.ok) {
          const rawData = await response.json()
          const textContent = rawData?.choices?.[0]?.message?.content
          if (textContent) {
            const cleanJson = textContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
            const parsed = JSON.parse(cleanJson)

            const normalizedObj = {
              skill: parsed.skill || skillName,
              career: parsed.career || careerTargetName,
              overview: parsed.overview || `AI-generated roadmap for ${skillName}.`,
              initialScore: typeof parsed.initialScore === 'number' ? parsed.initialScore : currentScore,
              targetScore: typeof parsed.targetScore === 'number' ? parsed.targetScore : requiredLevel,
              gap: typeof parsed.gap === 'number' ? parsed.gap : gap,
              estimatedHours: typeof parsed.estimatedHours === 'number' ? parsed.estimatedHours : 5,
              prerequisites: Array.isArray(parsed.prerequisites) ? parsed.prerequisites : ['Core programming fundamentals'],
              stages: Array.isArray(parsed.stages) ? parsed.stages.map((st: any, idx: number) => ({
                stageNumber: typeof st.stageNumber === 'number' ? st.stageNumber : (idx + 1),
                title: st.title || `Stage ${idx + 1}`,
                description: st.description || '',
                durationMinutes: typeof st.durationMinutes === 'number' ? st.durationMinutes : 45,
                topics: Array.isArray(st.topics) ? st.topics : [st.title || 'Core Topic'],
                keyTakeaway: st.keyTakeaway || st.title || 'Mastery of core concepts',
                careerRelevance: st.careerRelevance || 'Required for job-readiness',
                isCompleted: Boolean(st.isCompleted),
              })) : [],
              projects: Array.isArray(parsed.projects) ? parsed.projects : [`Build a practical ${skillName} application`],
              next_step: parsed.next_step || `Start with Stage 1 fundamentals`,
              source: 'ai_generated' as const,
            }

            const validated = SkillRoadmapResponseSchema.safeParse(normalizedObj)
            if (validated.success) {
              return NextResponse.json({
                success: true,
                data: validated.data,
              })
            } else {
              console.warn('[Skill Roadmap API] AI response schema validation warning:', validated.error.format())
            }
          }
        } else {
          console.warn(`[Skill Roadmap API] AI provider returned status ${response.status}`)
        }
      } catch (aiErr: any) {
        console.warn('[Skill Roadmap API] AI provider error, falling back to canonical roadmap:', aiErr.message)
      }
    }

    // 3. Deterministic Canonical SkillBridge Roadmap Fallback
    const canonicalRoadmap = generateCanonicalRoadmap(
      skillName,
      careerTargetName,
      currentScore,
      requiredLevel
    )

    return NextResponse.json({
      success: true,
      data: canonicalRoadmap,
    })
  } catch (err: any) {
    console.error('[Skill Roadmap API FATAL Error]:', err)
    return NextResponse.json({
      success: false,
      error: { message: err?.message || 'Failed to generate skill roadmap' },
    }, { status: 500 })
  }
}
