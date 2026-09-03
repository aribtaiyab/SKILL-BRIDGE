/**
 * Phase 7 — Verification & Proof Intelligence Service
 *
 * ARCHITECTURE CONTRACT:
 * - Governs the 5-tier verification precedence hierarchy.
 * - Does NOT mutate or recalculate Phase 4 skill scores or career readiness.
 * - Manages proof-to-skill linkages and evidence-supported confidence.
 * - Provides privacy-safe projections for public passports.
 */

import { StudentSkillScore, SkillRequirement, normalizeScore } from './engine'

// ─── Verification Status Hierarchy ──────────────────────────────────────────

export type VerificationLevel =
  | 'self_declared'
  | 'assessment_verified'
  | 'practical_verified'
  | 'evidence_verified'
  | 'institution_verified'

export const VERIFICATION_RANKS: Record<VerificationLevel, number> = {
  self_declared: 1,
  assessment_verified: 2,
  practical_verified: 3,
  evidence_verified: 4,
  institution_verified: 5,
}

export const VERIFICATION_METADATA: Record<
  VerificationLevel,
  {
    label: string
    shortLabel: string
    variant: 'secondary' | 'outline' | 'warning' | 'success' | 'accent'
    description: string
  }
> = {
  self_declared: {
    label: 'Self-Declared',
    shortLabel: 'Declared',
    variant: 'secondary',
    description: 'Skill declared by student without official platform assessment or proof.',
  },
  assessment_verified: {
    label: 'Assessment Verified',
    shortLabel: 'Assessed',
    variant: 'outline',
    description: 'Skill evaluated and confirmed through SkillBridge knowledge assessment.',
  },
  practical_verified: {
    label: 'Practical Verified',
    shortLabel: 'Practical',
    variant: 'warning',
    description: 'Skill validated through timed practical coding or problem-solving tasks.',
  },
  evidence_verified: {
    label: 'Evidence Verified',
    shortLabel: 'Evidence',
    variant: 'success',
    description: 'Skill verified by reviewing submitted project codebase, repository, or portfolio proof.',
  },
  institution_verified: {
    label: 'Institution Verified',
    shortLabel: 'Institution',
    variant: 'accent',
    description: 'Skill officially audited and attested by an accredited academic institution.',
  },
}

/**
 * Returns the numerical rank (1-5) of a verification status.
 */
export function getVerificationRank(status: string | null | undefined): number {
  if (!status) return VERIFICATION_RANKS.self_declared
  const normalized = status.toLowerCase().trim() as VerificationLevel
  return VERIFICATION_RANKS[normalized] ?? 1
}

/**
 * Checks whether candidateStatus is greater than or equal to currentStatus in the hierarchy.
 */
export function isHigherOrEqualVerification(
  candidateStatus: string,
  currentStatus: string
): boolean {
  return getVerificationRank(candidateStatus) >= getVerificationRank(currentStatus)
}

/**
 * Determines the upgraded verification status.
 * Precedence rule: higher verification levels are never downgraded by lower ones.
 */
export function resolveHigherVerificationStatus(
  currentStatus: string,
  newClaim: string
): VerificationLevel {
  const currentRank = getVerificationRank(currentStatus)
  const newRank = getVerificationRank(newClaim)
  return (newRank >= currentRank ? newClaim : currentStatus) as VerificationLevel
}

/**
 * Formats badge information for a given verification status.
 */
export function getVerificationBadgeInfo(status: string | null | undefined) {
  const normalized = (status?.toLowerCase().trim() || 'self_declared') as VerificationLevel
  return VERIFICATION_METADATA[normalized] || VERIFICATION_METADATA.self_declared
}

// ─── Evidence & Proof Coverage ───────────────────────────────────────────────

export interface EvidenceItemSummary {
  id: string
  title: string
  evidenceType: string
  url?: string | null
  status: 'draft' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'needs_clarification' | 'archived'
  verifiedAt?: string | null
  reviewerFeedback?: string | null
  skillsClaimed: {
    skillId: string
    skillName: string
    claimedLevel?: number
    claimDescription?: string
    verificationStatus: 'pending' | 'verified' | 'rejected' | 'unverified'
  }[]
}

export interface SkillProofCoverageDetail {
  skillId: string
  skillName: string
  requiredLevel: number
  currentLevel: number
  scoreMet: boolean
  verificationStatus: VerificationLevel
  isEvidenceVerified: boolean
  proofCount: number
  proofItems: {
    evidenceId: string
    title: string
    evidenceType: string
    url?: string | null
  }[]
}

export interface ProofCoverageResult {
  totalRequiredSkills: number
  scoreSatisfiedCount: number
  verifiedSkillsCount: number
  evidenceBackedCount: number
  proofCoveragePercentage: number
  skills: SkillProofCoverageDetail[]
  summaryMessage: string
}

/**
 * Calculates proof coverage for an opportunity or career target.
 * Shows which required skills have evidence attached vs which only have scores/assessments.
 */
export function calculateProofCoverage(
  requiredSkills: { skillId: string; skillName: string; minimumLevel: number }[],
  studentSkills: StudentSkillScore[],
  studentEvidence: EvidenceItemSummary[]
): ProofCoverageResult {
  const studentSkillMap = new Map<string, StudentSkillScore>()
  studentSkills.forEach(s => {
    studentSkillMap.set(s.skillId, s)
    if (s.skillName) {
      studentSkillMap.set(s.skillName.toLowerCase(), s)
    }
  })

  // Map verified evidence by skillId
  const verifiedEvidenceBySkill = new Map<string, { evidenceId: string; title: string; evidenceType: string; url?: string | null }[]>()

  for (const ev of studentEvidence) {
    if (ev.status === 'verified') {
      for (const sk of ev.skillsClaimed) {
        if (sk.verificationStatus === 'verified') {
          const list = verifiedEvidenceBySkill.get(sk.skillId) || []
          list.push({
            evidenceId: ev.id,
            title: ev.title,
            evidenceType: ev.evidenceType,
            url: ev.url,
          })
          verifiedEvidenceBySkill.set(sk.skillId, list)
          if (sk.skillName) {
            verifiedEvidenceBySkill.set(sk.skillName.toLowerCase(), list)
          }
        }
      }
    }
  }

  let scoreSatisfiedCount = 0
  let verifiedSkillsCount = 0
  let evidenceBackedCount = 0

  const details: SkillProofCoverageDetail[] = requiredSkills.map(req => {
    const studentSkill = studentSkillMap.get(req.skillId) ?? studentSkillMap.get(req.skillName.toLowerCase())
    const currentLevel = studentSkill?.currentLevel || 0
    const rawStatus = (studentSkill?.verificationStatus || 'self_declared') as VerificationLevel
    const scoreMet = currentLevel >= req.minimumLevel
    if (scoreMet) scoreSatisfiedCount++

    const isAssessed = getVerificationRank(rawStatus) >= VERIFICATION_RANKS.assessment_verified
    if (isAssessed) verifiedSkillsCount++

    const proofs = verifiedEvidenceBySkill.get(req.skillId) || verifiedEvidenceBySkill.get(req.skillName.toLowerCase()) || []
    const isEvidenceVerified = proofs.length > 0 || getVerificationRank(rawStatus) >= VERIFICATION_RANKS.evidence_verified
    if (isEvidenceVerified) evidenceBackedCount++

    return {
      skillId: req.skillId,
      skillName: req.skillName,
      requiredLevel: req.minimumLevel,
      currentLevel,
      scoreMet,
      verificationStatus: rawStatus,
      isEvidenceVerified,
      proofCount: proofs.length,
      proofItems: proofs,
    }
  })

  const total = requiredSkills.length
  const proofCoveragePercentage = total > 0 ? normalizeScore((evidenceBackedCount / total) * 100) : 0

  let summaryMessage = ''
  if (proofCoveragePercentage === 100) {
    summaryMessage = 'All required skills have verified project proof.'
  } else if (proofCoveragePercentage >= 60) {
    summaryMessage = `${evidenceBackedCount} of ${total} required skills have verified proof. Adding proof for remaining skills will strengthen your candidacy.`
  } else {
    summaryMessage = `Proof coverage is low (${evidenceBackedCount}/${total}). Submitting projects or repositories for required skills will boost employer confidence.`
  }

  return {
    totalRequiredSkills: total,
    scoreSatisfiedCount,
    verifiedSkillsCount,
    evidenceBackedCount,
    proofCoveragePercentage,
    skills: details,
    summaryMessage,
  }
}

// ─── Public Passport Privacy Projection ──────────────────────────────────────

export interface PublicPassportView {
  shareToken: string
  headline: string | null
  bio: string | null
  institutionName?: string | null
  skills: {
    skillName: string
    category: string
    level: number
    verificationStatus: VerificationLevel
    verificationBadge: { label: string; variant: string }
    proofCount: number
  }[]
  projects: {
    title: string
    description: string
    evidenceType: string
    url?: string | null
    verified: boolean
    skills: string[]
  }[]
  certifications: {
    name: string
    issuingOrganization: string
    issueDate?: string | null
    verificationStatus: string
  }[]
  careerReadiness?: {
    careerName: string
    readinessPercentage: number
    category: string
  } | null
}

/**
 * Sanitizes and projects passport data for public viewing.
 * Strips all private data (email, student_id, internal reviewer notes, private evidence).
 */
export function projectPublicPassport(
  profile: { full_name: string; institution_name?: string },
  settings: {
    shareToken: string
    headline?: string | null
    bio?: string | null
    show_skills: boolean
    show_projects: boolean
    show_certifications: boolean
    show_readiness: boolean
  },
  skills: { name: string; category: string; level: number; verification_status: string; proof_count: number }[],
  projects: { title: string; description: string; evidence_type: string; url?: string | null; is_verified: boolean; skills: string[] }[],
  certifications: { name: string; issuing_organization: string; issue_date?: string | null; verification_status: string }[],
  careerReadiness?: { careerName: string; readinessPercentage: number; category: string } | null
): PublicPassportView {
  return {
    shareToken: settings.shareToken,
    headline: settings.headline || null,
    bio: settings.bio || null,
    institutionName: profile.institution_name || null,
    skills: settings.show_skills
      ? skills.map(s => {
          const vLevel = (s.verification_status || 'self_declared') as VerificationLevel
          const badge = getVerificationBadgeInfo(vLevel)
          return {
            skillName: s.name,
            category: s.category || 'Technical',
            level: s.level,
            verificationStatus: vLevel,
            verificationBadge: { label: badge.label, variant: badge.variant },
            proofCount: s.proof_count || 0,
          }
        })
      : [],
    projects: settings.show_projects
      ? projects.map(p => ({
          title: p.title,
          description: p.description,
          evidenceType: p.evidence_type,
          url: p.url || null,
          verified: p.is_verified,
          skills: p.skills || [],
        }))
      : [],
    certifications: settings.show_certifications
      ? certifications.map(c => ({
          name: c.name,
          issuingOrganization: c.issuing_organization,
          issueDate: c.issue_date || null,
          verificationStatus: c.verification_status,
        }))
      : [],
    careerReadiness: settings.show_readiness && careerReadiness ? careerReadiness : null,
  }
}
