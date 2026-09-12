const apiKey = process.env.GROQ_API_KEY || '';
const baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';

async function listModels() {
  const res = await fetch(baseUrl + '/models', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const data = await res.json();
  console.log('Models:', data.data?.map(m => m.id));
}

listModels();
