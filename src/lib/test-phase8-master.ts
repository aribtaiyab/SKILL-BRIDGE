/**
 * ==============================================================================
 * SKILLBRIDGE CONNECT — PHASE 8 MASTER PRODUCT VERIFICATION SUITE
 * ==============================================================================
 * Comprehensive End-to-End System Test Suite verifying all 5 pillars:
 * 1. Assess  (Deterministic Knowledge & Practical Assessments)
 * 2. Identify (Skill Gaps & Priority Bottlenecks)
 * 3. Improve (AI-Powered Learning Plans & Adaptive Practice)
 * 4. Prove   (5-Tier Verification Hierarchy & Cryptographic Skill Passport)
 * 5. Connect (Opportunity-Specific Readiness & Application Workflows)
 * ==============================================================================
 */

import {
  normalizeScore,
  calculateGap,
  classifyGap,
  calculatePriorityScore,
  calculateSkillReadiness,
  calculateOverallReadiness,
  calculateImprovement,
  getReadinessCategory,
  evaluateCareerReadiness,
  evaluateOpportunityReadiness,
  SkillRequirement,
  StudentSkillScore,
} from './intelligence/engine'

import {
  rankOpportunitiesForStudent,
  MatchableOpportunity,
  getDeadlineStatus,
} from './intelligence/matching'

import {
  getVerificationRank,
  isHigherOrEqualVerification,
  resolveHigherVerificationStatus,
  getVerificationBadgeInfo,
  calculateProofCoverage,
  projectPublicPassport,
  VerificationLevel,
  EvidenceItemSummary,
} from './intelligence/verification'

import { DeterministicSkillBridgeAIProvider } from './ai/provider'
import { StudentAIContext } from './ai/types'
import { getEnvironmentHealth } from './config/env'

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

console.log('\n====================================================================')
console.log('SKILLBRIDGE CONNECT — PHASE 8 MASTER END-TO-END VERIFICATION SUITE')
console.log('====================================================================\n')

// ─── 1. PILLAR 1 & 2: ASSESS & IDENTIFY (INTELLIGENCE ENGINE) ────────────────
console.log('--- 1. Testing Core Deterministic Readiness Engine ---')
{
  // Normalization
  assert(normalizeScore(105) === 100, 'Engine: Score normalization caps at 100')
  assert(normalizeScore(-10) === 0, 'Engine: Score normalization floors at 0')
  assert(normalizeScore(78.6) === 79, 'Engine: Score rounds to nearest integer')

  // Gap Calculations
  assert(calculateGap(80, 65) === 15, 'Engine: calculateGap(80, 65) is 15')
  assert(calculateGap(80, 85) === 0, 'Engine: calculateGap(80, 85) is 0 (surplus is 0 gap)')

  // Gap Classification
  assert(classifyGap(0, 'High') === 'ready', 'Engine: 0 gap is classified as ready')
  assert(classifyGap(5, 'Medium') === 'needs_improvement', 'Engine: 5 gap is classified as needs_improvement')
  assert(classifyGap(15, 'High') === 'critical', 'Engine: 15 gap is classified as critical')

  // Weighted Readiness Calculation
  const reqs: SkillRequirement[] = [
    { skillId: 's1', skillName: 'React', requiredLevel: 80, importance: 'High' }, // weight 1.0
    { skillId: 's2', skillName: 'Node.js', requiredLevel: 80, importance: 'High' }, // weight 1.0
    { skillId: 's3', skillName: 'SQL', requiredLevel: 60, importance: 'Medium' }, // weight 0.7
  ]

  const studentSkills: StudentSkillScore[] = [
    { skillId: 's1', currentLevel: 80 }, // 1.0 contribution
    { skillId: 's2', currentLevel: 60 }, // 60/80 = 0.75 contribution
    { skillId: 's3', currentLevel: 60 }, // 1.0 contribution
  ]

  const overall = calculateOverallReadiness(reqs, studentSkills)
  assert(overall === 91, `Engine: Weighted career readiness calculated accurately (${overall}%)`)

  // Career Evaluation
  const evalResult = evaluateCareerReadiness('Full Stack Developer', reqs, studentSkills)
  assert(evalResult.readinessPercentage === 91, 'Engine: Career evaluation returns exact percentage')
  assert(evalResult.priorityGap?.skillName === 'Node.js', 'Engine: Priority gap correctly identified as Node.js')
  assert(evalResult.priorityGap?.gap === 20, 'Engine: Node.js gap correctly computed as 20')
  assert(evalResult.strengths.length === 2, 'Engine: React & SQL correctly identified as strengths')
}

// ─── 2. PILLAR 3: IMPROVE (AI-POWERED COACH & LEARNING LOOP) ─────────────────
console.log('\n--- 2. Testing AI Coach & Adaptive Learning Loop ---')
{
  const aiProvider = new DeterministicSkillBridgeAIProvider()
  const sampleContext: StudentAIContext = {
    student: { id: 'std-1', name: 'Jordan', targetCareer: 'Full Stack Developer' },
    skills: [
      { id: 's1', name: 'React', currentScore: 80, requiredScore: 80, gap: 0, importance: 'High', status: 'ready', verificationStatus: 'evidence_verified' },
      { id: 's2', name: 'Node.js', currentScore: 60, requiredScore: 80, gap: 20, importance: 'High', status: 'critical', verificationStatus: 'assessment_verified' },
    ],
    readiness: {
      overallPercentage: 91,
      category: 'Ready',
      priorityGapSkill: 'Node.js',
      priorityGapPoints: 20,
    },
    reassessments: [],
  }

  // Diagnostic
  aiProvider.diagnose(sampleContext, 'Node.js').then(diag => {
    assert(diag.skill === 'Node.js', 'AI Coach: Diagnostic targets requested skill')
    assert(diag.gap === 20, 'AI Coach: Diagnostic preserves Phase 4 authoritative gap (20 pts)')
    assert(diag.weakAreas.length >= 2, 'AI Coach: Diagnostic identifies concrete weak areas')
  })

  // Learning Plan
  aiProvider.createLearningPlan(sampleContext, 'Node.js').then(plan => {
    assert(plan.steps.length === 5, 'AI Coach: Learning plan generates 5 sequential steps')
    assert(plan.steps[0].stepType === 'understand', 'AI Coach: Step 1 is conceptual understanding')
    assert(plan.steps[4].stepType === 'reassess', 'AI Coach: Final step is official benchmark reassessment')
  })

  // Practice Challenge Generation & Evaluation
  aiProvider.generatePractice(sampleContext, 'Node.js', 'Intermediate').then(practice => {
    assert(practice.question.skill === 'Node.js', 'AI Coach: Generated practice targets skill')
    assert(practice.serverAnswer.length > 0, 'AI Coach: Server answer securely stored')

    aiProvider.evaluatePractice(sampleContext, 'Node.js', practice.question.questionText, practice.serverAnswer, practice.serverAnswer).then(evalRes => {
      assert(evalRes.isCorrect === true, 'AI Coach: Correct student answer passes evaluation')
      assert(evalRes.score === 100, 'AI Coach: 100 score awarded for correct answer')
    })
  })
}

// ─── 3. PILLAR 4: PROVE (5-TIER VERIFICATION & SKILL PASSPORT) ───────────────
console.log('\n--- 3. Testing 5-Tier Verification Hierarchy & Skill Passport ---')
{
  // Verification Precedence
  assert(getVerificationRank('self_declared') === 1, 'Verification: self_declared is Rank 1')
  assert(getVerificationRank('assessment_verified') === 2, 'Verification: assessment_verified is Rank 2')
  assert(getVerificationRank('practical_verified') === 3, 'Verification: practical_verified is Rank 3')
  assert(getVerificationRank('evidence_verified') === 4, 'Verification: evidence_verified is Rank 4')
  assert(getVerificationRank('institution_verified') === 5, 'Verification: institution_verified is Rank 5')

  // Upgrades and Anti-Downgrade Protection
  const upgraded = resolveHigherVerificationStatus('assessment_verified', 'evidence_verified')
  assert(upgraded === 'evidence_verified', 'Verification: Promotes from assessment to evidence verified')

  const noDowngrade = resolveHigherVerificationStatus('evidence_verified', 'self_declared')
  assert(noDowngrade === 'evidence_verified', 'Verification: Blocks downgrade from evidence to self_declared')

  // Proof Coverage
  const required = [
    { skillId: 'react', skillName: 'React', minimumLevel: 75 },
    { skillId: 'node', skillName: 'Node.js', minimumLevel: 80 },
  ]
  const studentSkills: StudentSkillScore[] = [
    { skillId: 'react', skillName: 'React', currentLevel: 80, verificationStatus: 'evidence_verified' },
    { skillId: 'node', skillName: 'Node.js', currentLevel: 60, verificationStatus: 'assessment_verified' },
  ]
  const evidenceList: EvidenceItemSummary[] = [
    {
      id: 'ev-1',
      title: 'Full Stack App',
      evidenceType: 'project',
      status: 'verified',
      skillsClaimed: [{ skillId: 'react', skillName: 'React', verificationStatus: 'verified' }],
    },
  ]

  const proofResult = calculateProofCoverage(required, studentSkills, evidenceList)
  assert(proofResult.totalRequiredSkills === 2, 'Passport: 2 required skills evaluated')
  assert(proofResult.evidenceBackedCount === 1, 'Passport: 1 skill backed by verified evidence')
  assert(proofResult.proofCoveragePercentage === 50, 'Passport: 50% proof coverage computed')

  // Public Passport Privacy Sanitization
  const publicView = projectPublicPassport(
    { full_name: 'Alex Rivera', institution_name: 'Engineering Institute' },
    { shareToken: 'tok-xyz-987', show_skills: true, show_projects: true, show_certifications: true, show_readiness: true },
    [{ name: 'React', category: 'Frontend', level: 80, verification_status: 'evidence_verified', proof_count: 1 }],
    [{ title: 'Portfolio', description: 'Web app', evidence_type: 'project', is_verified: true, skills: ['React'] }],
    [],
    { careerName: 'Frontend Engineer', readinessPercentage: 85, category: 'Ready' }
  )

  assert(publicView.shareToken === 'tok-xyz-987', 'Passport: Share token preserved in public view')
  assert(!('email' in publicView), 'Passport: Email strictly excluded from public view')
  assert(publicView.skills.length === 1, 'Passport: Skills included when show_skills=true')
}

// ─── 4. PILLAR 5: CONNECT (OPPORTUNITY MATCHING & READINESS) ─────────────────
console.log('\n--- 4. Testing Opportunity-Specific Readiness & Matching ---')
{
  const studentSkills: StudentSkillScore[] = [
    { skillId: 'react', skillName: 'React', currentLevel: 85 },
    { skillId: 'node', skillName: 'Node.js', currentLevel: 70 },
  ]

  const opp1: MatchableOpportunity = {
    id: 'opp-1',
    title: 'Senior React Developer',
    companyName: 'Tech Corp',
    opportunityType: 'full_time',
    location: 'Remote',
    workMode: 'remote',
    duration: null,
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'published',
    skills: [
      { skillId: 'react', skillName: 'React', minimumLevel: 80, importance: 'High' },
    ],
  }

  const opp2: MatchableOpportunity = {
    id: 'opp-2',
    title: 'Backend Node.js Engineer',
    companyName: 'Backend Inc',
    opportunityType: 'full_time',
    location: 'Onsite',
    workMode: 'onsite',
    duration: null,
    deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
    status: 'published',
    skills: [
      { skillId: 'node', skillName: 'Node.js', minimumLevel: 85, importance: 'High' },
    ],
  }

  const ranked = rankOpportunitiesForStudent([opp1, opp2], studentSkills)
  assert(ranked.length === 2, 'Matching: Both opportunities evaluated and ranked')
  assert(ranked[0].opportunity.id === 'opp-1', 'Matching: Higher-matching opportunity (Senior React) ranked #1')
  assert(ranked[0].readiness.matchPercentage === 100, 'Matching: 100% match computed for React developer')
  assert(ranked[1].readiness.matchPercentage < 100, 'Matching: Lower match computed for Backend Node.js')
}

// ─── 5. PRODUCTION INTEGRITY & ENVIRONMENT VALIDATION ────────────────────────
console.log('\n--- 5. Testing Production Integrity & Security Boundaries ---')
{
  const envHealth = getEnvironmentHealth()
  assert(typeof envHealth.app.nodeEnv === 'string', 'Security: nodeEnv properly resolved')
  assert(typeof envHealth.supabase.configured === 'boolean', 'Security: Supabase configuration checked')
  assert(typeof envHealth.ai.configured === 'boolean', 'Security: AI configuration checked')
}

// ─── FINAL SUMMARY ───────────────────────────────────────────────────────────
setTimeout(() => {
  console.log('\n====================================================================')
  console.log(`PHASE 8 MASTER SUITE: ${passed} passed, ${failed} failed`)
  if (failed === 0) {
    console.log('=== ALL 5 PILLARS PASSED 100% OF VERIFICATION CHECKS ===')
    console.log('====================================================================\n')
  } else {
    console.error(`=== ${failed} CHECK(S) FAILED ===`)
    process.exit(1)
  }
}, 600)
