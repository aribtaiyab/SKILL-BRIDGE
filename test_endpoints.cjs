const http = require('http');

const endpoints = [
  { path: '/api/health', method: 'GET' },
  { path: '/api/student/profile', method: 'GET' },
  { path: '/api/student/career-target', method: 'GET' },
  { path: '/api/student/skills', method: 'GET' },
  { path: '/api/student/skill-gaps', method: 'GET' },
  { path: '/api/student/opportunities', method: 'GET' },
  { path: '/api/student/evidence', method: 'GET' },
  { path: '/api/student/projects', method: 'GET' },
  { path: '/api/student/passport', method: 'GET' },
  { path: '/api/student/progress', method: 'GET' },
  { path: '/api/opportunities', method: 'GET' },
  { path: '/api/career-navigator/history', method: 'GET' },
  { path: '/api/academician/students', method: 'GET' },
  { path: '/api/academician/mentorships', method: 'GET' },
  { path: '/api/academician/workshops', method: 'GET' },
  { path: '/api/industry/opportunities', method: 'GET' },
  { path: '/api/industry/candidates', method: 'GET' },
  { path: '/api/industry/insights', method: 'GET' },
  { 
    path: '/api/career-navigator/analyze', 
    method: 'POST',
    body: JSON.stringify({ query: 'AI or Web Development?' })
  },
  { 
    path: '/api/career-navigator/analyze', 
    method: 'POST',
    body: JSON.stringify({ query: 'Full Stack or Data Science?' })
  },
  { 
    path: '/api/career-navigator/analyze', 
    method: 'POST',
    body: JSON.stringify({ query: 'Can I switch to AI?' })
  },
  { 
    path: '/api/career-navigator/analyze', 
    method: 'POST',
    body: JSON.stringify({ query: 'Should I learn Java or Python?' })
  },
];

async function runTests() {
  console.log('=== RUNNING BACKEND ENDPOINT AUDIT (PORT 5000) ===\n');
  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    const start = Date.now();
    try {
      const res = await new Promise((resolve, reject) => {
        const role = ep.path.includes('academician') ? 'academician' : ep.path.includes('industry') ? 'industry' : 'student';
        const req = http.request({
          hostname: 'localhost',
          port: 5000,
          path: ep.path,
          method: ep.method,
          headers: {
            'Content-Type': 'application/json',
            'x-demo-mode': 'true',
            'x-demo-role': role,
            ...(ep.body ? { 'Content-Length': Buffer.byteLength(ep.body) } : {})
          },
          timeout: 8000
        }, (response) => {
          let data = '';
          response.on('data', chunk => data += chunk);
          response.on('end', () => resolve({ status: response.statusCode, data }));
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timed out'));
        });

        if (ep.body) req.write(ep.body);
        req.end();
      });

      const duration = Date.now() - start;
      if (res.status >= 200 && res.status < 400) {
        let json;
        try { json = JSON.parse(res.data); } catch (e) {}
        console.log(`[PASS] (${duration}ms) [HTTP ${res.status}] ${ep.method} ${ep.path} -> success: ${json?.success}`);
        if (ep.path === '/api/career-navigator/analyze') {
          console.log(`       Recommendation: "${json?.data?.headline || json?.data?.recommendation?.careerName}"`);
        }
        passed++;
      } else {
        console.error(`[FAIL] (${duration}ms) [HTTP ${res.status}] ${ep.method} ${ep.path} -> Body: ${res.data.slice(0, 150)}`);
        failed++;
      }
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`[ERROR] (${duration}ms) ${ep.method} ${ep.path} -> ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
}

runTests();
