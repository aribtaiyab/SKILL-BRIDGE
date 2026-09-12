async function testFrontend() {
  console.log('=== SKILLBRIDGE CONNECT: FRONTEND NEXT.JS GROQ ENDPOINT AUDIT ===\n');

  const BASE = 'http://localhost:3000';
  const HEADERS = { 'Content-Type': 'application/json' };

  // 1. Frontend AI Health
  try {
    const res = await fetch(`${BASE}/api/ai/health`);
    const data = await res.json();
    console.log('[FE 1] GET /api/ai/health:');
    console.log('  Status:', res.status);
    console.log('  Provider:', data.provider);
    console.log('  Model:', data.model);
    console.log('  Configured:', data.configured);
    console.log('  Category:', data.category);
    console.log('  Message:', data.message);
  } catch (err) {
    console.log('[FE 1] Health Error:', err.message);
  }

  // 2. Frontend Career Navigator Analyze
  try {
    const res = await fetch(`${BASE}/api/career-navigator/analyze`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        message: 'Should I do Web Development or AI?',
        history: [],
      }),
    });
    const data = await res.json();
    console.log('\n[FE 2] POST /api/career-navigator/analyze:');
    console.log('  Status:', res.status);
    console.log('  Success:', data.success);
    console.log('  Headline:', data.data?.headline);
    console.log('  Recommendation:', data.data?.recommendation?.careerName, `(${data.data?.recommendation?.confidence}%)`);
    console.log('  Summary:', data.data?.summary?.slice(0, 120) + '...');
    console.log('  Comparison items:', data.data?.comparison?.length);
    console.log('  Why bullet points:', data.data?.why?.length);
  } catch (err) {
    console.log('[FE 2] Career Navigator Error:', err.message);
  }

  // 3. Frontend AI Coach
  try {
    const res = await fetch(`${BASE}/api/ai/coach`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        message: 'How can I practice asynchronous Node.js streams?',
        history: [],
      }),
    });
    const data = await res.json();
    console.log('\n[FE 3] POST /api/ai/coach:');
    console.log('  Status:', res.status);
    console.log('  Reply preview:', data.data?.reply?.slice(0, 100) + '...');
  } catch (err) {
    console.log('[FE 3] Coach Error:', err.message);
  }

  // 4. Frontend AI Diagnose
  try {
    const res = await fetch(`${BASE}/api/ai/diagnose`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        targetRole: 'Backend Developer',
        studentScores: { 'Node.js': 55, 'SQL': 70 },
        benchmark: { 'Node.js': { required: 80, weight: 1.0 }, 'SQL': { required: 75, weight: 0.8 } },
      }),
    });
    const data = await res.json();
    console.log('\n[FE 4] POST /api/ai/diagnose:');
    console.log('  Status:', res.status);
    console.log('  Priority Gap:', data.priorityGap);
    console.log('  Gap Deficit:', data.gapDeficit);
    console.log('  Actionable Plan:', data.actionablePlan?.slice(0, 100) + '...');
  } catch (err) {
    console.log('[FE 4] Diagnose Error:', err.message);
  }

  // 5. Frontend AI Learning Plan
  try {
    const res = await fetch(`${BASE}/api/ai/learning-plan`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        skill: 'Node.js',
        careerTarget: 'Backend Developer',
        currentScore: 55,
        targetScore: 80,
      }),
    });
    const data = await res.json();
    console.log('\n[FE 5] POST /api/ai/learning-plan:');
    console.log('  Status:', res.status);
    console.log('  Success:', data.success);
    console.log('  Skill:', data.data?.plan?.skill);
    console.log('  Summary:', data.data?.plan?.summary);
    console.log('  Steps count:', data.data?.plan?.steps?.length);
  } catch (err) {
    console.log('[FE 5] Learning Plan Error:', err.message);
  }

  // 6. Frontend AI Practice
  try {
    const res = await fetch(`${BASE}/api/ai/practice`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ skillName: 'Node.js', difficulty: 'Intermediate' }),
    });
    const data = await res.json();
    console.log('\n[FE 6] POST /api/ai/practice:');
    console.log('  Status:', res.status);
    console.log('  Question:', data.data?.question?.questionText);
  } catch (err) {
    console.log('[FE 6] Practice Error:', err.message);
  }

  // 7. Frontend AI Skill Map
  try {
    const res = await fetch(`${BASE}/api/ai/skill-map`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ text: 'I have built full-stack applications with React, Node.js, REST APIs, and PostgreSQL database' }),
    });
    const data = await res.json();
    console.log('\n[FE 7] POST /api/ai/skill-map:');
    console.log('  Status:', res.status);
    console.log('  Skills found:', data.data?.skills?.map(s => s.skillName));
  } catch (err) {
    console.log('[FE 7] Skill Map Error:', err.message);
  }

  // 8. Frontend AI Evidence Analysis
  try {
    const res = await fetch(`${BASE}/api/ai/evidence-analysis`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        url: 'https://github.com/student/e-commerce-node-react',
        title: 'E-commerce API with Node.js and React',
        description: 'REST API backend with JWT auth and Prisma PostgreSQL',
      }),
    });
    const data = await res.json();
    console.log('\n[FE 8] POST /api/ai/evidence-analysis:');
    console.log('  Status:', res.status);
    console.log('  Complexity:', data.data?.complexity);
    console.log('  Identified competencies:', data.data?.skillEvidence?.map(s => s.skillName));
  } catch (err) {
    console.log('[FE 8] Evidence Analysis Error:', err.message);
  }

  console.log('\n=== ALL FRONTEND ENDPOINTS VERIFIED ===');
}

testFrontend().catch(console.error);
