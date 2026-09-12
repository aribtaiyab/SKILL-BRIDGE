async function testCareerChat() {
  console.log('=== TESTING STANDALONE CAREER CHAT API ===\n');

  const query = "Frontend vs Backend: Which is better for beginners?";
  console.log(`Sending query: "${query}" to http://localhost:3000/api/career-chat ...`);

  try {
    const res = await fetch('http://localhost:3000/api/career-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    console.log('HTTP Status:', res.status);
    const data = await res.json();
    console.log('\nAI Response Content:\n----------------------------------------');
    console.log(data.text || data);
    console.log('----------------------------------------');

    if (data.text && data.text.includes('Short Answer') || data.text.includes('Breakdown') || data.text.includes('Next Steps')) {
      console.log('\n SUCCESS: Groq Career Advisor returned a properly structured Markdown response.');
    } else {
      console.log('\n Response received successfully.');
    }
  } catch (err) {
    console.error('Error during career chat test:', err);
  }
}

testCareerChat();
