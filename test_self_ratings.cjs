const BASE = 'http://localhost:5000';
const DEMO = { 'x-demo-mode': 'true', 'x-demo-role': 'student', 'Content-Type': 'application/json' };

async function run() {
  // Test 1: unauthenticated should 401
  const noAuth = await fetch(BASE + '/api/student/self-ratings/test-career-id');
  console.log('[Test 1] GET /self-ratings no auth:', noAuth.status === 401 ? 'PASS (401)' : 'FAIL (' + noAuth.status + ')');

  // Test 2: GET with demo auth returns empty array
  const get = await fetch(BASE + '/api/student/self-ratings/30000000-0000-0000-0000-000000000003', { headers: DEMO });
  const getJson = await get.json();
  console.log('[Test 2] GET /self-ratings demo:', get.status === 200 && Array.isArray(getJson.data) ? 'PASS' : 'FAIL', JSON.stringify(getJson).slice(0,80));

  // Test 3: POST no auth -> 401
  const noAuthPost = await fetch(BASE + '/api/student/self-ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  console.log('[Test 3] POST /self-ratings no auth:', noAuthPost.status === 401 ? 'PASS (401)' : 'FAIL (' + noAuthPost.status + ')');

  // Test 4: POST invalid label -> 422
  const badLabel = await fetch(BASE + '/api/student/self-ratings', {
    method: 'POST', headers: DEMO,
    body: JSON.stringify({ career_target_id: 'abc', ratings: [{ skill_id: 'sk1', self_rating_label: 'expert' }] })
  });
  console.log('[Test 4] POST invalid label:', badLabel.status === 422 ? 'PASS (422)' : 'FAIL (' + badLabel.status + ')');

  // Test 5: POST valid ratings
  const valid = await fetch(BASE + '/api/student/self-ratings', {
    method: 'POST', headers: DEMO,
    body: JSON.stringify({ career_target_id: '30000000-0000-0000-0000-000000000003', ratings: [
      { skill_id: 'sk1', self_rating_label: 'comfortable' },
      { skill_id: 'sk2', self_rating_label: 'basic' }
    ]})
  });
  const validJson = await valid.json();
  console.log('[Test 5] POST valid ratings:', valid.status === 200 && validJson.success ? 'PASS' : 'FAIL', JSON.stringify(validJson).slice(0,80));

  // Test 6: readiness endpoint still returns same shape + new additive selfRatings field
  const readiness = await fetch(BASE + '/api/student/readiness?career_id=30000000-0000-0000-0000-000000000003', { headers: DEMO });
  const rJson = await readiness.json();
  console.log('[Test 6] GET /readiness still works:', readiness.status === 200 && rJson.data && rJson.data.readinessPercentage !== undefined ? 'PASS' : 'FAIL');
  console.log('         readinessPercentage:', rJson.data && rJson.data.readinessPercentage);
  console.log('         selfRatings field present:', Array.isArray(rJson.data && rJson.data.selfRatings) ? 'YES (array)' : 'NO / missing');
}
run().catch(console.error);
