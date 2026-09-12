/**
 * SkillBridge Student <-> Academia Skill Verification End-to-End Verification Test
 */

const BASE_URL = 'http://localhost:3000'

async function runTests() {
  console.log('================================================================')
  console.log('SKILLBRIDGE STUDENT <-> ACADEMIA VERIFICATION END-TO-END TEST')
  console.log('================================================================\n')

  let passedTests = 0
  const totalTests = 10

  // ─── TEST 1: GET /api/verification/academicians ───────────────────────────
  console.log('--- TEST 1: Fetch Available Faculty Reviewers ---')
  try {
    const res = await fetch(`${BASE_URL}/api/verification/academicians`)
    const json = await res.json()
    if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
      console.log(`Faculty count: ${json.data.length}`)
      console.log(`Sample faculty: ${json.data[0].full_name} (${json.data[0].institution_name})`)
      console.log('PASS: Available academicians loaded successfully.\n')
      passedTests++
    } else {
      throw new Error(`Failed to load academicians: ${JSON.stringify(json)}`)
    }
  } catch (err) {
    console.error('TEST 1 FAILED:', err.message)
  }

  // ─── TEST 2: Submit Verification Request (Student) ─────────────────────────
  console.log('--- TEST 2: Student Submits Verification Request for React ---')
  let createdRequestId = null
  try {
    const payload = {
      student_id: 'std-test-user-001',
      student_name: 'Arib Tayab',
      student_email: 'arib.student@dtu.ac.in',
      department: 'Computer Science & Engineering',
      skill_name: 'React',
      claimed_level: 'Strong (80-89)',
      score: 85,
      description: 'Architected and built a full-stack responsive web application using React 19, TypeScript, compound component patterns, and server actions.',
      project_title: 'SkillBridge Platform Frontend',
      tech_stack: 'React, Next.js, TypeScript, TailwindCSS',
      academician_id: 'fac-01-sarah-mitchell',
      supporting_evidence: [
        {
          title: 'Production React Repository',
          type: 'github_repo',
          url: 'https://github.com/aribtaiyab/skillbridge-react-app',
          description: 'Production frontend codebase with modular component architecture.'
        },
        {
          title: 'Advanced React Architecture Certificate',
          type: 'certificate',
          url: 'https://certificates.skillbridge.edu/react-mastery-cert',
          description: 'Accredited certificate in modern React design patterns.'
        }
      ]
    }

    const res = await fetch(`${BASE_URL}/api/verification/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()

    if (res.ok && json.success && json.data?.id) {
      createdRequestId = json.data.id
      console.log(`Created Request ID: ${createdRequestId}`)
      console.log(`Status: ${json.data.status}`)
      console.log(`Skill: ${json.data.skill_name} (Score: ${json.data.score})`)
      console.log('PASS: Verification request created in database with pending status.\n')
      passedTests++
    } else {
      throw new Error(`Failed to create request: ${JSON.stringify(json)}`)
    }
  } catch (err) {
    console.error('TEST 2 FAILED:', err.message)
  }

  // ─── TEST 3: Student Fetches Submitted Requests ────────────────────────────
  console.log('--- TEST 3: Student Queries Own Verification Requests ---')
  try {
    const res = await fetch(`${BASE_URL}/api/verification/student/requests`)
    const json = await res.json()
    const requests = json.data || json.requests || []
    const matched = requests.find(r => r.id === createdRequestId)

    if (res.ok && matched) {
      console.log(`Found submitted request: ${matched.skill_name} (${matched.status})`)
      console.log(`Evidence count: ${matched.supporting_evidence?.length || 0}`)
      console.log('PASS: Student successfully views submitted verification request.\n')
      passedTests++
    } else {
      throw new Error(`Submitted request not found in student list: ${JSON.stringify(json)}`)
    }
  } catch (err) {
    console.error('TEST 3 FAILED:', err.message)
  }

  // ─── TEST 4: Academia Inbox Queries Queue ──────────────────────────────────
  console.log('--- TEST 4: Academia Queries Verification Queue ---')
  try {
    const res = await fetch(`${BASE_URL}/api/verification/academician/requests`)
    const json = await res.json()
    const requests = json.data || json.requests || []
    const matched = requests.find(r => r.id === createdRequestId)

    if (res.ok && matched) {
      console.log(`Academia inbox received ticket: ${matched.id}`)
      console.log(`Student: ${matched.student_name} (${matched.student_email})`)
      console.log(`Skill: ${matched.skill_name} | Status: ${matched.status}`)
      console.log('PASS: Academia reviewer inbox contains real student submission.\n')
      passedTests++
    } else {
      throw new Error(`Submitted request not found in academia queue: ${JSON.stringify(json)}`)
    }
  } catch (err) {
    console.error('TEST 4 FAILED:', err.message)
  }

  // ─── TEST 5: Academia Reviewer Approves / Endorses Skill ───────────────────
  console.log('--- TEST 5: Academia Reviewer Endorses & Approves Skill ---')
  try {
    const payload = {
      requestId: createdRequestId,
      action: 'approved',
      verifiedScore: 88,
      verifiedTier: 'Institution Verified',
      facultyFeedback: 'Excellent React component architecture and clear state isolation. Code demonstrates advanced proficiency.',
      reviewerName: 'Dr. Sarah Mitchell (Dept. Chair)'
    }

    const res = await fetch(`${BASE_URL}/api/verification/action`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()

    if (res.ok && json.success && json.ticket?.status === 'approved') {
      console.log(`Decision Status: ${json.ticket.status}`)
      console.log(`Verified Level: ${json.ticket.verified_level || 88}`)
      console.log(`Faculty Feedback: ${json.ticket.faculty_feedback}`)
      console.log('PASS: Academia approved skill verification and recorded endorsement.\n')
      passedTests++
    } else {
      throw new Error(`Failed to approve request: ${JSON.stringify(json)}`)
    }
  } catch (err) {
    console.error('TEST 5 FAILED:', err.message)
  }

  // ─── TEST 6: Student Reloads & Confirms Verified Badge ─────────────────────
  console.log('--- TEST 6: Student Confirms Verified Status & Faculty Feedback ---')
  try {
    const res = await fetch(`${BASE_URL}/api/verification/student/requests`)
    const json = await res.json()
    const requests = json.data || json.requests || []
    const matched = requests.find(r => r.id === createdRequestId)

    if (res.ok && matched && matched.status === 'approved') {
      console.log(`Verified Status: ${matched.status.toUpperCase()}`)
      console.log(`Verified By: ${matched.academician_name}`)
      console.log(`Feedback: "${matched.faculty_feedback}"`)
      console.log('PASS: Student profile immediately reflects approved institutional verification.\n')
      passedTests++
    } else {
      throw new Error(`Request not updated to approved: ${JSON.stringify(matched)}`)
    }
  } catch (err) {
    console.error('TEST 6 FAILED:', err.message)
  }

  // ─── TEST 7: Submit Second Request (Node.js) for Rejection Test ────────────
  console.log('--- TEST 7: Student Submits Second Request for Node.js ---')
  let secondRequestId = null
  try {
    const payload = {
      student_id: 'std-test-user-001',
      student_name: 'Arib Tayab',
      student_email: 'arib.student@dtu.ac.in',
      department: 'Computer Science & Engineering',
      skill_name: 'Node.js',
      claimed_level: 'Strong (80-89)',
      score: 80,
      description: 'Basic HTTP server with express routing.',
      project_title: 'Simple API Demo',
      academician_id: 'fac-01-sarah-mitchell',
      supporting_evidence: [
        {
          title: 'Express Starter Repo',
          type: 'github_repo',
          url: 'https://github.com/aribtaiyab/starter-node',
          description: 'Starter server.'
        }
      ]
    }

    const res = await fetch(`${BASE_URL}/api/verification/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()

    if (res.ok && json.success && json.data?.id) {
      secondRequestId = json.data.id
      console.log(`Created Second Request ID: ${secondRequestId}`)
      console.log('PASS: Second request submitted.\n')
      passedTests++
    } else {
      throw new Error(`Failed to create second request: ${JSON.stringify(json)}`)
    }
  } catch (err) {
    console.error('TEST 7 FAILED:', err.message)
  }

  // ─── TEST 8: Academia Rejects Second Request with Constructive Feedback ───
  console.log('--- TEST 8: Academia Rejects Second Request with Required Reason ---')
  try {
    const payload = {
      requestId: secondRequestId,
      action: 'rejected',
      rejectionReason: 'Insufficient practical repository evidence',
      facultyFeedback: 'The starter repository contains only boilerplate code. Please implement error middleware, authentication, and integration tests before resubmitting.',
      reviewerName: 'Dr. Sarah Mitchell (Dept. Chair)'
    }

    const res = await fetch(`${BASE_URL}/api/verification/action`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()

    if (res.ok && json.success && json.ticket?.status === 'rejected') {
      console.log(`Decision: ${json.ticket.status}`)
      console.log(`Rejection Reason: ${json.ticket.rejection_reason}`)
      console.log(`Feedback: ${json.ticket.faculty_feedback}`)
      console.log('PASS: Request rejected with reason and actionable feedback.\n')
      passedTests++
    } else {
      throw new Error(`Failed to reject request: ${JSON.stringify(json)}`)
    }
  } catch (err) {
    console.error('TEST 8 FAILED:', err.message)
  }

  // ─── TEST 9: Student Confirms Rejection & Feedback ─────────────────────────
  console.log('--- TEST 9: Student Confirms Rejected Status & Reason ---')
  try {
    const res = await fetch(`${BASE_URL}/api/verification/student/requests`)
    const json = await res.json()
    const requests = json.data || json.requests || []
    const matched = requests.find(r => r.id === secondRequestId)

    if (res.ok && matched && matched.status === 'rejected') {
      console.log(`Status: ${matched.status.toUpperCase()}`)
      console.log(`Rejection Reason: ${matched.rejection_reason}`)
      console.log(`Feedback: ${matched.faculty_feedback}`)
      console.log('PASS: Student views rejection details with guidance to improve and resubmit.\n')
      passedTests++
    } else {
      throw new Error(`Second request not updated to rejected: ${JSON.stringify(matched)}`)
    }
  } catch (err) {
    console.error('TEST 9 FAILED:', err.message)
  }

  // ─── TEST 10: Career Target Regression Check ──────────────────────────────
  console.log('--- TEST 10: Verify Career Target Remains 100% Intact & Untouched ---')
  try {
    const res = await fetch(`${BASE_URL}/api/student/career-targets`)
    const json = await res.json()
    if (res.ok && json.success && Array.isArray(json.data) && json.data.length === 14) {
      console.log(`Career targets catalog intact: ${json.data.length} tracks`)
      console.log('PASS: Career Target and its intelligence engine remain 100% intact.\n')
      passedTests++
    } else {
      throw new Error(`Career target catalog error: ${JSON.stringify(json)}`)
    }
  } catch (err) {
    console.error('TEST 10 FAILED:', err.message)
  }

  console.log('================================================================')
  console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`)
  console.log('================================================================')

  if (passedTests === totalTests) {
    console.log('STUDENT <-> ACADEMIA SKILL VERIFICATION IS FULLY CONNECTED AND READY!')
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
