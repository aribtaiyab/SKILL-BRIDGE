import { NextRequest, NextResponse } from 'next/server'
import { getAIConfig } from '@/lib/ai/config'

export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      // body empty or non-JSON
    }

    const skillName: string = body?.skill || "Node.js"
    const careerTarget: string = body?.careerTarget || "Backend Developer"
    const currentScore: number = Number(body?.currentScore) || 50
    const targetScore: number = Number(body?.targetScore) || 80
    const deficit = Math.max(targetScore - currentScore, 0)

    const isLowScore = currentScore < 50
    const isHighScore = currentScore >= 75

    let summary = `A 5-step structured roadmap designed to close the ${deficit}-point deficit in ${skillName} and qualify you for ${careerTarget}.`
    let steps = [
      {
        stepNumber: 1,
        stepType: "understand",
        title: `Core Architectural Principles in ${skillName}`,
        description: `Understand foundational paradigms, execution mechanics, and internal lifecycle of ${skillName}.`,
        estimatedMinutes: 45,
        keyConcept: `${skillName} Core Lifecycle & Architecture`,
        careerRelevance: `Essential foundation expected for ${careerTarget} roles`,
        isCompleted: isHighScore,
      },
      {
        stepNumber: 2,
        stepType: "learn",
        title: `Production Error Handling & Patterns in ${skillName}`,
        description: `Master robust error handling, boundaries, and enterprise patterns in ${skillName}.`,
        estimatedMinutes: 60,
        keyConcept: "Resilient Error Boundaries & Flow",
        careerRelevance: `Required for production-grade ${careerTarget} systems`,
        isCompleted: false,
      },
      {
        stepNumber: 3,
        stepType: "practice",
        title: `Hands-On Practical Code Challenge: ${skillName}`,
        description: `Implement and debug practical scenarios under benchmark test conditions.`,
        estimatedMinutes: 45,
        keyConcept: "Practical Implementation Mastery",
        careerRelevance: "Upgrades Skill Passport to Practical Verified status",
        isCompleted: false,
      },
      {
        stepNumber: 4,
        stepType: "build",
        title: `Integration Project: ${skillName} in ${careerTarget}`,
        description: `Build a realistic mini-service demonstrating end-to-end integration and best practices.`,
        estimatedMinutes: 90,
        keyConcept: "Full-Stack / Service Integration",
        careerRelevance: `Direct portfolio evidence for hiring partners looking for ${careerTarget} talent`,
        isCompleted: false,
      },
      {
        stepNumber: 5,
        stepType: "reassess",
        title: `SkillBridge Benchmark Reassessment: ${skillName}`,
        description: `Complete the official benchmark assessment to update your verified score to ${targetScore}+.`,
        estimatedMinutes: 20,
        keyConcept: "Verified Skill Certification",
        careerRelevance: "Unlocks employer matching and verified credential in Skill Passport",
        isCompleted: false,
      },
    ]

    // Attempt Groq enhancement if configured
    const aiConfig = getAIConfig()
    if (aiConfig.apiKey) {
      try {
        const prompt = `You are the SkillBridge Connect AI Roadmap Architect.
A student aiming for the career role "${careerTarget}" has a score of ${currentScore}/100 in "${skillName}" (target: ${targetScore}/100, gap: ${deficit} pts).
Generate a concise 5-step learning roadmap in valid JSON matching this schema:
{
  "summary": "1-2 sentence overview of the roadmap",
  "steps": [
    {
      "stepNumber": 1,
      "stepType": "understand",
      "title": "Title",
      "description": "Short description",
      "estimatedMinutes": 45,
      "keyConcept": "Key concept",
      "careerRelevance": "Why employers care"
    }
  ]
}
Ensure exactly 5 steps: step 1 understand, step 2 learn, step 3 practice, step 4 build, step 5 reassess.`

        const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${aiConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: aiConfig.model,
            messages: [
              { role: 'system', content: 'You are the SkillBridge Connect AI Roadmap Architect. Return valid JSON only.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 1024,
            response_format: { type: 'json_object' },
          }),
          signal: AbortSignal.timeout(Math.min(aiConfig.timeoutMs, 10000)),
        })

        if (response.ok) {
          const data = await response.json()
          const text = data?.choices?.[0]?.message?.content
          if (text) {
            const clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
            const parsed = JSON.parse(clean)
            if (parsed.summary) summary = parsed.summary
            if (Array.isArray(parsed.steps) && parsed.steps.length === 5) {
              steps = parsed.steps.map((s: any, idx: number) => ({
                stepNumber: idx + 1,
                stepType: s.stepType || steps[idx].stepType,
                title: s.title || steps[idx].title,
                description: s.description || steps[idx].description,
                estimatedMinutes: Number(s.estimatedMinutes) || 45,
                keyConcept: s.keyConcept || steps[idx].keyConcept,
                careerRelevance: s.careerRelevance || steps[idx].careerRelevance,
                isCompleted: idx === 0 && isHighScore,
              }))
            }
          }
        }
      } catch (groqErr) {
        console.warn('Groq roadmap generation fallback to deterministic steps:', groqErr)
      }
    }

    const plan = {
      skill: skillName,
      careerTarget,
      initialScore: currentScore,
      targetScore,
      estimatedTotalHours: Math.ceil(steps.reduce((acc, s) => acc + (s.estimatedMinutes || 45), 0) / 60),
      summary,
      steps,
    }

    return NextResponse.json({
      success: true,
      data: { plan },
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to generate roadmap' },
      { status: 500 }
    )
  }
}
