/**
 * Comprehensive End-to-End Automated Test for Academician Skill Verification Test Feature
 */

const http = require('http')

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })
    req.on('error', reject)
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body))
    }
    req.end()
  })
}

async function runSkillTestFlowCompleteTest() {
  console.log('================================================================')
  console.log('SKILLBRIDGE ACADEMICIAN SKILL TEST FLOW COMPLETE VERIFICATION')
  console.log('================================================================\n')

  const studentHeaders = {
    'Content-Type': 'application/json',
    'x-demo-mode': 'true',
    'x-demo-role': 'student',
    'x-user-id': 'student-test-arib-99',
  }

  const academiaHeaders = {
    'Content-Type': 'application/json',
    'x-demo-mode': 'true',
    'x-demo-role': 'academician',
    'x-user-id': 'fac-01-sarah-mitchell',
  }

  let passed = 0
  let failed = 0

  // ─── STEP 1: STUDENT SUBMITS "React" VERIFICATION REQUEST ─────────────────
  console.log('--- STEP 1: Student Submits "React" Verification Request ---')
  const submitRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/request',
    method: 'POST',
    headers: studentHeaders,
  }, {
    skill_name: 'React',
    claimed_level: 'Strong (80-89)',
    score: 85,
    description: 'Built high-scale Next.js dashboard with server components and state management.',
    project_title: 'Enterprise Analytics Dashboard',
    project_url: 'https://github.com/student/react-enterprise-app',
    tech_stack: 'React, Next.js, TypeScript',
    supporting_evidence: [
      { title: 'GitHub Repo', type: 'github_repo', url: 'https://github.com/student/react-enterprise-app', description: 'Production source code' }
    ],
    academician_id: 'fac-01-sarah-mitchell',
  })

  console.log(`Submit Status: ${submitRes.status}`)
  const requestId = submitRes.body?.data?.id
  console.log(`Created Request ID: ${requestId}, Status: ${submitRes.body?.data?.status}`)

  if (submitRes.status === 201 && submitRes.body?.success && submitRes.body?.data?.status === 'pending') {
    console.log('✅ PASS: React verification request created with status PENDING.')
    passed++
  } else {
    console.error('❌ FAIL: Expected 201 with status pending, got:', submitRes)
    failed++
  }

  // ─── STEP 2: ACADEMICIAN INBOX RETRIEVAL ───────────────────────────────────
  console.log('\n--- STEP 2: Academician Retrieves Verification Inbox ---')
  const inboxRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/academician/requests',
    method: 'GET',
    headers: academiaHeaders,
  })

  const reqFound = (inboxRes.body?.data || []).find(r => r.id === requestId)
  console.log(`Inbox Status: ${inboxRes.status}, Ticket Found: ${!!reqFound}`)

  if (inboxRes.status === 200 && reqFound) {
    console.log('✅ PASS: Academician sees pending request in queue.')
    passed++
  } else {
    console.error('❌ FAIL: Academician could not find request:', inboxRes)
    failed++
  }

  // ─── STEP 3: ACADEMICIAN SENDS CUSTOM SKILL TEST ──────────────────────────
  console.log('\n--- STEP 3: Academician Creates and Assigns Skill Test ---')
  const testPayload = {
    title: 'React Architecture & Performance Screening',
    instructions: 'Complete all practical implementation tasks demonstrating React 19 hooks and state management.',
    test_type: 'mixed',
    difficulty: 'intermediate',
    duration_minutes: 45,
    passing_score: 75,
    verification_methods: ['assignment_only', 'live_video'],
    questions: [
      {
        id: 'q-react-01',
        type: 'conceptual',
        questionText: 'How does React 19 handle optimistic updates?',
        options: [
          'It automatically reverts on async rejection with useActionState',
          'It replaces Virtual DOM with Web Components',
          'It only works in static pages',
        ],
        correctAnswer: 'It automatically reverts on async rejection with useActionState',
        points: 50,
      },
      {
        id: 'q-react-02',
        type: 'practical',
        questionText: 'How do you prevent redundant re-renders when passing callbacks to React.memo children?',
        options: [
          'Memoize callbacks with useCallback and ensure stable dependencies',
          'Call forceUpdate on parent',
        ],
        correctAnswer: 'Memoize callbacks with useCallback and ensure stable dependencies',
        points: 50,
      },
    ],
  }

  const sendTestRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/verification/requests/${requestId}/test`,
    method: 'POST',
    headers: academiaHeaders,
  }, testPayload)

  console.log(`Send Test Status: ${sendTestRes.status}, Request Status: ${sendTestRes.body?.request?.status}`)
  if (sendTestRes.status === 201 && sendTestRes.body?.success && sendTestRes.body?.request?.status === 'test_sent') {
    console.log('✅ PASS: Academician successfully assigned skill test; status transitioned to TEST_SENT.')
    passed++
  } else {
    console.error('❌ FAIL: Expected 201 with status test_sent, got:', sendTestRes)
    failed++
  }

  // ─── STEP 4: STUDENT RETRIEVES ASSIGNED TEST (SECURITY: NO ANSWER LEAKS) ──
  console.log('\n--- STEP 4: Student Fetches Assigned Test (Security Validation) ---')
  const studentTestRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/verification/requests/${requestId}/test`,
    method: 'GET',
    headers: studentHeaders,
  })

  const studentQuestions = studentTestRes.body?.data?.questions || []
  const hasLeakedAnswers = studentQuestions.some(q => q.correctAnswer || q.correct_answer || q.explanation)
  console.log(`Student Test Status: ${studentTestRes.status}, Question Count: ${studentQuestions.length}, Answers Leaked: ${hasLeakedAnswers}`)

  if (studentTestRes.status === 200 && studentQuestions.length === 2 && !hasLeakedAnswers) {
    console.log('✅ PASS: Student receives test tasks with correct answers securely masked.')
    passed++
  } else {
    console.error('❌ FAIL: Security check failed or questions missing:', studentTestRes)
    failed++
  }

  // ─── STEP 5: STUDENT SUBMITS TEST ATTEMPT ─────────────────────────────────
  console.log('\n--- STEP 5: Student Submits Test Attempt ---')
  const submitAttemptRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/verification/requests/${requestId}/test/submit`,
    method: 'POST',
    headers: studentHeaders,
  }, {
    answers: {
      'q-react-01': 'It automatically reverts on async rejection with useActionState',
      'q-react-02': 'Memoize callbacks with useCallback and ensure stable dependencies',
    },
    duration_taken_seconds: 1200,
  })

  console.log(`Submit Attempt Status: ${submitAttemptRes.status}, Calculated Score: ${submitAttemptRes.body?.data?.score}%, Passed: ${submitAttemptRes.body?.data?.passed}`)
  if (submitAttemptRes.status === 200 && submitAttemptRes.body?.success && submitAttemptRes.body?.data?.score === 100 && submitAttemptRes.body?.data?.passed) {
    console.log('✅ PASS: Student test scored 100% and submitted successfully.')
    passed++
  } else {
    console.error('❌ FAIL: Expected 200 with score 100, got:', submitAttemptRes)
    failed++
  }

  // ─── STEP 6: ACADEMICIAN REVIEWS TEST ATTEMPT ─────────────────────────────
  console.log('\n--- STEP 6: Academician Fetches Test Attempt for Evaluation ---')
  const getAttemptRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/verification/requests/${requestId}/attempt`,
    method: 'GET',
    headers: academiaHeaders,
  })

  const attemptData = getAttemptRes.body?.data?.attempt
  const reqStatusAfterTest = getAttemptRes.body?.data?.request?.status
  console.log(`Get Attempt Status: ${getAttemptRes.status}, Score: ${attemptData?.score}%, Request Status: ${reqStatusAfterTest}`)

  if (getAttemptRes.status === 200 && attemptData?.score === 100 && reqStatusAfterTest === 'test_submitted') {
    console.log('✅ PASS: Academician retrieves submitted answers, question review, and score.')
    passed++
  } else {
    console.error('❌ FAIL: Could not retrieve attempt:', getAttemptRes)
    failed++
  }

  // ─── STEP 7: ACADEMICIAN SAVES LIVE SCREENING NOTES ───────────────────────
  console.log('\n--- STEP 7: Academician Records Live Screening Notes ---')
  const saveNotesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/verification/requests/${requestId}/notes`,
    method: 'POST',
    headers: academiaHeaders,
  }, {
    notes: 'Candidate articulated React 19 transition primitives clearly during live code walkthrough.',
  })

  console.log(`Save Notes Status: ${saveNotesRes.status}`)
  if (saveNotesRes.status === 200 && saveNotesRes.body?.success) {
    console.log('✅ PASS: Live screening notes saved.')
    passed++
  } else {
    console.error('❌ FAIL: Notes could not be saved:', saveNotesRes)
    failed++
  }

  // ─── STEP 8: ACADEMICIAN MAKES FINAL HUMAN DECISION (VERIFY) ──────────────
  console.log('\n--- STEP 8: Academician Finalizes Decision: VERIFY SKILL ---')
  const finalDecisionRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/verification/requests/${requestId}/decision`,
    method: 'POST',
    headers: academiaHeaders,
  }, {
    decision: 'VERIFY',
    verified_level: 95,
    academic_test_score: 100,
    verification_notes: 'Exceptional test performance and solid live repository walkthrough.',
  })

  console.log(`Final Decision Status: ${finalDecisionRes.status}, Result Status: ${finalDecisionRes.body?.data?.status}`)
  if (finalDecisionRes.status === 200 && finalDecisionRes.body?.success && finalDecisionRes.body?.data?.status === 'verified') {
    console.log('✅ PASS: Academician verified skill with score 95/100.')
    passed++
  } else {
    console.error('❌ FAIL: Verification decision failed:', finalDecisionRes)
    failed++
  }

  // ─── STEP 9: STUDENT VERIFIES OFFICIAL CREDENTIAL ON PASSPORT ─────────────
  console.log('\n--- STEP 9: Student Checks Updated Living Skill Passport & Queue ---')
  const studentQueueRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/student/requests',
    method: 'GET',
    headers: studentHeaders,
  })

  const updatedReq = (studentQueueRes.body?.data || []).find(r => r.id === requestId)
  console.log(`Student Queue Status: ${studentQueueRes.status}, Ticket Status: ${updatedReq?.status}, Verified Level: ${updatedReq?.verified_level}`)

  if (studentQueueRes.status === 200 && updatedReq?.status === 'verified' && updatedReq?.verified_level === 95) {
    console.log('✅ PASS: Student verification ticket reflects VERIFIED with score 95/100.')
    passed++
  } else {
    console.error('❌ FAIL: Ticket did not update properly:', updatedReq)
    failed++
  }

  // ─── STEP 10: SECOND SKILL FLOW (REASSESSMENT REQUIRED) ───────────────────
  console.log('\n--- STEP 10: Second Skill: Submit & Request Re-Assessment Workflow ---')
  const submitNode = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/request',
    method: 'POST',
    headers: studentHeaders,
  }, {
    skill_name: 'Node.js',
    claimed_level: 'Intermediate (60-79)',
    score: 70,
    description: 'Basic Express server without clustering or Redis caching.',
    academician_id: 'fac-01-sarah-mitchell',
  })

  const nodeReqId = submitNode.body?.data?.id
  const reassessRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/verification/requests/${nodeReqId}/decision`,
    method: 'POST',
    headers: academiaHeaders,
  }, {
    decision: 'REASSESSMENT',
    rejection_reason: 'Missing cluster concurrency and caching layer',
    rejection_feedback: 'Please integrate Redis caching, write integration tests, and review with your AI Coach before requesting re-screening.',
  })

  console.log(`Reassessment Decision Status: ${reassessRes.status}, Status: ${reassessRes.body?.data?.status}`)
  if (reassessRes.status === 200 && reassessRes.body?.data?.status === 'reassessment_required') {
    console.log('✅ PASS: Re-assessment requested with feedback and AI Coach pathway.')
    passed++
  } else {
    console.error('❌ FAIL: Re-assessment flow failed:', reassessRes)
    failed++
  }

  console.log('\n================================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runSkillTestFlowCompleteTest().catch(err => {
  console.error('Unhandled test execution error:', err)
  process.exit(1)
})
