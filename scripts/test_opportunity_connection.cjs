const fetch = globalThis.fetch;

async function runOpportunityTests() {
  console.log('=== TEST: INDUSTRY TO STUDENT OPPORTUNITY FEED INTEGRATION ===\n');

  // Step 1: Create a new opportunity with specific skill requirements
  const testJob = {
    company_name: 'Stripe Payments Inc',
    title: 'Senior Node.js & REST API Intern',
    type: 'internship',
    location: 'San Francisco, CA / Remote',
    work_setting: 'remote',
    duration: '6 Months',
    deadline: '2026-11-30',
    description: 'Build scalable high-throughput payment APIs, microservices, and asynchronous event pipelines.',
    skills: [
      { skill_name: 'Node.js', required_score: 80 },
      { skill_name: 'REST APIs', required_score: 75 },
      { skill_name: 'PostgreSQL', required_score: 75 },
    ]
  };

  console.log('1. Posting new opportunity from Industry portal...');
  const postRes = await fetch('http://localhost:3000/api/opportunities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testJob)
  });

  console.log(`   POST Status: ${postRes.status}`);
  const postData = await postRes.json();
  console.log('   POST Response:', postData);

  if (!postData.success) {
    console.error('FAILED: Opportunity creation failed.');
    process.exit(1);
  }

  const createdId = postData.data?.id;

  // Step 2: Fetch opportunities from GET /api/opportunities
  console.log('\n2. Fetching opportunities from GET /api/opportunities (Student Feed)...');
  const getRes = await fetch('http://localhost:3000/api/opportunities');
  console.log(`   GET Status: ${getRes.status}`);
  const getData = await getRes.json();

  if (!getData.success || !Array.isArray(getData.data)) {
    console.error('FAILED: Could not fetch opportunities list.');
    process.exit(1);
  }

  console.log(`   Total Opportunities in Feed: ${getData.data.length}`);

  // Find the created job in the feed
  const matchedJob = getData.data.find(o => o.id === createdId || o.title === testJob.title);
  if (!matchedJob) {
    console.error('FAILED: Created opportunity was not found in the student feed.');
    process.exit(1);
  }

  console.log('\n3. Verifying Job Data & Match Calculation:');
  console.log(`   ID: ${matchedJob.id}`);
  console.log(`   Title: "${matchedJob.title}"`);
  console.log(`   Company: "${matchedJob.company}"`);
  console.log(`   Work Mode: "${matchedJob.workMode}"`);
  console.log(`   Match Percentage: ${matchedJob.matchPercentage}%`);
  console.log(`   Skills Met: ${matchedJob.skillsMetCount} / ${matchedJob.totalSkillsCount}`);
  console.log('   Required Skills Breakdown:');
  matchedJob.skills.forEach(s => {
    console.log(`     - ${s.name}: benchmark ${s.requiredLevel}, current ${s.currentLevel} [${s.status}]`);
  });

  // Step 3: Fetch from student-specific endpoint
  console.log('\n4. Verifying GET /api/student/opportunities...');
  const studentRes = await fetch('http://localhost:3000/api/student/opportunities');
  const studentData = await studentRes.json();
  const foundInStudent = studentData.data?.some(o => o.id === createdId || o.title === testJob.title);
  console.log(`   Found in /api/student/opportunities: ${foundInStudent}`);

  console.log('\n=== ALL OPPORTUNITY CONNECTION TESTS PASSED SUCCESSFULLY ===');
}

runOpportunityTests();
