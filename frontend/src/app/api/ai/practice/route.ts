import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skillName = "Node.js", difficulty = "Intermediate" } = body

    const question = {
      id: `prac-q-${Date.now()}`,
      skill: skillName,
      subskill: "Asynchronous Error Boundaries",
      difficulty,
      questionType: "multiple_choice",
      objective: "Demonstrate safe exception handling in asynchronous Node.js execution.",
      questionText: "In modern Node.js, what is the best practice for capturing asynchronous exceptions thrown inside an Express route handler?",
      codeSnippet: `app.get('/api/resource', async (req, res, next) => {
  // How should potential errors from async operations be caught?
  const data = await fetchAsyncData();
  res.json(data);
});`,
      options: [
        { id: "opt_a", text: "Wrap in try/catch and pass the caught error to next(error)" },
        { id: "opt_b", text: "Use process.on('uncaughtException') globally and ignore route-level errors" },
        { id: "opt_c", text: "Return res.status(500) inside a synchronous setTimeout callback" },
        { id: "opt_d", text: "Do nothing; Express automatically recovers from unhandled rejections without terminating" },
      ],
    }

    return NextResponse.json({
      success: true,
      data: { question },
    })
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        question: {
          id: `prac-q-default`,
          skill: "Node.js",
          subskill: "Event Loop",
          difficulty: "Intermediate",
          questionType: "multiple_choice",
          objective: "Identify non-blocking methods.",
          questionText: "Which core method performs asynchronous file I/O?",
          options: [
            { id: "opt_a", text: "fs.promises.readFile()" },
            { id: "opt_b", text: "fs.readFileSync()" },
          ],
        },
      },
    })
  }
}
