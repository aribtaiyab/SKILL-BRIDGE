async function testDiagnose() {
  const res = await fetch('http://localhost:3000/api/ai/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetRole: 'Backend Developer',
      studentScores: { 'Node.js': 60, 'REST APIs': 75, 'PostgreSQL': 85 },
      benchmark: { 'Node.js': 80, 'REST APIs': 80, 'PostgreSQL': 75 }
    })
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

testDiagnose();
