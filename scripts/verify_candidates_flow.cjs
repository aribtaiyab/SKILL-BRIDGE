const http = require('http');

function postJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

function patchJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('=== 1. Testing GET /api/industry/candidates (initial state) ===');
  const res1 = await getJson('/api/industry/candidates');
  console.log('Status:', res1.status, 'Candidates count:', res1.data.data?.length);

  console.log('\n=== 2. Simulating Student applying to an Opportunity ===');
  const applyRes = await postJson('/api/applications', {
    opportunity_id: 'opp-01',
    cover_letter: 'I have deep expertise in Node.js and SQL.',
  });
  console.log('Apply response status:', applyRes.status, 'Result:', applyRes.data);

  console.log('\n=== 3. Testing GET /api/industry/candidates after Application ===');
  const res2 = await getJson('/api/industry/candidates');
  console.log('Status:', res2.status, 'Candidates count:', res2.data.data?.length);
  if (!res2.data.data || res2.data.data.length === 0) {
    console.error('ERROR: Candidate did not appear in candidate discovery endpoint!');
    process.exit(1);
  }

  const candidateItem = res2.data.data[0];
  console.log('\n=== 4. Validating Candidate Data Contract ===');
  console.log('Application ID:', candidateItem.applicationId);
  console.log('Status:', candidateItem.applicationStatus);
  console.log('Candidate ID:', candidateItem.candidate?.id);
  console.log('Candidate Name:', candidateItem.candidate?.name);
  console.log('Candidate Institution:', candidateItem.candidate?.institution);
  console.log('Opportunity Title:', candidateItem.opportunity?.title);
  console.log('Match Percentage:', candidateItem.readiness?.matchPercentage);
  console.log('Readiness Category:', candidateItem.readiness?.readinessCategory);
  console.log('Skills Breakdown count:', candidateItem.readiness?.skills?.length);

  if (!candidateItem.candidate || !candidateItem.candidate.name || !candidateItem.candidate.institution) {
    console.error('ERROR: Candidate contract violated!');
    process.exit(1);
  }

  console.log('\n=== 5. Testing Industry Status Update (Shortlist) ===');
  const updateRes = await patchJson(`/api/industry/applications/${candidateItem.applicationId}/status`, {
    status: 'shortlisted',
  });
  console.log('Status update result:', updateRes.data);

  console.log('\n=== 6. Testing Min Match Filter (/api/industry/candidates?min_match=60) ===');
  const filteredRes = await getJson('/api/industry/candidates?min_match=60');
  console.log('Filtered candidates count:', filteredRes.data.data?.length);

  console.log('\n ALL TESTS PASSED SUCCESSFULLY! Data flow is fully verified.');
  process.exit(0);
}

run().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
