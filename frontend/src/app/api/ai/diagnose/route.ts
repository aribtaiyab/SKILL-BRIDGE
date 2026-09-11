import { NextRequest, NextResponse } from 'next/server'

function generateFallbackDiagnosis(targetRole: string = 'Backend Developer', studentScores: Record<string, number> = {}, benchmark: Record<string, any> = {}) {
  // Find highest deficit skill
  let priorityGap = "Node.js & REST APIs"
  let maxGap = 15

  if (benchmark && Object.keys(benchmark).length > 0) {
    for (const [skill, req] of Object.entries(benchmark)) {
      const required = typeof req === 'number' ? req : (req?.required || 80)
      const current = studentScores[skill] || 65
      const gap = required - current
      if (gap > maxGap) {
        maxGap = gap
        priorityGap = skill
      }
    }
  }

  const gapCategory = maxGap > 20 ? "Critical Gap" : maxGap > 5 ? "Needs Improvement" : "Ready"

  return {
    priorityGap,
    gapDeficit: Math.max(maxGap, 10),
    gapCategory,
    weakSubSkills: [
      `${priorityGap} Core Architecture & Asynchronous Flow`,
      `${priorityGap} Production Error Handling & Resiliency`,
    ],
    actionablePlan: `Focus on closing the ${maxGap} point deficit in ${priorityGap} before reassessment. Complete targeted practical challenges to build verified proof.`,
    recommendedTask: `Complete the 15-minute Level 2 Practical Challenge for ${priorityGap}.`,
    diagnosis: {
      skill: priorityGap,
      summary: `Focus on closing the ${maxGap} point deficit in ${priorityGap} before reassessment.`,
      currentScore: studentScores[priorityGap] || 65,
      targetScore: (benchmark[priorityGap]?.required || 80),
      gap: maxGap,
      weakAreas: [`${priorityGap} Asynchronous Programming`, `${priorityGap} Error Handling`],
      strengths: ["Demonstrated solid core language foundation", "Familiarity with standard APIs"],
      commonMistakes: ["Uncaught asynchronous rejections in route handlers", "Missing index definitions on high-frequency join columns"],
      prerequisites: ["Asynchronous Control Flow", "REST Conventions"],
      recommendedSequence: [
        "1. Master try/catch async error propagation in middleware",
        "2. Solve Level 2 practical debugging challenges",
        "3. Reassess benchmark in Skill Assessments",
      ],
      nextAction: {
        title: `Complete the Level 2 Practical Challenge for ${priorityGap}`,
        description: "Complete the practical hands-on challenge to eliminate the priority gap.",
        estimatedMinutes: 20,
      },
      confidence: "high",
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const {
      targetRole = 'Full Stack Developer',
      studentScores = { 'Node.js': 65, 'REST APIs': 72, 'SQL': 82 },
      benchmark = { 'Node.js': { required: 80, weight: 1.0 }, 'REST APIs': { required: 80, weight: 1.0 }, 'SQL': { required: 75, weight: 0.8 } }
    } = body

    const apiKey = (process.env.GROQ_API_KEY || '').trim()

    // Deterministic fallback if key is not configured
    if (!apiKey) {
      console.warn("AI Key not found in process.env. Utilizing deterministic engine.")
      return NextResponse.json(generateFallbackDiagnosis(targetRole, studentScores, benchmark))
    }

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
    const baseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '')
    const groqUrl = `${baseUrl}/chat/completions`

    const promptText = `
You are the SkillBridge Diagnostic AI Coach.
Analyze this student for target role: "${targetRole}".
Student Scores: ${JSON.stringify(studentScores)}
Required Benchmarks: ${JSON.stringify(benchmark)}

Return ONLY valid raw JSON with no markdown backticks, matching this exact shape:
{
  "priorityGap": "Skill Name with largest deficit",
  "gapDeficit": 15,
  "gapCategory": "Needs Improvement",
  "weakSubSkills": ["subskill 1", "subskill 2"],
  "actionablePlan": "1-2 concise actionable sentences",
  "recommendedTask": "Specific 15-minute practical task"
}
`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8500)

    const response = await fetch(groqUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are the SkillBridge Diagnostic AI Coach. Return valid JSON only.' },
          { role: 'user', content: promptText },
        ],
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.error("Groq API error status:", response.status, await response.text())
      return NextResponse.json(generateFallbackDiagnosis(targetRole, studentScores, benchmark))
    }

    const data = await response.json()
    const rawText = data?.choices?.[0]?.message?.content || '{}'

    // Clean markdown code blocks if model returned them
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim()

    let parsedData: any
    try {
      parsedData = JSON.parse(cleanJson)
    } catch {
      return NextResponse.json(generateFallbackDiagnosis(targetRole, studentScores, benchmark))
    }

    // Attach structured diagnosis node for maximum backward/forward compatibility
    const prioritySkill = parsedData.priorityGap || 'Node.js'
    const gap = Number(parsedData.gapDeficit) || 15
    const fallbackObj = generateFallbackDiagnosis(targetRole, studentScores, benchmark)

    parsedData.diagnosis = {
      ...fallbackObj.diagnosis,
      skill: prioritySkill,
      summary: parsedData.actionablePlan || fallbackObj.actionablePlan,
      gap: gap,
      weakAreas: Array.isArray(parsedData.weakSubSkills) ? parsedData.weakSubSkills : fallbackObj.weakSubSkills,
      nextAction: {
        title: parsedData.recommendedTask || fallbackObj.recommendedTask,
        description: "Complete the practical hands-on challenge to eliminate the priority gap.",
        estimatedMinutes: 15,
      },
    }

    return NextResponse.json(parsedData)
  } catch (error) {
    console.error("AI API Handler Exception:", error)
    return NextResponse.json(generateFallbackDiagnosis('General', {}, {}))
  }
}
