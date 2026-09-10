import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'
import { sessionSkills } from './studentController.js'

// Persistent in-memory session caches for zero-crash fallback guarantees
export const sessionVerificationRequests = new Map<string, any>()
export const sessionVerificationSessions = new Map<string, any>()
export const sessionAcademicTests = new Map<string, any>()
export const sessionSkillVerifications = new Map<string, any>()

export const PRESET_ACADEMICIANS = [
  {
    id: 'fac-01-sarah-mitchell',
    profile_id: 'fac-01-sarah-mitchell',
    full_name: 'Dr. Sarah Mitchell',
    title: 'Associate Professor & Dept. Chair',
    institution_name: 'Delhi Technological University (DTU)',
    department: 'Computer Science & Engineering',
    expertise_skills: ['React', 'Node.js', 'Web Architecture', 'Full Stack Development', 'TypeScript'],
    availability: 'Mon - Thu, 10:00 AM - 4:00 PM IST',
    verified_count: 48,
    avatar_url: null,
  },
  {
    id: 'fac-02-rajesh-raman',
    profile_id: 'fac-02-rajesh-raman',
    full_name: 'Prof. Rajesh Raman',
    title: 'Professor & Head of Systems Lab',
    institution_name: 'Indian Institute of Technology (IIT Delhi)',
    department: 'Information Technology',
    expertise_skills: ['Java', 'Spring Boot', 'SQL', 'Distributed Systems', 'Microservices'],
    availability: 'Mon, Wed, Fri, 2:00 PM - 6:00 PM IST',
    verified_count: 62,
    avatar_url: null,
  },
  {
    id: 'fac-03-ananya-sen',
    profile_id: 'fac-03-ananya-sen',
    full_name: 'Dr. Ananya Sen',
    title: 'Lead AI/ML Faculty Fellow',
    institution_name: 'IIIT Hyderabad',
    department: 'Data Science & Artificial Intelligence',
    expertise_skills: ['Python', 'Machine Learning', 'Data Structures', 'SQL', 'Statistical Modeling'],
    availability: 'Tue, Thu, Sat, 11:00 AM - 5:00 PM IST',
    verified_count: 35,
    avatar_url: null,
  },
  {
    id: 'fac-04-david-chen',
    profile_id: 'fac-04-david-chen',
    full_name: 'Dr. David Chen',
    title: 'Faculty of Cloud & DevOps Infrastructure',
    institution_name: 'National University of Singapore',
    department: 'Cloud Systems & Networks',
    expertise_skills: ['Docker', 'Kubernetes', 'Cloud Infrastructure', 'CI/CD Pipelines', 'Linux'],
    availability: 'Wed & Fri, 1:00 PM - 5:00 PM SGT',
    verified_count: 29,
    avatar_url: null,
  },
]

export const PRESET_SKILL_TESTS: Record<string, any> = {
  react: {
    skillName: 'React',
    difficulty: 'Intermediate / Production',
    passingScore: 75,
    questions: [
      {
        id: 'q-react-1',
        type: 'conceptual',
        questionText: 'How does React 19 handle optimistic state updates, and how does `useActionState` compare with standard `useState`?',
        options: [
          'It synchronizes synchronous UI with server mutations and automatically reverts on rejection',
          'It replaces the React Virtual DOM with web components',
          'It only works inside pure client-rendered static pages',
          'It disables browser event propagation',
        ],
        correctAnswer: 'It synchronizes synchronous UI with server mutations and automatically reverts on rejection',
        explanation: '`useActionState` manages pending states and rollback of optimistic UI during async transitions.',
        points: 25,
      },
      {
        id: 'q-react-2',
        type: 'practical',
        questionText: 'In a component with complex sub-trees, what is the correct strategy to prevent redundant re-renders when passing callbacks?',
        options: [
          'Memoize callbacks with `useCallback` and ensure dependencies are immutable or stable',
          'Call `forceUpdate` in the parent component',
          'Store all callbacks in the DOM dataset attribute',
          'Declare callbacks inside `useEffect` with an empty dependency array',
        ],
        correctAnswer: 'Memoize callbacks with `useCallback` and ensure dependencies are immutable or stable',
        explanation: 'Stable references via `useCallback` prevent pure child components wrapped in `React.memo` from re-rendering.',
        points: 25,
      },
      {
        id: 'q-react-3',
        type: 'debugging',
        questionText: 'A useEffect hook runs on every render causing an infinite loop. What is the most common architectural defect?',
        options: [
          'An object or array created inline inside render is listed in the dependency array without memoization',
          'The component does not use Redux',
          'The JSX tag was not self-closing',
          'React strict mode was turned off',
        ],
        correctAnswer: 'An object or array created inline inside render is listed in the dependency array without memoization',
        explanation: 'Inline objects create a new reference on each render, tripping shallow reference equality in the dependency array.',
        points: 25,
      },
      {
        id: 'q-react-4',
        type: 'project_based',
        questionText: 'When designing a scalable design system component (e.g., Modal or Accordion), how should state be shared cleanly with child sub-components?',
        options: [
          'Using React Context with compound components pattern',
          'Global window variables',
          'Direct DOM querySelectors inside useEffect',
          'Deep props drilling through 10 component layers',
        ],
        correctAnswer: 'Using React Context with compound components pattern',
        explanation: 'Compound components with Context provide declarative, flexible, and decoupled state sharing.',
        points: 25,
      },
    ],
  },
  python: {
    skillName: 'Python',
    difficulty: 'Intermediate',
    passingScore: 75,
    questions: [
      {
        id: 'q-py-1',
        type: 'conceptual',
        questionText: 'What is the Global Interpreter Lock (GIL) in CPython and how does it influence concurrency?',
        options: [
          'A mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecodes simultaneously',
          'A security firewall for network sockets',
          'A hardware driver for GPU acceleration',
          'A memory leak prevention algorithm in Pandas',
        ],
        correctAnswer: 'A mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecodes simultaneously',
        explanation: 'The GIL ensures thread-safe memory management in CPython but restricts CPU-bound tasks in standard threading.',
        points: 25,
      },
      {
        id: 'q-py-2',
        type: 'practical',
        questionText: 'What is the key advantage of using a generator expression or `yield` over returning a standard list for large datasets?',
        options: [
          'Memory efficiency via lazy evaluation (evaluates item-by-item without allocating memory for the entire sequence)',
          'It compiles the code into WebAssembly',
          'It makes the code run 100x faster regardless of memory',
          'It automatically parallelizes across GPU cores',
        ],
        correctAnswer: 'Memory efficiency via lazy evaluation (evaluates item-by-item without allocating memory for the entire sequence)',
        explanation: 'Generators produce values on demand, enabling processing of massive datasets that would exceed memory limits.',
        points: 25,
      },
      {
        id: 'q-py-3',
        type: 'debugging',
        questionText: 'Why is defining a mutable default argument like `def append_item(item, items=[])` dangerous in Python?',
        options: [
          'The default list is instantiated once when the function is defined and shared across all subsequent invocations',
          'It raises a SyntaxError at compile time',
          'It causes garbage collection to hang',
          'It turns the function into an asynchronous coroutine',
        ],
        correctAnswer: 'The default list is instantiated once when the function is defined and shared across all subsequent invocations',
        explanation: 'Default arguments are evaluated once at definition time, causing mutable objects to retain state across calls.',
        points: 25,
      },
      {
        id: 'q-py-4',
        type: 'project_based',
        questionText: 'In a production FastAPI service, what mechanism should be used to handle database connection pooling and graceful cleanup per request?',
        options: [
          'Dependency injection with `yield` in async context managers',
          'Global static dictionaries',
          'Re-instantiating raw TCP connections in every route function without pooling',
          'Cron jobs that restart the process every minute',
        ],
        correctAnswer: 'Dependency injection with `yield` in async context managers',
        explanation: 'FastAPI dependency injection with yield guarantees proper session acquisition and cleanup even on errors.',
        points: 25,
      },
    ],
  },
  java: {
    skillName: 'Java',
    difficulty: 'Intermediate',
    passingScore: 75,
    questions: [
      {
        id: 'q-java-1',
        type: 'conceptual',
        questionText: 'What is the primary difference between `Comparable` and `Comparator` in Java?',
        options: [
          'Comparable defines the natural ordering on the class itself (`compareTo`), while Comparator provides external custom ordering (`compare`)',
          'Comparable is only for primitive types while Comparator is for objects',
          'Comparable is deprecated in Java 21',
          'Comparator can only be used with HashMaps',
        ],
        correctAnswer: 'Comparable defines the natural ordering on the class itself (`compareTo`), while Comparator provides external custom ordering (`compare`)',
        explanation: 'Comparable provides internal natural sorting; Comparator provides decoupled, flexible custom sorting strategies.',
        points: 25,
      },
      {
        id: 'q-java-2',
        type: 'practical',
        questionText: 'In Spring Boot, what is the role of `@Transactional` and what happens when an unchecked `RuntimeException` is thrown?',
        options: [
          'It manages database transaction boundaries and automatically rolls back on unchecked RuntimeExceptions',
          'It encrypts database network packets',
          'It commits the transaction regardless of errors',
          'It turns the method into an asynchronous thread pool',
        ],
        correctAnswer: 'It manages database transaction boundaries and automatically rolls back on unchecked RuntimeExceptions',
        explanation: 'Spring transaction interceptors roll back on RuntimeException / Error by default.',
        points: 25,
      },
      {
        id: 'q-java-3',
        type: 'debugging',
        questionText: 'A Java application experiences high latency and `OutOfMemoryError: Java heap space`. What is the first diagnostic step?',
        options: [
          'Capture and analyze a heap dump using a memory profiler (e.g. VisualVM / JProfiler / Eclipse MAT) to identify memory leaks',
          'Reboot the operating system without checking logs',
          'Delete the JDK installation',
          'Convert all classes to static methods',
        ],
        correctAnswer: 'Capture and analyze a heap dump using a memory profiler (e.g. VisualVM / JProfiler / Eclipse MAT) to identify memory leaks',
        explanation: 'Heap dump analysis reveals dominant object references and lingering memory retention chains.',
        points: 25,
      },
      {
        id: 'q-java-4',
        type: 'project_based',
        questionText: 'How do Virtual Threads in Java 21 (Project Loom) improve the throughput of I/O-heavy server applications?',
        options: [
          'They allow lightweight user-mode threads unmounted from carrier OS threads during blocking I/O operations',
          'They bypass the JVM bytecode compiler',
          'They replace SQL databases with files',
          'They run Java code directly in the CPU L1 cache',
        ],
        correctAnswer: 'They allow lightweight user-mode threads unmounted from carrier OS threads during blocking I/O operations',
        explanation: 'Virtual threads preserve simple synchronous code structure with near-zero OS thread overhead during blocking I/O.',
        points: 25,
      },
    ],
  },
  sql: {
    skillName: 'SQL',
    difficulty: 'Intermediate',
    passingScore: 75,
    questions: [
      {
        id: 'q-sql-1',
        type: 'conceptual',
        questionText: 'What is the critical distinction between `WHERE` and `HAVING` clauses?',
        options: [
          '`WHERE` filters rows before aggregation, while `HAVING` filters aggregated groups after `GROUP BY`',
          '`HAVING` can only be used with string columns',
          '`WHERE` is only available in SQLite',
          '`HAVING` is executed before table joins',
        ],
        correctAnswer: '`WHERE` filters rows before aggregation, while `HAVING` filters aggregated groups after `GROUP BY`',
        explanation: 'WHERE acts on individual row predicates; HAVING acts on group aggregate values like SUM() or COUNT().',
        points: 25,
      },
      {
        id: 'q-sql-2',
        type: 'practical',
        questionText: 'In PostgreSQL or MySQL, what index type is best suited for equality and range queries on a date/timestamp column?',
        options: [
          'B-Tree Index',
          'Hash Index',
          'Full-Text Index',
          'Spatial Index',
        ],
        correctAnswer: 'B-Tree Index',
        explanation: 'B-Tree indices maintain sorted leaf nodes, making them optimal for both equality and range scans (<, >, BETWEEN).',
        points: 25,
      },
      {
        id: 'q-sql-3',
        type: 'debugging',
        questionText: 'A query with `SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.status = \'shipped\'` inadvertently drops users with zero orders. Why?',
        options: [
          'The `WHERE o.status = \'shipped\'` filter converts the outer join into an inner join because null outer rows fail the condition',
          'LEFT JOIN is not supported in relational databases',
          'The table has duplicate primary keys',
          'The database ran out of disk space',
        ],
        correctAnswer: 'The `WHERE o.status = \'shipped\'` filter converts the outer join into an inner join because null outer rows fail the condition',
        explanation: 'Filtering a right-table column in the WHERE clause removes the NULL-padded rows from the LEFT JOIN.',
        points: 25,
      },
      {
        id: 'q-sql-4',
        type: 'project_based',
        questionText: 'What SQL construct provides the cleanest way to assign ranked positions to students partitioned by department?',
        options: [
          'Window function: `DENSE_RANK() OVER (PARTITION BY department_id ORDER BY score DESC)`',
          'Self-joining the table 10 times in a nested subquery',
          'Exporting to CSV and sorting in Excel',
          'Using `GROUP BY department_id` with `RAND()`',
        ],
        correctAnswer: 'Window function: `DENSE_RANK() OVER (PARTITION BY department_id ORDER BY score DESC)`',
        explanation: 'Window ranking functions compute rank across designated partitions without collapsing row details.',
        points: 25,
      },
    ],
  },
}

// ─── Controller Handlers ─────────────────────────────────────────────────────

export async function getAvailableAcademicians(req: AuthenticatedRequest, res: Response) {
  try {
    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('academician_profiles')
          .select('profile_id, institution_id, department, title, expertise_skills, profiles(full_name, avatar_url, email), institutions(name)')
        
        if (!error && data && data.length > 0) {
          const formatted = data.map((d: any) => ({
            id: d.profile_id,
            profile_id: d.profile_id,
            full_name: d.profiles?.full_name || 'Faculty Member',
            title: d.title || 'Faculty Reviewer',
            institution_name: d.institutions?.name || 'Partner Academic Institution',
            department: d.department || 'Computer Science',
            expertise_skills: d.expertise_skills || ['Full Stack', 'Software Engineering'],
            availability: 'Mon - Fri, 10:00 AM - 4:00 PM IST',
            verified_count: 24,
            avatar_url: d.profiles?.avatar_url || null,
          }))
          return res.status(200).json({ success: true, data: formatted })
        }
      } catch {}
    }

    return res.status(200).json({ success: true, data: PRESET_ACADEMICIANS })
  } catch (err: any) {
    return res.status(200).json({ success: true, data: PRESET_ACADEMICIANS })
  }
}

export async function createVerificationRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const {
      skill_name,
      skill_id,
      academician_id,
      supporting_evidence = [],
      student_notes = '',
    } = req.body || {}

    if (!skill_name) {
      return res.status(400).json({ success: false, error: 'skill_name is required' })
    }

    const assignedAcademician = PRESET_ACADEMICIANS.find(a => a.id === academician_id || a.profile_id === academician_id) || PRESET_ACADEMICIANS[0]

    // Fetch student's current assessed score for this skill
    let currentScore = 75
    let assessmentScore = 75
    if (sessionSkills.has(user.id)) {
      const userSkills = sessionSkills.get(user.id)!
      for (const s of userSkills.values()) {
        if (s.skills?.name?.toLowerCase() === skill_name.toLowerCase() || s.skill_name?.toLowerCase() === skill_name.toLowerCase()) {
          currentScore = s.current_level || s.verified_level || 75
          assessmentScore = s.verified_level || s.current_level || 75
          break
        }
      }
    }

    const requestId = `vr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    const newRequest = {
      id: requestId,
      student_id: user.id,
      student_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
      student_email: user.email || '',
      academician_id: assignedAcademician.id,
      academician_name: assignedAcademician.full_name,
      academician_institution: assignedAcademician.institution_name,
      academician_department: assignedAcademician.department,
      skill_id: skill_id || `skill-${skill_name.toLowerCase()}`,
      skill_name,
      current_skill_score: currentScore,
      assessment_score: assessmentScore,
      status: 'request_sent',
      supporting_evidence: Array.isArray(supporting_evidence) ? supporting_evidence : [],
      student_notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    sessionVerificationRequests.set(requestId, newRequest)

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        await supabase.from('verification_requests').insert({
          id: requestId,
          student_id: user.id,
          academician_id: assignedAcademician.profile_id,
          skill_name,
          status: 'request_sent',
          supporting_evidence: newRequest.supporting_evidence,
        })

        // Notify academician
        await supabase.from('notifications').insert({
          user_id: assignedAcademician.profile_id,
          title: 'New Skill Verification Request',
          message: `${newRequest.student_name} requested verification for ${skill_name}.`,
          type: 'verification',
          link: '/academia/verification',
        })
      } catch {}
    }

    return res.status(201).json({ success: true, data: newRequest })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to submit verification request' })
  }
}

export async function getStudentVerificationRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .select('*, verification_sessions(*)')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          return res.status(200).json({ success: true, data })
        }
      } catch {}
    }

    const userRequests = Array.from(sessionVerificationRequests.values())
      .filter(r => r.student_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Attach session details if scheduled
    const enriched = userRequests.map(r => {
      const session = sessionVerificationSessions.get(r.id)
      return {
        ...r,
        session: session || null,
      }
    })

    return res.status(200).json({ success: true, data: enriched })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch verification requests' })
  }
}

export async function getAcademicianVerificationRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .select('*, profiles:student_id(full_name, email, avatar_url), verification_sessions(*)')
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          return res.status(200).json({ success: true, data })
        }
      } catch {}
    }

    // In-memory or demo fallback
    const allRequests = Array.from(sessionVerificationRequests.values())
      .map(r => ({
        ...r,
        session: sessionVerificationSessions.get(r.id) || null,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return res.status(200).json({ success: true, data: allRequests })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch verification requests' })
  }
}

export async function acceptVerificationRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id)
    const request = sessionVerificationRequests.get(id)
    if (!request) {
      return res.status(404).json({ success: false, error: 'Verification request not found' })
    }

    request.status = 'accepted'
    request.updated_at = new Date().toISOString()
    sessionVerificationRequests.set(id, request)

    // Automatically seed academic test if not already present
    const testKey = request.skill_name.toLowerCase()
    const testTemplate = PRESET_SKILL_TESTS[testKey] || PRESET_SKILL_TESTS.react
    const testId = `test-${id}`
    sessionAcademicTests.set(id, {
      id: testId,
      request_id: id,
      skill_name: request.skill_name,
      difficulty: testTemplate.difficulty,
      passing_score: testTemplate.passingScore,
      questions: testTemplate.questions,
    })

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        await supabase
          .from('verification_requests')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', id)

        await supabase.from('notifications').insert({
          user_id: request.student_id,
          title: 'Verification Request Accepted',
          message: `Your verification request for ${request.skill_name} was accepted. A verification session will be scheduled shortly.`,
          type: 'verification',
          link: '/student/verification',
        })
      } catch {}
    }

    return res.status(200).json({ success: true, data: request })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to accept verification request' })
  }
}

export async function scheduleVerificationSession(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id)
    const {
      scheduled_at,
      duration_minutes = 30,
      verification_methods = ['live_video', 'skill_test'],
      meeting_link,
      verification_notes = '',
    } = req.body || {}

    const request = sessionVerificationRequests.get(id)
    if (!request) {
      return res.status(404).json({ success: false, error: 'Verification request not found' })
    }

    if (!scheduled_at) {
      return res.status(400).json({ success: false, error: 'scheduled_at is required' })
    }

    const sessionId = `vs-${id}`
    const sessionRecord = {
      id: sessionId,
      request_id: id,
      scheduled_at,
      duration_minutes: Number(duration_minutes),
      verification_methods,
      meeting_link: meeting_link || `/verification/room/${id}`,
      verification_notes,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    sessionVerificationSessions.set(id, sessionRecord)

    request.status = 'scheduled'
    request.updated_at = new Date().toISOString()
    sessionVerificationRequests.set(id, request)

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        await supabase.from('verification_sessions').upsert({
          id: sessionId,
          request_id: id,
          scheduled_at,
          duration_minutes: Number(duration_minutes),
          verification_methods,
          meeting_link: sessionRecord.meeting_link,
          verification_notes,
          status: 'scheduled',
        }, { onConflict: 'id' })

        await supabase
          .from('verification_requests')
          .update({ status: 'scheduled', updated_at: new Date().toISOString() })
          .eq('id', id)

        await supabase.from('notifications').insert({
          user_id: request.student_id,
          title: 'Verification Session Scheduled',
          message: `Your verification session for ${request.skill_name} is scheduled for ${new Date(scheduled_at).toLocaleString()}.`,
          type: 'verification',
          link: '/student/verification',
        })
      } catch {}
    }

    return res.status(200).json({
      success: true,
      data: {
        request,
        session: sessionRecord,
      },
    })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to schedule verification session' })
  }
}

export async function saveVerificationNotes(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id)
    const { notes } = req.body || {}

    const session = sessionVerificationSessions.get(id) || {
      id: `vs-${id}`,
      request_id: id,
      scheduled_at: new Date().toISOString(),
      duration_minutes: 30,
      verification_methods: ['live_video', 'skill_test'],
      meeting_link: `/verification/room/${id}`,
      status: 'in_progress',
    }

    session.verification_notes = notes || ''
    session.updated_at = new Date().toISOString()
    sessionVerificationSessions.set(id, session)

    const request = sessionVerificationRequests.get(id)
    if (request && request.status === 'scheduled') {
      request.status = 'in_progress'
      sessionVerificationRequests.set(id, request)
    }

    return res.status(200).json({ success: true, data: session })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to save verification notes' })
  }
}

export async function getAcademicTest(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id)
    let test = sessionAcademicTests.get(id)

    if (!test) {
      const request = sessionVerificationRequests.get(id)
      const skillKey = (request?.skill_name || 'react').toLowerCase()
      const template = PRESET_SKILL_TESTS[skillKey] || PRESET_SKILL_TESTS.react

      test = {
        id: `test-${id}`,
        request_id: id,
        skill_name: request?.skill_name || 'React',
        difficulty: template.difficulty,
        passing_score: template.passingScore,
        questions: template.questions,
      }
      sessionAcademicTests.set(id, test)
    }

    // Mask correct answers if student is requesting
    const sanitizedQuestions = test.questions.map((q: any) => ({
      id: q.id,
      type: q.type,
      questionText: q.questionText,
      options: q.options,
      points: q.points,
    }))

    return res.status(200).json({
      success: true,
      data: {
        ...test,
        questions: sanitizedQuestions,
      },
    })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch academic test' })
  }
}

export async function submitAcademicTest(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id)
    const { answers = {} } = req.body || {}

    const request = sessionVerificationRequests.get(id)
    const skillKey = (request?.skill_name || 'react').toLowerCase()
    const template = PRESET_SKILL_TESTS[skillKey] || PRESET_SKILL_TESTS.react

    let correctCount = 0
    const detailedReview: any[] = []

    template.questions.forEach((q: any) => {
      const studentAns = answers[q.id]
      const isCorrect = studentAns && studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      if (isCorrect) correctCount++

      detailedReview.push({
        questionId: q.id,
        questionText: q.questionText,
        studentAnswer: studentAns || 'Unanswered',
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      })
    })

    const totalQuestions = template.questions.length || 4
    const score = Math.round((correctCount / totalQuestions) * 100)
    const passed = score >= template.passingScore

    const attempt = {
      id: `att-${Date.now()}`,
      request_id: id,
      student_id: req.user?.id || 'student',
      score,
      passed,
      answers,
      review: detailedReview,
      submitted_at: new Date().toISOString(),
    }

    // Cache test score on request
    if (request) {
      request.academic_test_score = score
      sessionVerificationRequests.set(id, request)
    }

    return res.status(200).json({ success: true, data: attempt })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to submit test' })
  }
}

export async function completeVerificationDecision(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const id = String(req.params.id)
    const {
      decision, // 'VERIFY' | 'REJECT' | 'REASSESSMENT'
      rejection_reason,
      rejection_feedback,
      verification_notes = '',
      evidence_score = 85,
      platform_assessment_score = 80,
      academic_test_score = 85,
    } = req.body || {}

    const request = sessionVerificationRequests.get(id)
    if (!request) {
      return res.status(404).json({ success: false, error: 'Verification request not found' })
    }

    const studentId = request.student_id
    const skillName = request.skill_name

    if (decision === 'VERIFY') {
      request.status = 'verified'
      request.updated_at = new Date().toISOString()
      sessionVerificationRequests.set(id, request)

      // Store authoritative verification record
      const verificationRecord = {
        id: `ver-${id}`,
        request_id: id,
        student_id: studentId,
        academician_id: user.id,
        academician_name: user.user_metadata?.full_name || 'Academician',
        skill_name: skillName,
        verified_at: new Date().toISOString(),
        verification_method: 'Live Video Verification + Academic Skill Test',
        academic_test_score: Number(academic_test_score),
        evidence_score: Number(evidence_score),
        platform_assessment_score: Number(platform_assessment_score),
        verification_notes: verification_notes || request.verification_notes || '',
        evidence_reviewed: request.supporting_evidence || [],
        verification_status: 'academically_verified',
      }
      sessionSkillVerifications.set(`${studentId}:${skillName.toLowerCase()}`, verificationRecord)

      // Update student's skill in sessionSkills Map to academically_verified
      if (!sessionSkills.has(studentId)) sessionSkills.set(studentId, new Map())
      const userSkills = sessionSkills.get(studentId)!
      
      let matchedSkillId = request.skill_id
      let existingSkillRecord = userSkills.get(matchedSkillId)

      if (!existingSkillRecord) {
        for (const [sId, sRec] of userSkills.entries()) {
          if (sRec.skills?.name?.toLowerCase() === skillName.toLowerCase() || sRec.skill_name?.toLowerCase() === skillName.toLowerCase()) {
            matchedSkillId = sId
            existingSkillRecord = sRec
            break
          }
        }
      }

      const finalLevel = Math.max(
        Number(academic_test_score || 85),
        existingSkillRecord?.current_level || 75
      )

      const updatedRecord = {
        id: existingSkillRecord?.id || `ss-${Date.now()}`,
        student_id: studentId,
        skill_id: matchedSkillId,
        self_declared_level: existingSkillRecord?.self_declared_level || 80,
        current_level: finalLevel,
        verified_level: finalLevel,
        verification_status: 'academically_verified',
        skills: {
          id: matchedSkillId,
          name: skillName,
          category: existingSkillRecord?.skills?.category || 'Technical',
        },
      }
      userSkills.set(matchedSkillId, updatedRecord)

      // Database write
      const supabase = getSupabaseAdmin()
      if (supabase) {
        try {
          await supabase
            .from('verification_requests')
            .update({ status: 'verified', updated_at: new Date().toISOString() })
            .eq('id', id)

          await supabase.from('skill_verifications').upsert({
            request_id: id,
            student_id: studentId,
            academician_id: user.id,
            skill_name: skillName,
            verified_at: new Date().toISOString(),
            verification_method: 'Live Video Verification + Skill Test',
            academic_test_score: Number(academic_test_score),
            evidence_score: Number(evidence_score),
            platform_assessment_score: Number(platform_assessment_score),
            verification_notes,
            verification_status: 'academically_verified',
          }, { onConflict: 'student_id,skill_name' })

          await supabase.from('student_skills').upsert({
            student_id: studentId,
            skill_id: matchedSkillId,
            current_level: finalLevel,
            verified_level: finalLevel,
            verification_status: 'academically_verified',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'student_id,skill_id' })

          // Send celebratory notification to student
          await supabase.from('notifications').insert({
            user_id: studentId,
            title: `Skill Verified: ${skillName}`,
            message: `Congratulations! ${skillName} has been officially verified by ${verificationRecord.academician_name} with an Academic Test Score of ${academic_test_score}%.`,
            type: 'verification',
            link: '/student/skills',
          })
        } catch {}
      }

      return res.status(200).json({
        success: true,
        data: {
          status: 'verified',
          verification: verificationRecord,
          updatedSkill: updatedRecord,
        },
      })
    } else {
      // Rejection or Re-assessment
      const newStatus = decision === 'REASSESSMENT' ? 'reassessment_required' : 'rejected'
      request.status = newStatus
      request.rejection_reason = rejection_reason || 'Insufficient practical evidence demonstrated'
      request.rejection_feedback = rejection_feedback || 'Focus on building end-to-end practical projects and review foundational debugging before requesting re-verification.'
      request.updated_at = new Date().toISOString()
      sessionVerificationRequests.set(id, request)

      const supabase = getSupabaseAdmin()
      if (supabase) {
        try {
          await supabase
            .from('verification_requests')
            .update({
              status: newStatus,
              rejection_reason: request.rejection_reason,
              rejection_feedback: request.rejection_feedback,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)

          await supabase.from('notifications').insert({
            user_id: studentId,
            title: `Verification Update: ${skillName}`,
            message: `Verification ${newStatus === 'reassessment_required' ? 'requires re-assessment' : 'not approved'}: ${request.rejection_reason}. Click to improve this skill with your AI Coach.`,
            type: 'reassessment',
            link: `/student/ai-coach?skill=${encodeURIComponent(skillName)}`,
          })
        } catch {}
      }

      return res.status(200).json({
        success: true,
        data: {
          status: newStatus,
          request,
          aiCoachRoute: `/student/ai-coach?skill=${encodeURIComponent(skillName)}`,
        },
      })
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to finalize verification decision' })
  }
}
