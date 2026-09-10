const http = require('http');
const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../backend/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hegueovimarmwihxxwbj.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Gg_ieV30Gv2LU0lH7gzA0g_B9J0NGat';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

function postJson(path, body, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('=== STAGE 4 & 5 COMPREHENSIVE VERIFICATION ===\n');

  // Test 1: Ask "Full Stack or Data Science?"
  console.log('--- TEST 1: Question 1: "Full Stack or Data Science?" ---');
  const res1 = await postJson('/api/career-navigator/analyze', {
    message: 'Full Stack or Data Science?',
    query: 'Full Stack or Data Science?'
  });
  console.log('Status:', res1.status);
  console.log('Top Pick:', res1.body.data?.recommendation?.careerName);
  console.log('Top Pick Confidence:', res1.body.data?.recommendation?.confidence);
  console.log('Comparison Tracks:', res1.body.data?.comparison?.map(c => c.careerName));
  console.log('Headline:', res1.body.data?.headline);
  console.log('Summary:', res1.body.data?.summary);
  console.log('Is From Fallback:', res1.body.data?.isFromFallback);
  console.log('Fallback Notice:', res1.body.data?.fallbackNotice);

  // Test 2: Ask "Should I learn Java or Python?"
  console.log('\n--- TEST 2: Question 2: "Should I learn Java or Python?" ---');
  const res2 = await postJson('/api/career-navigator/analyze', {
    message: 'Should I learn Java or Python?',
    query: 'Should I learn Java or Python?'
  });
  console.log('Status:', res2.status);
  console.log('Top Pick:', res2.body.data?.recommendation?.careerName);
  console.log('Top Pick Confidence:', res2.body.data?.recommendation?.confidence);
  console.log('Comparison Tracks:', res2.body.data?.comparison?.map(c => c.careerName));
  console.log('Headline:', res2.body.data?.headline);
  console.log('Summary:', res2.body.data?.summary);
  console.log('Is From Fallback:', res2.body.data?.isFromFallback);
  console.log('Fallback Notice:', res2.body.data?.fallbackNotice);

  // Verification of distinctness
  console.log('\n--- VERIFICATION OF DISTINCTNESS ---');
  const areDifferentHeadlines = res1.body.data?.headline !== res2.body.data?.headline;
  const areDifferentTracks = JSON.stringify(res1.body.data?.comparison?.map(c => c.careerSlug)) !== JSON.stringify(res2.body.data?.comparison?.map(c => c.careerSlug));
  console.log('Different headlines between Q1 and Q2:', areDifferentHeadlines);
  console.log('Different comparison tracks between Q1 and Q2:', areDifferentTracks);

  // Test 3: Authenticated user with real verified skills -> test student context & backend math
  console.log('\n--- TEST 3: Student with Real Verified Skills & Backend Math Verification ---');
  const testEmail = `stage4_student_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const createRes = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { role: 'student', full_name: 'Devika Patel' }
  });

  if (createRes.error) {
    throw new Error('Could not create test user: ' + createRes.error.message);
  }
  const userId = createRes.data.user.id;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const loginRes = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (loginRes.error || !loginRes.data.session) {
    throw new Error('Sign in failed: ' + loginRes.error?.message);
  }
  const token = loginRes.data.session.access_token;
  console.log('Created real test student:', testEmail, 'User ID:', userId, 'Token length:', token.length);

  // Set Career Target to Backend Developer
  await postJson('/api/student/career-target', {
    target_career_id: '30000000-0000-0000-0000-000000000001'
  }, token);

  // Check Navigator before any skills: verified skills = 0, readiness = 0, confidence = 0
  const navBeforeSkills = await postJson('/api/career-navigator/analyze', {
    message: 'Full Stack or Data Science?',
    query: 'Full Stack or Data Science?'
  }, token);
  console.log('\nNavigator Before Skills:');
  console.log('Headline:', navBeforeSkills.body.data?.headline);
  console.log('Recommendation:', navBeforeSkills.body.data?.recommendation?.careerName);
  console.log('Backend Confidence %:', navBeforeSkills.body.data?.recommendation?.confidence);
  console.log('Fit scores:', navBeforeSkills.body.data?.comparison?.map(c => `${c.careerName}: ${c.fitScore}%`));

  // Declare an unverified skill: Node.js = 90
  await postJson('/api/student/skills', {
    skill_id: '40000000-0000-0000-0000-000000000001',
    skill_name: 'Node.js',
    self_declared_level: 90,
    verification_status: 'self_declared'
  }, token);

  // Confirm unverified self-rating does NOT change Navigator fitScore or confidence
  const navAfterSelfRate = await postJson('/api/career-navigator/analyze', {
    message: 'Full Stack or Data Science?',
    query: 'Full Stack or Data Science?'
  }, token);
  console.log('\nNavigator After Self-Rating (unverified):');
  console.log('Backend Confidence % (MUST remain 0):', navAfterSelfRate.body.data?.recommendation?.confidence);

  // Now verify Node.js with real assessment score = 80
  await postJson('/api/student/skills', {
    skill_id: '40000000-0000-0000-0000-000000000001',
    skill_name: 'Node.js',
    current_level: 80,
    self_declared_level: 90,
    verification_status: 'assessment_verified'
  }, token);

  // Query Navigator again: verified skills = [Node.js: 80]
  // In TRACK_REQUIREMENTS['full-stack']: Node.js has weight 25.
  // Expected fitScore for Full Stack = round((80 * 25) / 100) = 20%.
  // In TRACK_REQUIREMENTS['ai-ml']: Node.js is not in TRACK_REQUIREMENTS['ai-ml'].
  // Expected fitScore for AI/ML = 0%.
  const navAfterVerifiedSkill = await postJson('/api/career-navigator/analyze', {
    message: 'Full Stack or Data Science?',
    query: 'Full Stack or Data Science?'
  }, token);
  console.log('\nNavigator After Verified Assessment (Node.js verified at 80):');
  console.log('Headline:', navAfterVerifiedSkill.body.data?.headline);
  console.log('Top Pick:', navAfterVerifiedSkill.body.data?.recommendation?.careerName);
  console.log('Top Pick Confidence %:', navAfterVerifiedSkill.body.data?.recommendation?.confidence);
  console.log('Fit scores breakdown:', navAfterVerifiedSkill.body.data?.comparison?.map(c => `${c.careerName}: ${c.fitScore}% (Advantage: ${c.skillAdvantage})`));
  console.log('Strengths:', navAfterVerifiedSkill.body.data?.strengths);

  const fullStackItem = navAfterVerifiedSkill.body.data?.comparison?.find(c => c.careerSlug === 'full-stack');
  const aimlItem = navAfterVerifiedSkill.body.data?.comparison?.find(c => c.careerSlug === 'ai-ml');

  console.log('\n--- FORMULA VALIDATION (STAGE 5) ---');
  console.log('Full Stack Fit Score (expected 20% from 80 * 0.25):', fullStackItem?.fitScore);
  console.log('AI/ML Fit Score (expected 0%):', aimlItem?.fitScore);
  console.log('Formula match verified:', fullStackItem?.fitScore === 20 && aimlItem?.fitScore === 0);
  console.log('Top pick confidence matches backend formula exactly:', navAfterVerifiedSkill.body.data?.recommendation?.confidence === fullStackItem?.fitScore);

  // Clean up test user
  await admin.auth.admin.deleteUser(userId);
  console.log('Test user cleaned up successfully.');
}

run().catch(console.error);
