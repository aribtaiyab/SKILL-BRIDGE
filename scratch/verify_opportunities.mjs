// Using native fetch in Node 24

async function runTests() {
  console.log('--- OPPORTUNITY HUB VERIFICATION TESTS ---');

  // Test 1: Test GET /api/student/saved-opportunities
  try {
    const getRes = await fetch('http://localhost:3000/api/student/saved-opportunities');
    console.log('GET /api/student/saved-opportunities status:', getRes.status);
    const getData = await getRes.json();
    console.log('GET /api/student/saved-opportunities body:', getData);
    if (!getData.success || !Array.isArray(getData.savedOpportunityIds)) {
      throw new Error('GET /api/student/saved-opportunities invalid response format');
    }
  } catch (err) {
    console.error('Test 1 failed:', err.message);
  }

  // Test 2: Test POST /api/student/saved-opportunities (toggle save)
  try {
    const postRes1 = await fetch('http://localhost:3000/api/student/saved-opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunityId: 'opp-seed-1', isSaved: true })
    });
    console.log('POST save status:', postRes1.status);
    const postData1 = await postRes1.json();
    console.log('POST save body:', postData1);

    if (!postData1.success || postData1.isSaved !== true) {
      throw new Error('Save toggle failed');
    }

    // Verify it is saved in GET
    const getRes2 = await fetch('http://localhost:3000/api/student/saved-opportunities');
    const getData2 = await getRes2.json();
    console.log('Verified saved list contains opp-seed-1:', getData2.savedOpportunityIds.includes('opp-seed-1'));

    // Untoggle
    const postRes2 = await fetch('http://localhost:3000/api/student/saved-opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunityId: 'opp-seed-1', isSaved: false })
    });
    const postData2 = await postRes2.json();
    console.log('POST unsave body:', postData2);
    if (!postData2.success || postData2.isSaved !== false) {
      throw new Error('Unsave toggle failed');
    }
  } catch (err) {
    console.error('Test 2 failed:', err.message);
  }

  // Test 3: Test backend port 5000 endpoints
  try {
    const bGet = await fetch('http://localhost:5000/api/student/saved-opportunities');
    console.log('Backend (port 5000) GET status:', bGet.status);
    const bGetData = await bGet.json();
    console.log('Backend GET body:', bGetData);

    const bPost = await fetch('http://localhost:5000/api/student/saved-opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunityId: 'opp-seed-2', isSaved: true })
    });
    console.log('Backend (port 5000) POST status:', bPost.status);
    const bPostData = await bPost.json();
    console.log('Backend POST body:', bPostData);
  } catch (err) {
    console.error('Backend endpoint test warning:', err.message);
  }

  // Test 4: Verify Career Target and Career Navigator endpoints still respond normally
  try {
    const cRes = await fetch('http://localhost:5000/api/intelligence/career-benchmark/fullstack-engineer');
    console.log('Career benchmark endpoint status:', cRes.status);
    const cData = await cRes.json();
    console.log('Career benchmark title:', cData?.benchmark?.title || cData?.title);
  } catch (err) {
    console.error('Career benchmark regression check:', err.message);
  }

  console.log('--- ALL VERIFICATION CHECKS COMPLETE ---');
}

runTests();
