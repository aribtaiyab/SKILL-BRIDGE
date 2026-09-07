import {
  calculateOpportunityMatch,
  getAssessmentRouteForSkill,
  READY_THRESHOLD,
  ALMOST_READY_THRESHOLD,
  CLOSE_THRESHOLD,
  SEED_OPPORTUNITIES
} from '../frontend/src/lib/opportunities-seed.ts';

console.log('Testing calculateOpportunityMatch and helper functions...');
console.log('Constants:', { READY_THRESHOLD, ALMOST_READY_THRESHOLD, CLOSE_THRESHOLD });

// Test 1: Full match
const sampleOpp = {
  id: 'test-opp-1',
  title: 'Full Stack Intern',
  requiredSkills: [
    { name: 'TypeScript', minScore: 70 },
    { name: 'React', minScore: 65 },
    { name: 'Node.js', minScore: 60 }
  ]
};

// Case A: Student has all verified scores exceeding requirement
const studentScoresA = {
  'TypeScript': 85,
  'React': 80,
  'Node.js': 75
};

const matchA = calculateOpportunityMatch(sampleOpp, studentScoresA);
console.log('Match A (all met):', {
  percentage: matchA.matchPercentage,
  skills: matchA.skills
});

if (matchA.matchPercentage !== 100) throw new Error('Match A should be 100%');
if (!matchA.skills.every(s => s.status === 'met')) throw new Error('All skills in Match A should be met');

// Case B: Close skills and missing skills
const studentScoresB = {
  'TypeScript': 60, // required 70 -> gap 10 (<= 15 -> 'close')
  'React': 40,      // required 65 -> gap 25 (> 15 -> 'missing')
  // Node.js not assessed -> missing
};

const matchB = calculateOpportunityMatch(sampleOpp, studentScoresB);
console.log('Match B (mixed):', {
  percentage: matchB.matchPercentage,
  skills: matchB.skills
});

const tsSkill = matchB.skills.find(s => s.name === 'TypeScript');
const reactSkill = matchB.skills.find(s => s.name === 'React');
const nodeSkill = matchB.skills.find(s => s.name === 'Node.js');

if (tsSkill.status !== 'close' || tsSkill.statusLabel !== 'close — 10 pts short') {
  throw new Error(`Unexpected tsSkill: ${JSON.stringify(tsSkill)}`);
}
if (reactSkill.status !== 'missing' || reactSkill.statusLabel !== '25 pts deficit') {
  throw new Error(`Unexpected reactSkill: ${JSON.stringify(reactSkill)}`);
}
if (nodeSkill.status !== 'missing' || nodeSkill.statusLabel !== 'not assessed') {
  throw new Error(`Unexpected nodeSkill: ${JSON.stringify(nodeSkill)}`);
}

// Test 2: Check routing URL generation
const routeTs = getAssessmentRouteForSkill('TypeScript');
console.log('Route TypeScript:', routeTs);
if (!routeTs.includes('skill=TypeScript') || !routeTs.includes('autostart=true')) {
  throw new Error(`Invalid routeTs: ${routeTs}`);
}

const routeReact = getAssessmentRouteForSkill('React');
console.log('Route React:', routeReact);
if (!routeReact.includes('skill=React') || !routeReact.includes('autostart=true')) {
  throw new Error(`Invalid routeReact: ${routeReact}`);
}

// Test 3: Grouping logic test on seed opportunities
const groupedReady = [];
const groupedAlmost = [];
const groupedOther = [];

for (const opp of SEED_OPPORTUNITIES) {
  const m = calculateOpportunityMatch(opp, studentScoresB);
  if (m.matchPercentage >= READY_THRESHOLD) {
    groupedReady.push(opp.id);
  } else if (m.matchPercentage >= ALMOST_READY_THRESHOLD) {
    groupedAlmost.push(opp.id);
  } else {
    groupedOther.push(opp.id);
  }
}

console.log('Grouped counts:', {
  ready: groupedReady.length,
  almost: groupedAlmost.length,
  other: groupedOther.length,
  total: SEED_OPPORTUNITIES.length
});

console.log('✅ ALL MATCH LOGIC AND HELPER TESTS PASSED!');
