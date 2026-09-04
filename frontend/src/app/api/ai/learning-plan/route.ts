import { NextResponse } from 'next/server'

export async function POST() {
  const plan = {
    skill: "Node.js",
    careerTarget: "Backend Developer (Internship/Junior)",
    initialScore: 65,
    targetScore: 80,
    estimatedTotalHours: 8,
    summary: "A 5-step structured roadmap designed to close the 15-point deficit in Node.js and qualify you for backend internships.",
    steps: [
      {
        stepNumber: 1,
        stepType: "understand",
        title: "Event Loop & Libuv Architecture",
        description: "Understand microtask queues, macrotasks, and how the single-threaded event loop handles non-blocking I/O.",
        estimatedMinutes: 45,
        keyConcept: "Libuv non-blocking scheduling",
        careerRelevance: "Essential for debugging high-traffic backend servers",
        isCompleted: true,
      },
      {
        stepNumber: 2,
        stepType: "learn",
        title: "Asynchronous Error Propagation & Express Middleware",
        description: "Master try/catch patterns with async/await and centralize error reporting via Express error handlers.",
        estimatedMinutes: 60,
        keyConcept: "Centralized Error Middleware",
        careerRelevance: "Required for robust production API gateways",
        isCompleted: false,
      },
      {
        stepNumber: 3,
        stepType: "practice",
        title: "Level 2 Practical Debug Challenge",
        description: "Solve the timed challenge fixing an unhandled promise rejection in route handlers.",
        estimatedMinutes: 30,
        keyConcept: "Hands-on Code Debugging",
        careerRelevance: "Directly upgrades Skill Passport to Practical Verified",
        isCompleted: false,
      },
      {
        stepNumber: 4,
        stepType: "build",
        title: "Relational Database Connection Pooling with PostgreSQL",
        description: "Implement query parameterization and connection pools to prevent database connection starvation.",
        estimatedMinutes: 90,
        keyConcept: "Connection Pooling & Index Tuning",
        careerRelevance: "Standard requirement for fintech backend roles",
        isCompleted: false,
      },
      {
        stepNumber: 5,
        stepType: "reassess",
        title: "Benchmark Reassessment",
        description: "Retake the official SkillBridge knowledge and practical assessment to update your verified score to 80+.",
        estimatedMinutes: 20,
        keyConcept: "Verified Skill Certification",
        careerRelevance: "Unlocks direct candidate shortlisting by hiring partners",
        isCompleted: false,
      },
    ],
  }

  return NextResponse.json({
    success: true,
    data: { plan },
  })
}
