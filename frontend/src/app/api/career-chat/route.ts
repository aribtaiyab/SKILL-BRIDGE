import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    if (!apiKey) {
      // Deterministic advisor fallback if API key is not configured
      return NextResponse.json({
        text: `### The Short Answer\nChoosing the right path depends on your strengths, but mastering core foundational concepts (such as JavaScript/Python and RESTful system design) provides the strongest launchpad for modern tech roles in 2026.\n\n### The Breakdown\n* **Frontend:** Focuses on user interfaces, responsive design, state management, and modern component architecture (React, Next.js, Tailwind).\n* **Backend:** Focuses on APIs, business logic, data models, asynchronous job processing, and scalable database queries (Node.js, PostgreSQL, Redis).\n* **Cloud & DevOps:** Focuses on automation, containerization, CI/CD pipelines, and cloud reliability (Docker, Kubernetes, AWS/GCP).\n\n### Your Next Steps\n1. **Build a Full-Stack Project:** Create a complete CRUD application with authentication and persistent database storage.\n2. **Master Asynchronous Patterns:** Practice error boundaries and API resiliency in Node.js or Python.\n3. **Assess Your Verified Benchmark:** Complete a SkillBridge practical challenge to validate your score on your Living Skill Passport.`
      });
    }

    const systemPrompt = `You are an elite, empathetic tech career advisor for students.
Your goal is to answer career, course, and tech-stack questions in the simplest, most understandable way.

RULES FOR YOUR RESPONSE:
1. Use clean, simple language. Avoid dense jargon.
2. If the user asks to compare two things (e.g., "Node vs Python"), break it down clearly with pros/cons.
3. ALWAYS structure your response in distinct parts using Markdown:
   - **The Short Answer:** A direct, 1-2 sentence answer.
   - **The Breakdown (or Comparison):** Simple bullet points explaining the details.
   - **Your Next Steps:** 2-3 highly actionable things the student should do right now (e.g., specific concepts to learn or small projects to build).`;

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const baseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
    const groqUrl = `${baseUrl}/chat/completions`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(groqUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.5,
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);

      // Attempt fallback with secondary model if model not found error
      if (errorText.includes('model_not_found') || errorText.includes('does not exist')) {
        const fallbackRes = await fetch(groqUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: query }
            ],
            temperature: 0.5,
          })
        });

        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          return NextResponse.json({ text: fallbackData.choices[0].message.content });
        }
      }

      return NextResponse.json({ error: "Failed to fetch AI response" }, { status: 500 });
    }

    const data = await response.json();
    const replyText = data?.choices?.[0]?.message?.content || "No response generated.";
    return NextResponse.json({ text: replyText });

  } catch (error) {
    console.error("Career Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
