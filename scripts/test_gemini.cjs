const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
const { GoogleGenAI } = require(path.join(__dirname, '../backend/node_modules/@google/genai'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing Gemini API with key:', apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'MISSING');

async function testModel(modelName) {
  try {
    console.log(`\nTesting model: "${modelName}"...`);
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: 'Hello, reply with JSON: {"status": "ok"}' }] }],
      config: { responseMimeType: 'application/json' }
    });
    console.log(`SUCCESS for "${modelName}":`, res.text);
    return true;
  } catch (err) {
    console.error(`FAILED for "${modelName}":`, err.message || err);
    return false;
  }
}

async function run() {
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];
  for (const m of models) {
    const ok = await testModel(m);
    if (ok) {
      console.log(`\n>>> Best working model is: ${m}`);
      break;
    }
  }
}

run();
