async function verifyPhase3() {
  console.log('=== PHASE 3 VERIFICATION: Industry -> Student Data Flow ===\n');

  // 1. Industry creates a new opportunity
  const newJob = {
    title: "Senior Cloud & AI Infrastructure Fellow",
    description: "Architect distributed AI model serving pipelines and low-latency microservices with automated failover.",
    type: "job",
    location: "Austin, TX (Hybrid)",
    work_mode: "hybrid",
    duration: "Full-Time",
    application_deadline: "2026-12-31",
    stipend: 5000,
    skills: [
      { name: "Node.js", level: 80 },
      { name: "SQL", level: 75 },
      { name: "Docker", level: 70 }
    ]
  };

  console.log('[1/2] Simulating Industry POST /api/industry/opportunities...');
  const postRes = await fetch('http://localhost:3000/api/industry/opportunities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newJob)
  });

  const postData = await postRes.json();
  console.log('  POST Status:', postRes.status);
  console.log('  POST Response:', postData);

  if (!postData.success) {
    console.error('Failed to create opportunity');
    return;
  }

  // 2. Student queries opportunities
  console.log('\n[2/2] Simulating Student GET /api/student/opportunities...');
  const getRes = await fetch('http://localhost:3000/api/student/opportunities');
  const getData = await getRes.json();
  console.log('  GET Status:', getRes.status);
  console.log('  Total opportunities found:', getData.data?.length);

  const matched = getData.data?.find(o => o.title === newJob.title);
  if (matched) {
    console.log('\n SUCCESS: Newly created opportunity found in Student Feed!');
    console.log('  Job Title:', matched.title);
    console.log('  Company:', matched.company);
    console.log('  Match Percentage:', matched.matchPercentage + '%');
    console.log('  Readiness Category:', matched.readinessCategory);
    console.log('  Skills Met:', `${matched.skillsMetCount}/${matched.totalSkillsCount}`);
    console.log('  Main Blocker:', matched.mainBlocker || 'None (Fully Qualified)');
  } else {
    console.error('\n FAILED: Newly created opportunity was not found in Student Feed.');
  }

  console.log('\n=== PHASE 3 VERIFICATION COMPLETED ===');
}

verifyPhase3();
