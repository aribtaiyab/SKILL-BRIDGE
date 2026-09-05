/**
 * SkillBridge Connect - Pre-loaded Assignments & Multi-Level Assessments
 *
 * Implements the 3 Assessment Levels defined in the official specification:
 * - Level 1: Knowledge (MCQs)
 * - Level 2: Practical Timed Challenges (Debug, SQL, Logic)
 * - Level 3: Evidence Submission Portal (GitHub, Live URL, Certificates)
 */

export interface MCQOption {
  id: string
  optionText: string
  isCorrect?: boolean
}

export interface MCQQuestion {
  id: string
  questionText: string
  points: number
  orderIndex: number
  options: MCQOption[]
  correctOptionId: string
  explanation: string
}

export interface Level1Assessment {
  id: string
  title: string
  skill: string
  description: string
  timeLimitMinutes: number
  totalQuestions: number
  passingScore: number
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  questions: MCQQuestion[]
}

export interface Level2PracticalChallenge {
  id: string
  title: string
  skill: string
  type: "debug" | "sql" | "logic"
  difficulty: "Intermediate" | "Advanced"
  timeLimitMinutes: number
  objective: string
  instructions: string
  initialCode: string
  expectedSolutionSnippet: string
  testCheck: (submission: string) => { passed: boolean; score: number; feedback: string }
}

export interface Level3EvidenceSubmission {
  id: string
  skillName: string
  githubUrl: string
  liveDemoUrl?: string
  certificateId?: string
  status: "Self-Declared" | "Assessment Verified" | "Practical Verified" | "Evidence Verified"
  submittedAt: string
}

export const LEVEL_1_KNOWLEDGE_ASSESSMENTS: Level1Assessment[] = [
  {
    id: "assess-l1-backend-core",
    title: "Backend Engineering Knowledge Benchmark",
    skill: "Node.js & Backend Architecture",
    description: "Evaluates core backend fundamentals across Node.js event loop, asynchronous promises, relational SQL, REST standards, and version control.",
    timeLimitMinutes: 15,
    totalQuestions: 5,
    passingScore: 70,
    difficulty: "Intermediate",
    questions: [
      {
        id: "q1-node-loop",
        questionText: "What handles asynchronous I/O operations and event-driven scheduling in Node.js?",
        points: 20,
        orderIndex: 1,
        options: [
          { id: "opt-1a", optionText: "V8 JavaScript Execution Engine" },
          { id: "opt-1b", optionText: "Libuv cross-platform asynchronous I/O library" },
          { id: "opt-1c", optionText: "Thread Pool Manager in OS kernel only" },
          { id: "opt-1d", optionText: "Worker Threads Module exclusively" },
        ],
        correctOptionId: "opt-1b",
        explanation: "Libuv is the C library responsible for the Node.js event loop, thread pool, and non-blocking asynchronous I/O operations.",
      },
      {
        id: "q2-async-promises",
        questionText: "Which HTTP status code should a REST API return when a new resource has been successfully created?",
        points: 20,
        orderIndex: 2,
        options: [
          { id: "opt-2a", optionText: "200 OK" },
          { id: "opt-2b", optionText: "201 Created" },
          { id: "opt-2c", optionText: "204 No Content" },
          { id: "opt-2d", optionText: "301 Moved Permanently" },
        ],
        correctOptionId: "opt-2b",
        explanation: "HTTP 201 Created signifies that the request succeeded and led to the creation of a new resource on the server.",
      },
      {
        id: "q3-sql-joins",
        questionText: "In PostgreSQL, what is the primary performance benefit of creating an index on a foreign key column?",
        points: 20,
        orderIndex: 3,
        options: [
          { id: "opt-3a", optionText: "It prevents duplicate rows across tables" },
          { id: "opt-3b", optionText: "It significantly speeds up JOIN operations and parent row deletions" },
          { id: "opt-3c", optionText: "It automatically creates a corresponding primary key in the child table" },
          { id: "opt-3d", optionText: "It compresses the table storage on disk" },
        ],
        correctOptionId: "opt-3b",
        explanation: "Indexes on foreign key columns allow the query planner to quickly find child records during relational JOIN operations and cascading foreign key checks.",
      },
      {
        id: "q4-promise-handling",
        questionText: "What occurs if an async function throws an error and no await / .catch() block captures it in modern Node.js?",
        points: 20,
        orderIndex: 4,
        options: [
          { id: "opt-4a", optionText: "Node.js retries the function until it succeeds" },
          { id: "opt-4b", optionText: "The error is silently discarded and execution continues" },
          { id: "opt-4c", optionText: "An UnhandledPromiseRejection event is emitted, terminating the process in Node.js 16+" },
          { id: "opt-4d", optionText: "The runtime converts the rejected promise into undefined" },
        ],
        correctOptionId: "opt-4c",
        explanation: "Unhandled promise rejections emit an unhandledRejection event and terminate the Node.js process by default to prevent hidden state corruption.",
      },
      {
        id: "q5-git-rebase",
        questionText: "What is the key difference between 'git merge' and 'git rebase' when integrating changes?",
        points: 20,
        orderIndex: 5,
        options: [
          { id: "opt-5a", optionText: "Merge preserves the true commit history with a merge commit, while rebase rewrites project history linearly" },
          { id: "opt-5b", optionText: "Rebase permanently deletes uncommitted changes in the working tree" },
          { id: "opt-5c", optionText: "Merge only works on local branches, whereas rebase only works on remote repositories" },
          { id: "opt-5d", optionText: "There is no difference; they are exact aliases in Git" },
        ],
        correctOptionId: "opt-5a",
        explanation: "Git merge creates a dedicated merge commit preserving history topology. Git rebase applies commits from the current branch on top of the base branch, producing a linear commit log.",
      },
    ],
  },
  {
    id: "assess-l1-nodejs-loop",
    title: "Node.js Event Loop & Concurrency Benchmark",
    skill: "Node.js",
    description: "Deep dive into timers, I/O polling, setImmediate, process.nextTick, and microtask queue priorities.",
    timeLimitMinutes: 10,
    totalQuestions: 3,
    passingScore: 70,
    difficulty: "Intermediate",
    questions: [
      {
        id: "q-node-loop-1",
        questionText: "Which queue is executed immediately after the current operation finishes, before the next event loop phase?",
        points: 34,
        orderIndex: 1,
        options: [
          { id: "opt-nl-1a", optionText: "process.nextTick queue" },
          { id: "opt-nl-1b", optionText: "check phase (setImmediate)" },
          { id: "opt-nl-1c", optionText: "timers phase (setTimeout)" },
          { id: "opt-nl-1d", optionText: "poll phase (I/O events)" },
        ],
        correctOptionId: "opt-nl-1a",
        explanation: "process.nextTick callbacks are resolved after the current operation runs, preempting the event loop phases.",
      },
      {
        id: "q-node-loop-2",
        questionText: "Which C library handles non-blocking I/O and thread pooling under the hood in Node.js?",
        points: 33,
        orderIndex: 2,
        options: [
          { id: "opt-nl-2a", optionText: "Libuv" },
          { id: "opt-nl-2b", optionText: "V8" },
          { id: "opt-nl-2c", optionText: "OpenSSL" },
          { id: "opt-nl-2d", optionText: "Zlib" },
        ],
        correctOptionId: "opt-nl-2a",
        explanation: "Libuv is the multiplatform support library providing asynchronous I/O and event loop abstraction.",
      },
      {
        id: "q-node-loop-3",
        questionText: "By default, how many worker threads are in the libuv thread pool?",
        points: 33,
        orderIndex: 3,
        options: [
          { id: "opt-nl-3a", optionText: "4" },
          { id: "opt-nl-3b", optionText: "1" },
          { id: "opt-nl-3c", optionText: "16" },
          { id: "opt-nl-3d", optionText: "Equal to CPU core count" },
        ],
        correctOptionId: "opt-nl-3a",
        explanation: "UV_THREADPOOL_SIZE defaults to 4 threads unless explicitly overridden via environment variables.",
      },
    ],
  },
  {
    id: "assess-l1-sql-indexing",
    title: "SQL Joins & Relational Indexing Benchmark",
    skill: "SQL",
    description: "Validates ability to design indexes, choose appropriate JOIN types, and avoid costly sequential scans.",
    timeLimitMinutes: 10,
    totalQuestions: 3,
    passingScore: 70,
    difficulty: "Intermediate",
    questions: [
      {
        id: "q-sql-1",
        questionText: "Which index type is default and optimal for range queries (<, <=, =, >=, >) in PostgreSQL and MySQL?",
        points: 34,
        orderIndex: 1,
        options: [
          { id: "opt-sql-1a", optionText: "B-Tree Index" },
          { id: "opt-sql-1b", optionText: "Hash Index" },
          { id: "opt-sql-1c", optionText: "GIN Index" },
          { id: "opt-sql-1d", optionText: "GiST Index" },
        ],
        correctOptionId: "opt-sql-1a",
        explanation: "B-Tree indexes maintain sorted order, making them ideal for equality, prefix, and range queries.",
      },
      {
        id: "q-sql-2",
        questionText: "What type of join returns all records from the left table and matched records from the right table?",
        points: 33,
        orderIndex: 2,
        options: [
          { id: "opt-sql-2a", optionText: "LEFT OUTER JOIN" },
          { id: "opt-sql-2b", optionText: "INNER JOIN" },
          { id: "opt-sql-2c", optionText: "CROSS JOIN" },
          { id: "opt-sql-2d", optionText: "FULL JOIN" },
        ],
        correctOptionId: "opt-sql-2a",
        explanation: "LEFT JOIN retains every record from the left table, filling unmatched right-side attributes with NULL.",
      },
      {
        id: "q-sql-3",
        questionText: "When should you generally AVOID adding a new index to a table?",
        points: 33,
        orderIndex: 3,
        options: [
          { id: "opt-sql-3a", optionText: "On high-write / high-insert tables with low read frequency" },
          { id: "opt-sql-3b", optionText: "On foreign keys used in frequent JOINs" },
          { id: "opt-sql-3c", optionText: "On columns filtered in WHERE clauses" },
          { id: "opt-sql-3d", optionText: "On columns used in ORDER BY clauses" },
        ],
        correctOptionId: "opt-sql-3a",
        explanation: "Every index adds overhead on INSERT, UPDATE, and DELETE queries; unnecessary indexes degrade write throughput.",
      },
    ],
  },
  {
    id: "assess-l1-rest-design",
    title: "RESTful API Standards & Status Codes",
    skill: "REST APIs",
    description: "Evaluates idempotent HTTP methods, status code semantics, and safe resource modeling.",
    timeLimitMinutes: 10,
    totalQuestions: 3,
    passingScore: 70,
    difficulty: "Intermediate",
    questions: [
      {
        id: "q-rest-1",
        questionText: "Which HTTP method is idempotent and intended for full replacement of a resource?",
        points: 34,
        orderIndex: 1,
        options: [
          { id: "opt-rest-1a", optionText: "PUT" },
          { id: "opt-rest-1b", optionText: "PATCH" },
          { id: "opt-rest-1c", optionText: "POST" },
          { id: "opt-rest-1d", optionText: "DELETE" },
        ],
        correctOptionId: "opt-rest-1a",
        explanation: "PUT is idempotent and replaces the target resource state in its entirety.",
      },
      {
        id: "q-rest-2",
        questionText: "What status code should be returned when client credentials are valid but forbidden from accessing the resource?",
        points: 33,
        orderIndex: 2,
        options: [
          { id: "opt-rest-2a", optionText: "403 Forbidden" },
          { id: "opt-rest-2b", optionText: "401 Unauthorized" },
          { id: "opt-rest-2c", optionText: "400 Bad Request" },
          { id: "opt-rest-2d", optionText: "405 Method Not Allowed" },
        ],
        correctOptionId: "opt-rest-2a",
        explanation: "401 means unauthenticated (missing/invalid credentials), while 403 means authenticated but unauthorized (forbidden).",
      },
      {
        id: "q-rest-3",
        questionText: "What HTTP header is used in optimistic concurrency control to prevent conflicting overwrites?",
        points: 33,
        orderIndex: 3,
        options: [
          { id: "opt-rest-3a", optionText: "If-Match / ETag" },
          { id: "opt-rest-3b", optionText: "Authorization" },
          { id: "opt-rest-3c", optionText: "Accept-Encoding" },
          { id: "opt-rest-3d", optionText: "Cache-Control" },
        ],
        correctOptionId: "opt-rest-3a",
        explanation: "ETag combined with If-Match allows the server to verify the resource has not changed since the client last fetched it.",
      },
    ],
  },
  {
    id: "assess-l1-git-workflows",
    title: "Git Workflows & Version Control Mastery",
    skill: "Git & Version Control",
    description: "Evaluates branch strategy, stash management, cherry-picking, and conflict resolution techniques.",
    timeLimitMinutes: 10,
    totalQuestions: 3,
    passingScore: 70,
    difficulty: "Intermediate",
    questions: [
      {
        id: "q-git-1",
        questionText: "Which command allows you to copy a specific commit from another branch into your current branch?",
        points: 34,
        orderIndex: 1,
        options: [
          { id: "opt-git-1a", optionText: "git cherry-pick <commit-hash>" },
          { id: "opt-git-1b", optionText: "git pull --copy" },
          { id: "opt-git-1c", optionText: "git fetch --apply" },
          { id: "opt-git-1d", optionText: "git branch --replicate" },
        ],
        correctOptionId: "opt-git-1a",
        explanation: "git cherry-pick applies the changes introduced by some existing commits onto the HEAD of the current branch.",
      },
      {
        id: "q-git-2",
        questionText: "What happens when you run 'git stash pop'?",
        points: 33,
        orderIndex: 2,
        options: [
          { id: "opt-git-2a", optionText: "Applies the latest stashed changes and removes them from the stash list" },
          { id: "opt-git-2b", optionText: "Permanently deletes all stashes without applying" },
          { id: "opt-git-2c", optionText: "Creates a new branch from the stash" },
          { id: "opt-git-2d", optionText: "Applies the stash but keeps it indefinitely in the list" },
        ],
        correctOptionId: "opt-git-2a",
        explanation: "git stash pop restores the top stash entry and drops it from the stash stack if no conflicts occur.",
      },
      {
        id: "q-git-3",
        questionText: "Why is rewriting published history with 'git push --force' dangerous in shared team branches?",
        points: 33,
        orderIndex: 3,
        options: [
          { id: "opt-git-3a", optionText: "It overwrites remote commits that teammates may have based their work on, causing divergence" },
          { id: "opt-git-3b", optionText: "It deletes the remote repository" },
          { id: "opt-git-3c", optionText: "It invalidates all SSH keys" },
          { id: "opt-git-3d", optionText: "It disables automated CI builds forever" },
        ],
        correctOptionId: "opt-git-3a",
        explanation: "Force pushing overwrites the remote branch commit graph, disrupting other developers who pulled the previous history.",
      },
    ],
  },
  {
    id: "assess-l1-react-basics",
    title: "React Component Architecture & Hooks Benchmark",
    skill: "React",
    description: "Evaluates React fundamentals: JSX rendering, useState, useEffect dependencies, key prop usage, and component purity.",
    timeLimitMinutes: 10,
    totalQuestions: 3,
    passingScore: 70,
    difficulty: "Intermediate",
    questions: [
      {
        id: "q-react-1",
        questionText: "What is the primary danger of omitting the dependency array in useEffect?",
        points: 34,
        orderIndex: 1,
        options: [
          { id: "opt-react-1a", optionText: "The effect runs on every single render, potentially triggering an infinite loop if it updates state" },
          { id: "opt-react-1b", optionText: "The effect never executes" },
          { id: "opt-react-1c", optionText: "React throws a syntax error at build time" },
          { id: "opt-react-1d", optionText: "The component unmounts immediately" },
        ],
        correctOptionId: "opt-react-1a",
        explanation: "Without a dependency array, useEffect fires after every render cycle. If it triggers a state update, it causes an infinite re-render loop.",
      },
      {
        id: "q-react-2",
        questionText: "Why is using array index as a 'key' prop discouraged when rendering dynamic lists in React?",
        points: 33,
        orderIndex: 2,
        options: [
          { id: "opt-react-2a", optionText: "It degrades performance and causes state bugs when items are reordered, inserted, or removed" },
          { id: "opt-react-2b", optionText: "React strictly forbids numbers as keys" },
          { id: "opt-react-2c", optionText: "It breaks the CSS styles applied to list items" },
          { id: "opt-react-2d", optionText: "Keys must always be strings longer than 10 characters" },
        ],
        correctOptionId: "opt-react-2a",
        explanation: "Keys enable React to track item identities across renders. Using indices causes component state to attach to the wrong element upon insertion/reordering.",
      },
      {
        id: "q-react-3",
        questionText: "How should state updates that depend on the previous state value be written?",
        points: 33,
        orderIndex: 3,
        options: [
          { id: "opt-react-3a", optionText: "Using the functional updater: setCount(prev => prev + 1)" },
          { id: "opt-react-3b", optionText: "By directly mutating the state variable: state++" },
          { id: "opt-react-3c", optionText: "By calling forceUpdate() inside setTimeout" },
          { id: "opt-react-3d", optionText: "By reading from document.getElementById()" },
        ],
        correctOptionId: "opt-react-3a",
        explanation: "Functional state updates guarantee access to the latest state value even during batched asynchronous updates.",
      },
    ],
  },
  {
    id: "assess-l1-javascript-core",
    title: "JavaScript Core Language & Async Foundations",
    skill: "JavaScript",
    description: "Tests closures, scope chains, event bubbling, coercion, and Promise microtask scheduling.",
    timeLimitMinutes: 10,
    totalQuestions: 3,
    passingScore: 70,
    difficulty: "Intermediate",
    questions: [
      {
        id: "q-js-1",
        questionText: "In JavaScript, what is a closure?",
        points: 34,
        orderIndex: 1,
        options: [
          { id: "opt-js-1a", optionText: "A function bundled with references to its surrounding lexical environment" },
          { id: "opt-js-1b", optionText: "A method that terminates an active loop" },
          { id: "opt-js-1c", optionText: "A private variable that can never be garbage collected" },
          { id: "opt-js-1d", optionText: "A way to close browser tabs programmatically" },
        ],
        correctOptionId: "opt-js-1a",
        explanation: "A closure gives a function access to its outer scope variables even after the outer function has finished executing.",
      },
      {
        id: "q-js-2",
        questionText: "What is the difference between '==' and '===' in JavaScript?",
        points: 33,
        orderIndex: 2,
        options: [
          { id: "opt-js-2a", optionText: "'===' checks both value and type without type coercion; '==' coerces types before comparing" },
          { id: "opt-js-2b", optionText: "'===' only compares strings, while '==' compares numbers" },
          { id: "opt-js-2c", optionText: "There is no difference in modern V8" },
          { id: "opt-js-2d", optionText: "'==' is faster because it bypasses memory checks" },
        ],
        correctOptionId: "opt-js-2a",
        explanation: "Strict equality (===) performs no type conversion and returns true only if operands have identical types and values.",
      },
      {
        id: "q-js-3",
        questionText: "Which statement accurately describes Promise.all() behavior?",
        points: 33,
        orderIndex: 3,
        options: [
          { id: "opt-js-3a", optionText: "It resolves when all promises resolve, or rejects immediately when ANY promise rejects (fail-fast)" },
          { id: "opt-js-3b", optionText: "It waits for all promises to settle regardless of rejections" },
          { id: "opt-js-3c", optionText: "It executes promises sequentially one after another" },
          { id: "opt-js-3d", optionText: "It only accepts synchronous functions" },
        ],
        correctOptionId: "opt-js-3a",
        explanation: "Promise.all fails fast: if any promise in the array rejects, the returned promise immediately rejects with that error.",
      },
    ],
  },
]

export const LEVEL_2_PRACTICAL_CHALLENGES: Level2PracticalChallenge[] = [
  {
    id: "prac-01-express-debug",
    title: "Challenge 1: Fix Unhandled Promise Rejection in Express Middleware",
    skill: "Node.js & Express",
    type: "debug",
    difficulty: "Intermediate",
    timeLimitMinutes: 20,
    objective: "Catch async errors and delegate them to Express error handling middleware via next().",
    instructions: `Below is an Express route handler that suffers from an unhandled rejection if \`fetchUserFromDb()\` fails.
Fix the code so that any exception is safely caught and forwarded using \`next(error)\`.`,
    initialCode: `// Fix the unhandled promise rejection below
app.get('/api/users/:id', async (req, res, next) => {
  const user = await database.fetchUserFromDb(req.params.id);
  res.json({ success: true, data: user });
});`,
    expectedSolutionSnippet: "try",
    testCheck: (submission: string) => {
      const hasTryCatch = /try\s*\{[\s\S]*\}\s*catch\s*\(\s*(\w+)\s*\)\s*\{[\s\S]*next\s*\(\s*\1\s*\)/i.test(submission)
      const hasAsyncWrapper = /next\s*\(/i.test(submission) && /catch/i.test(submission)

      if (hasTryCatch || hasAsyncWrapper) {
        return {
          passed: true,
          score: 100,
          feedback: "Verified! You implemented structured error handling with try/catch and correctly passed the caught error to next(err).",
        }
      }
      return {
        passed: false,
        score: 30,
        feedback: "The async operation is still vulnerable. Wrap the await statement in a try/catch block and call next(error) inside the catch block.",
      }
    },
  },
  {
    id: "prac-02-sql-ranking",
    title: "Challenge 2: Write an SQL Query to Rank Top 3 Students",
    skill: "PostgreSQL / SQL",
    type: "sql",
    difficulty: "Intermediate",
    timeLimitMinutes: 15,
    objective: "Write an optimized SQL query fetching top 3 students ranked by completed assessments score.",
    instructions: `Write a standard SQL query on table \`student_skills\` that:
1. Selects \`student_id\` and \`AVG(current_level) AS avg_score\`
2. Groups by \`student_id\`
3. Orders by \`avg_score\` in descending order
4. Limits the output to 3 rows`,
    initialCode: `-- Write your SQL query here:
SELECT student_id, AVG(current_level) AS avg_score
FROM student_skills
-- Complete the query
`,
    expectedSolutionSnippet: "GROUP BY",
    testCheck: (submission: string) => {
      const lower = submission.toLowerCase()
      const hasGroupBy = lower.includes("group by") && lower.includes("student_id")
      const hasOrderBy = lower.includes("order by") && (lower.includes("desc") || lower.includes("avg"))
      const hasLimit = lower.includes("limit 3") || lower.includes("fetch first 3")

      if (hasGroupBy && hasOrderBy && hasLimit) {
        return {
          passed: true,
          score: 100,
          feedback: "Verified! Your SQL aggregation properly groups by student_id, orders by the average score descending, and limits results to the top 3.",
        }
      }
      return {
        passed: false,
        score: 40,
        feedback: "Make sure your query includes GROUP BY student_id, ORDER BY avg_score DESC, and LIMIT 3.",
      }
    },
  },
  {
    id: "prac-03-rate-limiter",
    title: "Challenge 3: Implement Token Bucket Rate-Limiter Logic",
    skill: "Algorithm & Backend Logic",
    type: "logic",
    difficulty: "Advanced",
    timeLimitMinutes: 25,
    objective: "Implement a sliding window or token refill function using timestamps.",
    instructions: `Implement a function \`allowRequest(userId, maxTokens, refillRatePerSec)\` that tracks user tokens based on elapsed timestamps. Return \`true\` if allowed (decrement 1 token), or \`false\` if rate limit exceeded.`,
    initialCode: `class RateLimiter {
  constructor() {
    this.buckets = new Map(); // userId -> { tokens, lastRefillTime }
  }

  allowRequest(userId, maxTokens = 5, refillRatePerSec = 1) {
    const now = Date.now();
    let bucket = this.buckets.get(userId);
    if (!bucket) {
      bucket = { tokens: maxTokens, lastRefillTime: now };
      this.buckets.set(userId, bucket);
    }

    // TODO: Calculate tokens to add based on (now - bucket.lastRefillTime)
    // Refill up to maxTokens and consume 1 token if available.

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }
}`,
    expectedSolutionSnippet: "bucket.tokens",
    testCheck: (submission: string) => {
      const hasElapsed = /now\s*-\s*bucket\.lastRefillTime/i.test(submission) || /Date\.now\(\)/i.test(submission)
      const hasRefill = /tokens\s*\+=/i.test(submission) || /Math\.min/i.test(submission) || /bucket\.tokens/i.test(submission)

      if (hasElapsed && hasRefill) {
        return {
          passed: true,
          score: 100,
          feedback: "Verified! You correctly calculated elapsed time delta, refilled tokens proportionally to refillRatePerSec, and consumed a token.",
        }
      }
      return {
        passed: false,
        score: 45,
        feedback: "Ensure you compute the elapsed seconds since lastRefillTime and increment bucket.tokens before checking if tokens >= 1.",
      }
    },
  },
  {
    id: "prac-04-react-hook",
    title: "Challenge 4: Build a Safe Async Fetch Custom Hook",
    skill: "React",
    type: "logic",
    difficulty: "Intermediate",
    timeLimitMinutes: 20,
    objective: "Implement a custom hook useFetchData(url) that tracks loading, error, and data, cleaning up on unmount.",
    instructions: `Write a React hook \`useFetchData(url)\` that initializes state for \`{ data, loading: true, error: null }\`, triggers a fetch inside \`useEffect\`, and uses an \`isMounted\` or \`AbortController\` cleanup to prevent memory leaks on unmount.`,
    initialCode: `import { useState, useEffect } from 'react';

export function useFetchData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Implement safe fetch with cleanup
  }, [url]);

  return { data, loading, error };
}`,
    expectedSolutionSnippet: "setData",
    testCheck: (submission: string) => {
      const hasFetch = /fetch\s*\(/i.test(submission) || /axios/i.test(submission)
      const hasCleanup = /return\s*\(\)\s*=>/i.test(submission) || /abort\(\)/i.test(submission) || /mounted\s*=\s*false/i.test(submission)
      const setsState = /setData\s*\(/i.test(submission) && /setLoading\s*\(/i.test(submission)

      if (hasFetch && hasCleanup && setsState) {
        return {
          passed: true,
          score: 100,
          feedback: "Verified! Your React custom hook safely handles data fetching and includes an unmount cleanup to guard against memory leaks.",
        }
      }
      return {
        passed: false,
        score: 40,
        feedback: "Make sure you fetch the URL, call setData/setLoading, and return a cleanup function from useEffect to prevent memory leaks.",
      }
    },
  },
]

/**
 * Evaluates student answers for Level 1 MCQs
 */
export function gradeLevel1Assessment(
  assessment: Level1Assessment,
  answers: Array<{ questionId: string; selectedOptionId: string }> | Record<string, string | number> = []
) {
  let correctCount = 0

  const answerLookup: Record<string, string> = {}
  if (Array.isArray(answers)) {
    answers.forEach((a) => {
      if (a && a.questionId) {
        answerLookup[a.questionId] = a.selectedOptionId
      }
    })
  } else if (answers && typeof answers === 'object') {
    Object.entries(answers).forEach(([qid, opt]) => {
      answerLookup[qid] = String(opt)
    })
  }

  const results = assessment.questions.map((q) => {
    const selected = answerLookup[q.id]
    // Check if selected matches option ID or index (0-indexed)
    let isCorrect = selected === q.correctOptionId
    if (!isCorrect && selected !== undefined) {
      const optionIndex = q.options.findIndex((o) => o.id === q.correctOptionId)
      if (optionIndex !== -1 && (selected === String(optionIndex) || selected === q.options[optionIndex]?.optionText)) {
        isCorrect = true
      }
    }

    if (isCorrect) correctCount++
    return {
      questionId: q.id,
      questionText: q.questionText,
      selectedOptionId: selected || null,
      correctOptionId: q.correctOptionId,
      isCorrect,
      explanation: q.explanation,
    }
  })

  const score = Math.round((correctCount / (assessment.questions.length || 1)) * 100)
  const passed = score >= assessment.passingScore

  return {
    assessmentId: assessment.id,
    title: assessment.title,
    skillName: assessment.skill,
    totalQuestions: assessment.questions.length,
    correctCount,
    score,
    passed,
    results,
    verificationTierGranted: passed ? ("Assessment Verified" as const) : ("Self-Declared" as const),
  }
}
