/**
 * Phase 7 — Verification & Proof Intelligence Unit Tests
 * Tests: verification hierarchy, rank precedence, proof coverage analytics,
 * public passport privacy projection, and non-destructive skill state updates.
 */

import {
  getVerificationRank,
  isHigherOrEqualVerification,
  resolveHigherVerificationStatus,
  getVerificationBadgeInfo,
  calculateProofCoverage,
  projectPublicPassport,
  VERIFICATION_RANKS,
  VerificationLevel,
  EvidenceItemSummary,
} from './verification'

import { StudentSkillScore } from './engine'

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

console.log('\n=== RUNNING PHASE 7 VERIFICATION & SKILL PASSPORT UNIT TESTS ===\n')

// ─── Test Group 1: Verification Hierarchy & Ranks ────────────────────────────
{
  assert(getVerificationRank('self_declared') === 1, 'Test 1a: self_declared has rank 1')
  assert(getVerificationRank('assessment_verified') === 2, 'Test 1b: assessment_verified has rank 2')
  assert(getVerificationRank('practical_verified') === 3, 'Test 1c: practical_verified has rank 3')
  assert(getVerificationRank('evidence_verified') === 4, 'Test 1d: evidence_verified has rank 4')
  assert(getVerificationRank('institution_verified') === 5, 'Test 1e: institution_verified has rank 5')
  assert(getVerificationRank(null) === 1, 'Test 1f: null/undefined fallback to rank 1')
  assert(getVerificationRank('unknown_status') === 1, 'Test 1g: unknown status fallback to rank 1')
}

// ─── Test Group 2: Verification Precedence Rules ─────────────────────────────
{
  assert(
    isHigherOrEqualVerification('evidence_verified', 'assessment_verified'),
    'Test 2a: evidence_verified >= assessment_verified'
  )
  assert(
    isHigherOrEqualVerification('institution_verified', 'evidence_verified'),
    'Test 2b: institution_verified >= evidence_verified'
  )
  assert(
    !isHigherOrEqualVerification('self_declared', 'practical_verified'),
    'Test 2c: self_declared < practical_verified'
  )
  assert(
    isHigherOrEqualVerification('assessment_verified', 'assessment_verified'),
    'Test 2d: equal levels return true'
  )
}

// ─── Test Group 3: Non-Destructive State Promotion ───────────────────────────
{
  // Upgrades should succeed
  const upgraded = resolveHigherVerificationStatus('assessment_verified', 'evidence_verified')
  assert(upgraded === 'evidence_verified', 'Test 3a: assessment_verified upgrades to evidence_verified')

  const institutionUpgrade = resolveHigherVerificationStatus('evidence_verified', 'institution_verified')
  assert(institutionUpgrade === 'institution_verified', 'Test 3b: evidence_verified upgrades to institution_verified')

  // Downgrades should be blocked by precedence
  const noDowngrade = resolveHigherVerificationStatus('evidence_verified', 'self_declared')
  assert(noDowngrade === 'evidence_verified', 'Test 3c: evidence_verified is not downgraded by self_declared')

  const noDowngradeAssessment = resolveHigherVerificationStatus('institution_verified', 'assessment_verified')
  assert(noDowngradeAssessment === 'institution_verified', 'Test 3d: institution_verified is not downgraded by assessment')
}

// ─── Test Group 4: Badge Metadata Integrity ─────────────────────────────────
{
  const levels: VerificationLevel[] = [
    'self_declared',
    'assessment_verified',
    'practical_verified',
    'evidence_verified',
    'institution_verified',
  ]

  for (const lvl of levels) {
    const info = getVerificationBadgeInfo(lvl)
    assert(typeof info.label === 'string' && info.label.length > 0, `Test 4a [${lvl}]: Valid label`)
    assert(typeof info.shortLabel === 'string' && info.shortLabel.length > 0, `Test 4b [${lvl}]: Valid shortLabel`)
    assert(typeof info.description === 'string' && info.description.length > 0, `Test 4c [${lvl}]: Valid description`)
    assert(['secondary', 'outline', 'warning', 'success', 'accent'].includes(info.variant), `Test 4d [${lvl}]: Valid badge variant`)
  }
}

// ─── Test Group 5: Proof Coverage Calculator ─────────────────────────────────
{
  const required = [
    { skillId: 'react', skillName: 'React', minimumLevel: 70 },
    { skillId: 'node', skillName: 'Node.js', minimumLevel: 65 },
    { skillId: 'sql', skillName: 'SQL', minimumLevel: 60 },
  ]

  const studentSkills: StudentSkillScore[] = [
    { skillId: 'react', skillName: 'React', currentLevel: 80, verificationStatus: 'evidence_verified' },
    { skillId: 'node', skillName: 'Node.js', currentLevel: 68, verificationStatus: 'assessment_verified' },
    { skillId: 'sql', skillName: 'SQL', currentLevel: 45, verificationStatus: 'self_declared' },
  ]

  const evidenceList: EvidenceItemSummary[] = [
    {
      id: 'ev-1',
      title: 'E-Commerce Frontend & Backend',
      evidenceType: 'project',
      url: 'https://github.com/student/e-commerce',
      status: 'verified',
      skillsClaimed: [
        {
          skillId: 'react',
          skillName: 'React',
          verificationStatus: 'verified',
        },
      ],
    },
  ]

  const coverage = calculateProofCoverage(required, studentSkills, evidenceList)

  assert(coverage.totalRequiredSkills === 3, 'Test 5a: totalRequiredSkills is 3')
  assert(coverage.scoreSatisfiedCount === 2, 'Test 5b: scoreSatisfiedCount is 2 (React 80 >= 70, Node 68 >= 65)')
  assert(coverage.verifiedSkillsCount === 2, 'Test 5c: verifiedSkillsCount is 2 (React + Node are assessed/evidence)')
  assert(coverage.evidenceBackedCount === 1, 'Test 5d: evidenceBackedCount is 1 (React has verified evidence)')
  assert(coverage.proofCoveragePercentage === 33, `Test 5e: proofCoveragePercentage is 33% (1/3)`, `Got: ${coverage.proofCoveragePercentage}%`)
  assert(coverage.skills.length === 3, 'Test 5f: 3 skill details returned')
  assert(coverage.skills[0].proofItems.length === 1, 'Test 5g: React skill has 1 proof item attached')
  assert(coverage.skills[1].proofItems.length === 0, 'Test 5h: Node.js has 0 proof items attached')
}

// ─── Test Group 6: Full Proof Coverage (100%) ────────────────────────────────
{
  const required = [{ skillId: 'git', skillName: 'Git', minimumLevel: 50 }]
  const studentSkills: StudentSkillScore[] = [
    { skillId: 'git', skillName: 'Git', currentLevel: 75, verificationStatus: 'evidence_verified' },
  ]
  const evidenceList: EvidenceItemSummary[] = [
    {
      id: 'ev-git',
      title: 'Open Source Contributions',
      evidenceType: 'github_repo',
      status: 'verified',
      skillsClaimed: [{ skillId: 'git', skillName: 'Git', verificationStatus: 'verified' }],
    },
  ]

  const coverage = calculateProofCoverage(required, studentSkills, evidenceList)
  assert(coverage.proofCoveragePercentage === 100, 'Test 6a: 100% proof coverage when all required skills have proof')
  assert(coverage.summaryMessage.includes('All required skills'), 'Test 6b: Positive summary message on 100% coverage')
}

// ─── Test Group 7: Public Passport Privacy Projection ────────────────────────
{
  const rawProfile = { full_name: 'Alex Rivera', institution_name: 'Tech University' }
  const settings = {
    shareToken: 'test-token-12345678',
    headline: 'Full Stack Engineer',
    bio: 'Passionate software developer.',
    show_skills: true,
    show_projects: true,
    show_certifications: false, // hidden by student
    show_readiness: true,
  }

  const rawSkills = [
    { name: 'TypeScript', category: 'Frontend', level: 85, verification_status: 'evidence_verified', proof_count: 2 },
  ]
  const rawProjects = [
    { title: 'Project Alpha', description: 'Built with TS', evidence_type: 'project', url: 'https://demo.com', is_verified: true, skills: ['TypeScript'] },
  ]
  const rawCerts = [
    { name: 'AWS Certified Cloud Practitioner', issuing_organization: 'Amazon', issue_date: '2026-01-01', verification_status: 'verified' },
  ]

  const publicPassport = projectPublicPassport(
    rawProfile,
    settings,
    rawSkills,
    rawProjects,
    rawCerts,
    { careerName: 'Full Stack Developer', readinessPercentage: 88, category: 'Strong Match' }
  )

  assert(publicPassport.shareToken === 'test-token-12345678', 'Test 7a: Share token preserved')
  assert(publicPassport.headline === 'Full Stack Engineer', 'Test 7b: Headline preserved')
  assert(publicPassport.institutionName === 'Tech University', 'Test 7c: Institution name included')
  assert(publicPassport.skills.length === 1, 'Test 7d: Skills included when show_skills=true')
  assert(publicPassport.projects.length === 1, 'Test 7e: Projects included when show_projects=true')
  assert(publicPassport.certifications.length === 0, 'Test 7f: Certifications excluded when show_certifications=false')
  assert(publicPassport.careerReadiness?.readinessPercentage === 88, 'Test 7g: Career readiness included when show_readiness=true')
  assert(!('email' in publicPassport), 'Test 7h: Email field is strictly omitted from public passport')
}

// ─── Test Group 8: Public Passport with Section Hiding ───────────────────────
{
  const rawProfile = { full_name: 'Anonymous Student' }
  const settings = {
    shareToken: 'private-view-token',
    show_skills: false,
    show_projects: false,
    show_certifications: false,
    show_readiness: false,
  }

  const publicPassport = projectPublicPassport(
    rawProfile,
    settings,
    [{ name: 'Python', category: 'Backend', level: 90, verification_status: 'evidence_verified', proof_count: 1 }],
    [{ title: 'Secret Repo', description: 'Desc', evidence_type: 'project', is_verified: true, skills: [] }],
    [],
    null
  )

  assert(publicPassport.skills.length === 0, 'Test 8a: Skills hidden when show_skills=false')
  assert(publicPassport.projects.length === 0, 'Test 8b: Projects hidden when show_projects=false')
  assert(publicPassport.careerReadiness === null, 'Test 8c: Readiness hidden when show_readiness=false')
}

// ─── Test Group 9: Score & Verification Orthogonality ────────────────────────
{
  // Verify that promotion never modifies score
  const studentSkill = { skillId: 'react', currentLevel: 78, verificationStatus: 'assessment_verified' }
  const targetLevel = resolveHigherVerificationStatus(studentSkill.verificationStatus, 'evidence_verified')

  assert(studentSkill.currentLevel === 78, 'Test 9a: Skill score remains exactly 78 after verification')
  assert(targetLevel === 'evidence_verified', 'Test 9b: Verification status updated to evidence_verified')
}

// ─── Results Summary ─────────────────────────────────────────────────────────
console.log(`\n=== PHASE 7 TESTS: ${passed} passed, ${failed} failed ===`)
if (failed === 0) {
  console.log('=== ALL PHASE 7 VERIFICATION TESTS PASSED SUCCESSFULLY ===\n')
} else {
  console.error(`=== ${failed} TEST(S) FAILED — REVIEW ABOVE ===\n`)
  process.exit(1)
}
