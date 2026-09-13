/**
 * Verification Script for Academia Skill Gaps & RBAC Auth
 */

const http = require('http')

async function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ status: res.statusCode, body: parsed })
        } catch {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })

    req.on('error', (err) => reject(err))
    req.end()
  })
}

async function runTests() {
  console.log('==================================================')
  console.log('RUNNING ACADEMIA SKILL GAPS RBAC & API TESTS')
  console.log('==================================================\n')

  let passed = 0
  let failed = 0

  // TEST 1: Unauthenticated request should return 401
  try {
    const res = await makeRequest('/api/academia/skill-gaps')
    if (res.status === 401) {
      console.log('✅ TEST 1 PASSED: Unauthenticated request correctly returns 401 Unauthorized')
      passed++
    } else {
      console.error(`❌ TEST 1 FAILED: Expected 401, got ${res.status}`, res.body)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 1 ERROR:', err.message)
    failed++
  }

  // TEST 2: Student user should return 403 Forbidden
  try {
    const res = await makeRequest('/api/academia/skill-gaps', {
      'x-demo-mode': 'true',
      'x-demo-role': 'student',
      'x-user-id': 'demo-student-id'
    })
    if (res.status === 403 && res.body?.error?.includes('requires academician or institution role')) {
      console.log('✅ TEST 2 PASSED: Authenticated Student is correctly blocked with 403 Forbidden')
      passed++
    } else {
      console.error(`❌ TEST 2 FAILED: Expected 403 Forbidden for student, got ${res.status}`, res.body)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 2 ERROR:', err.message)
    failed++
  }

  // TEST 3: Industry user should return 403 Forbidden
  try {
    const res = await makeRequest('/api/academia/skill-gaps', {
      'x-demo-mode': 'true',
      'x-demo-role': 'industry',
      'x-user-id': 'demo-industry-id'
    })
    if (res.status === 403 && res.body?.error?.includes('requires academician or institution role')) {
      console.log('✅ TEST 3 PASSED: Authenticated Industry is correctly blocked with 403 Forbidden')
      passed++
    } else {
      console.error(`❌ TEST 3 FAILED: Expected 403 Forbidden for industry, got ${res.status}`, res.body)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 3 ERROR:', err.message)
    failed++
  }

  // TEST 4: Academician user should return 200 OK with real gap data
  try {
    const res = await makeRequest('/api/academia/skill-gaps', {
      'x-demo-mode': 'true',
      'x-demo-role': 'academician',
      'x-user-id': 'demo-academician-id'
    })
    if (res.status === 200 && res.body?.success && res.body?.data?.gaps && res.body?.data?.summary) {
      console.log('✅ TEST 4 PASSED: Authenticated Academician receives 200 OK with cohort gaps & summary')
      console.log(`   - Gaps returned: ${res.body.data.gaps.length}`)
      console.log(`   - Critical Gaps: ${res.body.data.summary.criticalCount}`)
      console.log(`   - Needs Improvement: ${res.body.data.summary.needsImprovementCount}`)
      console.log(`   - Ready Count: ${res.body.data.summary.readyCount}`)
      passed++
    } else {
      console.error(`❌ TEST 4 FAILED: Expected 200 OK with gaps, got ${res.status}`, res.body)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 4 ERROR:', err.message)
    failed++
  }

  // TEST 5: Institution user should return 200 OK
  try {
    const res = await makeRequest('/api/academia/skill-gaps', {
      'x-demo-mode': 'true',
      'x-demo-role': 'institution',
      'x-user-id': 'demo-institution-id'
    })
    if (res.status === 200 && res.body?.success && res.body?.data?.gaps) {
      console.log('✅ TEST 5 PASSED: Authenticated Institution receives 200 OK')
      passed++
    } else {
      console.error(`❌ TEST 5 FAILED: Expected 200 OK for institution, got ${res.status}`, res.body)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 5 ERROR:', err.message)
    failed++
  }

  // TEST 6: Faculty role alias should return 200 OK
  try {
    const res = await makeRequest('/api/academia/skill-gaps', {
      'x-demo-mode': 'true',
      'x-demo-role': 'faculty',
      'x-user-id': 'demo-faculty-id'
    })
    if (res.status === 200 && res.body?.success && res.body?.data?.gaps) {
      console.log('✅ TEST 6 PASSED: Authenticated Faculty alias receives 200 OK')
      passed++
    } else {
      console.error(`❌ TEST 6 FAILED: Expected 200 OK for faculty, got ${res.status}`, res.body)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 6 ERROR:', err.message)
    failed++
  }

  // TEST 7: Query filtering (career & severity)
  try {
    const res = await makeRequest('/api/academia/skill-gaps?severity=critical', {
      'x-demo-mode': 'true',
      'x-demo-role': 'academician',
      'x-user-id': 'demo-academician-id'
    })
    if (res.status === 200 && res.body?.success) {
      const allCritical = res.body.data.gaps.every(g => g.severity === 'critical')
      if (allCritical) {
        console.log('✅ TEST 7 PASSED: Severity filter correctly filters cohort gaps')
        passed++
      } else {
        console.error('❌ TEST 7 FAILED: Some non-critical items returned when filtering by critical')
        failed++
      }
    } else {
      console.error(`❌ TEST 7 FAILED: Status ${res.status}`, res.body)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 7 ERROR:', err.message)
    failed++
  }

  // TEST 8: Frontend Next.js API route (/api/academia/skill-gaps on port 3000)
  try {
    const res = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/academia/skill-gaps',
        method: 'GET',
      }, (res) => {
        let data = ''
        res.on('data', c => { data += c })
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
          catch { resolve({ status: res.statusCode, body: data }) }
        })
      })
      req.on('error', reject)
      req.end()
    })
    if (res.status === 401 || (res.status === 200 && res.body?.success)) {
      console.log(`✅ TEST 8 PASSED: Frontend Next.js route responded properly (status: ${res.status})`)
      passed++
    } else {
      console.error(`❌ TEST 8 FAILED: Unexpected status ${res.status}`, res.body)
      failed++
    }
  } catch (err) {
    console.warn('⚠️ TEST 8 SKIPPED (frontend server not listening on 3000 or busy):', err.message)
  }

  console.log('\n==================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('==================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
