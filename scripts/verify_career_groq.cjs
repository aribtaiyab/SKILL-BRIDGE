const BASE = 'http://localhost:5000';
const DEMO = { 'x-demo-mode': 'true', 'x-demo-role': 'student', 'Content-Type': 'application/json' };

async function run() {
  console.log('=== VERIFICATION RUN ===');

  // 1. Career Readiness Check ("Full Stack Engineer")
  const r1 = await fetch(BASE + '/api/student/readiness?career_id=30000000-0000-0000-0000-000000000003', { headers: DEMO });
  const d1 = await r1.json();
  console.log('\n[1] GET /api/student/readiness?career_id=FullStack:');
  console.log('    Status:', r1.status);
  console.log('    careerName:', d1.data?.careerName);
  console.log('    title:', d1.data?.title);
  console.log('    description:', d1.data?.description);
  console.log('    skills count:', d1.data?.skills?.length);
  console.log('    skills:', d1.data?.skills?.map(s => `${s.skillName} (Req: ${s.requiredLevel} pts, ${s.importance})`));

  // 2. Career Benchmark Endpoint Check
  const r2 = await fetch(BASE + '/api/careers/30000000-0000-0000-0000-000000000003/benchmark');
  const d2 = await r2.json();
  console.log('\n[2] GET /api/careers/:id/benchmark:');
  console.log('    Status:', r2.status);
  console.log('    title:', d2.data?.title);
  console.log('    description:', d2.data?.description);
  console.log('    requiredSkills count:', d2.data?.requiredSkills?.length);

  // 3. 404 on Unknown Career Check
  const r3 = await fetch(BASE + '/api/student/readiness?career_id=unknown-uuid-999', { headers: DEMO });
  const d3 = await r3.json();
  console.log('\n[3] 404 on Unknown Career:');
  console.log('    Status:', r3.status);
  console.log('    Response body:', JSON.stringify(d3));

  // 4. Groq AI Integration Check (Rating Combo A)
  const r4 = await fetch(BASE + '/api/student/self-ratings', {
    method: 'POST',
    headers: DEMO,
    body: JSON.stringify({
      career_target_id: '30000000-0000-0000-0000-000000000003',
      ratings: [
        { skill_id: 'skill-fullstack-1', self_rating_label: 'strong' },
        { skill_id: 'skill-fullstack-2', self_rating_label: 'strong' },
        { skill_id: 'skill-fullstack-3', self_rating_label: 'basic' },
        { skill_id: 'skill-fullstack-4', self_rating_label: 'never_used' }
      ]
    })
  });
  const d4 = await r4.json();
  console.log('\n[4] Groq AI Self-Rating Analysis:');
  console.log('    Status:', r4.status);
  console.log('    Stored count:', d4.data?.stored);
  console.log('    AI Narrative Summary:');
  console.log('    "', d4.data?.summary, '"');
}

run().catch(console.error);
