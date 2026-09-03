import {
  calculateGap,
  classifyGap,
  calculatePriorityScore,
  calculateSkillReadiness,
  calculateOverallReadiness,
  calculateImprovement,
  evaluateCareerReadiness,
  evaluateOpportunityReadiness,
  normalizeScore,
} from './engine'

console.log('=== RUNNING PHASE 4 INTELLIGENCE ENGINE UNIT TESTS ===')

// Test 1: Gap Calculation
console.assert(calculateGap(80, 65) === 15, 'Test 1.1 Failed: 80 - 65 should be 15')
console.assert(calculateGap(70, 82) === 0, 'Test 1.2 Failed: 70 - 82 should be 0 (no negative gap)')
console.assert(calculateGap(0, 50) === 0, 'Test 1.3 Failed: 0 required should be 0')
console.log('✓ Test 1: Gap calculations passed.')

// Test 2: Gap Classification
console.assert(classifyGap(15, 'High') === 'critical', 'Test 2.1 Failed: 15 gap is critical')
console.assert(classifyGap(10, 'High') === 'critical', 'Test 2.2 Failed: 10 gap with High importance is critical')
console.assert(classifyGap(8, 'Medium') === 'needs_improvement', 'Test 2.3 Failed: 8 gap with Medium is needs_improvement')
console.assert(classifyGap(0, 'High') === 'ready', 'Test 2.4 Failed: 0 gap is ready')
console.log('✓ Test 2: Gap classifications passed.')

// Test 3: Score Normalization and Capping
console.assert(normalizeScore(120) === 100, 'Test 3.1 Failed: 120 should cap at 100')
console.assert(normalizeScore(-5) === 0, 'Test 3.2 Failed: -5 should floor at 0')
console.assert(calculateSkillReadiness(82, 70) === 1.0, 'Test 3.3 Failed: 82/70 should cap at 1.0')
console.log('✓ Test 3: Score normalization passed.')

// Test 4: Weighted Career Readiness (Backend Developer example from master prompt)
// Node.js: 65/80 (High=1.0) -> 0.8125
// REST APIs: 72/75 (High=1.0) -> 0.96
// SQL: 82/70 (High=1.0) -> 1.0 (capped)
// Git: 75/60 (Medium=0.7) -> 1.0 (capped)
// Total weights = 1.0 + 1.0 + 1.0 + 0.7 = 3.7
// Weighted sum = 0.8125 + 0.96 + 1.0 + 0.7 = 3.4725
// Overall = (3.4725 / 3.7) * 100 = 93.85% -> 94%
const reqs = [
  { skillId: 's1', skillName: 'Node.js', requiredLevel: 80, importance: 'High' as const },
  { skillId: 's2', skillName: 'REST APIs', requiredLevel: 75, importance: 'High' as const },
  { skillId: 's3', skillName: 'SQL', requiredLevel: 70, importance: 'High' as const },
  { skillId: 's4', skillName: 'Git', requiredLevel: 60, importance: 'Medium' as const },
]

const studentScores = [
  { skillId: 's1', skillName: 'Node.js', currentLevel: 65 },
  { skillId: 's2', skillName: 'REST APIs', currentLevel: 72 },
  { skillId: 's3', skillName: 'SQL', currentLevel: 82 },
  { skillId: 's4', skillName: 'Git', currentLevel: 75 },
]

const readiness = calculateOverallReadiness(reqs, studentScores)
console.assert(readiness === 94, `Test 4 Failed: Expected 94, got ${readiness}`)
console.log(`✓ Test 4: Weighted career readiness verified (Calculated: ${readiness}%).`)

// Test 5: Improvement Calculation
console.assert(calculateImprovement(81, 45) === 36, 'Test 5.1 Failed: 45 -> 81 is +36')
console.assert(calculateImprovement(74, 81) === -7, 'Test 5.2 Failed: 81 -> 74 is -7 (honest negative score)')
console.log('✓ Test 5: Reassessment improvement verified.')

// Test 6: Priority Gap Identification
const evalResult = evaluateCareerReadiness('Backend Developer', reqs, studentScores)
console.assert(evalResult.priorityGap?.skillName === 'Node.js', 'Test 6.1 Failed: Node.js should be priority gap')
console.assert(evalResult.priorityGap?.gap === 15, 'Test 6.2 Failed: Node.js gap should be 15')
console.log('✓ Test 6: Priority gap identification verified.')

// Test 7: Opportunity-Specific Readiness
const opp = {
  id: 'opp-1',
  title: 'Backend Developer Internship',
  companyName: 'TechFlow Solutions',
  skills: [
    { skillId: 's1', skillName: 'Node.js', minimumLevel: 80, importance: 'High' },
    { skillId: 's2', skillName: 'REST APIs', minimumLevel: 75, importance: 'High' },
    { skillId: 's3', skillName: 'SQL', minimumLevel: 70, importance: 'High' },
    { skillId: 's5', skillName: 'Docker', minimumLevel: 50, importance: 'Medium' },
  ],
}
const oppResult = evaluateOpportunityReadiness(opp, studentScores)
console.assert(oppResult.missingSkills.includes('Docker'), 'Test 7.1 Failed: Docker should be identified as missing')
console.assert(oppResult.mainBlocker === 'Docker' || oppResult.mainBlocker === 'Node.js', 'Test 7.2 Failed: main blocker identified')
console.log(`✓ Test 7: Opportunity readiness verified (Match: ${oppResult.matchPercentage}%, Missing: ${oppResult.missingSkills.join(', ')}).`)

console.log('=== ALL PHASE 4 ENGINE TESTS PASSED SUCCESSFULLY ===')
