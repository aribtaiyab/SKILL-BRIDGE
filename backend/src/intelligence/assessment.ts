import { getSupabaseAdmin } from '../config/supabase.js'
import { normalizeScore } from './engine.js'
import { QuestionSafeView, AssessmentAttemptResult, FALLBACK_QUESTIONS } from './types.js'

export type { QuestionSafeView, AssessmentAttemptResult }
export { FALLBACK_QUESTIONS }

// Authoritative correct answers (server-side only, never sent before evaluation)
const AUTHORITATIVE_ANSWER_KEYS: Record<string, string> = {
  // Legacy / fallback keys
  q1: 'opt1_2',
  q2: 'opt2_2',
  q3: 'opt3_2',
  q4: 'opt4_2',
  q5: 'opt5_1',
  'q1-node-loop': 'opt-1b',
  'q2-async-promises': 'opt-2b',
  'q3-sql-joins': 'opt-3b',
  'q4-promise-handling': 'opt-4c',
  'q5-git-rebase': 'opt-5a',

  // Node.js
  'q1-node-libuv': 'opt-node-1b',
  'q2-node-unhandled': 'opt-node-2c',
  'q3-node-backpressure': 'opt-node-3b',
  'q4-node-ticks': 'opt-node-4a',
  'q5-node-cluster': 'opt-node-5b',

  // React
  'q1-react-lifecycle': 'opt-r1b',
  'q2-react-props': 'opt-r2a',
  'q3-react-state': 'opt-r3a',
  'q4-react-keys': 'opt-r4b',
  'q5-react-context': 'opt-r5a',

  // SQL
  'q1-sql-foreign-index': 'opt-sql-1b',
  'q2-sql-joins-diff': 'opt-sql-2a',
  'q3-sql-having': 'opt-sql-3c',
  'q4-sql-acid': 'opt-sql-4a',
  'q5-sql-btree': 'opt-sql-5b',

  // REST APIs
  'q1-rest-created': 'opt-rest-1b',
  'q2-rest-idempotent': 'opt-rest-2a',
  'q3-rest-auth': 'opt-rest-3b',
  'q4-rest-stateless': 'opt-rest-4c',
  'q5-rest-validation': 'opt-rest-5a',

  // Git
  'q1-git-rebase': 'opt-git-1a',
  'q2-git-stash': 'opt-git-2b',
  'q3-git-fastforward': 'opt-git-3a',
  'q4-git-cherrypick': 'opt-git-4c',
  'q5-git-conflict': 'opt-git-5a',

  // JavaScript
  'q1-js-closures': 'opt-j1a',
  'q2-js-types': 'opt-j2c',
  'q3-js-event-loop': 'opt-j3a',
  'q4-js-destructuring': 'opt-j4a',
  'q5-js-equality': 'opt-j5a',

  // MongoDB
  'q1-mongo-id': 'opt-m1b',
  'q2-mongo-pipeline': 'opt-m2a',
  'q3-mongo-indexing': 'opt-m3b',
  'q4-mongo-lookup': 'opt-m4b',
  'q5-mongo-embed-vs-ref': 'opt-m5b',

  // Express.js
  'q1-express-middleware': 'opt-e1b',
  'q2-express-error': 'opt-e2a',
  'q3-express-router': 'opt-e3c',
  'q4-express-async': 'opt-e4a',
  'q5-express-security': 'opt-e5b',

  // Authentication & Security
  'q1-auth-jwt': 'opt-a1a',
  'q2-auth-cookies': 'opt-a2b',
  'q3-auth-csrf': 'opt-a3c',
  'q4-auth-hash': 'opt-a4a',
  'q5-auth-rbac': 'opt-a5b',

  // Deployment & Cloud
  'q1-deploy-docker': 'opt-d1a',
  'q2-deploy-env': 'opt-d2c',
  'q3-deploy-health': 'opt-d3b',
  'q4-deploy-proxy': 'opt-d4a',
  'q5-deploy-cicd': 'opt-d5b',

  // Problem Solving / DSA
  'q1-dsa-binary-search': 'opt-ds1a',
  'q2-dsa-hashmap': 'opt-ds2b',
  'q3-dsa-bfs-dfs': 'opt-ds3a',
  'q4-dsa-stack': 'opt-ds4c',
  'q5-dsa-memo': 'opt-ds5a',

  // HTML
  'q1-html-semantic': 'opt-h1a',
  'q2-html-alt': 'opt-h2b',
  'q3-html-viewport': 'opt-h3c',
  'q4-html-forms': 'opt-h4a',
  'q5-html-doctype': 'opt-h5a',

  // CSS
  'q1-css-boxmodel': 'opt-c1a',
  'q2-css-flexbox': 'opt-c2b',
  'q3-css-grid': 'opt-c3a',
  'q4-css-media': 'opt-c4c',
  'q5-css-specificity': 'opt-c5a',
}

const CANONICAL_ASSESSMENTS: Record<string, {
  title: string
  skillId: string
  skillName: string
  timeLimit: number
  questions: QuestionSafeView[]
}> = {
  'assess-l1-nodejs-loop': {
    title: 'Node.js Event Loop & Concurrency Benchmark',
    skillId: '40000000-0000-0000-0000-000000000001',
    skillName: 'Node.js',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-node-libuv',
        questionText: 'What handles asynchronous I/O operations and event-driven scheduling in Node.js runtime?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-node-1a', optionText: 'V8 JavaScript Execution Engine', orderIndex: 1 },
          { id: 'opt-node-1b', optionText: 'Libuv cross-platform asynchronous I/O library', orderIndex: 2 },
          { id: 'opt-node-1c', optionText: 'Thread Pool Manager in OS kernel only', orderIndex: 3 },
          { id: 'opt-node-1d', optionText: 'Worker Threads Module exclusively', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-node-unhandled',
        questionText: 'What occurs if an async function throws an error and no await / .catch() captures it in modern Node.js?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-node-2a', optionText: 'Node.js retries the function until it succeeds', orderIndex: 1 },
          { id: 'opt-node-2b', optionText: 'The error is silently discarded and execution continues', orderIndex: 2 },
          { id: 'opt-node-2c', optionText: 'An UnhandledPromiseRejection event is emitted, terminating the process by default', orderIndex: 3 },
          { id: 'opt-node-2d', optionText: 'The runtime converts the rejected promise into undefined', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-node-backpressure',
        questionText: 'When piping data to a Writable stream, what does writable.write(chunk) returning false signify?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-node-3a', optionText: 'The stream encountered a fatal network socket exception', orderIndex: 1 },
          { id: 'opt-node-3b', optionText: 'The internal buffer has exceeded highWaterMark and the writer should pause until \'drain\' fires', orderIndex: 2 },
          { id: 'opt-node-3c', optionText: 'The chunk was corrupted and needs re-encoding', orderIndex: 3 },
          { id: 'opt-node-3d', optionText: 'The destination file was closed by the OS', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-node-ticks',
        questionText: 'In the Node.js event loop lifecycle, when is a process.nextTick() callback scheduled?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-node-4a', optionText: 'Immediately after the current operation finishes, before moving to the next event loop phase', orderIndex: 1 },
          { id: 'opt-node-4b', optionText: 'In the Poll phase alongside I/O callbacks', orderIndex: 2 },
          { id: 'opt-node-4c', optionText: 'In the Check phase along with setImmediate callbacks', orderIndex: 3 },
          { id: 'opt-node-4d', optionText: 'At the start of the next process garbage collection cycle', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-node-cluster',
        questionText: 'What is the primary difference between Node.js Worker Threads and the Cluster module?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-node-5a', optionText: 'Cluster shares memory, whereas Worker Threads run isolated processes', orderIndex: 1 },
          { id: 'opt-node-5b', optionText: 'Cluster forks multiple processes that share server ports, while Worker Threads share process memory within a single process', orderIndex: 2 },
          { id: 'opt-node-5c', optionText: 'There is no difference; Worker Threads is deprecated in favor of Cluster', orderIndex: 3 },
          { id: 'opt-node-5d', optionText: 'Worker Threads only work in web browsers', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-backend-core': {
    title: 'Node.js & Backend Architecture Benchmark',
    skillId: '40000000-0000-0000-0000-000000000001',
    skillName: 'Node.js',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-node-libuv',
        questionText: 'What handles asynchronous I/O operations and event-driven scheduling in Node.js runtime?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-node-1a', optionText: 'V8 JavaScript Execution Engine', orderIndex: 1 },
          { id: 'opt-node-1b', optionText: 'Libuv cross-platform asynchronous I/O library', orderIndex: 2 },
          { id: 'opt-node-1c', optionText: 'Thread Pool Manager in OS kernel only', orderIndex: 3 },
          { id: 'opt-node-1d', optionText: 'Worker Threads Module exclusively', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-node-unhandled',
        questionText: 'What occurs if an async function throws an error and no await / .catch() captures it in modern Node.js?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-node-2a', optionText: 'Node.js retries the function until it succeeds', orderIndex: 1 },
          { id: 'opt-node-2b', optionText: 'The error is silently discarded and execution continues', orderIndex: 2 },
          { id: 'opt-node-2c', optionText: 'An UnhandledPromiseRejection event is emitted, terminating the process by default', orderIndex: 3 },
          { id: 'opt-node-2d', optionText: 'The runtime converts the rejected promise into undefined', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-node-backpressure',
        questionText: 'When piping data to a Writable stream, what does writable.write(chunk) returning false signify?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-node-3a', optionText: 'The stream encountered a fatal network socket exception', orderIndex: 1 },
          { id: 'opt-node-3b', optionText: 'The internal buffer has exceeded highWaterMark and the writer should pause until \'drain\' fires', orderIndex: 2 },
          { id: 'opt-node-3c', optionText: 'The chunk was corrupted and needs re-encoding', orderIndex: 3 },
          { id: 'opt-node-3d', optionText: 'The destination file was closed by the OS', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-node-ticks',
        questionText: 'In the Node.js event loop lifecycle, when is a process.nextTick() callback scheduled?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-node-4a', optionText: 'Immediately after the current operation finishes, before moving to the next event loop phase', orderIndex: 1 },
          { id: 'opt-node-4b', optionText: 'In the Poll phase alongside I/O callbacks', orderIndex: 2 },
          { id: 'opt-node-4c', optionText: 'In the Check phase along with setImmediate callbacks', orderIndex: 3 },
          { id: 'opt-node-4d', optionText: 'At the start of the next process garbage collection cycle', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-node-cluster',
        questionText: 'What is the primary difference between Node.js Worker Threads and the Cluster module?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-node-5a', optionText: 'Cluster shares memory, whereas Worker Threads run isolated processes', orderIndex: 1 },
          { id: 'opt-node-5b', optionText: 'Cluster forks multiple processes that share server ports, while Worker Threads share process memory within a single process', orderIndex: 2 },
          { id: 'opt-node-5c', optionText: 'There is no difference; Worker Threads is deprecated in favor of Cluster', orderIndex: 3 },
          { id: 'opt-node-5d', optionText: 'Worker Threads only work in web browsers', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-react-basics': {
    title: 'React Component Architecture & Hooks Benchmark',
    skillId: '40000000-0000-0000-0000-000000000002',
    skillName: 'React',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-react-lifecycle',
        questionText: 'Which React hook should be used to perform side effects after component rendering?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-r1a', optionText: 'useState', orderIndex: 1 },
          { id: 'opt-r1b', optionText: 'useEffect', orderIndex: 2 },
          { id: 'opt-r1c', optionText: 'useMemo', orderIndex: 3 },
          { id: 'opt-r1d', optionText: 'useRef', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-react-props',
        questionText: 'How are props passed to child components in React?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-r2a', optionText: 'Downwards unidirectionally via JSX attributes', orderIndex: 1 },
          { id: 'opt-r2b', optionText: 'Through global mutable variables', orderIndex: 2 },
          { id: 'opt-r2c', optionText: 'By modifying DOM element attributes directly', orderIndex: 3 },
          { id: 'opt-r2d', optionText: 'Upwards automatically to parent components', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-react-state',
        questionText: 'Why should component state never be mutated directly in React (e.g., state.count = 1)?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-r3a', optionText: 'Direct mutation bypasses React reconciliation and will not trigger a re-render', orderIndex: 1 },
          { id: 'opt-r3b', optionText: 'Direct mutation causes immediate memory leaks in V8', orderIndex: 2 },
          { id: 'opt-r3c', optionText: 'It is a syntax error in JavaScript', orderIndex: 3 },
          { id: 'opt-r3d', optionText: 'React only allows state mutation inside constructor functions', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-react-keys',
        questionText: 'Why is a unique "key" prop required when rendering dynamic lists in React?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-r4a', optionText: 'To give CSS selectors an ID hook', orderIndex: 1 },
          { id: 'opt-r4b', optionText: 'To help React identify which items have changed, been added, or removed efficiently', orderIndex: 2 },
          { id: 'opt-r4c', optionText: 'To enable localStorage caching', orderIndex: 3 },
          { id: 'opt-r4d', optionText: 'To sort items alphabetically by default', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-react-context',
        questionText: 'What is the primary benefit of React Context API over standard prop drilling?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-r5a', optionText: 'It shares data through the component tree without manually passing props at every level', orderIndex: 1 },
          { id: 'opt-r5b', optionText: 'It increases network speed when fetching REST APIs', orderIndex: 2 },
          { id: 'opt-r5c', optionText: 'It replaces the browser DOM entirely with WebAssembly', orderIndex: 3 },
          { id: 'opt-r5d', optionText: 'It prevents all re-renders across all child components', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-frontend-react': {
    title: 'React Component Architecture & Hooks Benchmark',
    skillId: '40000000-0000-0000-0000-000000000002',
    skillName: 'React',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-react-lifecycle',
        questionText: 'Which React hook should be used to perform side effects after component rendering?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-r1a', optionText: 'useState', orderIndex: 1 },
          { id: 'opt-r1b', optionText: 'useEffect', orderIndex: 2 },
          { id: 'opt-r1c', optionText: 'useMemo', orderIndex: 3 },
          { id: 'opt-r1d', optionText: 'useRef', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-react-props',
        questionText: 'How are props passed to child components in React?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-r2a', optionText: 'Downwards unidirectionally via JSX attributes', orderIndex: 1 },
          { id: 'opt-r2b', optionText: 'Through global mutable variables', orderIndex: 2 },
          { id: 'opt-r2c', optionText: 'By modifying DOM element attributes directly', orderIndex: 3 },
          { id: 'opt-r2d', optionText: 'Upwards automatically to parent components', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-react-state',
        questionText: 'Why should component state never be mutated directly in React (e.g., state.count = 1)?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-r3a', optionText: 'Direct mutation bypasses React reconciliation and will not trigger a re-render', orderIndex: 1 },
          { id: 'opt-r3b', optionText: 'Direct mutation causes immediate memory leaks in V8', orderIndex: 2 },
          { id: 'opt-r3c', optionText: 'It is a syntax error in JavaScript', orderIndex: 3 },
          { id: 'opt-r3d', optionText: 'React only allows state mutation inside constructor functions', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-react-keys',
        questionText: 'Why is a unique "key" prop required when rendering dynamic lists in React?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-r4a', optionText: 'To give CSS selectors an ID hook', orderIndex: 1 },
          { id: 'opt-r4b', optionText: 'To help React identify which items have changed, been added, or removed efficiently', orderIndex: 2 },
          { id: 'opt-r4c', optionText: 'To enable localStorage caching', orderIndex: 3 },
          { id: 'opt-r4d', optionText: 'To sort items alphabetically by default', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-react-context',
        questionText: 'What is the primary benefit of React Context API over standard prop drilling?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-r5a', optionText: 'It shares data through the component tree without manually passing props at every level', orderIndex: 1 },
          { id: 'opt-r5b', optionText: 'It increases network speed when fetching REST APIs', orderIndex: 2 },
          { id: 'opt-r5c', optionText: 'It replaces the browser DOM entirely with WebAssembly', orderIndex: 3 },
          { id: 'opt-r5d', optionText: 'It prevents all re-renders across all child components', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-sql-indexing': {
    title: 'SQL Joins & Relational Indexing Benchmark',
    skillId: '40000000-0000-0000-0000-000000000003',
    skillName: 'SQL',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-sql-foreign-index',
        questionText: 'In relational databases (PostgreSQL/MySQL), what is the primary performance reason to index foreign key columns?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-sql-1a', optionText: 'It prevents duplicate records from being inserted', orderIndex: 1 },
          { id: 'opt-sql-1b', optionText: 'It speeds up JOIN queries and prevents full-table locks during parent row updates/deletes', orderIndex: 2 },
          { id: 'opt-sql-1c', optionText: 'It creates a secondary master database replica automatically', orderIndex: 3 },
          { id: 'opt-sql-1d', optionText: 'It compresses relational table storage on disk', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-sql-joins-diff',
        questionText: 'What is the fundamental difference between an INNER JOIN and a LEFT JOIN?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-sql-2a', optionText: 'INNER JOIN returns only matching rows; LEFT JOIN returns all rows from the left table plus matching rows from the right', orderIndex: 1 },
          { id: 'opt-sql-2b', optionText: 'LEFT JOIN is always faster than INNER JOIN regardless of indices', orderIndex: 2 },
          { id: 'opt-sql-2c', optionText: 'INNER JOIN converts null values into empty strings', orderIndex: 3 },
          { id: 'opt-sql-2d', optionText: 'LEFT JOIN only works on indexed integer columns', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-sql-having',
        questionText: 'When querying with aggregate functions (e.g. COUNT, AVG), why must HAVING be used instead of WHERE?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-sql-3a', optionText: 'WHERE is not supported in ANSI SQL standards', orderIndex: 1 },
          { id: 'opt-sql-3b', optionText: 'HAVING operates faster because it bypasses query planning', orderIndex: 2 },
          { id: 'opt-sql-3c', optionText: 'WHERE filters rows before aggregation; HAVING filters groups after aggregation has been computed', orderIndex: 3 },
          { id: 'opt-sql-3d', optionText: 'HAVING is only used for sorting results', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-sql-acid',
        questionText: 'In ACID properties of relational transactions, what does Atomicity guarantee?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-sql-4a', optionText: 'All operations in the transaction succeed completely, or the entire transaction is rolled back with no partial effects', orderIndex: 1 },
          { id: 'opt-sql-4b', optionText: 'The database guarantees 100% continuous uptime without network drops', orderIndex: 2 },
          { id: 'opt-sql-4c', optionText: 'Queries execute in parallel across multiple CPU cores', orderIndex: 3 },
          { id: 'opt-sql-4d', optionText: 'Data types cannot be changed after a table is created', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-sql-btree',
        questionText: 'Under what condition will the PostgreSQL query planner choose a Sequential Scan over a B-Tree index scan?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-sql-5a', optionText: 'Whenever the table contains more than 1,000,000 rows', orderIndex: 1 },
          { id: 'opt-sql-5b', optionText: 'When the query condition matches a large percentage of the table rows, making sequential disk I/O cheaper than random index lookups', orderIndex: 2 },
          { id: 'opt-sql-5c', optionText: 'When foreign keys are disabled in the database configuration', orderIndex: 3 },
          { id: 'opt-sql-5d', optionText: 'B-Tree indexes are never bypassed by PostgreSQL', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-rest-design': {
    title: 'RESTful API Standards & Status Codes Benchmark',
    skillId: '40000000-0000-0000-0000-000000000005',
    skillName: 'REST APIs',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-rest-created',
        questionText: 'Which HTTP status code should a REST API return when a new resource has been successfully created via POST?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-rest-1a', optionText: '200 OK', orderIndex: 1 },
          { id: 'opt-rest-1b', optionText: '201 Created', orderIndex: 2 },
          { id: 'opt-rest-1c', optionText: '204 No Content', orderIndex: 3 },
          { id: 'opt-rest-1d', optionText: '302 Found', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-rest-idempotent',
        questionText: 'In HTTP/REST semantics, which of the following HTTP methods is defined as idempotent?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-rest-2a', optionText: 'PUT (replacing a resource produces the same state regardless of how many times it is repeated)', orderIndex: 1 },
          { id: 'opt-rest-2b', optionText: 'POST', orderIndex: 2 },
          { id: 'opt-rest-2c', optionText: 'PATCH when appending to arrays', orderIndex: 3 },
          { id: 'opt-rest-2d', optionText: 'CONNECT', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-rest-auth',
        questionText: 'What is the architectural difference between HTTP status codes 401 Unauthorized and 403 Forbidden?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-rest-3a', optionText: '401 is for server errors; 403 is for client typos', orderIndex: 1 },
          { id: 'opt-rest-3b', optionText: '401 indicates missing or invalid authentication credentials; 403 indicates the identity is authenticated but lacks required authorization permissions', orderIndex: 2 },
          { id: 'opt-rest-3c', optionText: '401 is deprecated in HTTP/2', orderIndex: 3 },
          { id: 'opt-rest-3d', optionText: 'They are completely interchangeable', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-rest-stateless',
        questionText: 'What does the REST constraint of "Statelessness" require from client requests?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-rest-4a', optionText: 'The server must not use a relational database', orderIndex: 1 },
          { id: 'opt-rest-4b', optionText: 'All client requests must be unencrypted', orderIndex: 2 },
          { id: 'opt-rest-4c', optionText: 'Every request must contain all information necessary for the server to understand and process it, without relying on stored server session state', orderIndex: 3 },
          { id: 'opt-rest-4d', optionText: 'The client must disconnect and reconnect for every HTTP header', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-rest-validation',
        questionText: 'When a client submits syntactically valid JSON whose fields fail business validation (e.g. negative age or invalid email format), what status code is most appropriate?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-rest-5a', optionText: '422 Unprocessable Entity (or 400 Bad Request with field errors)', orderIndex: 1 },
          { id: 'opt-rest-5b', optionText: '500 Internal Server Error', orderIndex: 2 },
          { id: 'opt-rest-5c', optionText: '404 Not Found', orderIndex: 3 },
          { id: 'opt-rest-5d', optionText: '304 Not Modified', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-git-workflows': {
    title: 'Git Workflows & Version Control Mastery Benchmark',
    skillId: '40000000-0000-0000-0000-000000000004',
    skillName: 'Git & Version Control',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-git-rebase',
        questionText: 'What is the key difference between \'git merge\' and \'git rebase\' when integrating changes?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-git-1a', optionText: 'Merge preserves the true commit history with a merge commit, while rebase rewrites project history linearly', orderIndex: 1 },
          { id: 'opt-git-1b', optionText: 'Rebase permanently deletes uncommitted changes in the working tree', orderIndex: 2 },
          { id: 'opt-git-1c', optionText: 'Merge only works on local branches, whereas rebase only works on remote repositories', orderIndex: 3 },
          { id: 'opt-git-1d', optionText: 'There is no difference; they are exact aliases in Git', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-git-stash',
        questionText: 'When should a developer use \'git stash\' during everyday feature development?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-git-2a', optionText: 'To permanently delete uncommitted code that is broken', orderIndex: 1 },
          { id: 'opt-git-2b', optionText: 'To temporarily shelf uncommitted changes in order to switch branches without committing incomplete work', orderIndex: 2 },
          { id: 'opt-git-2c', optionText: 'To push commits directly to the production server', orderIndex: 3 },
          { id: 'opt-git-2d', optionText: 'To revert the last 3 pushed commits', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-git-fastforward',
        questionText: 'Under what condition does Git perform a "fast-forward" merge?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-git-3a', optionText: 'When the target branch has no new commits since the feature branch was branched off, simply moving the pointer forward', orderIndex: 1 },
          { id: 'opt-git-3b', optionText: 'When both branches have conflicting edits on the exact same line', orderIndex: 2 },
          { id: 'opt-git-3c', optionText: 'When merging using SSH instead of HTTPS', orderIndex: 3 },
          { id: 'opt-git-3d', optionText: 'When the commit message contains the keyword [fast-forward]', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-git-cherrypick',
        questionText: 'What is the purpose of the \'git cherry-pick <commit-hash>\' command?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-git-4a', optionText: 'To select the most recent commit and tag it for release', orderIndex: 1 },
          { id: 'opt-git-4b', optionText: 'To delete an unwanted branch from remote origin', orderIndex: 2 },
          { id: 'opt-git-4c', optionText: 'To apply the changes introduced by a specific commit from another branch onto your current HEAD branch', orderIndex: 3 },
          { id: 'opt-git-4d', optionText: 'To search the repository for syntax errors', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-git-conflict',
        questionText: 'How should a developer resolve a Git merge conflict in a shared file?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-git-5a', optionText: 'Inspect conflict markers (<<<<<<<, =======, >>>>>>>), determine correct logic, edit the file, stage with git add, and complete the merge commit', orderIndex: 1 },
          { id: 'opt-git-5b', optionText: 'Delete the .git directory and re-initialize the repository', orderIndex: 2 },
          { id: 'opt-git-5c', optionText: 'Force push to origin immediately with git push --force', orderIndex: 3 },
          { id: 'opt-git-5d', optionText: 'Conflicts cannot be resolved manually; Git must always choose automatically', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-javascript-core': {
    title: 'JavaScript Language Knowledge Benchmark',
    skillId: '40000000-0000-0000-0000-000000000015',
    skillName: 'JavaScript',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-js-closures',
        questionText: 'What is a closure in JavaScript?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-j1a', optionText: 'A function bundled together with references to its surrounding lexical environment', orderIndex: 1 },
          { id: 'opt-j1b', optionText: 'A method that terminates an active HTTP request', orderIndex: 2 },
          { id: 'opt-j1c', optionText: 'An event listener that automatically unbinds after one call', orderIndex: 3 },
          { id: 'opt-j1d', optionText: 'A syntax error when curly brackets are unclosed', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-js-types',
        questionText: 'What does the operator typeof null return in JavaScript?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-j2a', optionText: '"null"', orderIndex: 1 },
          { id: 'opt-j2b', optionText: '"undefined"', orderIndex: 2 },
          { id: 'opt-j2c', optionText: '"object"', orderIndex: 3 },
          { id: 'opt-j2d', optionText: '"boolean"', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-js-event-loop',
        questionText: 'In JavaScript microtask vs macrotask execution, which has higher priority?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-j3a', optionText: 'Microtasks (like Promise.then) are executed before macrotasks (like setTimeout)', orderIndex: 1 },
          { id: 'opt-j3b', optionText: 'Macrotasks are always executed first', orderIndex: 2 },
          { id: 'opt-j3c', optionText: 'They run strictly in parallel threads', orderIndex: 3 },
          { id: 'opt-j3d', optionText: 'Priority is chosen randomly by the browser', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-js-destructuring',
        questionText: 'What will const [a, ...rest] = [1, 2, 3] assign to rest?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-j4a', optionText: '[2, 3]', orderIndex: 1 },
          { id: 'opt-j4b', optionText: '2', orderIndex: 2 },
          { id: 'opt-j4c', optionText: '[1, 2, 3]', orderIndex: 3 },
          { id: 'opt-j4d', optionText: 'undefined', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-js-equality',
        questionText: 'What is the primary difference between == and === in JavaScript?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-j5a', optionText: '=== compares both value and type without type coercion, while == performs coercion', orderIndex: 1 },
          { id: 'opt-j5b', optionText: '== compares memory addresses while === compares string representations', orderIndex: 2 },
          { id: 'opt-j5c', optionText: 'There is no difference in ES6+', orderIndex: 3 },
          { id: 'opt-j5d', optionText: '=== is only used for numerical values', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-mongodb-core': {
    title: 'MongoDB Aggregations & Document Modeling Benchmark',
    skillId: '40000000-0000-0000-0000-000000000008',
    skillName: 'MongoDB',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-mongo-id',
        questionText: 'What is the default datatype and purpose of _id in a MongoDB document?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-m1a', optionText: '64-bit auto-incrementing integer for table indexing', orderIndex: 1 },
          { id: 'opt-m1b', optionText: '12-byte BSON ObjectId containing timestamp, machine ID, process ID, and counter', orderIndex: 2 },
          { id: 'opt-m1c', optionText: 'Random SHA-256 UUID generated by the client driver', orderIndex: 3 },
          { id: 'opt-m1d', optionText: 'String hash of the document payload', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-mongo-pipeline',
        questionText: 'Which aggregation pipeline stage filters documents before grouping or projections?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-m2a', optionText: '$match stage filtering documents matching specified criteria', orderIndex: 1 },
          { id: 'opt-m2b', optionText: '$filter operator inside an expression array', orderIndex: 2 },
          { id: 'opt-m2c', optionText: '$where JavaScript evaluation stage', orderIndex: 3 },
          { id: 'opt-m2d', optionText: '$project projection stage', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-mongo-indexing',
        questionText: 'What is the primary benefit of creating a compound index on { status: 1, createdAt: -1 }?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-m3a', optionText: 'Compresses stored documents on disk by 50%', orderIndex: 1 },
          { id: 'opt-m3b', optionText: 'Accelerates queries filtering by status and sorting by createdAt without an in-memory sort', orderIndex: 2 },
          { id: 'opt-m3c', optionText: 'Automatically shards the collection across multiple clusters', orderIndex: 3 },
          { id: 'opt-m3d', optionText: 'Prevents duplicate records across both fields unconditionally', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-mongo-lookup',
        questionText: 'What does the $lookup aggregation stage accomplish?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-m4a', optionText: 'Performs an index rebuild across replica sets', orderIndex: 1 },
          { id: 'opt-m4b', optionText: 'Performs a left outer join to an unsharded collection in the same database', orderIndex: 2 },
          { id: 'opt-m4c', optionText: 'Connects to an external SQL database via ODBC', orderIndex: 3 },
          { id: 'opt-m4d', optionText: 'Validates document schema against JSONSchema definitions', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-mongo-embed-vs-ref',
        questionText: 'When is embedding sub-documents preferred over referencing in MongoDB schema design?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-m5a', optionText: 'For unbounded 1-to-N relationships exceeding 16MB document size', orderIndex: 1 },
          { id: 'opt-m5b', optionText: 'For data that is queried together, has 1-to-few relationship, and avoids multi-document transactions', orderIndex: 2 },
          { id: 'opt-m5c', optionText: 'When documents need to be frequently updated by hundreds of concurrent workers', orderIndex: 3 },
          { id: 'opt-m5d', optionText: 'Embedding is never recommended in production MongoDB', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-express-core': {
    title: 'Express.js Middleware Architecture & Routing Benchmark',
    skillId: 'skill-fs-express',
    skillName: 'Express.js',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-express-middleware',
        questionText: 'In Express.js middleware, what is the critical purpose of calling next()?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-e1a', optionText: 'Terminates the current HTTP connection and sends 200 OK', orderIndex: 1 },
          { id: 'opt-e1b', optionText: 'Passes execution flow to the subsequent middleware function in the stack', orderIndex: 2 },
          { id: 'opt-e1c', optionText: 'Restarts the Express application worker process', orderIndex: 3 },
          { id: 'opt-e1d', optionText: 'Reroutes the request back to the client browser', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-express-error',
        questionText: 'How is an error-handling middleware function defined in Express.js?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-e2a', optionText: 'With exactly four arguments: (err, req, res, next)', orderIndex: 1 },
          { id: 'opt-e2b', optionText: 'By decorating an endpoint with @CatchError()', orderIndex: 2 },
          { id: 'opt-e2c', optionText: 'With three arguments: (req, res, err)', orderIndex: 3 },
          { id: 'opt-e2d', optionText: 'Using process.on(\'uncaughtException\') inside routes only', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-express-router',
        questionText: 'What does express.Router() provide to an enterprise application architecture?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-e3a', optionText: 'Hardware routing tables for the physical network interface', orderIndex: 1 },
          { id: 'opt-e3b', optionText: 'Direct database connection pooling for PostgreSQL', orderIndex: 2 },
          { id: 'opt-e3c', optionText: 'Isolated, modular instance of middleware and routing logic mounted at a prefix', orderIndex: 3 },
          { id: 'opt-e3d', optionText: 'Automatic GraphQL schema generation', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-express-async',
        questionText: 'What happens in Express 4 when an async route handler rejects without a try/catch block?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-e4a', optionText: 'It results in an unhandled promise rejection unless wrapped or forwarded via next(err)', orderIndex: 1 },
          { id: 'opt-e4b', optionText: 'Express automatically catches it and returns 400 Bad Request', orderIndex: 2 },
          { id: 'opt-e4c', optionText: 'The request is retried three times before timing out', orderIndex: 3 },
          { id: 'opt-e4d', optionText: 'The client receives an empty 204 response immediately', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-express-security',
        questionText: 'Which middleware is commonly used in Express to secure HTTP response headers against clickjacking and XSS?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-e5a', optionText: 'body-parser', orderIndex: 1 },
          { id: 'opt-e5b', optionText: 'helmet', orderIndex: 2 },
          { id: 'opt-e5c', optionText: 'morgan', orderIndex: 3 },
          { id: 'opt-e5d', optionText: 'multer', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-auth-security': {
    title: 'Authentication, JWT & Web Security Benchmark',
    skillId: 'skill-fs-auth',
    skillName: 'Authentication',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-auth-jwt',
        questionText: 'What are the three components of a JSON Web Token (JWT) separated by dots?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-a1a', optionText: 'Header, Payload, Signature', orderIndex: 1 },
          { id: 'opt-a1b', optionText: 'Algorithm, UserID, Expiration', orderIndex: 2 },
          { id: 'opt-a1c', optionText: 'Protocol, Claim, Hash', orderIndex: 3 },
          { id: 'opt-a1d', optionText: 'Issuer, Audience, SecretKey', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-auth-cookies',
        questionText: 'Why should sensitive session JWTs be stored in HttpOnly cookies instead of browser localStorage?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-a2a', optionText: 'HttpOnly cookies have infinite storage capacity compared to 5MB localStorage', orderIndex: 1 },
          { id: 'opt-a2b', optionText: 'HttpOnly cookies cannot be accessed by client-side JavaScript, protecting against XSS token theft', orderIndex: 2 },
          { id: 'opt-a2c', optionText: 'HttpOnly cookies are automatically encrypted by the browser', orderIndex: 3 },
          { id: 'opt-a2d', optionText: 'localStorage does not persist across browser tabs', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-auth-csrf',
        questionText: 'What protection is most effective against Cross-Site Request Forgery (CSRF) for cookie-based authentication?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-a3a', optionText: 'Using HTTPS encryption only', orderIndex: 1 },
          { id: 'opt-a3b', optionText: 'Storing passwords in base64 format', orderIndex: 2 },
          { id: 'opt-a3c', optionText: 'SameSite cookie flags (Strict/Lax) and anti-CSRF challenge tokens', orderIndex: 3 },
          { id: 'opt-a3d', optionText: 'Disabling CORS completely on the server', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-auth-hash',
        questionText: 'Why should developers use salted slow hashing algorithms (like bcrypt or Argon2) instead of MD5 or SHA-256 for passwords?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-a4a', optionText: 'Bcrypt and Argon2 include computational work factors and unique salts that resist brute-force and rainbow table attacks', orderIndex: 1 },
          { id: 'opt-a4b', optionText: 'MD5 is reversible back to plaintext with a single mathematical formula', orderIndex: 2 },
          { id: 'opt-a4c', optionText: 'SHA-256 produces output strings that are too long for database columns', orderIndex: 3 },
          { id: 'opt-a4d', optionText: 'Only bcrypt supports UTF-8 characters', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-auth-rbac',
        questionText: 'In Role-Based Access Control (RBAC), how should permissions be evaluated in endpoint middleware?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-a5a', optionText: 'By checking client-sent query parameters like ?role=admin', orderIndex: 1 },
          { id: 'opt-a5b', optionText: 'By verifying authenticated user roles/claims decoded from a verified token against required permissions before route handler execution', orderIndex: 2 },
          { id: 'opt-a5c', optionText: 'By letting all requests reach the database and handling errors there', orderIndex: 3 },
          { id: 'opt-a5d', optionText: 'By hardcoding IP addresses for administrators', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-deployment-cloud': {
    title: 'Containerization, Cloud Deployment & CI/CD Benchmark',
    skillId: 'skill-fs-deploy',
    skillName: 'Deployment',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-deploy-docker',
        questionText: 'What is the primary benefit of multi-stage Docker builds in modern container deployments?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-d1a', optionText: 'Separates build tools and dependencies from the final minimal runtime image, reducing image size and attack surface', orderIndex: 1 },
          { id: 'opt-d1b', optionText: 'Allows running multiple operating systems simultaneously in one container', orderIndex: 2 },
          { id: 'opt-d1c', optionText: 'Eliminates the need for Docker Compose in production', orderIndex: 3 },
          { id: 'opt-d1d', optionText: 'Automatically deploys the image to AWS ECS without an access key', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-deploy-env',
        questionText: 'According to the Twelve-Factor App methodology, where should application configuration (like DB credentials) be stored?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-d2a', optionText: 'Hardcoded in constants inside source code files', orderIndex: 1 },
          { id: 'opt-d2b', optionText: 'Committed to a private Git repository in a config.json file', orderIndex: 2 },
          { id: 'opt-d2c', optionText: 'Injected via environment variables at runtime', orderIndex: 3 },
          { id: 'opt-d2d', optionText: 'Stored in the browser localStorage during build', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-deploy-health',
        questionText: 'What is the purpose of a dedicated /health or /healthz endpoint in a deployed service?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-d3a', optionText: 'To output server CPU temperatures to end users', orderIndex: 1 },
          { id: 'opt-d3b', optionText: 'Enables load balancers and orchestrators (like Kubernetes) to verify liveness and readiness for routing traffic', orderIndex: 2 },
          { id: 'opt-d3c', optionText: 'To execute automated unit tests on every GET request', orderIndex: 3 },
          { id: 'opt-d3d', optionText: 'To backup database tables to cloud storage', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-deploy-proxy',
        questionText: 'Why is a reverse proxy (e.g., Nginx, Caddy, or Cloudflare) commonly placed in front of Node.js apps in production?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-d4a', optionText: 'Handles SSL/TLS termination, gzip compression, static asset caching, and load balancing efficiently', orderIndex: 1 },
          { id: 'opt-d4b', optionText: 'Compiles TypeScript into JavaScript on the fly', orderIndex: 2 },
          { id: 'opt-d4c', optionText: 'Converts Node.js into native C++ binaries', orderIndex: 3 },
          { id: 'opt-d4d', optionText: 'Replaces Node.js runtime with Apache server', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-deploy-cicd',
        questionText: 'In a robust CI/CD pipeline, what is the correct order of stages before production deployment?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-d5a', optionText: 'Deploy -> Lint -> Test -> Build', orderIndex: 1 },
          { id: 'opt-d5b', optionText: 'Lint & Typecheck -> Automated Unit/Integration Tests -> Container Build -> Staging Deployment -> Production Deployment', orderIndex: 2 },
          { id: 'opt-d5c', optionText: 'Build -> Deploy -> Test in Production -> Rollback', orderIndex: 3 },
          { id: 'opt-d5d', optionText: 'Deploy -> Validate Git Commits -> Run Tests', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-dsa-core': {
    title: 'Data Structures & Algorithmic Problem Solving Benchmark',
    skillId: 'skill-fs-dsa',
    skillName: 'Problem Solving / DSA',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-dsa-binary-search',
        questionText: 'What is the time complexity of Binary Search on a sorted array of N elements?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-ds1a', optionText: 'O(log N)', orderIndex: 1 },
          { id: 'opt-ds1b', optionText: 'O(N)', orderIndex: 2 },
          { id: 'opt-ds1c', optionText: 'O(N log N)', orderIndex: 3 },
          { id: 'opt-ds1d', optionText: 'O(1)', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-dsa-hashmap',
        questionText: 'What is the average time complexity for lookup and insertion operations in a well-designed Hash Map?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-ds2a', optionText: 'O(N)', orderIndex: 1 },
          { id: 'opt-ds2b', optionText: 'O(1) amortized constant time', orderIndex: 2 },
          { id: 'opt-ds2c', optionText: 'O(log N)', orderIndex: 3 },
          { id: 'opt-ds2d', optionText: 'O(N^2)', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-dsa-bfs-dfs',
        questionText: 'Which graph traversal algorithm uses a Queue data structure and is optimal for finding the shortest path on unweighted graphs?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-ds3a', optionText: 'Breadth-First Search (BFS)', orderIndex: 1 },
          { id: 'opt-ds3b', optionText: 'Depth-First Search (DFS)', orderIndex: 2 },
          { id: 'opt-ds3c', optionText: 'Topological Sort', orderIndex: 3 },
          { id: 'opt-ds3d', optionText: 'Bellman-Ford Algorithm', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-dsa-stack',
        questionText: 'Which data structure follows the Last-In, First-Out (LIFO) principle and is used for function call stacks and balanced parenthesis checking?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-ds4a', optionText: 'Queue', orderIndex: 1 },
          { id: 'opt-ds4b', optionText: 'Heap', orderIndex: 2 },
          { id: 'opt-ds4c', optionText: 'Stack', orderIndex: 3 },
          { id: 'opt-ds4d', optionText: 'Linked List', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-dsa-memo',
        questionText: 'In Dynamic Programming, what does "Memoization" refer to?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-ds5a', optionText: 'Top-down caching of subproblem solutions to prevent redundant exponential calculations', orderIndex: 1 },
          { id: 'opt-ds5b', optionText: 'Writing code comments explaining the algorithm', orderIndex: 2 },
          { id: 'opt-ds5c', optionText: 'Converting recursive algorithms into bitwise operations', orderIndex: 3 },
          { id: 'opt-ds5d', optionText: 'Freeing unused variables from memory garbage collector', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-html-basics': {
    title: 'Semantic HTML5 & Web Standards Benchmark',
    skillId: '40000000-0000-0000-0000-000000000016',
    skillName: 'HTML',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-html-semantic',
        questionText: 'Which HTML5 element should be used for the primary self-contained content of a webpage?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-h1a', optionText: '<main>', orderIndex: 1 },
          { id: 'opt-h1b', optionText: '<section>', orderIndex: 2 },
          { id: 'opt-h1c', optionText: '<div>', orderIndex: 3 },
          { id: 'opt-h1d', optionText: '<content>', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-html-alt',
        questionText: 'What is the critical accessibility purpose of the alt attribute on <img> elements?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-h2a', optionText: 'To set image dimensions for responsive layout rendering', orderIndex: 1 },
          { id: 'opt-h2b', optionText: 'Provides text alternative for screen reader users and displays when the image fails to load', orderIndex: 2 },
          { id: 'opt-h2c', optionText: 'Defines the CSS hover tooltip exclusively', orderIndex: 3 },
          { id: 'opt-h2d', optionText: 'Improves compression ratio in WebP formats', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-html-viewport',
        questionText: 'What is the purpose of <meta name="viewport" content="width=device-width, initial-scale=1.0">?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-h3a', optionText: 'Sets the maximum allowable window resolution on desktop', orderIndex: 1 },
          { id: 'opt-h3b', optionText: 'Preloads Google Fonts before parsing body HTML', orderIndex: 2 },
          { id: 'opt-h3c', optionText: 'Controls the viewport width and initial zoom scale on mobile devices for responsive rendering', orderIndex: 3 },
          { id: 'opt-h3d', optionText: 'Prevents users from rotating device orientation', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-html-forms',
        questionText: 'Which form attribute prevents form submission if a specific input is left empty by the user?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-h4a', optionText: 'required', orderIndex: 1 },
          { id: 'opt-h4b', optionText: 'validate="true"', orderIndex: 2 },
          { id: 'opt-h4c', optionText: 'mandatory', orderIndex: 3 },
          { id: 'opt-h4d', optionText: 'locked', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-html-doctype',
        questionText: 'What does <!DOCTYPE html> at the beginning of an HTML document accomplish?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-h5a', optionText: 'Tells the browser to parse the document in standard HTML5 mode, avoiding quirks mode', orderIndex: 1 },
          { id: 'opt-h5b', optionText: 'Imports the JavaScript V8 engine into the browser', orderIndex: 2 },
          { id: 'opt-h5c', optionText: 'Enables server-side rendering for Next.js', orderIndex: 3 },
          { id: 'opt-h5d', optionText: 'Connects to the W3C validator on every page load', orderIndex: 4 },
        ],
      },
    ],
  },
  'assess-l1-css-layouts': {
    title: 'Modern CSS, Flexbox & Responsive Layouts Benchmark',
    skillId: '40000000-0000-0000-0000-000000000017',
    skillName: 'CSS',
    timeLimit: 15,
    questions: [
      {
        id: 'q1-css-boxmodel',
        questionText: 'What does setting box-sizing: border-box do in CSS layout calculations?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-c1a', optionText: 'Includes padding and border within the element\'s total width and height, preventing layout overflow', orderIndex: 1 },
          { id: 'opt-c1b', optionText: 'Adds an automated 1px black border to all div containers', orderIndex: 2 },
          { id: 'opt-c1c', optionText: 'Hides all scrollbars inside the viewport', orderIndex: 3 },
          { id: 'opt-c1d', optionText: 'Disables CSS margin collapse across child elements', orderIndex: 4 },
        ],
      },
      {
        id: 'q2-css-flexbox',
        questionText: 'In Flexbox with flex-direction: row, what is the difference between justify-content and align-items?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-c2a', optionText: 'They are identical and can be used interchangeably', orderIndex: 1 },
          { id: 'opt-c2b', optionText: 'justify-content aligns along the main horizontal axis, while align-items aligns along the cross vertical axis', orderIndex: 2 },
          { id: 'opt-c2c', optionText: 'justify-content sets font size, while align-items sets margins', orderIndex: 3 },
          { id: 'opt-c2d', optionText: 'align-items only works when flex-wrap: wrap is set', orderIndex: 4 },
        ],
      },
      {
        id: 'q3-css-grid',
        questionText: 'What is the primary advantage of CSS Grid over Flexbox in modern UI design?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-c3a', optionText: 'CSS Grid is two-dimensional (simultaneous control of rows and columns), while Flexbox is one-dimensional', orderIndex: 1 },
          { id: 'opt-c3b', optionText: 'Flexbox does not support mobile viewports', orderIndex: 2 },
          { id: 'opt-c3c', optionText: 'CSS Grid runs in a Web Worker thread', orderIndex: 3 },
          { id: 'opt-c3d', optionText: 'CSS Grid does not require any CSS rules', orderIndex: 4 },
        ],
      },
      {
        id: 'q4-css-media',
        questionText: 'In mobile-first responsive web design, how are CSS media queries typically structured?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-c4a', optionText: 'Using max-width rules starting from 4K screens down to mobile', orderIndex: 1 },
          { id: 'opt-c4b', optionText: 'Using device-pixel-ratio only without width checks', orderIndex: 2 },
          { id: 'opt-c4c', optionText: 'Default CSS styles target mobile screens, while min-width media queries add rules for larger screens', orderIndex: 3 },
          { id: 'opt-c4d', optionText: 'By serving different HTML files for each device', orderIndex: 4 },
        ],
      },
      {
        id: 'q5-css-specificity',
        questionText: 'Which CSS selector has the highest specificity weight?',
        questionType: 'multiple_choice',
        points: 20,
        orderIndex: 5,
        options: [
          { id: 'opt-c5a', optionText: '#header (ID selector: 1-0-0)', orderIndex: 1 },
          { id: 'opt-c5b', optionText: '.nav-link.active (Class selectors: 0-2-0)', orderIndex: 2 },
          { id: 'opt-c5c', optionText: 'header div ul li a (Element selectors: 0-0-5)', orderIndex: 3 },
          { id: 'opt-c5d', optionText: '* (Universal selector: 0-0-0)', orderIndex: 4 },
        ],
      },
    ],
  },
}

// Session store for assessment attempts: studentId -> Array of attempts
export const sessionAssessmentAttempts = new Map<string, any[]>()

export function getAssessmentAttempts(studentId: string, skillId?: string): any[] {
  const list = sessionAssessmentAttempts.get(studentId) || []
  if (!skillId) return list
  return list.filter(a => a.skillId === skillId || a.skill_id === skillId || a.skillName?.toLowerCase() === skillId.toLowerCase())
}

function resolveCanonicalAssessment(id: string) {
  if (CANONICAL_ASSESSMENTS[id]) return CANONICAL_ASSESSMENTS[id]
  const norm = id.toLowerCase()
  if (norm.includes('mongo')) return CANONICAL_ASSESSMENTS['assess-l1-mongodb-core']
  if (norm.includes('express')) return CANONICAL_ASSESSMENTS['assess-l1-express-core']
  if (norm.includes('auth') || norm.includes('security')) return CANONICAL_ASSESSMENTS['assess-l1-auth-security']
  if (norm.includes('deploy') || norm.includes('cloud') || norm.includes('docker')) return CANONICAL_ASSESSMENTS['assess-l1-deployment-cloud']
  if (norm.includes('dsa') || norm.includes('problem') || norm.includes('algorithm')) return CANONICAL_ASSESSMENTS['assess-l1-dsa-core']
  if (norm.includes('html')) return CANONICAL_ASSESSMENTS['assess-l1-html-basics']
  if (norm.includes('css')) return CANONICAL_ASSESSMENTS['assess-l1-css-layouts']
  if (norm.includes('react')) return CANONICAL_ASSESSMENTS['assess-l1-react-basics']
  if (norm.includes('sql') || norm.includes('database')) return CANONICAL_ASSESSMENTS['assess-l1-sql-indexing']
  if (norm.includes('rest') || norm.includes('api')) return CANONICAL_ASSESSMENTS['assess-l1-rest-design']
  if (norm.includes('git') || norm.includes('version')) return CANONICAL_ASSESSMENTS['assess-l1-git-workflows']
  if (norm.includes('js') || norm.includes('javascript')) return CANONICAL_ASSESSMENTS['assess-l1-javascript-core']
  if (norm.includes('node') || norm.includes('backend')) return CANONICAL_ASSESSMENTS['assess-l1-nodejs-loop']
  return CANONICAL_ASSESSMENTS['assess-l1-nodejs-loop']
}

/**
 * Starts an assessment attempt.
 * Returns questions WITHOUT is_correct flags.
 */
export async function startAssessment(
  studentId: string,
  assessmentId: string
): Promise<{ attemptId: string; title: string; skillName: string; timeLimit: number; questions: QuestionSafeView[] }> {
  const canonical = resolveCanonicalAssessment(assessmentId)
  let title = canonical.title
  let skillName = canonical.skillName
  let timeLimit = canonical.timeLimit
  let questions: QuestionSafeView[] = canonical.questions
  let attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

  try {
    const supabase = getSupabaseAdmin()
    if (supabase) {
      // 1. Fetch assessment details
      const { data: assessmentData } = await (supabase as any)
        .from('assessments')
        .select('id, title, time_limit, skill_id, skills(id, name)')
        .eq('id', assessmentId)
        .maybeSingle()

      if (assessmentData) {
        title = assessmentData.title || title
        skillName = assessmentData.skills?.name || skillName
        timeLimit = assessmentData.time_limit || timeLimit
      }

      // 2. Fetch questions and options (EXCLUDING is_correct)
      const { data: rawQuestions } = await (supabase as any)
        .from('assessment_questions')
        .select(`
          id, question_text, question_type, points, order_index,
          assessment_options(id, option_text, order_index)
        `)
        .eq('assessment_id', assessmentId)
        .order('order_index', { ascending: true })

      if (rawQuestions && rawQuestions.length > 0) {
        questions = rawQuestions.map((q: any) => ({
          id: q.id,
          questionText: q.question_text,
          questionType: q.question_type,
          points: q.points,
          orderIndex: q.order_index,
          options: (q.assessment_options || []).map((o: any) => ({
            id: o.id,
            optionText: o.option_text,
            orderIndex: o.order_index,
          })),
        }))
      }

      // 3. Create assessment_attempts row in Supabase
      const { data: attempt } = await (supabase as any)
        .from('assessment_attempts')
        .insert({
          assessment_id: assessmentId,
          student_id: studentId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle()

      if (attempt?.id) {
        attemptId = attempt.id
      }
    }
  } catch (error) {
    // Fall back to canonical assessment definition
  }

  return {
    attemptId,
    title,
    skillName,
    timeLimit,
    questions,
  }
}

/**
 * Submits an assessment and calculates the deterministic score, updates skill levels,
 * records reassessments, and produces explainable results.
 */
export async function submitAssessment(
  studentId: string,
  attemptId: string,
  assessmentId: string,
  submittedAnswers: { questionId: string; selectedOptionId: string }[]
): Promise<AssessmentAttemptResult> {
  const canonical = resolveCanonicalAssessment(assessmentId)
  let totalQuestions = Math.max(submittedAnswers.length, 1)
  let correctCount = 0

  const supabase = getSupabaseAdmin()

  // 1. Fetch real questions with is_correct from DB or use canonical answer keys
  const correctMap = new Map<string, string>()

  if (supabase) {
    try {
      const { data: dbOptions } = await (supabase as any)
        .from('assessment_options')
        .select('id, question_id, is_correct')
        .in(
          'question_id',
          submittedAnswers.map(a => a.questionId)
        )

      if (dbOptions && dbOptions.length > 0) {
        dbOptions.forEach((opt: any) => {
          if (opt.is_correct) {
            correctMap.set(opt.question_id, opt.id)
          }
        })
      }
    } catch {}
  }

  // Authoritative fallback correct mapping
  submittedAnswers.forEach(ans => {
    if (!correctMap.has(ans.questionId)) {
      const canonicalKey = AUTHORITATIVE_ANSWER_KEYS[ans.questionId]
      if (canonicalKey) {
        correctMap.set(ans.questionId, canonicalKey)
      }
    }
  })

  // Compare answers securely with server-side answer keys
  for (const ans of submittedAnswers) {
    const expected = correctMap.get(ans.questionId)
    const isCorrect = Boolean(expected && expected === ans.selectedOptionId)
    if (isCorrect) correctCount++

    // Record answer in database if real attempt row exists
    if (supabase && !attemptId.startsWith('attempt-')) {
      try {
        await (supabase as any).from('assessment_answers').upsert(
          {
            attempt_id: attemptId,
            question_id: ans.questionId,
            selected_option_id: ans.selectedOptionId,
            is_correct: isCorrect,
            points_earned: isCorrect ? 20 : 0,
            answered_at: new Date().toISOString(),
          },
          { onConflict: 'attempt_id,question_id' }
        )
      } catch {}
    }
  }

  // Calculate score (0 - 100)
  const score = normalizeScore((correctCount / totalQuestions) * 100)
  const passed = score >= 70

  // 2. Fetch previous score for skill
  let previousScore: number | null = null
  let skillId = canonical.skillId
  let skillName = canonical.skillName
  let title = canonical.title

  if (supabase) {
    try {
      const { data: assessmentData } = await (supabase as any)
        .from('assessments')
        .select('title, skill_id, skills(id, name)')
        .eq('id', assessmentId)
        .maybeSingle()

      if (assessmentData) {
        title = assessmentData.title || title
        skillId = assessmentData.skill_id || skillId
        skillName = assessmentData.skills?.name || skillName
      }

      if (skillId) {
        const { data: currentSkill } = await (supabase as any)
          .from('student_skills')
          .select('current_level')
          .eq('student_id', studentId)
          .eq('skill_id', skillId)
          .maybeSingle()

        if (currentSkill) {
          previousScore = currentSkill.current_level
        }
      }
    } catch {}
  }

  const improvement = previousScore !== null ? score - previousScore : 0

  // 3. Update database records: attempt status, student_skills, skill_scores, reassessments, progress_history
  try {
    if (!attemptId.startsWith('attempt-')) {
      await (supabase as any)
        .from('assessment_attempts')
        .update({
          score,
          percentage: score,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
    }

    if (skillId) {
      // Record in skill_scores
      await (supabase as any).from('skill_scores').insert({
        student_id: studentId,
        skill_id: skillId,
        score,
        source: 'assessment',
        recorded_at: new Date().toISOString(),
      })

      // Update student_skills with assessment_verified
      await (supabase as any).from('student_skills').upsert(
        {
          student_id: studentId,
          skill_id: skillId,
          current_level: score,
          verified_level: score,
          verification_status: 'assessment_verified',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,skill_id' }
      )

      // Record in reassessments if prior score existed
      if (previousScore !== null) {
        await (supabase as any).from('reassessments').insert({
          student_id: studentId,
          skill_id: skillId,
          previous_score: previousScore,
          new_score: score,
          recorded_at: new Date().toISOString(),
        })
      }

      // Record in progress_history
      await (supabase as any).from('progress_history').insert({
        student_id: studentId,
        skill_id: skillId,
        score,
        source: 'assessment',
        recorded_at: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.warn('Database update error in submitAssessment:', err)
  }

  // Record in memory attempt tracking
  const studentAttempts = sessionAssessmentAttempts.get(studentId) || []
  const matchingSkillAttempts = studentAttempts.filter(a => a.skillId === skillId)
  const attemptNumber = matchingSkillAttempts.length + 1

  const attemptRecord = {
    id: attemptId,
    studentId,
    skillId,
    skillName,
    title,
    assessmentId,
    score,
    percentage: score,
    passed,
    attemptNumber,
    previousScore,
    improvement,
    verificationLevel: 'assessment_verified',
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
  studentAttempts.push(attemptRecord)
  sessionAssessmentAttempts.set(studentId, studentAttempts)

  // 4. Generate explainable assessment summary
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (score >= 80) {
    strengths.push(`Strong grasp of core ${skillName} architectural concepts.`)
    strengths.push(`Demonstrated mastery of standard conventions and practical problem solving.`)
  } else if (score >= 60) {
    strengths.push(`Solid understanding of foundational ${skillName} concepts and workflows.`)
    weaknesses.push(`Review edge cases and advanced design patterns.`)
  } else {
    weaknesses.push(`Fundamental ${skillName} core mechanics need dedicated review.`)
    weaknesses.push(`Practice hands-on exercises before attempting re-certification.`)
  }

  const careerImpact = improvement >= 0
    ? `Your verified ${skillName} score is ${score}%, advancing your authenticated readiness.`
    : `Your ${skillName} score is ${Math.abs(improvement)} points below your previous benchmark. We recommend reviewing weak areas before re-testing.`

  const nextStep = score >= 70
    ? `Great job! Your ${skillName} competency is now Assessment Verified on your SkillBridge profile.`
    : `Complete targeted exercises on ${skillName} core patterns to close remaining gaps before reassessing.`

  return {
    attemptId,
    assessmentId,
    skillId,
    title,
    skillName,
    totalQuestions,
    correctCount,
    score,
    percentage: score,
    passed,
    verifiedLevel: score,
    verificationStatus: 'assessment_verified',
    attemptNumber,
    previousScore,
    improvement,
    explanationSummary: {
      strengths,
      weaknesses,
      careerImpact,
      nextStep,
    },
  }
}
