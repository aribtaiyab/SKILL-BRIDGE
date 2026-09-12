const http = require('http');

function getJson(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
  });
}

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

async function run() {
  console.log('=== STAGE 1: Testing Career Targets Catalog & Search ===');
  const careersRes = await getJson('/api/student/career-targets');
  console.log('Careers count:', careersRes.data?.data?.length);
  if (!careersRes.data?.data || careersRes.data.data.length < 5) {
    console.error('ERROR: Career targets catalog is insufficient!');
    process.exit(1);
  }

  const searchRes = await getJson('/api/student/career-targets?search=front');
  console.log('Search "front" count:', searchRes.data?.data?.length);
  const foundFrontend = searchRes.data?.data?.some(c => c.name.toLowerCase().includes('frontend'));
  if (!foundFrontend) {
    console.error('ERROR: Search for "front" failed to find Frontend Developer!');
    process.exit(1);
  }
  console.log('PASS: Career targets catalog and search working properly.');

  console.log('\n=== STAGE 2: Testing Career Skills Loading ===');
  const frontendTarget = careersRes.data.data.find(c => c.slug === 'frontend') || careersRes.data.data[0];
  const skillsRes = await getJson(`/api/student/career-target/skills?career_id=${frontendTarget.id}`);
  console.log('Skills count for', frontendTarget.name, ':', skillsRes.data?.skills?.length);
  if (!skillsRes.data?.skills || skillsRes.data.skills.length === 0) {
    console.error('ERROR: No skills loaded for career target!');
    process.exit(1);
  }
  console.log('Sample skills:', skillsRes.data.skills.map(s => s.skillName).join(', '));
  console.log('PASS: Career skills loaded successfully.');

  console.log('\n=== STAGE 3: Testing Skill Bulk Save (Self-Declared) ===');
  const savePayload = {
    careerTargetId: frontendTarget.id,
    skills: skillsRes.data.skills.map((s, i) => ({
      skillId: s.skillId,
      skillName: s.skillName,
      selfScore: i === 0 ? 95 : i === 1 ? 90 : 70,
    })),
  };
  const saveRes = await postJson('/api/student/career-target/skills', savePayload);
  console.log('Save result status:', saveRes.status, 'Success:', saveRes.data?.success);
  if (saveRes.status !== 200 || !saveRes.data?.success) {
    console.error('ERROR: Bulk save skills failed!', saveRes);
    process.exit(1);
  }
  console.log('PASS: Skills bulk save verified.');

  console.log('\n=== STAGE 4: Testing AI Skill Roadmap Endpoint (/api/ai/skill-roadmap) ===');
  const roadmapPayload = {
    skill_name: 'React',
    career_target_name: 'Frontend Developer',
    currentScore: 60,
    targetScore: 80,
  };
  const roadmapRes = await postJson('/api/ai/skill-roadmap', roadmapPayload);
  console.log('Roadmap status:', roadmapRes.status, 'Success:', roadmapRes.data?.success);
  console.log('Roadmap Source:', roadmapRes.data?.data?.source);
  console.log('Roadmap Stages count:', roadmapRes.data?.data?.stages?.length);
  console.log('Roadmap Next Action:', roadmapRes.data?.data?.next_step);

  if (roadmapRes.status !== 200 || !roadmapRes.data?.data?.stages || roadmapRes.data.data.stages.length < 3) {
    console.error('ERROR: Roadmap generation failed or returned invalid stages schema!');
    process.exit(1);
  }
  console.log('PASS: AI Skill Roadmap endpoint successfully generated structured learning path.');

  console.log('\n=== STAGE 5: Testing Zero-Inflation Verification Contract ===');
  const reloadedSkills = await getJson(`/api/student/career-target/skills?career_id=${frontendTarget.id}`);
  for (const s of reloadedSkills.data.skills) {
    if (s.selfDeclaredScore > 0 && s.verifiedScore === 0) {
      if (s.isAssessed) {
        console.error('ERROR: Self-declared score was falsely marked as isAssessed/verified!');
        process.exit(1);
      }
    }
  }
  console.log('PASS: Zero-inflation verification contract strictly preserved (Self-Declared ≠ Verified).');

  console.log('\n ALL PRODUCTION CAREER TARGET STAGES VERIFIED SUCCESSFULLY!');
  process.exit(0);
}

run().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
