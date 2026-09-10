const http = require('http');

async function getReadiness(port, careerId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: `/api/student/readiness?career_id=${careerId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-mode': 'true',
        'x-demo-role': 'student',
      }
    };
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
    req.end();
  });
}

async function runStage1() {
  console.log('================================================================');
  console.log('STAGE 1: VERIFYING REAL PER-CAREER DATA FETCHING (NETWORK & API)');
  console.log('================================================================\n');

  const backendDevId = '30000000-0000-0000-0000-000000000001';
  const dataAnalystId = '30000000-0000-0000-0000-000000000006';

  // Step 1: Select "Backend Developer"
  console.log('[STEP 1] Selecting "Backend Developer" (ID:', backendDevId, ')');
  const res1 = await getReadiness(5000, backendDevId);
  console.log('  HTTP Request: GET http://localhost:5000/api/student/readiness?career_id=' + backendDevId);
  console.log('  HTTP Status:', res1.status);
  console.log('  Career Name:', res1.data?.data?.careerName);
  console.log('  Readiness %:', res1.data?.data?.readinessPercentage + '%');
  console.log('  Readiness Category:', res1.data?.data?.readinessCategory);
  console.log('  Diagnostic Priority:', res1.data?.data?.priorityGap ? `${res1.data.data.priorityGap.skillName} (${res1.data.data.priorityGap.gap} pts deficit, ${res1.data.data.priorityGap.importance} priority)` : 'None');
  console.log('  Recommended Action:', res1.data?.data?.explanation?.recommendedAction);
  console.log('  Required Skills Count:', res1.data?.data?.skills?.length);
  console.log('  Required Skills List:');
  res1.data?.data?.skills?.forEach(s => {
    console.log(`    - ${s.skillName}: Required = ${s.requiredLevel}, Current = ${s.currentLevel}, Gap = ${s.gap}, Status = ${s.status}, Assessed = ${s.isAssessed}`);
  });

  // Step 2: Select "Data Analyst"
  console.log('\n[STEP 2] Selecting "Data Analyst" (ID:', dataAnalystId, ')');
  const res2 = await getReadiness(5000, dataAnalystId);
  console.log('  HTTP Request: GET http://localhost:5000/api/student/readiness?career_id=' + dataAnalystId);
  console.log('  HTTP Status:', res2.status);
  console.log('  Career Name:', res2.data?.data?.careerName);
  console.log('  Readiness %:', res2.data?.data?.readinessPercentage + '%');
  console.log('  Readiness Category:', res2.data?.data?.readinessCategory);
  console.log('  Diagnostic Priority:', res2.data?.data?.priorityGap ? `${res2.data.data.priorityGap.skillName} (${res2.data.data.priorityGap.gap} pts deficit, ${res2.data.data.priorityGap.importance} priority)` : 'None');
  console.log('  Recommended Action:', res2.data?.data?.explanation?.recommendedAction);
  console.log('  Required Skills Count:', res2.data?.data?.skills?.length);
  console.log('  Required Skills List:');
  res2.data?.data?.skills?.forEach(s => {
    console.log(`    - ${s.skillName}: Required = ${s.requiredLevel}, Current = ${s.currentLevel}, Gap = ${s.gap}, Status = ${s.status}, Assessed = ${s.isAssessed}`);
  });

  // Step 3: Select "Backend Developer" AGAIN
  console.log('\n[STEP 3] Selecting "Backend Developer" AGAIN (ID:', backendDevId, ')');
  const res3 = await getReadiness(5000, backendDevId);
  console.log('  HTTP Request: GET http://localhost:5000/api/student/readiness?career_id=' + backendDevId);
  console.log('  HTTP Status:', res3.status);
  console.log('  Career Name:', res3.data?.data?.careerName);
  console.log('  Readiness %:', res3.data?.data?.readinessPercentage + '%');
  console.log('  Readiness Category:', res3.data?.data?.readinessCategory);
  console.log('  Diagnostic Priority:', res3.data?.data?.priorityGap ? `${res3.data.data.priorityGap.skillName} (${res3.data.data.priorityGap.gap} pts deficit)` : 'None');

  // Comparison Assertion
  const isDifferent = JSON.stringify(res1.data?.data?.skills) !== JSON.stringify(res2.data?.data?.skills);
  const isIdentical = JSON.stringify(res1.data?.data) === JSON.stringify(res3.data?.data);

  console.log('\n[ASSERTIONS]');
  console.log('  1. Are Data Analyst skills genuinely different from Backend Developer?', isDifferent ? 'YES (PASS)' : 'NO (FAIL)');
  console.log('  2. Are repeat Backend Developer results 100% deterministic & identical?', isIdentical ? 'YES (PASS)' : 'NO (FAIL)');
  
  if (isDifferent && isIdentical) {
    console.log('\n>>> STAGE 1 VERIFICATION RESULT: PASS <<<');
  } else {
    console.log('\n>>> STAGE 1 VERIFICATION RESULT: FAIL <<<');
  }
}

runStage1().catch(console.error);
