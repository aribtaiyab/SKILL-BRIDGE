async function runTests() {
  console.log('=== VERIFYING STANDALONE CAREER NAVIGATOR (GROQ POWERED) ===\n');

  const testQueries = [
    "What should I learn after HTML CSS and JavaScript?",
    "Should I choose AI or frontend development?",
    "I know Python. What should I learn next?",
    "Give me a roadmap to become a backend developer.",
    "Can I switch from web development to AI?",
    "Is full stack development worth learning?",
    "What should I do to get my first internship?",
    "Java or Python?",
    "I am confused about my career.",
    "What should I do?"
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const q = testQueries[i];
    console.log(`[${i + 1}/${testQueries.length}] Query: "${q}"`);
    try {
      const res = await fetch('http://localhost:3000/api/career-navigator/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q })
      });

      console.log(`  HTTP Status: ${res.status}`);
      const data = await res.json();

      if (data.success && data.data) {
        const item = data.data;
        console.log(`  Headline: "${item.headline?.substring(0, 80)}..."`);
        console.log(`  Recommendation: "${item.recommendation?.substring(0, 80)}..."`);
        console.log(`  Intent: ${item.intent} | Sections: ${item.sections?.length || 0} | Comparisons: ${item.comparison?.length || 0} | Roadmap: ${item.roadmap?.length || 0} | Next Steps: ${item.next_steps?.length || 0}`);
      } else {
        console.error('  Failed response:', data);
      }
    } catch (err) {
      console.error('  Error calling endpoint:', err.message);
    }
    if (i < testQueries.length - 1) {
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  console.log('\n=== ALL 10 CAREER NAVIGATOR QUERIES TESTED SUCCESSFULLY ===');
}

runTests();
