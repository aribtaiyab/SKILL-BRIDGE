async function verifyPhase4() {
  console.log('=== PHASE 4 VERIFICATION: Student -> Academia Verification Flow ===\n');

  // 1. Student submits verification request
  const testSubmission = {
    studentId: 'std-2026-999',
    studentName: 'Arib Tayab (Candidate)',
    studentEmail: 'arib.tayab@dtu.ac.in',
    department: 'Computer Science & Engineering',
    skillName: 'Distributed Systems & Microservices',
    verificationTier: 'Assessment Verified',
    score: 95,
    proofUrl: 'https://github.com/aribtayab/distributed-raft-consensus',
    proofNotes: 'Implemented Raft consensus algorithm with leader election and log replication passing all chaos test suites.'
  };

  console.log('[1/3] Simulating Student POST /api/verification/request...');
  const submitRes = await fetch('http://localhost:3000/api/verification/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testSubmission)
  });

  const submitData = await submitRes.json();
  console.log('  Submission Status:', submitRes.status);
  console.log('  Created Request ID:', submitData.data?.id);
  console.log('  Initial Ticket Status:', submitData.data?.status);

  if (!submitData.success || !submitData.data?.id) {
    console.error('Failed to create verification request');
    return;
  }

  const requestId = submitData.data.id;

  // 2. Academia views pending queue
  console.log('\n[2/3] Simulating Academia GET /api/verification/list...');
  const listRes = await fetch('http://localhost:3000/api/verification/list');
  const listData = await listRes.json();
  console.log('  List Status:', listRes.status);
  console.log('  Total Requests in Queue:', listData.requests?.length);

  const foundItem = listData.requests?.find(r => r.id === requestId);
  if (foundItem) {
    console.log('  Found pending ticket in queue:', foundItem.skill_name, `(Score: ${foundItem.score}, Status: ${foundItem.status})`);
  } else {
    console.error('  Could not find submitted ticket in list');
    return;
  }

  // 3. Academia Approves the request
  console.log('\n[3/3] Simulating Academia Faculty Endorsement PATCH /api/verification/action...');
  const approveRes = await fetch('http://localhost:3000/api/verification/action', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: requestId,
      action: 'approved',
      facultyFeedback: 'Outstanding consensus implementation. Verified by Faculty Board.'
    })
  });

  const approveData = await approveRes.json();
  console.log('  Approval Status:', approveRes.status);
  console.log('  Updated Ticket Status:', approveData.ticket?.status);
  console.log('  Faculty Feedback:', approveData.ticket?.faculty_feedback);

  if (approveData.success && approveData.ticket?.status === 'approved') {
    console.log('\n SUCCESS: Student verification request processed and approved with zero errors.');
  } else {
    console.error('\n FAILED: Verification approval did not complete cleanly.');
  }

  console.log('\n=== PHASE 4 VERIFICATION COMPLETED ===');
}

verifyPhase4();
