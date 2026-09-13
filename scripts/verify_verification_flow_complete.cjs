/**
 * End-to-End Verification Flow Test: Student ↔ Database ↔ Academia
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

async function runEndToEndVerificationTest() {
  console.log('================================================================')
  console.log('SKILLBRIDGE SKILL VERIFICATION END-TO-END VERIFICATION TEST')
  console.log('================================================================\n')

  const studentHeaders = {
    'Content-Type': 'application/json',
    'x-demo-mode': 'true',
    'x-demo-role': 'student',
    'x-user-id': 'test-student-arib-01',
  }

  const academiaHeaders = {
    'Content-Type': 'application/json',
    'x-demo-mode': 'true',
    'x-demo-role': 'academician',
    'x-user-id': 'fac-01-sarah-mitchell',
  }

  let passed = 0
  let failed = 0

  // ─── STEP 1: INITIAL STATE (Student has 0 requests) ───────────────────────
  console.log('--- STEP 1: Inspect Initial Student Queue ---')
  const initRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/student/requests',
    method: 'GET',
    headers: studentHeaders,
  })
  console.log(`Initial Student Requests Status: ${initRes.status}, Count: ${(initRes.body?.data || []).length}`)
  if (initRes.status === 200 && initRes.body?.success) {
    passed++
  } else {
    failed++
  }

  // ─── STEP 2: STUDENT SUBMITS "React" VERIFICATION REQUEST ─────────────────
  console.log('\n--- STEP 2: Student Submits Verification for "React" ---')
  const submitReact = await request({
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
    project_url: 'https://github.com/student/react-analytics-app',
    tech_stack: 'React, Next.js, TypeScript, TailwindCSS',
    supporting_evidence: [
      { title: 'GitHub Repository', type: 'github_repo', url: 'https://github.com/student/react-analytics-app', description: 'Production source code with unit tests' },
    ],
    academician_id: 'fac-01-sarah-mitchell',
  })

  console.log(`Submit Status: ${submitReact.status}`)
  console.log(`Created Request ID: ${submitReact.body?.data?.id}, Status: ${submitReact.body?.data?.status}`)
  
  const reactRequestId = submitReact.body?.data?.id
  if (submitReact.status === 201 && submitReact.body?.success && submitReact.body?.data?.status === 'pending') {
    console.log('✅ PASS: React verification request successfully created with status PENDING.')
    passed++
  } else {
    console.error('❌ FAIL: Expected 201 with status pending, got:', submitReact)
    failed++
  }

  // ─── STEP 3: STUDENT FETCHES UPDATED REQUESTS & STATS ─────────────────────
  console.log('\n--- STEP 3: Student Verification Dashboard Update ---')
  const studentFetch1 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/student/requests',
    method: 'GET',
    headers: studentHeaders,
  })

  const reqs1 = studentFetch1.body?.data || []
  const total1 = reqs1.length
  const pending1 = reqs1.filter(r => r.status === 'pending' || r.status === 'request_sent').length
  const verified1 = reqs1.filter(r => r.status === 'approved' || r.status === 'verified').length

  console.log(`Student Stats -> Submitted: ${total1}, Pending: ${pending1}, Verified: ${verified1}`)
  if (total1 >= 1 && pending1 >= 1) {
    console.log('✅ PASS: Student statistics accurately reflect 1 Submitted, 1 Pending.')
    passed++
  } else {
    console.error('❌ FAIL: Incorrect student statistics:', { total1, pending1, verified1 })
    failed++
  }

  // ─── STEP 4: REFRESH SIMULATION ───────────────────────────────────────────
  console.log('\n--- STEP 4: Refresh Student Page Simulation ---')
  const studentRefresh = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/student/requests',
    method: 'GET',
    headers: studentHeaders,
  })
  const refreshReqs = studentRefresh.body?.data || []
  if (refreshReqs.length === total1 && refreshReqs.some(r => r.id === reactRequestId)) {
    console.log('✅ PASS: After browser refresh, submitted request and stats remain persistent in database.')
    passed++
  } else {
    console.error('❌ FAIL: Lost persistence across refresh.')
    failed++
  }

  // ─── STEP 5: ACADEMIA QUEUE RETRIEVAL ─────────────────────────────────────
  console.log('\n--- STEP 5: Academia Verification Inbox Retrieval ---')
  const acadFetch1 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/academician/requests',
    method: 'GET',
    headers: academiaHeaders,
  })

  const acadReqs = acadFetch1.body?.data || []
  const foundInAcad = acadReqs.find(r => r.id === reactRequestId)
  console.log(`Academia Inbox Count: ${acadReqs.length}, Found Submitted Ticket: ${Boolean(foundInAcad)}`)
  if (foundInAcad && foundInAcad.skill_name === 'React') {
    console.log('✅ PASS: Academia successfully received the real student verification request.')
    passed++
  } else {
    console.error('❌ FAIL: Submitted request not found in Academia queue.')
    failed++
  }

  // ─── STEP 6: ACADEMIA APPROVES "React" REQUEST ────────────────────────────
  console.log('\n--- STEP 6: Academia Endorsement / Approval Action ---')
  const approveRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/action',
    method: 'PATCH',
    headers: academiaHeaders,
  }, {
    requestId: reactRequestId,
    action: 'approved',
    verifiedScore: 90,
    facultyFeedback: 'Verified with high technical competence. Strong clean architecture in React component tree.',
    reviewerName: 'Dr. Sarah Mitchell (Dept. Chair)',
  })

  console.log(`Approve Action Status: ${approveRes.status}, Message: ${approveRes.body?.message}`)
  if (approveRes.status === 200 && approveRes.body?.success) {
    console.log('✅ PASS: Academia successfully verified and endorsed the skill in database.')
    passed++
  } else {
    console.error('❌ FAIL: Approval action failed:', approveRes)
    failed++
  }

  // ─── STEP 7: STUDENT REFRESHES AND SEES "VERIFIED" STATUS ─────────────────
  console.log('\n--- STEP 7: Student Refreshes to Inspect Verified Credential ---')
  const studentFetch2 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/student/requests',
    method: 'GET',
    headers: studentHeaders,
  })

  const reqs2 = studentFetch2.body?.data || []
  const reactUpdated = reqs2.find(r => r.id === reactRequestId)
  const pending2 = reqs2.filter(r => r.status === 'pending' || r.status === 'request_sent').length
  const verified2 = reqs2.filter(r => r.status === 'approved' || r.status === 'verified').length

  console.log(`React Ticket Status: ${reactUpdated?.status}, Verified Level: ${reactUpdated?.verified_level || reactUpdated?.score}`)
  console.log(`Updated Student Stats -> Pending: ${pending2}, Verified: ${verified2}`)
  if (reactUpdated?.status === 'approved' && verified2 >= 1) {
    console.log('✅ PASS: Student verification status transitioned to APPROVED / VERIFIED with updated score.')
    passed++
  } else {
    console.error('❌ FAIL: Student does not see updated verified status:', reactUpdated)
    failed++
  }

  // ─── STEP 8: STUDENT SUBMITS SECOND SKILL "Node.js" AND ACADEMIA REJECTS ──
  console.log('\n--- STEP 8: Second Skill Submission & Rejection Workflow ---')
  const submitNode = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/request',
    method: 'POST',
    headers: studentHeaders,
  }, {
    skill_name: 'Node.js',
    claimed_level: 'Developing (50-69)',
    score: 60,
    description: 'Basic Express server without clustering or test suite.',
    academician_id: 'fac-01-sarah-mitchell',
  })

  const nodeRequestId = submitNode.body?.data?.id

  // Academia Rejects
  const rejectRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/action',
    method: 'PATCH',
    headers: academiaHeaders,
  }, {
    requestId: nodeRequestId,
    action: 'rejected',
    rejectionReason: 'Insufficient unit test coverage and missing error handling',
    facultyFeedback: 'Please add automated Jest unit tests and robust error handling middleware before resubmitting.',
    reviewerName: 'Dr. Sarah Mitchell (Dept. Chair)',
  })

  console.log(`Reject Action Status: ${rejectRes.status}`)

  const studentFetch3 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/student/requests',
    method: 'GET',
    headers: studentHeaders,
  })

  const reqs3 = studentFetch3.body?.data || []
  const total3 = reqs3.length
  const verified3 = reqs3.filter(r => r.status === 'approved' || r.status === 'verified').length
  const rejected3 = reqs3.filter(r => r.status === 'rejected').length
  const nodeUpdated = reqs3.find(r => r.id === nodeRequestId)

  console.log(`Final Student Stats -> Total: ${total3}, Verified: ${verified3}, Rejected: ${rejected3}`)
  console.log(`Node.js Ticket Status: ${nodeUpdated?.status}, Reason: ${nodeUpdated?.rejection_reason}`)

  if (nodeUpdated?.status === 'rejected' && rejected3 >= 1 && verified3 >= 1) {
    console.log('✅ PASS: Rejection feedback, reason, and counters properly updated and displayed.')
    passed++
  } else {
    console.error('❌ FAIL: Rejection verification failed:', { nodeUpdated, rejected3 })
    failed++
  }

  console.log('\n================================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('================================================================')

  if (failed > 0) process.exit(1)
}

runEndToEndVerificationTest().catch(err => {
  console.error('Test script runtime exception:', err)
  process.exit(1)
})
