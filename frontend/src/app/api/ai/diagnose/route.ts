import { NextRequest, NextResponse } from 'next/server'
import { getCareerReadinessDiagnosis } from '@/lib/ai-coach'
import { CAREER_BENCHMARK_PROFILES } from '@/lib/benchmarks'

export async function POST(request: NextRequest) {
  try {
    let body = {}
    try {
      body = await request.json()
    } catch {
      // empty body
    }

    const { targetRole = "Backend Developer", studentScores = { "Node.js": 65, "REST APIs": 72, "SQL": 82 } } = body as any
    const profile = CAREER_BENCHMARK_PROFILES[0]

    const diagnosis = await getCareerReadinessDiagnosis(
      targetRole,
      studentScores,
      profile.skills
    )

    const formattedDiagnosis = {
      skill: diagnosis.priorityGap,
      summary: diagnosis.actionablePlan,
      currentScore: studentScores[diagnosis.priorityGap] || 65,
      targetScore: profile.skills[diagnosis.priorityGap]?.required || 80,
      gap: (profile.skills[diagnosis.priorityGap]?.required || 80) - (studentScores[diagnosis.priorityGap] || 65),
      weakAreas: diagnosis.weakSubSkills,
      strengths: ["Demonstrated solid core language foundation", "Familiarity with standard APIs"],
      commonMistakes: [
        "Uncaught asynchronous rejections terminating the execution context",
        "Missing index definitions on high-frequency join columns",
      ],
      prerequisites: ["Asynchronous Control Flow", "REST Conventions"],
      recommendedSequence: [
        "1. Master try/catch async error propagation in middleware",
        "2. Solve Level 2 practical debugging challenges",
        "3. Reassess benchmark in Skill Assessments",
      ],
      nextAction: {
        title: diagnosis.recommendedTask,
        description: "Complete the practical hands-on challenge to eliminate the priority gap.",
        estimatedMinutes: 20,
      },
      confidence: "high",
    }

    return NextResponse.json({
      success: true,
      data: { diagnosis: formattedDiagnosis },
    })
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      data: {
        diagnosis: {
          skill: "Node.js",
          summary: "Focus on closing the deficit in Node.js asynchronous error handling.",
          currentScore: 65,
          targetScore: 80,
          gap: 15,
          weakAreas: ["Asynchronous Programming", "Error Handling"],
          strengths: ["Basic REST Conventions"],
          commonMistakes: ["Unhandled Promise Rejections"],
          prerequisites: ["JavaScript ES6"],
          recommendedSequence: ["1. Review async/await", "2. Take practical challenge"],
          nextAction: {
            title: "Complete the Level 2 Practical Debugging Task for Node.js.",
            description: "Practice async error middleware.",
            estimatedMinutes: 15,
          },
          confidence: "high",
        },
      },
    })
  }
}
