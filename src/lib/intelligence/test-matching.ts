/**
 * Phase 6 Matching Service Unit Tests
 * Tests: matching, ranking, deadline logic, explanation builder
 */

import {
  matchStudentToOpportunity,
  rankOpportunitiesForStudent,
  buildMatchExplanation,
  getDeadlineStatus,
  computeRelevanceScore,
  MatchableOpportunity,
} from './matching'

import { StudentSkillScore } from './engine'

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const strongStudentSkills: StudentSkillScore[] = [
  { skillId: 'node-js', skillName: 'Node.js', currentLevel: 85 },
  { skillId: 'sql', skillName: 'SQL', currentLevel: 90 },
  { skillId: 'rest', skillName: 'REST APIs', currentLevel: 80 },
  { skillId: 'git', skillName: 'Git', currentLevel: 70 },
]

const weakStudentSkills: StudentSkillScore[] = [
  { skillId: 'node-js', skillName: 'Node.js', currentLevel: 20 },
  { skillId: 'sql', skillName: 'SQL', currentLevel: 30 },
  { skillId: 'rest', skillName: 'REST APIs', currentLevel: 15 },
]

const backendOpportunity: MatchableOpportunity = {
  id: 'opp-backend-001',
  title: 'Backend Developer Internship',
  companyName: 'TechFlow Solutions',
  opportunityType: 'Internship',
  location: 'San Francisco, CA',
  workMode: 'hybrid',
  duration: '6 Months',
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days out
  status: 'published',
  skills: [
    { skillId: 'node-js', skillName: 'Node.js', minimumLevel: 70, importance: 'High' },
    { skillId: 'sql', skillName: 'SQL', minimumLevel: 65, importance: 'High' },
    { skillId: 'rest', skillName: 'REST APIs', minimumLevel: 60, importance: 'Medium' },
    { skillId: 'docker', skillName: 'Docker', minimumLevel: 30, importance: 'Low' },
  ],
}

const urgentOpportunity: MatchableOpportunity = {
  ...backendOpportunity,
  id: 'opp-urgent-002',
  title: 'Urgent Data Engineer Role',
  deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days (soon)
}

const passedOpportunity: MatchableOpportunity = {
  ...backendOpportunity,
  id: 'opp-passed-003',
  title: 'Expired Frontend Role',
  deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
}

const rollingOpportunity: MatchableOpportunity = {
  ...backendOpportunity,
  id: 'opp-rolling-004',
  title: 'Mentorship Program',
  deadline: null,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`✓ ${label}`)
    passed++
  } else {
    console.error(`✗ FAIL: ${label}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

console.log('\n=== RUNNING PHASE 6 MATCHING SERVICE UNIT TESTS ===\n')

// ─── Test 1: Basic match for strong student ──────────────────────────────────
{
  const result = matchStudentToOpportunity(backendOpportunity, strongStudentSkills)
  assert(result.matchPercentage >= 80, 'Test 1a: Strong student achieves high match %', `Got: ${result.matchPercentage}%`)
  assert(result.skillsMetCount >= 3, 'Test 1b: Strong student meets >= 3 required skills', `Met: ${result.skillsMetCount}`)
  assert(result.opportunityId === backendOpportunity.id, 'Test 1c: Correct opportunity ID in result')
  assert(result.companyName === backendOpportunity.companyName, 'Test 1d: Correct company name')
}

// ─── Test 2: Low match for weak student ─────────────────────────────────────
{
  const result = matchStudentToOpportunity(backendOpportunity, weakStudentSkills)
  assert(result.matchPercentage < 50, 'Test 2a: Weak student achieves low match %', `Got: ${result.matchPercentage}%`)
  assert(result.skillsMetCount <= 1, 'Test 2b: Weak student meets few required skills', `Met: ${result.skillsMetCount}`)
  assert(result.mainBlocker !== null, 'Test 2c: Main blocker identified for weak student')
  assert(result.missingSkills.length > 0, 'Test 2d: Missing skills populated for weak student')
}

// ─── Test 3: No skills scenario ─────────────────────────────────────────────
{
  const result = matchStudentToOpportunity(backendOpportunity, [])
  assert(result.matchPercentage === 0, 'Test 3a: Zero skills → zero match', `Got: ${result.matchPercentage}%`)
  assert(result.skillsMetCount === 0, 'Test 3b: Zero skills met')
  assert(result.mainBlocker !== null, 'Test 3c: Main blocker set when no skills')
}

// ─── Test 4: Opportunity with no required skills ─────────────────────────────
{
  const emptyOpp: MatchableOpportunity = { ...backendOpportunity, id: 'opp-empty', skills: [] }
  const result = matchStudentToOpportunity(emptyOpp, strongStudentSkills)
  assert(result.matchPercentage === 0, 'Test 4: No required skills → 0% match (no requirements defined)')
}

// ─── Test 5: Deadline status ─────────────────────────────────────────────────
{
  const rolling = getDeadlineStatus(null)
  assert(rolling.label === 'Rolling', 'Test 5a: No deadline → Rolling label')
  assert(!rolling.isPassed, 'Test 5b: No deadline → not passed')
  assert(!rolling.isSoon, 'Test 5c: No deadline → not soon')

  const ds = getDeadlineStatus(urgentOpportunity.deadline)
  assert(ds.isSoon, 'Test 5d: Deadline in 2 days is "soon"')
  assert(!ds.isPassed, 'Test 5e: Deadline in 2 days is not passed')

  const passed_ds = getDeadlineStatus(passedOpportunity.deadline)
  assert(passed_ds.isPassed, 'Test 5f: Past deadline is "passed"')
}

// ─── Test 6: Ranking — passed deadline goes to bottom ────────────────────────
{
  const rankedResults = rankOpportunitiesForStudent(
    [passedOpportunity, backendOpportunity, urgentOpportunity, rollingOpportunity],
    strongStudentSkills
  )
  const lastId = rankedResults[rankedResults.length - 1].opportunity.id
  assert(lastId === passedOpportunity.id, 'Test 6a: Passed deadline opportunity ranked last', `Last: ${lastId}`)
  assert(rankedResults.length === 4, 'Test 6b: All 4 opportunities returned in ranking')

  // Non-passed opps should be ranked above passed
  const nonPassedRanks = rankedResults.filter(r => !r.isDeadlinePassed)
  const passedRanks = rankedResults.filter(r => r.isDeadlinePassed)
  assert(nonPassedRanks.length === 3, 'Test 6c: 3 non-passed opportunities')
  assert(passedRanks.length === 1, 'Test 6d: 1 passed opportunity')
}

// ─── Test 7: Different students → different rankings ─────────────────────────
{
  const opps = [backendOpportunity, urgentOpportunity, rollingOpportunity]
  const strongRanked = rankOpportunitiesForStudent(opps, strongStudentSkills)
  const weakRanked = rankOpportunitiesForStudent(opps, weakStudentSkills)

  // Strong student: all match% should be high
  assert(
    strongRanked[0].readiness.matchPercentage >= weakRanked[0].readiness.matchPercentage,
    'Test 7a: Strong student top match >= weak student top match',
    `Strong: ${strongRanked[0].readiness.matchPercentage}%, Weak: ${weakRanked[0].readiness.matchPercentage}%`
  )
  assert(
    strongRanked.every(r => r.readiness.matchPercentage >= weakRanked.find(wr => wr.opportunity.id === r.opportunity.id)!.readiness.matchPercentage),
    'Test 7b: Strong student always matches >= weak student on same opportunity'
  )
}

// ─── Test 8: Match explanation builder ───────────────────────────────────────
{
  const result = matchStudentToOpportunity(backendOpportunity, strongStudentSkills)
  const explanation = buildMatchExplanation(result, backendOpportunity.id)

  assert(typeof explanation.summary === 'string' && explanation.summary.length > 0, 'Test 8a: Explanation summary is non-empty string')
  assert(typeof explanation.recommendedAction === 'string', 'Test 8b: Recommended action is string')
  assert(Array.isArray(explanation.strengths), 'Test 8c: Strengths is an array')
  assert(Array.isArray(explanation.gaps), 'Test 8d: Gaps is an array')
  assert(Array.isArray(explanation.nextSteps), 'Test 8e: Next steps is an array')
  assert(['success', 'warning', 'critical'].includes(explanation.readinessVariant), 'Test 8f: Readiness variant is valid')

  // Strong student with high match should get 'success' or 'warning' variant
  assert(explanation.readinessVariant !== 'critical', 'Test 8g: Strong student does not get critical variant')
}

// ─── Test 9: Explanation for weak student ────────────────────────────────────
{
  const result = matchStudentToOpportunity(backendOpportunity, weakStudentSkills)
  const explanation = buildMatchExplanation(result, backendOpportunity.id)

  assert(explanation.gaps.length > 0, 'Test 9a: Weak student has gaps in explanation')
  assert(explanation.mainBlocker !== null, 'Test 9b: Weak student has a main blocker')
  assert(explanation.nextSteps.length > 0, 'Test 9c: Weak student gets next steps')

  // Gaps should be sorted by gap size descending
  if (explanation.gaps.length > 1) {
    const gapsSorted = explanation.gaps.every((g, i) =>
      i === 0 || g.gap <= explanation.gaps[i - 1].gap
    )
    assert(gapsSorted, 'Test 9d: Explanation gaps sorted by gap size descending')
  }
}

// ─── Test 10: Relevance score ordering ───────────────────────────────────────
{
  const highReadiness = computeRelevanceScore(90, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
  const lowReadiness = computeRelevanceScore(30, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
  assert(highReadiness > lowReadiness, 'Test 10a: Higher readiness → higher relevance score')

  const highReadinessSoon = computeRelevanceScore(90, new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString())
  assert(typeof highReadinessSoon === 'number' && highReadinessSoon >= 0 && highReadinessSoon <= 100,
    'Test 10b: Relevance score stays in [0, 100]', `Got: ${highReadinessSoon}`)
}

// ─── Results ─────────────────────────────────────────────────────────────────
console.log(`\n=== PHASE 6 MATCHING TESTS: ${passed} passed, ${failed} failed ===`)
if (failed === 0) {
  console.log('=== ALL PHASE 6 MATCHING TESTS PASSED SUCCESSFULLY ===\n')
} else {
  console.error(`=== ${failed} TEST(S) FAILED — REVIEW ABOVE ===\n`)
  process.exit(1)
}
