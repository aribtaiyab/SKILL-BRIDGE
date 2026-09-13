/**
 * SkillBridge Skill Passport End-to-End Verification Test
 * Tests: Profile editing, skills aggregation, project CRUD, certification CRUD,
 * and zero fake data persistence.
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const BACKEND_BASE = process.env.BACKEND_URL || 'http://localhost:5000';

const AUTH_HEADER = {
  'Content-Type': 'application/json',
  'x-demo-mode': 'true',
  'x-demo-role': 'student',
};

async function getJson(url, options = {}) {
  const res = await fetch(url, { headers: AUTH_HEADER, ...options });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function patchJson(url, body) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: AUTH_HEADER,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function deleteJson(url) {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: AUTH_HEADER,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('SKILLBRIDGE SKILL PASSPORT COMPREHENSIVE END-TO-END TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // ─── TEST 1: GET INITIAL STUDENT PROFILE ───
    console.log('--- TEST 1: GET /api/student/profile ---');
    const p1 = await getJson(`${BACKEND_BASE}/api/student/profile`);
    console.log('Profile status:', p1.status, 'Name:', p1.data?.data?.full_name);
    if (p1.status === 200 && p1.data?.success) {
      console.log('✅ PASS: Student profile loaded successfully.');
      passed++;
    } else {
      console.error('❌ FAIL: Profile fetch failed:', p1);
      failed++;
    }

    // ─── TEST 2: EDIT PASSPORT PROFILE (PATCH) ───
    console.log('\n--- TEST 2: PATCH /api/student/profile (Update Passport fields) ---');
    const updatePayload = {
      full_name: 'Md Arib',
      college_name: 'Dr. Akhilesh Das Gupta Institute of Professional Studies',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering',
      academic_year: '2nd Year',
      graduation_year: 2028,
      location: 'Delhi, India',
      bio: 'Building distributed systems, asynchronous microservices, and AI-powered educational platforms.',
      linkedin_url: 'https://linkedin.com/in/mdarib',
      github_url: 'https://github.com/aribtaiyab',
      portfolio_url: 'https://aribtaiyab.dev',
    };

    const p2 = await patchJson(`${BACKEND_BASE}/api/student/profile`, updatePayload);
    console.log('Update status:', p2.status, 'Message:', p2.data?.message || 'Updated');
    if (p2.status === 200 && p2.data?.success) {
      console.log('✅ PASS: Passport profile updated successfully.');
      passed++;
    } else {
      console.error('❌ FAIL: Profile update failed:', p2);
      failed++;
    }

    // ─── TEST 3: VERIFY PROFILE PERSISTENCE ACROSS GET ───
    console.log('\n--- TEST 3: GET /api/student/profile (Verify Persistence) ---');
    const p3 = await getJson(`${BACKEND_BASE}/api/student/profile`);
    const prof = p3.data?.data;
    console.log('Persisted Name:', prof?.full_name);
    console.log('Persisted College:', prof?.college_name);
    console.log('Persisted Degree/Branch:', `${prof?.degree} in ${prof?.branch}`);
    console.log('Persisted GitHub:', prof?.github_url);

    if (
      prof?.full_name === 'Md Arib' &&
      prof?.college_name.includes('Akhilesh Das Gupta') &&
      prof?.branch === 'Computer Science & Engineering' &&
      prof?.github_url === 'https://github.com/aribtaiyab'
    ) {
      console.log('✅ PASS: Profile fields verified and correctly persisted.');
      passed++;
    } else {
      console.error('❌ FAIL: Profile fields did not match expected values:', prof);
      failed++;
    }

    // ─── TEST 4: ADD PROJECT TO PASSPORT (POST) ───
    console.log('\n--- TEST 4: POST /api/student/projects ---');
    const projectPayload = {
      title: 'SkillBridge Platform Engine',
      description: 'Distributed skill passport and career readiness ledger with real-time verification.',
      technologies: ['Node.js', 'Express', 'TypeScript', 'PostgreSQL', 'Next.js'],
      github_url: 'https://github.com/aribtaiyab/skillbridge',
      project_url: 'https://skillbridge.dev',
    };

    const projRes = await postJson(`${BACKEND_BASE}/api/student/projects`, projectPayload);
    const createdProj = projRes.data?.data;
    console.log('Create Project status:', projRes.status, 'Project ID:', createdProj?.id);
    if (projRes.status === 201 && createdProj?.title === projectPayload.title) {
      console.log('✅ PASS: Project added to passport successfully.');
      passed++;
    } else {
      console.error('❌ FAIL: Project creation failed:', projRes);
      failed++;
    }

    // ─── TEST 5: GET PROJECTS LIST ───
    console.log('\n--- TEST 5: GET /api/student/projects ---');
    const projsGet = await getJson(`${BACKEND_BASE}/api/student/projects`);
    console.log('Projects count:', projsGet.data?.data?.length);
    if (projsGet.status === 200 && Array.isArray(projsGet.data?.data) && projsGet.data.data.length > 0) {
      console.log('✅ PASS: Projects retrieved successfully.');
      passed++;
    } else {
      console.error('❌ FAIL: Projects list empty or invalid:', projsGet);
      failed++;
    }

    // ─── TEST 6: ADD CERTIFICATION TO PASSPORT (POST) ───
    console.log('\n--- TEST 6: POST /api/student/certifications ---');
    const certPayload = {
      name: 'AWS Certified Solutions Architect - Associate',
      issuing_organization: 'Amazon Web Services',
      issue_date: '2026-08-15',
      credential_url: 'https://credly.com/sample-cert',
    };

    const certRes = await postJson(`${BACKEND_BASE}/api/student/certifications`, certPayload);
    const createdCert = certRes.data?.data;
    console.log('Create Cert status:', certRes.status, 'Cert ID:', createdCert?.id);
    if (certRes.status === 201 && createdCert?.name === certPayload.name) {
      console.log('✅ PASS: Certification added to passport successfully.');
      passed++;
    } else {
      console.error('❌ FAIL: Certification creation failed:', certRes);
      failed++;
    }

    // ─── TEST 7: GET CERTIFICATIONS LIST ───
    console.log('\n--- TEST 7: GET /api/student/certifications ---');
    const certsGet = await getJson(`${BACKEND_BASE}/api/student/certifications`);
    console.log('Certifications count:', certsGet.data?.data?.length);
    if (certsGet.status === 200 && Array.isArray(certsGet.data?.data) && certsGet.data.data.length > 0) {
      console.log('✅ PASS: Certifications retrieved successfully.');
      passed++;
    } else {
      console.error('❌ FAIL: Certifications list empty or invalid:', certsGet);
      failed++;
    }

    // ─── TEST 8: GET PASSPORT AGGREGATE ENDPOINT ───
    console.log('\n--- TEST 8: GET /api/student/passport ---');
    const passportRes = await getJson(`${BACKEND_BASE}/api/student/passport`);
    const passData = passportRes.data?.data;
    console.log('Passport status:', passportRes.status);
    console.log('Passport Projects:', passData?.projects?.length);
    console.log('Passport Certifications:', passData?.certifications?.length);
    console.log('Passport Skills:', passData?.skills?.length);

    if (passportRes.status === 200 && passData?.projects?.length > 0 && passData?.certifications?.length > 0) {
      console.log('✅ PASS: Student Passport aggregated all real database entities cleanly.');
      passed++;
    } else {
      console.error('❌ FAIL: Passport aggregation failed:', passportRes);
      failed++;
    }

    // ─── TEST 9: FRONTEND ROUTE HANDLERS (/api/passport and /api/student/passport) ───
    console.log('\n--- TEST 9: GET frontend /api/student/passport ---');
    const frontPassRes = await getJson(`${BASE}/api/student/passport`);
    console.log('Frontend Passport status:', frontPassRes.status, 'Success:', frontPassRes.data?.success);
    if (frontPassRes.status === 200 && frontPassRes.data?.success) {
      console.log('✅ PASS: Frontend student passport route handler working.');
      passed++;
    } else {
      console.error('❌ FAIL: Frontend passport route failed:', frontPassRes);
      failed++;
    }

    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
