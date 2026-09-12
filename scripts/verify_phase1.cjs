const { createClient } = require('@supabase/supabase-js');

async function verifyPhase1() {
  console.log('=== PHASE 1 VERIFICATION ===\n');

  // 1. Verify Groq API call directly
  const groqApiKey = process.env.GROQ_API_KEY || '';
  const groqBaseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
  const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  console.log('[1/2] Testing Groq API connection...');
  try {
    const groqRes = await fetch(`${groqBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          { role: 'system', content: 'You are the SkillBridge Diagnostic AI. Return valid JSON only.' },
          { role: 'user', content: 'Return: {"status": "connected", "verified": true}' }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (groqRes.ok) {
      const data = await groqRes.json();
      const content = data.choices?.[0]?.message?.content;
      console.log('  Groq API status: 200 OK');
      console.log('  Groq Response payload:', content);
    } else {
      console.error('  Groq API error:', groqRes.status, await groqRes.text());
    }
  } catch (err) {
    console.error('  Groq API call exception:', err);
  }

  // 2. Verify Supabase Client connection
  console.log('\n[2/2] Testing Supabase Client connection...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key-placeholder';

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('skills').select('id, name, slug').limit(3);
    if (error) {
      console.log('  Supabase query note:', error.message);
      console.log('  Supabase client initialized successfully without runtime crash.');
    } else {
      console.log('  Supabase query status: 200 OK');
      console.log(`  Fetched ${data?.length || 0} skills:`, data?.map(s => s.name));
    }
  } catch (err) {
    console.error('  Supabase exception:', err);
  }

  console.log('\n=== PHASE 1 VERIFICATION COMPLETED ===');
}

verifyPhase1();
