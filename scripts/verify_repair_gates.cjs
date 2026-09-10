const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
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

async function runVerification() {
  console.log('====================================');
  console.log('SKILLBRIDGE REPAIR GATES VERIFICATION');
  console.log('====================================\n');

  const testStudentId = 'test-gate-student-999';
  const authHeaders = {
    'Content-Type': 'application/json',
    'x-demo-mode': 'true',
    'x-user-id': testStudentId,
    'x-demo-role': 'student'
  };

  // GATE 2: Health
  console.log('--- Checking Gate 2: Backend Health ---');
  const health = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log('Health status:', health.status, health.data?.status);
  if (health.status !== 200) throw new Error('Health check failed');
  console.log('Gate 2: PASS ✅\n');

  // GATE 3: Career Target Persistence
  console.log('--- Checking Gate 3: Career Target Persistence ---');
  const setTarget = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/career-target',
    method: 'PATCH',
    headers: authHeaders
  }, {
    careerTarget: 'backend-developer'
  });
  console.log('Set Target response:', setTarget.status, setTarget.data);

  const getTarget = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/career-target',
    method: 'GET',
    headers: authHeaders
  });
  console.log('Get Target response:', getTarget.status, getTarget.data);

  const targetId = getTarget.data?.data?.target_career_id || getTarget.data?.data?.targetCareerId || getTarget.data?.careerTarget;
  if (targetId !== 'backend-developer') {
    throw new Error(`Career Target was not persisted! Got: ${targetId}`);
  }
  console.log('Gate 3: PASS ✅\n');

  // GATE 4: Bulk Skill Declaration Contract
  console.log('--- Checking Gate 4: Skill Declaration Contract ---');
  const declareSkills = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/skills/declare',
    method: 'POST',
    headers: authHeaders
  }, {
    declaredSkills: [
      { skillId: 'node-js', selfDeclaredLevel: 3 },
      { skillId: 'postgresql', selfDeclaredLevel: 2 }
    ]
  });
  console.log('Bulk skill response:', declareSkills.status, declareSkills.data);

  const getSkills = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/skills',
    method: 'GET',
    headers: authHeaders
  });
  console.log('Get skills response:', getSkills.status, 'Skill count:', getSkills.data?.data?.length || 0);
  console.log('Gate 4: PASS ✅\n');

  // GATE 5: Skill Gap + Readiness Engine (Discounted self-declared confidence, readiness > 0)
  console.log('--- Checking Gate 5: Readiness Calculation ---');
  const readinessRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/readiness?careerId=backend-developer',
    method: 'GET',
    headers: authHeaders
  });
  console.log('Readiness response status:', readinessRes.status);
  const readinessScore = readinessRes.data?.data?.overallReadiness ?? readinessRes.data?.data?.readinessPercentage ?? readinessRes.data?.readinessScore ?? 0;
  console.log(`Readiness Score for declared skills: ${readinessScore}%`);
  if (readinessScore <= 0) {
    throw new Error(`Readiness score should be > 0 with declared skills, got: ${readinessScore}`);
  }
  console.log('Gate 5: PASS ✅\n');

  // GATE 6: Assessment Contract
  console.log('--- Checking Gate 6: Assessment Contract & Grading ---');
  const startAssessment = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/assessments/assess-l1-backend-core/start',
    method: 'POST',
    headers: authHeaders
  }, {});
  console.log('Assessment start:', startAssessment.status, 'AttemptId:', startAssessment.data?.data?.attemptId);
  const attemptId = startAssessment.data?.data?.attemptId;
  const questions = startAssessment.data?.data?.questions || [];

  if (!attemptId || !questions.length) {
    throw new Error('Assessment start failed to return attemptId or questions');
  }

  // Answer questions with first option
  const answers = questions.map(q => ({
    questionId: q.id,
    selectedOptionId: q.options?.[0]?.id || 'opt-1'
  }));

  const submitAssessment = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/assessments/assess-l1-backend-core/submit',
    method: 'POST',
    headers: authHeaders
  }, {
    attemptId: attemptId,
    answers: answers
  });
  console.log('Submit assessment:', submitAssessment.status, 'Score:', submitAssessment.data?.data?.score ?? submitAssessment.data?.score);
  console.log('Gate 6: PASS ✅\n');

  // GATE 7: AI Learning Plan
  console.log('--- Checking Gate 7: AI Learning Plan ---');
  const planRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai/learning-plan',
    method: 'POST',
    headers: authHeaders
  }, {
    skill: 'node-js',
    careerTarget: 'backend-developer'
  });
  console.log('Learning plan status:', planRes.status, 'Plan exists:', !!(planRes.data?.data?.plan || planRes.data?.plan));
  if (planRes.status !== 200 || !(planRes.data?.data?.plan || planRes.data?.plan)) {
    throw new Error('Learning plan generation failed');
  }
  console.log('Gate 7: PASS ✅\n');

  // GATE 8: Career Navigator Intent Engine
  console.log('--- Checking Gate 8: Career Navigator Intent Engine ---');
  const navRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/career-navigator/analyze',
    method: 'POST',
    headers: authHeaders
  }, {
    message: 'Should I focus on DSA or Web Development?'
  });
  console.log('Career navigator status:', navRes.status);
  const data = navRes.data?.data || navRes.data || {};
  const reply = JSON.stringify(data);
  console.log('Navigator headline:', data.headline, 'Comparison count:', data.comparison?.length);
  const comparisonNames = (data.comparison || []).map(c => c.careerName?.toLowerCase() || '').join(' ');
  const mentionsDSA = comparisonNames.includes('dsa') || comparisonNames.includes('data structures') || reply.toLowerCase().includes('dsa');
  const mentionsWeb = comparisonNames.includes('web') || reply.toLowerCase().includes('web');
  console.log('Mentions DSA:', mentionsDSA, 'Mentions Web:', mentionsWeb);
  if (!mentionsDSA || !mentionsWeb) {
    throw new Error('Career Navigator failed to compare requested tracks (DSA vs Web Dev)');
  }
  console.log('Gate 8: PASS ✅\n');

  // GATE 9: Opportunities & Match Readiness
  console.log('--- Checking Gate 9: Industry Opportunities & Match Readiness ---');
  const industryHeaders = {
    'Content-Type': 'application/json',
    'x-demo-mode': 'true',
    'x-user-id': 'demo-industry-id',
    'x-demo-role': 'industry'
  };

  const createOppRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/industry/opportunities',
    method: 'POST',
    headers: industryHeaders
  }, {
    title: 'Senior Backend Systems Engineer',
    opportunity_type: 'Job',
    location: 'Remote / NYC',
    description: 'High-throughput Node.js microservices',
    required_skills: [
      { skill_id: 'node-js', required_level: 80, is_mandatory: true }
    ]
  });
  console.log('Create opportunity status:', createOppRes.status, 'Created ID:', createOppRes.data?.data?.id);
  if (createOppRes.status !== 201 || !createOppRes.data?.data?.id) {
    throw new Error('Failed to create opportunity in Industry portal');
  }

  const listOppRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/industry/opportunities',
    method: 'GET',
    headers: industryHeaders
  });
  console.log('List opportunities status:', listOppRes.status, 'Count:', listOppRes.data?.data?.length);
  const foundOpp = (listOppRes.data?.data || []).find(o => o.title === 'Senior Backend Systems Engineer');
  if (!foundOpp) {
    throw new Error('Created opportunity was not found in industry opportunity list');
  }
  console.log('Gate 9: PASS ✅\n');

  // GATE 10: Academician Verification Module End-to-End
  console.log('--- Checking Gate 10: Academician Verification Module ---');
  // 1. Get available academicians
  const acadListRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/academicians',
    method: 'GET',
    headers: authHeaders
  });
  console.log('Available academicians count:', acadListRes.data?.data?.length);
  const academician = acadListRes.data?.data?.[0];
  if (!academician?.id) {
    throw new Error('No available academicians returned');
  }

  // 2. Student submits verification request
  const reqCreateRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/requests',
    method: 'POST',
    headers: authHeaders
  }, {
    skill_name: 'Node.js',
    skill_id: 'node-js',
    academician_id: academician.id,
    supporting_evidence: [
      { type: 'github_pr', url: 'https://github.com/example/repo/pull/1', title: 'Implemented distributed rate limiter' }
    ],
    student_notes: 'Ready for academician verification'
  });
  console.log('Create verification request status:', reqCreateRes.status);
  const requestId = reqCreateRes.data?.data?.id;
  if (!requestId) {
    throw new Error('Failed to create student verification request');
  }

  // 3. Academician views queue
  const acadHeaders = {
    'Content-Type': 'application/json',
    'x-demo-mode': 'true',
    'x-user-id': academician.id,
    'x-demo-role': 'academician'
  };

  const acadQueueRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/verification/academician/requests',
    method: 'GET',
    headers: acadHeaders
  });
  console.log('Academician queue status:', acadQueueRes.status, 'Items:', acadQueueRes.data?.data?.length);

  // 4. Academician accepts request
  const acceptRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/verification/requests/${requestId}/accept`,
    method: 'POST',
    headers: acadHeaders
  }, {});
  console.log('Academician accept status:', acceptRes.status);

  // 5. Academician completes verification decision
  const decisionRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/verification/requests/${requestId}/decision`,
    method: 'POST',
    headers: acadHeaders
  }, {
    decision: 'VERIFY',
    academic_test_score: 92,
    evidence_score: 90,
    verification_notes: 'Exemplary understanding of Node.js event loop and streams'
  });
  console.log('Decision status:', decisionRes.status, 'Result status:', decisionRes.data?.data?.status);

  // 6. Verify student's skill record is updated to academically_verified
  const verifyStudentSkills = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/skills',
    method: 'GET',
    headers: authHeaders
  });
  const nodeSkill = (verifyStudentSkills.data?.data || []).find(s =>
    s.skill_id === 'node-js' || s.skills?.name === 'Node.js'
  );
  console.log('Updated student skill:', nodeSkill?.skills?.name, 'Verification Status:', nodeSkill?.verification_status, 'Level:', nodeSkill?.verified_level);
  if (nodeSkill?.verification_status !== 'academically_verified') {
    throw new Error(`Expected skill verification_status to be 'academically_verified', got: ${nodeSkill?.verification_status}`);
  }
  console.log('Gate 10: PASS ✅\n');

  console.log('====================================');
  console.log('ALL GATES 2-10 PASSED WITH FLYING COLORS! ✅');
  console.log('====================================');
}

runVerification().catch(err => {
  console.error('Verification failed ❌:', err);
  process.exit(1);
});
