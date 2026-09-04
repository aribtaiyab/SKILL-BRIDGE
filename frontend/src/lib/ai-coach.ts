/**
 * SkillBridge Connect - Dynamic AI Coach & Fallback Engine
 *
 * Adheres to official specification with strict 7.5s AbortController timeout for Vercel,
 * structured JSON output, and guaranteed deterministic fallback calculation.
 */

export interface DiagnosticResult {
  readinessScore: number
  priorityGap: string
  gapCategory: "Critical Gap" | "Needs Improvement" | "Ready"
  weakSubSkills: string[]
  actionablePlan: string
  recommendedTask: string
}

export function calculateRuleBasedReadiness(
  targetRole: string,
  studentScores: Record<string, number>,
  benchmark: Record<string, { required: number; weight: number }>
): DiagnosticResult {
  let weightedScore = 0
  let totalWeight = 0
  let maxDeficit = -Infinity
  let priorityGap = Object.keys(benchmark)[0] || "Core Fundamentals"

  for (const [skill, config] of Object.entries(benchmark)) {
    const studentScore = studentScores[skill] || studentScores[skill.toLowerCase()] || 0
    const deficit = config.required - studentScore
    if (deficit > maxDeficit) {
      maxDeficit = deficit
      priorityGap = skill
    }
    const ratio = Math.min(studentScore / config.required, 1.0)
    weightedScore += ratio * config.weight
    totalWeight += config.weight
  }

  const calculatedReadiness = Math.round((weightedScore / (totalWeight || 1)) * 100)
  const gapCategory: "Critical Gap" | "Needs Improvement" | "Ready" =
    maxDeficit > 20 ? "Critical Gap" : maxDeficit > 5 ? "Needs Improvement" : "Ready"

  return {
    readinessScore: calculatedReadiness,
    priorityGap,
    gapCategory,
    weakSubSkills: [
      `${priorityGap} Core Architecture & Patterns`,
      `${priorityGap} Production Error Handling & Resiliency`,
    ],
    actionablePlan: `Focus on closing the ${maxDeficit > 0 ? maxDeficit : 0} point deficit in ${priorityGap}. Complete targeted practical tasks before reassessing.`,
    recommendedTask: `Complete the Level 2 Practical Debugging Task for ${priorityGap}.`,
  }
}

export async function getCareerReadinessDiagnosis(
  targetRole: string,
  studentScores: Record<string, number>,
  benchmark: Record<string, { required: number; weight: number }>
): Promise<DiagnosticResult> {
  // 1. Calculate deterministic fallback values first
  const fallbackResult = calculateRuleBasedReadiness(targetRole, studentScores, benchmark)

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GROQ_API_KEY

  if (!apiKey) {
    return fallbackResult
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 7500) // 7.5s timeout for Vercel

    const prompt = `You are the SkillBridge Diagnostic AI.
Target Role: ${targetRole}
Current Student Scores: ${JSON.stringify(studentScores)}
Required Role Benchmarks: ${JSON.stringify(benchmark)}

Respond ONLY with valid JSON having this exact structure:
{
  "readinessScore": ${fallbackResult.readinessScore},
  "priorityGap": "${fallbackResult.priorityGap}",
  "gapCategory": "${fallbackResult.gapCategory}",
  "weakSubSkills": ["subskill 1", "subskill 2"],
  "actionablePlan": "Specific diagnostic guidance.",
  "recommendedTask": "${fallbackResult.recommendedTask}"
}`

    const baseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return fallbackResult
    }

    const data: any = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (content) {
      const parsed = JSON.parse(content.replace(/```json|```/g, "").trim())
      return {
        readinessScore: typeof parsed.readinessScore === "number" ? parsed.readinessScore : fallbackResult.readinessScore,
        priorityGap: parsed.priorityGap || fallbackResult.priorityGap,
        gapCategory: parsed.gapCategory || fallbackResult.gapCategory,
        weakSubSkills: Array.isArray(parsed.weakSubSkills) ? parsed.weakSubSkills : fallbackResult.weakSubSkills,
        actionablePlan: parsed.actionablePlan || fallbackResult.actionablePlan,
        recommendedTask: parsed.recommendedTask || fallbackResult.recommendedTask,
      }
    }

    return fallbackResult
  } catch {
    // Gracefully return deterministic result on timeout or API error
    return fallbackResult
  }
}
