/**
 * Safe client-side assessment types and fallback definitions
 */

export interface QuestionSafeView {
  id: string
  questionText: string
  questionType: string
  points: number
  orderIndex: number
  options: {
    id: string
    optionText: string
    orderIndex: number
  }[]
}

export interface AssessmentAttemptResult {
  attemptId: string
  assessmentId: string
  title: string
  skillName: string
  totalQuestions: number
  correctCount: number
  score: number
  percentage: number
  passed: boolean
  previousScore: number | null
  improvement: number
  explanationSummary: {
    strengths: string[]
    weaknesses: string[]
    careerImpact: string
    nextStep: string
  }
}

export const FALLBACK_QUESTIONS: QuestionSafeView[] = [
  {
    id: 'q1',
    questionText: 'Which of the following best describes the Node.js event loop?',
    questionType: 'multiple_choice',
    points: 20,
    orderIndex: 1,
    options: [
      { id: 'opt1_1', optionText: 'A multi-threaded mechanism for handling background tasks concurrently.', orderIndex: 1 },
      { id: 'opt1_2', optionText: 'A single-threaded, non-blocking mechanism that handles asynchronous callbacks.', orderIndex: 2 },
      { id: 'opt1_3', optionText: 'A synchronous loop that executes all code line-by-line before continuing.', orderIndex: 3 },
      { id: 'opt1_4', optionText: 'An external library that must be imported for async operations.', orderIndex: 4 },
    ],
  },
  {
    id: 'q2',
    questionText: 'How does Node.js handle child processes?',
    questionType: 'multiple_choice',
    points: 20,
    orderIndex: 2,
    options: [
      { id: 'opt2_1', optionText: 'It cannot spawn child processes; everything runs on one thread.', orderIndex: 1 },
      { id: 'opt2_2', optionText: 'Using the child_process module to spawn or fork new processes.', orderIndex: 2 },
      { id: 'opt2_3', optionText: 'Automatically creating a new thread for every incoming HTTP request.', orderIndex: 3 },
      { id: 'opt2_4', optionText: 'By utilizing the DOM Web Workers API.', orderIndex: 4 },
    ],
  },
  {
    id: 'q3',
    questionText: 'What is the primary purpose of Streams in Node.js?',
    questionType: 'multiple_choice',
    points: 20,
    orderIndex: 3,
    options: [
      { id: 'opt3_1', optionText: 'To play audio and video files in the browser.', orderIndex: 1 },
      { id: 'opt3_2', optionText: 'To read or write data sequentially in chunks without loading everything into memory.', orderIndex: 2 },
      { id: 'opt3_3', optionText: 'To establish WebSocket connections with clients.', orderIndex: 3 },
      { id: 'opt3_4', optionText: 'To bundle JavaScript files for production.', orderIndex: 4 },
    ],
  },
  {
    id: 'q4',
    questionText: 'Which error handling approach is standard in Node.js asynchronous code with Promises?',
    questionType: 'multiple_choice',
    points: 20,
    orderIndex: 4,
    options: [
      { id: 'opt4_1', optionText: 'Error-first callbacks only (cb(err, data)).', orderIndex: 1 },
      { id: 'opt4_2', optionText: 'Using async/await with try/catch blocks or .catch().', orderIndex: 2 },
      { id: 'opt4_3', optionText: 'Ignoring errors in production environments.', orderIndex: 3 },
      { id: 'opt4_4', optionText: 'Throwing exceptions globally without catching them.', orderIndex: 4 },
    ],
  },
  {
    id: 'q5',
    questionText: 'What does the Node.js built-in fs module provide?',
    questionType: 'multiple_choice',
    points: 20,
    orderIndex: 5,
    options: [
      { id: 'opt5_1', optionText: 'File system interaction like reading and writing files asynchronously or synchronously.', orderIndex: 1 },
      { id: 'opt5_2', optionText: 'Fast server setup capabilities with WebSocket support.', orderIndex: 2 },
      { id: 'opt5_3', optionText: 'Format styling for console outputs.', orderIndex: 3 },
      { id: 'opt5_4', optionText: 'Firewall security rules configuration.', orderIndex: 4 },
    ],
  },
]
