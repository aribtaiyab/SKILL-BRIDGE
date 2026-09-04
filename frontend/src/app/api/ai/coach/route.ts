import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message = "" } = body
    const lower = message.toLowerCase()

    let reply = "I am your SkillBridge AI Coach. I specialize in analyzing your target career benchmarks and guiding your practical skill verification."
    let suggestedQuestions = [
      "Why is Node.js my priority gap?",
      "Explain asynchronous event loop simply",
      "Give me a Level 2 practical challenge",
      "Am I ready to reassess?",
    ]

    if (lower.includes("why") && (lower.includes("gap") || lower.includes("priority"))) {
      reply = `**Node.js** is currently your top priority gap because it carries the highest benchmark weight (35%) for Backend Developer roles. Your verified score is currently **65/100** against a requirement of **80/100** (a 15-point deficit). Closing this gap will elevate your career readiness from 78% to 88%+.`
      suggestedQuestions = [
        "Explain asynchronous event loop simply",
        "Give me a practical challenge",
        "What is in my learning plan?",
      ]
    } else if (lower.includes("explain") && lower.includes("simply")) {
      reply = `### Asynchronous Programming Explained Simply\n\nImagine a chef working alone in a busy restaurant kitchen:\n- **Synchronous**: The chef puts water on the stove and stands still for 10 minutes staring at the pot until it boils, refusing to take orders or chop vegetables.\n- **Asynchronous**: The chef puts the pot on the burner, sets a timer (Libuv callback), and immediately starts prepping ingredients. When the timer dings, the chef returns to the pot.\n\n**Key Takeaway**: If an async task throws an error that isn't caught with \`try/catch\` or \`next(err)\`, the kitchen halts—known as an unhandled promise rejection.`
      suggestedQuestions = [
        "How do I fix unhandled promise rejections?",
        "Give me a code challenge on this",
        "Why is this tested in backend interviews?",
      ]
    } else if (lower.includes("ready") || lower.includes("reassess")) {
      reply = `You can reassess your Node.js skill anytime! You have completed the prerequisite conceptual learning. We recommend taking the **Level 2 Practical Challenge** to verify your hands-on debugging competency before retaking the Knowledge Assessment.`
    }

    return NextResponse.json({
      success: true,
      data: {
        reply,
        suggestedQuestions,
      },
    })
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        reply: "Hello! I am your SkillBridge AI Coach. Focus on closing your Node.js priority gap to qualify for active internships.",
        suggestedQuestions: [
          "Why is Node.js my priority gap?",
          "Explain asynchronous event loop simply",
        ],
      },
    })
  }
}
