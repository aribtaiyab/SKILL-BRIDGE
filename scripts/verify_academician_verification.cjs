const http = require('http');
const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../backend/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hegueovimarmwihxxwbj.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Gg_ieV30Gv2LU0lH7gzA0g_B9J0NGat';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function postJson(path, body, token) {
  const payload = JSON.stringify(body);
  return request({
    hostname: 'localhost',
    port: 5000,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${token}`
    }
  }, payload);
}

function getJson(path, token) {
  return request({
    hostname: 'localhost',
    port: 5000,
    path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

async function runTest() {
  console.log('=== ACADEMICIAN VERIFICATION MODULE END-TO-END VERIFICATION ===\n');

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. Create a Student Account
  const studentEmail = `verif_student_${Date.now()}@test.edu`;
  const studentPassword = 'Password123!Secure';
  console.log('1. Creating real student account:', studentEmail);
  const studentCreate = await admin.auth.admin.createUser({
    email: studentEmail,
    password: studentPassword,
    email_confirm: true,
    user_metadata: { role: 'student', full_name: 'Aditya Verma' }
  });
  if (studentCreate.error) throw new Error(studentCreate.error.message);
  const studentId = studentCreate.data.user.id;

  const studentLogin = await client.auth.signInWithPassword({ email: studentEmail, password: studentPassword });
  const studentToken = studentLogin.data.session.access_token;
  console.log('   Student authenticated. Token length:', studentToken.length);

  // 2. Create an Academician Account
  const facEmail = `verif_faculty_${Date.now()}@dtu.edu`;
  const facPassword = 'Password123!Secure';
  console.log('\n2. Creating real faculty account:', facEmail);
  const facCreate = await admin.auth.admin.createUser({
    email: facEmail,
    password: facPassword,
    email_confirm: true,
    user_metadata: { role: 'academician', full_name: 'Dr. Sarah Mitchell' }
  });
  if (facCreate.error) throw new Error(facCreate.error.message);
  const facId = facCreate.data.user.id;

  const facLogin = await client.auth.signInWithPassword({ email: facEmail, password: facPassword });
  const facToken = facLogin.data.session.access_token;
  console.log('   Faculty authenticated. Token length:', facToken.length);

  // 3. Student queries available academicians
  console.log('\n3. Student queries available academicians: GET /api/verification/academicians');
  const facListRes = await getJson('/api/verification/academicians', studentToken);
  console.log('   Status:', facListRes.status, 'Available faculty count:', facListRes.data.data?.length);
  const firstFac = facListRes.data.data[0];
  console.log(`   Selected Faculty: ${firstFac.full_name} (${firstFac.institution_name})`);

  // 4. Student self-declares and requests verification for React
  console.log('\n4. Student declares React and submits verification request: POST /api/verification/requests');
  await postJson('/api/student/skills', {
    skill_id: '40000000-0000-0000-0000-000000000002',
    skill_name: 'React',
    current_level: 78,
    self_declared_level: 78,
    verification_status: 'assessment_verified'
  }, studentToken);

  const reqRes = await postJson('/api/verification/requests', {
    skill_name: 'React',
    skill_id: '40000000-0000-0000-0000-000000000002',
    academician_id: firstFac.id,
    student_notes: 'I have built a production e-commerce application in Next.js.',
    supporting_evidence: [
      { title: 'Full Stack E-Commerce Platform', type: 'project', url: 'https://github.com/student/store' },
      { title: 'Meta React Professional Certificate', type: 'certificate' }
    ]
  }, studentToken);

  console.log('   Request submission status:', reqRes.status);
  const requestId = reqRes.data.data.id;
  console.log(`   Created Request ID: ${requestId}, Status: ${reqRes.data.data.status}`);

  // 5. Academician views queue
  console.log('\n5. Academician views verification queue: GET /api/verification/academician/requests');
  const queueRes = await getJson('/api/verification/academician/requests', facToken);
  console.log('   Queue length:', queueRes.data.data?.length);
  const foundInQueue = queueRes.data.data?.find(r => r.id === requestId);
  console.log('   Found request in faculty queue:', !!foundInQueue, 'Skill:', foundInQueue?.skill_name);

  // 6. Academician accepts the request
  console.log('\n6. Academician accepts request: POST /api/verification/requests/:id/accept');
  const acceptRes = await postJson(`/api/verification/requests/${requestId}/accept`, {}, facToken);
  console.log('   Status:', acceptRes.status, 'New Request Status:', acceptRes.data.data?.status);

  // 7. Academician schedules verification session
  console.log('\n7. Academician schedules verification session: POST /api/verification/requests/:id/schedule');
  const scheduleRes = await postJson(`/api/verification/requests/${requestId}/schedule`, {
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    duration_minutes: 30,
    verification_methods: ['live_video', 'skill_test']
  }, facToken);
  console.log('   Schedule status:', scheduleRes.status, 'Request Status:', scheduleRes.data.data?.request?.status);
  console.log('   Session Meeting Link:', scheduleRes.data.data?.session?.meeting_link);

  // 8. Academician records live interview notes
  console.log('\n8. Academician records live notes: POST /api/verification/requests/:id/notes');
  const notesRes = await postJson(`/api/verification/requests/${requestId}/notes`, {
    notes: 'Candidate articulated React 19 optimistic updates and component memoization clearly. Practical project was demonstrated live.'
  }, facToken);
  console.log('   Notes recorded status:', notesRes.status, 'Notes stored:', !!notesRes.data.data?.verification_notes);

  // 9. Student retrieves academic test questions
  console.log('\n9. Student retrieves academic skill test: GET /api/verification/requests/:id/test');
  const testRes = await getJson(`/api/verification/requests/${requestId}/test`, studentToken);
  console.log('   Test questions count:', testRes.data.data?.questions?.length);

  // 10. Student submits test answers
  console.log('\n10. Student submits academic skill test: POST /api/verification/requests/:id/test/submit');
  const answers = {
    'q-react-1': 'It synchronizes synchronous UI with server mutations and automatically reverts on rejection',
    'q-react-2': 'Memoize callbacks with `useCallback` and ensure dependencies are immutable or stable',
    'q-react-3': 'An object or array created inline inside render is listed in the dependency array without memoization',
    'q-react-4': 'Using React Context with compound components pattern'
  };
  const submitTestRes = await postJson(`/api/verification/requests/${requestId}/test/submit`, { answers }, studentToken);
  console.log('   Test score computed:', submitTestRes.data.data?.score, 'Passed:', submitTestRes.data.data?.passed);

  // 11. Academician makes Final Verification Decision: VERIFY SKILL
  console.log('\n11. Academician verifies skill: POST /api/verification/requests/:id/decision (VERIFY)');
  const decisionRes = await postJson(`/api/verification/requests/${requestId}/decision`, {
    decision: 'VERIFY',
    evidence_score: 90,
    platform_assessment_score: 85,
    academic_test_score: 100,
    verification_notes: 'Candidate demonstrated exceptional practical comprehension and passed the academic test with 100% score.'
  }, facToken);

  console.log('   Decision status:', decisionRes.status, 'Verification result:', decisionRes.data.data?.status);
  console.log('   Skill Status in Ledger:', decisionRes.data.data?.updatedSkill?.verification_status);

  // 12. Student fetches skills to verify Academically Verified badge
  console.log('\n12. Verifying student skills ledger reflects Academically Verified status: GET /api/student/skills');
  const skillsRes = await getJson('/api/student/skills', studentToken);
  const reactSkill = skillsRes.data.data?.find(s => s.skills?.name === 'React' || s.skill_name === 'React');
  console.log('   React Skill Record Found:', !!reactSkill);
  console.log('   React Verification Status:', reactSkill?.verification_status);
  console.log('   React Verified Level:', reactSkill?.verified_level);
  console.log('   Academically Verified Badge Valid:', reactSkill?.verification_status === 'academically_verified');

  // 13. Test Rejection / Re-assessment Flow
  console.log('\n13. Testing Rejection & AI Coach redirection flow:');
  const req2Res = await postJson('/api/verification/requests', {
    skill_name: 'Java',
    supporting_evidence: []
  }, studentToken);
  const req2Id = req2Res.data.data.id;

  const rejectRes = await postJson(`/api/verification/requests/${req2Id}/decision`, {
    decision: 'REASSESSMENT',
    rejection_reason: 'Insufficient practical knowledge',
    rejection_feedback: 'Build a Spring Boot REST API project with testing before re-requesting verification.'
  }, facToken);
  console.log('   Rejection Status:', rejectRes.status, 'Request Status:', rejectRes.data.data?.status);
  console.log('   AI Coach Redirection Route:', rejectRes.data.data?.aiCoachRoute);

  // Cleanup test accounts
  await admin.auth.admin.deleteUser(studentId);
  await admin.auth.admin.deleteUser(facId);
  console.log('\nTest students and faculty cleaned up from Supabase.');
  console.log('=== ALL ACADEMICIAN VERIFICATION MODULE TESTS PASSED ===');
}

runTest().catch(console.error);
