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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
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

async function runStage2Verification() {
  console.log('=== STAGE 2 VERIFICATION START ===');
  
  // 1. Create a real confirmed student account in Supabase
  const testEmail = `stage2_student_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  console.log(`Creating test real user: ${testEmail}...`);
  const createRes = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { role: 'student', full_name: 'Stage 2 Real Student' }
  });

  if (createRes.error) {
    throw new Error('Could not create user: ' + createRes.error.message);
  }
  const userId = createRes.data.user.id;
  console.log(`Real student created: ${userId}`);

  // 2. Sign in to obtain a real Supabase access token
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const loginRes = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (loginRes.error || !loginRes.data.session) {
    throw new Error('Sign in failed: ' + loginRes.error?.message);
  }
  const token = loginRes.data.session.access_token;
  console.log(`Obtained real auth token (length: ${token.length})`);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const careerId = '30000000-0000-0000-0000-000000000001'; // Backend Developer

  // Step 1: Check baseline readiness before any self-rating or assessment
  console.log('\n[Step 1] Fetching initial readiness for Backend Developer...');
  const initReadinessRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/student/readiness?career_id=${careerId}`,
    method: 'GET',
    headers: authHeaders
  });

  console.log(`Initial Readiness Status: ${initReadinessRes.status}`);
  console.log(`Initial Readiness Percentage: ${initReadinessRes.data.data.readinessPercentage}%`);
  console.log(`Initial Category: ${initReadinessRes.data.data.readinessCategory}`);

  // Step 2: Submit a self-rating of "comfortable" for a skill (e.g. Node.js skill-backend-1)
  console.log('\n[Step 2] POST /api/student/self-ratings with rating "comfortable"...');
  const targetSkillId = 'skill-backend-1'; // Node.js in benchmark
  const selfRatingPayload = {
    career_target_id: careerId,
    ratings: [
      { skill_id: targetSkillId, self_rating_label: 'comfortable' }
    ]
  };

  const selfRatingRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/self-ratings',
    method: 'POST',
    headers: authHeaders
  }, selfRatingPayload);

  console.log(`Self-rating POST Status: ${selfRatingRes.status}`);
  console.log('Self-rating Response Body:', JSON.stringify(selfRatingRes.data));

  // Verify GET /api/student/self-ratings/:career_target_id
  const getSelfRatingsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/student/self-ratings/${careerId}`,
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Get Self-Ratings Status: ${getSelfRatingsRes.status}`);
  console.log('Stored Self-Ratings Body:', JSON.stringify(getSelfRatingsRes.data));

  // Step 3: Check readiness % AFTER self-rating — must remain 0% (NOT affected by self-rating)
  console.log('\n[Step 3] Fetching readiness AFTER self-rating...');
  const afterRatingReadinessRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/student/readiness?career_id=${careerId}`,
    method: 'GET',
    headers: authHeaders
  });
  const readinessAfter = afterRatingReadinessRes.data.data.readinessPercentage;
  console.log(`Readiness % After Self-Rating: ${readinessAfter}%`);
  if (readinessAfter === 0) {
    console.log('>>> EVIDENCE CONFIRMED: Self-rating is NOT included in Career Readiness % calculation (still 0%).');
  } else {
    console.error(`>>> FAILED: Self-rating leaked into Readiness % (got ${readinessAfter}%).`);
  }

  // Also test declaring a skill level (90/100) via /api/student/skills/declare and verify readiness remains 0%
  console.log('\n[Step 3b] Declaring a skill level (90/100) via /api/student/skills/declare...');
  const declareRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/skills/declare',
    method: 'POST',
    headers: authHeaders
  }, {
    declarations: [
      { skill_id: targetSkillId, self_declared_level: 90, skill_name: 'Node.js' }
    ]
  });
  console.log(`Declare Status: ${declareRes.status}`);

  const afterDeclareReadinessRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/student/readiness?career_id=${careerId}`,
    method: 'GET',
    headers: authHeaders
  });
  const readinessAfterDeclare = afterDeclareReadinessRes.data.data.readinessPercentage;
  console.log(`Readiness % After Declaring 90/100: ${readinessAfterDeclare}%`);
  const nodeSkill = afterDeclareReadinessRes.data.data.skills.find(s => s.skillId === targetSkillId || s.skillName.toLowerCase().includes('node'));
  console.log(`Node.js in readiness: isAssessed=${nodeSkill?.isAssessed}, verificationStatus=${nodeSkill?.verificationStatus}, currentLevel=${nodeSkill?.currentLevel}`);

  if (readinessAfterDeclare === 0 && !nodeSkill?.isAssessed) {
    console.log('>>> EVIDENCE CONFIRMED: Self-declared level (90) is marked as unassessed/unverified and readiness % remains 0%.');
  } else {
    console.error(`>>> FAILED: Self-declared level altered readiness % (got ${readinessAfterDeclare}%).`);
  }

  // Step 4: Complete a real assessment for Node.js
  console.log('\n[Step 4] Submitting assessment for Node.js (assess-l1-nodejs-loop)...');
  const startRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/assessments/assess-l1-nodejs-loop/start',
    method: 'POST',
    headers: authHeaders
  }, {});
  console.log(`Assessment Start Status: ${startRes.status}, Attempt ID: ${startRes.data?.data?.attemptId}`);

  // Submit assessment answers
  const submitRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/assessments/assess-l1-nodejs-loop/submit',
    method: 'POST',
    headers: authHeaders
  }, {
    attemptId: startRes.data?.data?.attemptId,
    answers: [
      { questionId: 'q1-node-loop', selectedOptionId: 'opt-1b' },
      { questionId: 'q2-async-promises', selectedOptionId: 'opt-2b' },
      { questionId: 'q3-sql-joins', selectedOptionId: 'opt-3b' },
      { questionId: 'q4-promise-handling', selectedOptionId: 'opt-4c' },
      { questionId: 'q5-git-rebase', selectedOptionId: 'opt-5a' }
    ]
  });
  console.log(`Assessment Submit Status: ${submitRes.status}`);
  console.log('Assessment Submit Result:', JSON.stringify(submitRes.data?.data));
  const verifiedScore = submitRes.data?.data?.score;

  // Step 5: Check readiness % AFTER assessment — must now reflect verified score
  console.log('\n[Step 5] Fetching readiness AFTER verified assessment...');
  const afterAssessReadinessRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/student/readiness?career_id=${careerId}`,
    method: 'GET',
    headers: authHeaders
  });
  const readinessAfterAssess = afterAssessReadinessRes.data.data.readinessPercentage;
  console.log(`Readiness % After Assessment: ${readinessAfterAssess}%`);
  const nodeSkillAfterAssess = afterAssessReadinessRes.data.data.skills.find(s => s.skillId === targetSkillId || s.skillName.toLowerCase().includes('node'));
  console.log('Skill After Assessment:', JSON.stringify(nodeSkillAfterAssess));

  if (readinessAfterAssess > 0 && nodeSkillAfterAssess?.isAssessed && nodeSkillAfterAssess?.verificationStatus === 'assessment_verified') {
    console.log(`>>> EVIDENCE CONFIRMED: Verified score (${verifiedScore}) is separated from self-rating, labeled 'assessment_verified', and now increases Readiness % to ${readinessAfterAssess}%.`);
  } else {
    console.error('>>> Assessment did not update verified readiness properly.');
  }

  // Cleanup test user
  await admin.auth.admin.deleteUser(userId);
  console.log(`Cleaned up test user: ${userId}`);

  console.log('\n=== STAGE 2 VERIFICATION COMPLETE ===');
}

runStage2Verification().catch(console.error);
