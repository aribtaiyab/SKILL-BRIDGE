console.log('=== TEST 1: UNIT NORMALIZATION VERIFICATION ===');

function runUnitTests() {
  // Mock test cases for toStringArray
  const testCases = [
    { input: ['Pro 1', 'Pro 2'], expectedLength: 2, label: 'Standard array' },
    { input: 'Good salary and high demand', expectedLength: 1, label: 'Single string' },
    { input: '- High demand\n- Good salary\n- Great community', expectedLength: 3, label: 'Bullet list string' },
    { input: 'High demand, Good salary, Versatile', expectedLength: 3, label: 'Comma-separated string' },
    { input: { a: 'Feature A', b: 'Feature B' }, expectedLength: 2, label: 'Object map' },
    { input: null, expectedLength: 0, label: 'null value' },
    { input: undefined, expectedLength: 0, label: 'undefined value' },
    { input: [{ text: 'Nested object pro' }], expectedLength: 1, label: 'Array of objects' }
  ];

  // Self-contained toStringArray definition matching production implementation
  function toStringArrayFn(val) {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val
        .map((item) => {
          if (typeof item === 'string') return item.trim();
          if (typeof item === 'number' || typeof item === 'boolean') return String(item);
          if (typeof item === 'object' && item !== null) {
            const record = item;
            const candidate = record.text || record.name || record.title || record.value || record.point || record.desc;
            if (typeof candidate === 'string') return candidate.trim();
            return JSON.stringify(item);
          }
          return '';
        })
        .filter((s) => typeof s === 'string' && s.length > 0);
    }

    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return [];
      if (trimmed.includes('\n')) {
        return trimmed
          .split('\n')
          .map(line => line.replace(/^[-*•\d.)\s]+/, '').trim())
          .filter(line => line.length > 0);
      }
      if (trimmed.includes(',') && !trimmed.includes('{')) {
        const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length > 1) return parts;
      }
      return [trimmed];
    }

    if (typeof val === 'object' && val !== null) {
      const values = Object.values(val);
      return values
        .map(v => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean);
    }

    return [];
  }

  for (const tc of testCases) {
    const result = toStringArrayFn(tc.input);
    const isArray = Array.isArray(result);
    const allStrings = result.every(s => typeof s === 'string');
    const passed = isArray && allStrings && result.length === tc.expectedLength;
    console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${tc.label} -> Array: ${isArray}, All Strings: ${allStrings}, Count: ${result.length} (Expected: ${tc.expectedLength})`);
    if (!passed) {
      console.error('    Unexpected result:', result);
    }
  }
}

runUnitTests();

// Test Live API endpoint with comparison query
console.log('\n=== TEST 2: LIVE API RESPONSE SHAPE VERIFICATION ===');
async function testLiveApi() {
  const fetch = globalThis.fetch;
  const comparisons = [
    "AI vs Frontend: Which should I choose?",
    "Java or Python for backend?"
  ];

  for (const q of comparisons) {
    console.log(`\nTesting Query: "${q}"`);
    try {
      const res = await fetch('http://localhost:3000/api/career-navigator/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, conversation: [] }),
      });

      console.log(`  Status: ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        console.log(`  Headline: "${d.headline}"`);
        console.log(`  Comparison options count: ${d.comparison ? d.comparison.length : 0}`);
        
        if (Array.isArray(d.comparison)) {
          d.comparison.forEach((opt, idx) => {
            const isProsArray = Array.isArray(opt.pros);
            const isConsArray = Array.isArray(opt.cons);
            console.log(`    Option [${idx + 1}] "${opt.option}":`);
            console.log(`      pros is Array: ${isProsArray} (length: ${opt.pros.length}, sample: ${JSON.stringify(opt.pros.slice(0, 2))})`);
            console.log(`      cons is Array: ${isConsArray} (length: ${opt.cons.length}, sample: ${JSON.stringify(opt.cons.slice(0, 2))})`);
            if (!isProsArray || !isConsArray) {
              console.error('      ERROR: Non-array pros/cons detected!');
            }
          });
        }
      } else {
        console.log('  Response:', json);
      }
    } catch (e) {
      console.error('  Fetch Error:', e.message);
    }
  }
}

testLiveApi();
