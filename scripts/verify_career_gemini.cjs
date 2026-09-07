const BASE = 'http://localhost:3000';
const DEMO = { 'x-demo-mode': 'true', 'x-demo-role': 'student', 'Content-Type': 'application/json' };

async function run() {
  console.log('=== SKILLBRIDGE CONNECT: GEMINI & CAREER NAVIGATOR VERIFICATION ===\n');

  // 1. AI Health Check
  try {
    const rHealth = await fetch(BASE + '/api/ai/health');
    const dHealth = await rHealth.json();
    console.log('[1] GET /api/ai/health (Backend):');
    console.log('    Status:', rHealth.status);
    console.log('    Provider:', dHealth.provider);
    console.log('    Model:', dHealth.model);
    console.log('    Configured:', dHealth.configured);
  } catch (err) {
    console.log('[1] Backend AI Health: offline or unreachable:', err.message);
  }

  // 2. Career Targets List
  try {
    const rTargets = await fetch(BASE + '/api/student/career-targets', { headers: DEMO });
    const dTargets = await rTargets.json();
    console.log('\n[2] GET /api/student/career-targets:');
    console.log('    Status:', rTargets.status);
    console.log('    Targets Count:', dTargets.data?.length);
    if (dTargets.data?.length > 0) {
      console.log('    Tracks:', dTargets.data.map(t => `${t.name} (${t.slug})`).join(', '));
    }
  } catch (err) {
    console.log('[2] Career targets: offline or unreachable:', err.message);
  }

  // 3. Career Readiness Check ("Full Stack Engineer")
  try {
    const r1 = await fetch(BASE + '/api/student/readiness?career_id=30000000-0000-0000-0000-000000000003', { headers: DEMO });
    const d1 = await r1.json();
    console.log('\n[3] GET /api/student/readiness?career_id=FullStack:');
    console.log('    Status:', r1.status);
    console.log('    careerName:', d1.data?.careerName);
    console.log('    readinessPercentage:', d1.data?.readinessPercentage + '%');
    console.log('    skills count:', d1.data?.skills?.length);
    console.log('    skills with verificationStatus:', d1.data?.skills?.map(s => `${s.skillName}: ${s.currentLevel}/${s.requiredLevel} [${s.verificationStatus || 'unverified'}]`));
  } catch (err) {
    console.log('[3] Readiness: offline or unreachable:', err.message);
  }

  // 4. Career Navigator Analyze (Comparison & Gemini Reasoning)
  try {
    const rNav = await fetch(BASE + '/api/career-navigator/analyze', {
      method: 'POST',
      headers: DEMO,
      body: JSON.stringify({
        query: 'AI or Web Development?',
        history: []
      })
    });
    const dNav = await rNav.json();
    console.log('\n[4] POST /api/career-navigator/analyze (Backend):');
    console.log('    Status:', rNav.status);
    console.log('    Headline:', dNav.data?.headline);
    console.log('    Top Recommendation:', dNav.data?.recommendation?.careerName, `(${dNav.data?.recommendation?.confidence}%)`);
    console.log('    Comparison Paths:', dNav.data?.comparison?.map(c => `${c.careerName} (Fit: ${c.fitScore}%, Outlook: ${c.marketOutlook})`));
    console.log('    Next Steps:', dNav.data?.nextSteps);
  } catch (err) {
    console.log('[4] Career Navigator Analyze: offline or unreachable:', err.message);
  }

  console.log('\n=== VERIFICATION RUN COMPLETED ===');
}

run().catch(console.error);
