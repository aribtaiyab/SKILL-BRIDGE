const path = require('path');

async function testAll() {
  console.log('=== SKILLBRIDGE CONNECT: COMPREHENSIVE AI ENDPOINT RELIABILITY AUDIT ===\n');

  // Let's test Backend on port 5000 and Next.js on port 3000
  const BACKEND_URL = 'http://localhost:5000';
  const FRONTEND_URL = 'http://localhost:3000';
  const HEADERS = {
    'Content-Type': 'application/json',
    'x-demo-mode': 'true',
    'x-demo-role': 'student',
  };

  // Test 1: Backend Health
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/health`, { headers: HEADERS });
    const data = await res.json();
    console.log('[TEST 1] Backend /api/ai/health:');
    console.log('  Status:', res.status);
    console.log('  Provider:', data.provider);
    console.log('  Model:', data.model);
    console.log('  Configured:', data.configured);
    console.log('  Category:', data.category);
    console.log('  Message:', data.message);
  } catch (err) {
    console.log('[TEST 1] Backend health error:', err.message);
  }

  // Test 2: Backend Career Navigator Analyze
  try {
    const res = await fetch(`${BACKEND_URL}/api/career-navigator/analyze`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        query: 'Should I learn Full Stack or Data Science?',
        history: [],
      }),
    });
    const data = await res.json();
    console.log('\n[TEST 2] Backend /api/career-navigator/analyze:');
    console.log('  Status:', res.status);
    console.log('  Success:', data.success);
    console.log('  Intent:', data.data?.intent);
    console.log('  Headline:', data.data?.headline);
    console.log('  Recommendation:', data.data?.recommendation?.careerName, `(${data.data?.recommendation?.confidence}%)`);
    console.log('  Direct Answer:', data.data?.directAnswer?.slice(0, 100) + '...');
    console.log('  Why bullet count:', data.data?.why?.length);
    console.log('  Next steps count:', data.data?.nextSteps?.length);
  } catch (err) {
    console.log('[TEST 2] Backend Career Navigator error:', err.message);
  }

  // Test 3: Backend AI Coach Chat
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/coach`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        message: 'How do I master Node.js error handling?',
        history: [],
      }),
    });
    const data = await res.json();
    console.log('\n[TEST 3] Backend /api/ai/coach:');
    console.log('  Status:', res.status);
    console.log('  Reply:', data.data?.reply?.slice(0, 120) + '...');
    console.log('  Suggested questions:', data.data?.suggestedQuestions);
  } catch (err) {
    console.log('[TEST 3] Backend Coach error:', err.message);
  }

  // Test 4: Backend AI Diagnostic
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/diagnose`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        skillName: 'Node.js',
      }),
    });
    const data = await res.json();
    console.log('\n[TEST 4] Backend /api/ai/diagnose:');
    console.log('  Status:', res.status);
    console.log('  Skill:', data.data?.skill);
    console.log('  Gap:', data.data?.gap);
    console.log('  Summary:', data.data?.summary?.slice(0, 100) + '...');
  } catch (err) {
    console.log('[TEST 4] Backend Diagnose error:', err.message);
  }

  // Test 5: Backend AI Learning Plan
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/learning-plan`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        skillName: 'Node.js',
      }),
    });
    const data = await res.json();
    console.log('\n[TEST 5] Backend /api/ai/learning-plan:');
    console.log('  Status:', res.status);
    console.log('  Skill:', data.data?.plan?.skill);
    console.log('  Steps count:', data.data?.plan?.steps?.length);
    console.log('  Total Hours:', data.data?.plan?.estimatedTotalHours);
  } catch (err) {
    console.log('[TEST 5] Backend Learning Plan error:', err.message);
  }

  // Test 6: Backend Self-Ratings Narrative AI
  try {
    const res = await fetch(`${BACKEND_URL}/api/student/self-ratings`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        career_target_id: '30000000-0000-0000-0000-000000000003',
        ratings: [
          { skill_id: 'skill-fullstack-1', self_rating_label: 'strong' },
          { skill_id: 'skill-fullstack-2', self_rating_label: 'strong' },
          { skill_id: 'skill-fullstack-3', self_rating_label: 'basic' },
          { skill_id: 'skill-fullstack-4', self_rating_label: 'never_used' },
        ],
      }),
    });
    const data = await res.json();
    console.log('\n[TEST 6] Backend /api/student/self-ratings:');
    console.log('  Status:', res.status);
    console.log('  Stored count:', data.data?.stored);
    console.log('  AI Narrative Summary:', data.data?.summary);
  } catch (err) {
    console.log('[TEST 6] Backend Self-ratings narrative error:', err.message);
  }

  console.log('\n=== ALL TESTS FINISHED ===');
}

testAll().catch(console.error);
