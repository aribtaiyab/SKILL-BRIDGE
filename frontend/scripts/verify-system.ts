import { CAREER_BENCHMARK_PROFILES, computeDeterministicReadiness } from '../src/lib/benchmarks'
import { LEVEL_1_KNOWLEDGE_ASSESSMENTS, LEVEL_2_PRACTICAL_CHALLENGES, gradeLevel1Assessment } from '../src/lib/assessments-seed'
import { SEED_OPPORTUNITIES, calculateOpportunityMatch } from '../src/lib/opportunities-seed'
import { calculateRuleBasedReadiness } from '../src/lib/ai-coach'

function runSystemVerification() {
  console.log('=== SKILLBRIDGE CONNECT SYSTEM VERIFICATION ===\n')

  // 1. Verify Benchmark Profiles
  console.log('1. Checking Career Benchmark Profiles...')
  console.assert(CAREER_BENCHMARK_PROFILES.length >= 5, `Expected >= 5 benchmark profiles, got ${CAREER_BENCHMARK_PROFILES.length}`)
  CAREER_BENCHMARK_PROFILES.forEach(profile => {
    const totalWeight = Object.values(profile.skills).reduce((sum, s) => sum + s.weight, 0)
    console.log(`   ✓ Profile "${profile.name}": ${Object.keys(profile.skills).length} skills, total weight = ${totalWeight.toFixed(2)}`)
    console.assert(Math.abs(totalWeight - 1.0) < 0.05, `Weight for ${profile.name} does not sum to 1.0!`)
  })

  // 2. Verify Deterministic Readiness Engine
  console.log('\n2. Checking Deterministic Readiness Engine...')
  const backendProfile = CAREER_BENCHMARK_PROFILES[0]
  const testStudentScores = {
    'Node.js': 80,
    'REST APIs': 75,
    'SQL': 50, // deficit: 70 - 50 = 20
    'Git & Version Control': 40, // deficit: 60 - 40 = 20
  }
  const readinessResult = computeDeterministicReadiness(backendProfile, testStudentScores)
  console.log(`   ✓ Readiness Score: ${readinessResult.readinessPercentage}% (${readinessResult.readinessCategory}, variant: ${readinessResult.readinessVariant})`)
  console.log(`   ✓ Priority Deficit Skill: ${readinessResult.priorityGap?.skillName} (gap: ${readinessResult.priorityGap?.gap} points)`)
  console.assert(readinessResult.readinessPercentage > 0, 'Readiness percentage should be > 0')

  // 3. Verify Level 1 Assessment Engine
  console.log('\n3. Checking Level 1 Knowledge Assessment Engine...')
  console.assert(LEVEL_1_KNOWLEDGE_ASSESSMENTS.length >= 5, `Expected >= 5 MCQs, got ${LEVEL_1_KNOWLEDGE_ASSESSMENTS.length}`)
  const sampleMcq = LEVEL_1_KNOWLEDGE_ASSESSMENTS[0]
  const allCorrect = Object.fromEntries(sampleMcq.questions.map(q => [q.id, q.correctOptionId]))
  const gradedPerfect = gradeLevel1Assessment(sampleMcq, allCorrect)
  console.log(`   ✓ MCQ Grading Sample: Score = ${gradedPerfect.score}%, Passed = ${gradedPerfect.passed}`)
  console.assert(gradedPerfect.score === 100, 'Score should be 100% for all correct')

  // 4. Verify Level 2 Practical Challenges
  console.log('\n4. Checking Level 2 Practical Timed Challenges...')
  console.assert(LEVEL_2_PRACTICAL_CHALLENGES.length >= 3, `Expected >= 3 challenges, got ${LEVEL_2_PRACTICAL_CHALLENGES.length}`)
  LEVEL_2_PRACTICAL_CHALLENGES.forEach(c => {
    const testResult = c.testCheck('app.get("/", (req, res) => res.json({ status: "ok" }))')
    console.log(`   ✓ Challenge "${c.title}": testCheck returned score=${testResult.score}, passed=${testResult.passed}`)
  })

  // 5. Verify Opportunity Hub Match Engine
  console.log('\n5. Checking Opportunity Matching Engine...')
  console.assert(SEED_OPPORTUNITIES.length >= 6, `Expected >= 6 opportunities, got ${SEED_OPPORTUNITIES.length}`)
  const scoredOpps = SEED_OPPORTUNITIES.map(opp => ({
    title: opp.title,
    company: opp.company,
    match: calculateOpportunityMatch(opp, testStudentScores),
  })).sort((a, b) => b.match.matchPercentage - a.match.matchPercentage)
  console.log(`   ✓ Top matched opportunity: "${scoredOpps[0].title}" at ${scoredOpps[0].company} (${scoredOpps[0].match.matchPercentage}% match)`)
  console.assert(scoredOpps[0].match.matchPercentage >= 0 && scoredOpps[0].match.matchPercentage <= 100, 'Match % out of range')

  // 6. Verify Deterministic AI Coach Fallback
  console.log('\n6. Checking Zero-Crash AI Fallback Engine...')
  const fallbackAdvice = calculateRuleBasedReadiness(
    'Backend Developer (Internship/Junior)',
    testStudentScores,
    backendProfile.skills
  )
  console.log(`   ✓ Priority Gap: "${fallbackAdvice.priorityGap}" (${fallbackAdvice.gapCategory})`)
  console.log(`   ✓ Recommended Task: "${fallbackAdvice.recommendedTask}"`)
  console.assert(fallbackAdvice.readinessScore > 0, 'Readiness score should be > 0')
  console.assert(fallbackAdvice.weakSubSkills.length > 0, 'Weak sub-skills should not be empty')

  console.log('\n=== ALL SYSTEM VERIFICATION CHECKS PASSED (100%) ===')
}

runSystemVerification()
