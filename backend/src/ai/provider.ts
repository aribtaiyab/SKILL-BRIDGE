import { AI_CONFIG } from './config'
import {
  StudentAIContext,
  DiagnosticOutput,
  DiagnosticOutputSchema,
  LearningPlan,
  LearningPlanSchema,
  PracticeQuestionSafe,
  PracticeQuestionSafeSchema,
  PracticeFeedback,
  PracticeFeedbackSchema,
  CoachMessage,
  DifficultyLevel,
} from './types'
import {
  getDiagnosticSystemPrompt,
  getLearningPlanSystemPrompt,
  getPracticeSystemPrompt,
  getFeedbackSystemPrompt,
  getCoachChatSystemPrompt,
  formatSkillBridgeContext,
} from './prompts'

export interface AIProvider {
  diagnose(context: StudentAIContext, skillName: string): Promise<DiagnosticOutput>
  createLearningPlan(context: StudentAIContext, skillName: string): Promise<LearningPlan>
  generatePractice(context: StudentAIContext, skillName: string, difficulty: DifficultyLevel): Promise<{ question: PracticeQuestionSafe; serverAnswer: string; explanation: string }>
  evaluatePractice(
    context: StudentAIContext,
    skillName: string,
    questionText: string,
    studentAnswer: string,
    serverAnswer: string
  ): Promise<PracticeFeedback>
  chat(context: StudentAIContext, message: string, history: CoachMessage[]): Promise<{ reply: string; suggestedQuestions: string[] }>
}

/**
 * Intelligent Deterministic Fallback Provider
 * Produces structured, accurate, explainable responses strictly based on context.
 */
export class DeterministicSkillBridgeAIProvider implements AIProvider {
  async diagnose(context: StudentAIContext, skillName: string): Promise<DiagnosticOutput> {
    const skill = context.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase()) || context.skills[0]
    const currentScore = skill ? skill.currentScore : 65
    const targetScore = skill ? skill.requiredScore : 80
    const gap = Math.max(targetScore - currentScore, 0)
    const isLowScore = currentScore < 50
    const isHighScore = currentScore >= 75

    let weakAreas: string[] = []
    let commonMistakes: string[] = []
    let prerequisites: string[] = []
    let recommendedSequence: string[] = []

    if (skillName.toLowerCase().includes('node')) {
      if (isLowScore) {
        weakAreas = [
          'Core event-driven architecture and single-threaded execution model',
          'Fundamental asynchronous callbacks vs synchronous blocking operations',
          'Basic Node.js module exports and file system (fs) basics',
        ]
        commonMistakes = [
          'Attempting to return values directly from asynchronous callbacks',
          'Blocking execution with sync calls inside loops',
        ]
        prerequisites = ['JavaScript ES6 Syntax & Functions', 'Basics of HTTP']
        recommendedSequence = [
          '1. Understand non-blocking execution vs synchronous operations',
          '2. Practice callback error conventions and Promise basics',
          '3. Build a simple HTTP server responding to basic routes',
        ]
      } else if (isHighScore) {
        weakAreas = [
          'High-concurrency cluster workers and IPC communication',
          'Memory profiling and garbage collection pressure optimization',
          'Custom Transform streams with fine-grained backpressure thresholds',
        ]
        commonMistakes = [
          'Memory leaks from uncleaned event listeners in long-lived services',
          'Improper cluster load balancing across CPU cores',
        ]
        prerequisites = ['Advanced async architecture', 'Linux process models']
        recommendedSequence = [
          '1. Profile memory usage with heap snapshots',
          '2. Implement worker thread offloading for compute-heavy tasks',
          '3. Benchmark throughput under simulated high-load scenarios',
        ]
      } else {
        weakAreas = [
          'Asynchronous control flow (Promise chaining vs async/await rejection handling)',
          'Event loop tick phases and non-blocking I/O patterns',
          'Stream buffer backpressure & chunk error propagation',
        ]
        commonMistakes = [
          'Uncaught exceptions inside asynchronous callbacks causing process termination',
          'Blocking the main event loop with synchronous file system calls under load',
          'Forgetting to return after sending HTTP response in middleware',
        ]
        prerequisites = ['JavaScript ES6 Modules & Closures', 'HTTP Protocol & REST conventions']
        recommendedSequence = [
          '1. Master Promise rejection and async/await try/catch blocks',
          '2. Implement event listener error boundaries',
          '3. Build a streaming pipe with backpressure handling',
        ]
      }
    } else {
      weakAreas = [
        `Core foundational concepts in ${skillName}`,
        `Architectural integration and production error handling in ${skillName}`,
      ]
      commonMistakes = [
        `Overlooking edge case validation in ${skillName} workflows`,
      ]
      prerequisites = ['Basic technical foundations']
      recommendedSequence = [
        `1. Review core principles of ${skillName}`,
        `2. Complete practical hands-on challenge for ${skillName}`,
      ]
    }

    const opportunityNote = context.opportunity
      ? ` Closing this gap will elevate your readiness for ${context.opportunity.title} at ${context.opportunity.company}.`
      : ''

    const output: DiagnosticOutput = {
      skill: skill?.name || skillName,
      summary: `Diagnostic analysis identifies a ${gap}-point deficit in ${skill?.name || skillName} (Current: ${currentScore} / Target: ${targetScore}). ${isLowScore ? 'Focus is on establishing resilient core fundamentals.' : isHighScore ? 'Focus is on high-throughput optimization and advanced edge cases.' : 'The primary conceptual bottleneck is error propagation across asynchronous control boundaries.'}${opportunityNote}`,
      currentScore,
      targetScore,
      gap,
      weakAreas,
      strengths: [`Demonstrated solid grasp of basic syntax and initialization for ${skill?.name || skillName}`],
      commonMistakes,
      prerequisites,
      recommendedSequence,
      nextAction: {
        title: isLowScore
          ? `Master Core Fundamentals in ${skill?.name || skillName}`
          : `Practice Asynchronous Error Handling in ${skill?.name || skillName}`,
        description: `Complete a 15-minute targeted debugging scenario focusing on ${isLowScore ? 'basic async control' : 'try/catch blocks with async/await'}.`,
        estimatedMinutes: 15,
      },
      confidence: 'high',
    }

    return DiagnosticOutputSchema.parse(output)
  }

  async createLearningPlan(context: StudentAIContext, skillName: string): Promise<LearningPlan> {
    const skill = context.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase()) || context.skills[0]
    const initialScore = skill ? skill.currentScore : 65
    const targetScore = skill ? skill.requiredScore : 80
    const isLowScore = initialScore < 50
    const isHighScore = initialScore >= 75

    const steps = isLowScore
      ? [
          {
            stepNumber: 1,
            stepType: 'understand' as const,
            title: `Foundations: What makes ${skill?.name || skillName} non-blocking?`,
            description: 'Learn why single-threaded async execution enables lightweight scalability compared to multi-threaded models.',
            estimatedMinutes: 25,
            keyConcept: 'Single-threaded Non-blocking Model',
            careerRelevance: `Fundamental prerequisite for ${context.student.targetCareer}.`,
            isCompleted: false,
          },
          {
            stepNumber: 2,
            stepType: 'learn' as const,
            title: 'Mastering Callbacks and Promises',
            description: 'Transition from error-first callbacks to Promises and async/await syntax.',
            estimatedMinutes: 35,
            keyConcept: 'Promise State Transitions',
            careerRelevance: 'Enables clean asynchronous code maintenance.',
            isCompleted: false,
          },
          {
            stepNumber: 3,
            stepType: 'practice' as const,
            title: 'Basic Asynchronous API Exercises',
            description: 'Solve 3 beginner challenges implementing sequential and concurrent async calls.',
            estimatedMinutes: 30,
            keyConcept: 'Promise.all & async execution',
            careerRelevance: 'Builds foundational problem-solving speed.',
            isCompleted: false,
          },
          {
            stepNumber: 4,
            stepType: 'build' as const,
            title: 'Build Simple REST Service',
            description: 'Create a straightforward CRUD API verifying database reads and writes.',
            estimatedMinutes: 45,
            keyConcept: 'Basic REST endpoint structure',
            careerRelevance: 'Validates baseline capability.',
            isCompleted: false,
          },
          {
            stepNumber: 5,
            stepType: 'reassess' as const,
            title: `Take ${skill?.name || skillName} Reassessment`,
            description: 'Retake the assessment to elevate your verified skill score to Intermediate.',
            estimatedMinutes: 15,
            keyConcept: 'Official Benchmark Reassessment',
            careerRelevance: 'Updates verified Career Readiness.',
            isCompleted: false,
          },
        ]
      : [
          {
            stepNumber: 1,
            stepType: 'understand' as const,
            title: `Understand Asynchronous Mechanics in ${skill?.name || skillName}`,
            description: 'Deep dive into event loop queues, microtasks vs macrotasks, and why unhandled rejections crash servers.',
            estimatedMinutes: 30,
            keyConcept: 'Event Loop & Microtask Execution',
            careerRelevance: `Essential for high-throughput ${context.student.targetCareer} API endpoints.`,
            isCompleted: false,
          },
          {
            stepNumber: 2,
            stepType: 'learn' as const,
            title: 'Structured Error Handling & Middleware Pattern',
            description: 'Implement centralized error handling middleware that captures async errors without boilerplate.',
            estimatedMinutes: 45,
            keyConcept: 'Express/Fastify Error Middleware Pattern',
            careerRelevance: 'Prevents silent server crashes in production environments.',
            isCompleted: false,
          },
          {
            stepNumber: 3,
            stepType: 'practice' as const,
            title: 'Targeted Practice: Debugging Async Rejections',
            description: 'Solve 3 realistic code debugging exercises with asynchronous race conditions.',
            estimatedMinutes: 30,
            keyConcept: 'Promise.allSettled vs Promise.all failure modes',
            careerRelevance: 'Directly reinforces assessment benchmarks.',
            isCompleted: false,
          },
          {
            stepNumber: 4,
            stepType: 'build' as const,
            title: 'Build Resilient Streaming File Importer',
            description: 'Construct a microservice endpoint that streams large datasets with chunk validation.',
            estimatedMinutes: 60,
            keyConcept: 'Stream pipeline backpressure management',
            careerRelevance: 'Provides practical evidence for your Skill Passport.',
            isCompleted: false,
          },
          {
            stepNumber: 5,
            stepType: 'reassess' as const,
            title: `Reassess ${skill?.name || skillName} Benchmark`,
            description: `Retake the ${skill?.name || skillName} assessment to officially record your upgraded verified score.`,
            estimatedMinutes: 15,
            keyConcept: 'Verified Knowledge Reassessment',
            careerRelevance: 'Directly upgrades your verified Career Readiness score.',
            isCompleted: false,
          },
        ]

    const plan: LearningPlan = {
      skill: skill?.name || skillName,
      careerTarget: context.student.targetCareer,
      initialScore,
      targetScore,
      estimatedTotalHours: isLowScore ? 3 : 4,
      summary: `A structured ${steps.length}-step learning pathway designed to elevate your ${skill?.name || skillName} from ${initialScore} to ${targetScore} for ${context.student.targetCareer}.`,
      steps,
    }

    return LearningPlanSchema.parse(plan)
  }

  async generatePractice(
    context: StudentAIContext,
    skillName: string,
    difficulty: DifficultyLevel
  ): Promise<{ question: PracticeQuestionSafe; serverAnswer: string; explanation: string }> {
    const isNode = skillName.toLowerCase().includes('node')

    if (isNode) {
      if (difficulty === 'Beginner') {
        const q: PracticeQuestionSafe = {
          id: `practice-${Date.now()}`,
          skill: 'Node.js',
          subskill: 'Non-Blocking Foundations',
          difficulty: 'Beginner',
          questionType: 'multiple_choice',
          objective: 'Distinguish between synchronous and asynchronous operations.',
          questionText: 'Which Node.js core method executes asynchronously without blocking the event loop?',
          options: [
            { id: 'opt_a', text: 'fs.readFileSync()' },
            { id: 'opt_b', text: 'fs.promises.readFile()' },
            { id: 'opt_c', text: 'crypto.pbkdf2Sync()' },
            { id: 'opt_d', text: 'JSON.parse()' },
          ],
        }
        return {
          question: PracticeQuestionSafeSchema.parse(q),
          serverAnswer: 'opt_b',
          explanation: 'fs.promises.readFile() returns a Promise that delegates I/O to libuv threadpool asynchronously, preventing event loop blocking.',
        }
      }

      if (difficulty === 'Advanced') {
        const q: PracticeQuestionSafe = {
          id: `practice-${Date.now()}`,
          skill: 'Node.js',
          subskill: 'Stream Backpressure & Buffer Sizing',
          difficulty: 'Advanced',
          questionType: 'multiple_choice',
          objective: 'Manage high-throughput stream backpressure effectively.',
          questionText: 'When piping a fast Readable stream into a slower Writable stream in Node.js, what does writable.write(chunk) returning false indicate?',
          options: [
            { id: 'opt_a', text: 'The stream encountered a fatal network socket exception.' },
            { id: 'opt_b', text: 'The internal highWaterMark buffer is full and reading should pause until the drain event fires.' },
            { id: 'opt_c', text: 'The data chunk was discarded by the operating system.' },
            { id: 'opt_d', text: 'The writable stream is permanently closed.' },
          ],
        }
        return {
          question: PracticeQuestionSafeSchema.parse(q),
          serverAnswer: 'opt_b',
          explanation: 'Returning false indicates that the write buffer exceeds highWaterMark. The producer must pause and await the drain event to avoid out-of-memory crashes.',
        }
      }

      // Default Intermediate
      const q: PracticeQuestionSafe = {
        id: `practice-${Date.now()}`,
        skill: 'Node.js',
        subskill: 'Async Error Handling',
        difficulty: 'Intermediate',
        questionType: 'multiple_choice',
        objective: 'Identify safe error handling in async/await express routes.',
        questionText: 'In an Express route handler utilizing async/await, what happens if a rejected Promise occurs inside a function without a try/catch block and without passing the error to next()?',
        codeSnippet: `app.get('/api/users', async (req, res, next) => {
  const users = await database.getUsers(); // throws DBConnectionError
  res.json(users);
});`,
        options: [
          { id: 'opt_a', text: 'Express automatically returns a 500 error to the client.' },
          { id: 'opt_b', text: 'The request hangs indefinitely or triggers an UnhandledPromiseRejection, potentially crashing the process in modern Node.js.' },
          { id: 'opt_c', text: 'Node.js retries the query automatically three times before failing.' },
          { id: 'opt_d', text: 'The route executes normally and returns an empty array.' },
        ],
      }
      return {
        question: PracticeQuestionSafeSchema.parse(q),
        serverAnswer: 'opt_b',
        explanation: 'In Express v4, asynchronous errors thrown inside async route handlers must either be wrapped in try/catch or passed via an async wrapper to next(err). Otherwise, an UnhandledPromiseRejection is raised.',
      }
    }

    const q: PracticeQuestionSafe = {
      id: `practice-${Date.now()}`,
      skill: skillName,
      subskill: 'Core Principles',
      difficulty,
      questionType: 'multiple_choice',
      objective: `Evaluate core architectural principles of ${skillName}.`,
      questionText: `Which approach represents the recommended industry standard when handling production failures in ${skillName}?`,
      options: [
        { id: 'opt_a', text: 'Ignoring non-critical exceptions to maximize uptime.' },
        { id: 'opt_b', text: 'Centralized logging, structured error responses, and graceful resource cleanup.' },
        { id: 'opt_c', text: 'Restarting the operating system whenever an error threshold is reached.' },
        { id: 'opt_d', text: 'Disabling telemetry in production to reduce network overhead.' },
      ],
    }
    return {
      question: PracticeQuestionSafeSchema.parse(q),
      serverAnswer: 'opt_b',
      explanation: 'Production architectures require centralized telemetry, clean resource disposal, and clear HTTP status mapping.',
    }
  }

  async evaluatePractice(
    context: StudentAIContext,
    skillName: string,
    questionText: string,
    studentAnswer: string,
    serverAnswer: string
  ): Promise<PracticeFeedback> {
    const isCorrect = studentAnswer === serverAnswer || studentAnswer.includes(serverAnswer)

    const feedback: PracticeFeedback = {
      practiceId: `practice-eval-${Date.now()}`,
      isCorrect,
      score: isCorrect ? 100 : 0,
      explanation: isCorrect
        ? `Spot on! You correctly identified the technical solution. In Node.js, asynchronous rejections that bypass next(err) will trigger unhandled rejection events.`
        : `Not quite. In Express v4, unhandled promise rejections inside async handlers do not automatically route to default error middleware. The request will hang or trigger an UnhandledPromiseRejection.`,
      missedConcept: isCorrect ? undefined : 'Asynchronous Error Propagation & Next(err) delegation',
      correctAnswerSummary: 'Wrap asynchronous operations in try/catch or use an async-handler wrapper to pass errors explicitly to next(err).',
      recommendedFollowup: isCorrect
        ? 'Great mastery demonstrated. Try an Advanced challenge on Stream backpressure next!'
        : 'Review the Error Handling Middleware Pattern in Step 2 of your Learning Plan.',
    }

    return PracticeFeedbackSchema.parse(feedback)
  }

  async chat(
    context: StudentAIContext,
    message: string,
    history: CoachMessage[]
  ): Promise<{ reply: string; suggestedQuestions: string[] }> {
    const lower = message.toLowerCase()
    const priority = context.readiness.priorityGapSkill || 'Node.js'
    const readiness = context.readiness.overallPercentage

    // Prompt injection check
    if (lower.includes('ignore previous') || lower.includes('system prompt') || lower.includes('reveal secret') || lower.includes('override score')) {
      return {
        reply: "I am your SkillBridge AI Skill Coach focused on helping you build verified technical competence for your target career. I cannot modify official scores or disclose internal system configurations.",
        suggestedQuestions: [
          `Why is ${priority} my priority gap?`,
          "What should I learn next?",
          "Give me a practice question",
        ],
      }
    }

    // Opportunity inquiry
    if (context.opportunity && (lower.includes('opportunity') || lower.includes('job') || lower.includes('internship') || lower.includes('apply'))) {
      const opp = context.opportunity
      const missing = opp.requiredSkills.filter(r => {
        const s = context.skills.find(sk => sk.name.toLowerCase() === r.name.toLowerCase())
        return !s || s.currentScore < r.minLevel
      })

      return {
        reply: `For **${opp.title}** at **${opp.company}**, your current opportunity readiness is **${opp.readinessPercentage}%**.\n\n${missing.length > 0 ? `The primary requirement to satisfy is **${missing.map(m => `${m.name} (min ${m.minLevel})`).join(', ')}**.` : 'You currently satisfy all listed technical benchmarks for this position!'} Closing your ${priority} gap remains the most effective action before submitting your application.`,
        suggestedQuestions: [
          `How can I improve ${priority} quickly?`,
          "Give me a practice question",
          "What is my next step in the learning plan?",
        ],
      }
    }

    // Reassessment progress inquiry
    if (context.reassessments.length > 0 && (lower.includes('progress') || lower.includes('improved') || lower.includes('history'))) {
      const latest = context.reassessments[0]
      const delta = latest.newScore - latest.previousScore
      return {
        reply: `In your recent reassessment for **${latest.skillName}**, your score changed from **${latest.previousScore} to ${latest.newScore}** (${delta >= 0 ? `+${delta}` : `${delta}`} pts).\n\n${delta >= 0 ? 'This improvement has increased your verified readiness. Keep advancing through your learning plan steps to reach target benchmarks!' : 'Your score dropped slightly. We recommend revisiting prerequisite error-handling labs before retaking the assessment.'}`,
        suggestedQuestions: [
          `Give me a practice challenge for ${latest.skillName}`,
          "What should I learn next?",
          "Am I ready to reassess?",
        ],
      }
    }

    if (lower.includes('why') && (lower.includes('gap') || lower.includes('priority'))) {
      return {
        reply: `**${priority}** is currently your highest-priority focus because it carries a **High importance weight (1.0)** for **${context.student.targetCareer}**, and your verified level is currently **${context.skills.find(s => s.name === priority)?.currentScore || 65}** against a required benchmark of **${context.skills.find(s => s.name === priority)?.requiredScore || 80}**.\n\nClosing this gap directly increases your overall career readiness from **${readiness}%** and qualifies you for competitive backend opportunities.`,
        suggestedQuestions: [
          `Explain ${priority} simply`,
          `Give me a practice question on ${priority}`,
          "What is my next learning step?",
        ],
      }
    }

    if (lower.includes('ready') && (lower.includes('reassess') || lower.includes('assessment'))) {
      return {
        reply: `You can reassess your **${priority}** skills whenever you feel confident! After completing targeted practice in error handling and streams, head over to the Assessment tab to take the verified assessment. Your score will update dynamically upon completion.`,
        suggestedQuestions: [
          `Give me a practice test question on ${priority}`,
          `Explain asynchronous streams simply`,
          "View my Learning Plan",
        ],
      }
    }

    if (lower.includes('explain') && lower.includes('simply')) {
      return {
        reply: `### Asynchronous Programming Explained Simply\n\nImagine you are a chef in a busy kitchen with one cooking station (the single thread):\n- **Synchronous**: You put water on the stove to boil and stand there staring at it for 10 minutes, refusing to chop vegetables or take orders until it boils.\n- **Asynchronous**: You put the water on the stove, set a timer (event callback), and immediately start chopping vegetables. When the timer dings (event loop), you return to the pot.\n\n**Common Mistake**: Forgetting to catch an error if the stove runs out of gas (unhandled promise rejection).`,
        suggestedQuestions: [
          "Give me a code example",
          "Test me on this concept",
          "Why is this important for Backend Developers?",
        ],
      }
    }

    // Default intelligent guidance
    return {
      reply: `As your SkillBridge Coach for **${context.student.targetCareer}**, my goal is to guide you from your current **${readiness}% Career Readiness** to full job-readiness.\n\nYour primary focus should be closing the **${priority}** gap (${context.readiness.priorityGapPoints} pts to benchmark). Would you like to review core concepts, practice targeted questions, or walk through your personalized learning plan?`,
      suggestedQuestions: [
        `Why is ${priority} my priority gap?`,
        `Explain ${priority} simply`,
        `Give me a practice question`,
        "Am I ready to reassess?",
      ],
    }
  }
}

/**
 * Live OpenAI/Compatible API Provider
 * Falls back to DeterministicSkillBridgeAIProvider if key missing or request fails.
 */
export class LiveAPIProvider implements AIProvider {
  private fallback = new DeterministicSkillBridgeAIProvider()

  async diagnose(context: StudentAIContext, skillName: string): Promise<DiagnosticOutput> {
    if (!AI_CONFIG.isLiveProviderConfigured()) {
      return this.fallback.diagnose(context, skillName)
    }

    const skill = context.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase()) || context.skills[0]
    const currentScore = skill ? skill.currentScore : 65
    const targetScore = skill ? skill.requiredScore : 80
    const gap = Math.max(targetScore - currentScore, 0)

    try {
      const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          temperature: AI_CONFIG.temperature,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `${getDiagnosticSystemPrompt(context, skillName)}\n\nRespond ONLY with a JSON object with this exact shape:\n{
  "skill": "${skillName}",
  "currentScore": ${currentScore},
  "targetScore": ${targetScore},
  "gap": ${gap},
  "summary": "concise diagnosis summary string",
  "weakAreas": ["weak area 1", "weak area 2"],
  "strengths": ["strength 1"],
  "commonMistakes": ["mistake 1"],
  "prerequisites": ["prerequisite 1"],
  "recommendedSequence": ["step 1", "step 2"],
  "nextAction": { "title": "action title", "estimatedMinutes": 30, "actionType": "practice", "description": "action description" },
  "confidence": "high"
}`,
            },
            {
              role: 'user',
              content: JSON.stringify({ context: formatSkillBridgeContext(context), requestedSkill: skillName }),
            },
          ],
        }),
        signal: AbortSignal.timeout(AI_CONFIG.timeoutMs),
      })

      if (!response.ok) throw new Error(`AI Provider returned HTTP ${response.status}`)
      const data: any = await response.json()
      const content = data.choices?.[0]?.message?.content || '{}'
      const parsed = JSON.parse(content.replace(/```json|```/g, '').trim())
      return DiagnosticOutputSchema.parse(parsed)
    } catch (err) {
      console.warn('Live AI diagnose failed, using deterministic fallback:', err)
      return this.fallback.diagnose(context, skillName)
    }
  }

  async createLearningPlan(context: StudentAIContext, skillName: string): Promise<LearningPlan> {
    if (!AI_CONFIG.isLiveProviderConfigured()) {
      return this.fallback.createLearningPlan(context, skillName)
    }

    const skill = context.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase()) || context.skills[0]
    const initialScore = skill ? skill.currentScore : 65
    const targetScore = skill ? skill.requiredScore : 80
    const gap = Math.max(targetScore - initialScore, 0)

    try {
      const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          temperature: AI_CONFIG.temperature,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `${getLearningPlanSystemPrompt(context, skillName)}\n\nRespond ONLY with a JSON object with this exact shape:\n{
  "skill": "${skillName}",
  "initialScore": ${initialScore},
  "targetScore": ${targetScore},
  "gap": ${gap},
  "estimatedHoursTotal": 12,
  "steps": [
    { "stepNumber": 1, "title": "Step 1", "description": "Desc", "stepType": "understand", "durationMinutes": 45, "actionableTask": "Task", "milestone": "Milestone" },
    { "stepNumber": 2, "title": "Step 2", "description": "Desc", "stepType": "learn", "durationMinutes": 60, "actionableTask": "Task", "milestone": "Milestone" },
    { "stepNumber": 3, "title": "Step 3", "description": "Desc", "stepType": "practice", "durationMinutes": 60, "actionableTask": "Task", "milestone": "Milestone" },
    { "stepNumber": 4, "title": "Step 4", "description": "Desc", "stepType": "build", "durationMinutes": 90, "actionableTask": "Task", "milestone": "Milestone" },
    { "stepNumber": 5, "title": "Step 5", "description": "Desc", "stepType": "reassess", "durationMinutes": 30, "actionableTask": "Task", "milestone": "Milestone" }
  ],
  "milestones": ["Milestone 1", "Milestone 2"]
}`,
            },
            {
              role: 'user',
              content: JSON.stringify({ context: formatSkillBridgeContext(context), skillName }),
            },
          ],
        }),
        signal: AbortSignal.timeout(AI_CONFIG.timeoutMs),
      })

      if (!response.ok) throw new Error(`AI Provider returned HTTP ${response.status}`)
      const data: any = await response.json()
      const content = data.choices?.[0]?.message?.content || '{}'
      const parsed = JSON.parse(content.replace(/```json|```/g, '').trim())
      return LearningPlanSchema.parse(parsed)
    } catch (err) {
      console.warn('Live AI createLearningPlan failed, using deterministic fallback:', err)
      return this.fallback.createLearningPlan(context, skillName)
    }
  }

  async generatePractice(
    context: StudentAIContext,
    skillName: string,
    difficulty: DifficultyLevel
  ): Promise<{ question: PracticeQuestionSafe; serverAnswer: string; explanation: string }> {
    return this.fallback.generatePractice(context, skillName, difficulty)
  }

  async evaluatePractice(
    context: StudentAIContext,
    skillName: string,
    questionText: string,
    studentAnswer: string,
    serverAnswer: string
  ): Promise<PracticeFeedback> {
    return this.fallback.evaluatePractice(context, skillName, questionText, studentAnswer, serverAnswer)
  }

  async chat(
    context: StudentAIContext,
    message: string,
    history: CoachMessage[]
  ): Promise<{ reply: string; suggestedQuestions: string[] }> {
    if (!AI_CONFIG.isLiveProviderConfigured()) {
      return this.fallback.chat(context, message, history)
    }

    try {
      const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          temperature: AI_CONFIG.temperature,
          messages: [
            {
              role: 'system',
              content: getCoachChatSystemPrompt(context),
            },
            ...history.slice(-4).map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: message },
          ],
        }),
        signal: AbortSignal.timeout(AI_CONFIG.timeoutMs),
      })

      if (!response.ok) throw new Error(`AI Provider returned HTTP ${response.status}`)
      const data: any = await response.json()
      const reply = data.choices?.[0]?.message?.content || 'I am ready to help you improve your skills.'
      return {
        reply,
        suggestedQuestions: [
          `Why is ${context.readiness.priorityGapSkill || 'Node.js'} my priority gap?`,
          'Give me a practice question',
          'Explain this simply',
        ],
      }
    } catch {
      return this.fallback.chat(context, message, history)
    }
  }
}

// Global active provider instance
export const defaultAIProvider: AIProvider = new LiveAPIProvider()
