/**
 * Phase 6 — Opportunity Matching Service
 *
 * ARCHITECTURE CONTRACT:
 * This service is a thin orchestration layer above the Phase 4 intelligence engine.
 * It does NOT re-implement readiness calculations. It calls `evaluateOpportunityReadiness`
 * from the engine, which remains the single authoritative source of truth.
 *
 * Usage: Server-side only (API routes). Never import in client components.
 */

import {
  evaluateOpportunityReadiness,
  StudentSkillScore,
  OpportunityReadinessResult,
  normalizeScore,
} from './engine'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OpportunityRequirement {
  skillId: string
  skillName: string
  minimumLevel: number
  importance: string
}

export interface MatchableOpportunity {
  id: string
  title: string
  companyName: string
  opportunityType: string
  location: string
  workMode: string
  duration: string | null
  deadline: string | null
  status: string
  skills: OpportunityRequirement[]
}

export interface RankedOpportunityResult {
  opportunity: MatchableOpportunity
  readiness: OpportunityReadinessResult
  relevanceScore: number
  isDeadlineSoon: boolean
  isDeadlinePassed: boolean
  daysUntilDeadline: number | null
}

export interface MatchExplanation {
  summary: string
  strengths: string[]
  gaps: { skillName: string; currentLevel: number; requiredLevel: number; gap: number }[]
  mainBlocker: string | null
  readinessLabel: string
  readinessVariant: 'success' | 'warning' | 'critical'
  recommendedAction: string
  nextSteps: { action: string; href: string }[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEADLINE_SOON_DAYS = 7

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns deadline status for an opportunity.
 */
export function getDeadlineStatus(deadline: string | null): {
  isPassed: boolean
  isSoon: boolean
  daysUntilDeadline: number | null
  label: string
} {
  if (!deadline) return { isPassed: false, isSoon: false, daysUntilDeadline: null, label: 'Rolling' }

  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffMs = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { isPassed: true, isSoon: false, daysUntilDeadline: diffDays, label: 'Closed' }
  }
  if (diffDays <= DEADLINE_SOON_DAYS) {
    return { isPassed: false, isSoon: true, daysUntilDeadline: diffDays, label: `${diffDays}d left` }
  }
  return {
    isPassed: false,
    isSoon: false,
    daysUntilDeadline: diffDays,
    label: deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
}

/**
 * Computes a relevance score combining readiness + deadline urgency.
 * Used to rank recommended opportunities.
 *
 * Score = (readiness * 0.7) + (deadline_urgency * 0.3)
 * deadline_urgency: higher when closer to deadline (excluding passed)
 */
export function computeRelevanceScore(
  readinessPercentage: number,
  deadline: string | null
): number {
  const readinessFactor = normalizeScore(readinessPercentage) * 0.7

  let deadlineFactor = 50 * 0.3 // default neutral
  if (deadline) {
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 0) {
      // Closer deadline = higher urgency (bounded 0-100)
      const urgency = Math.max(0, Math.min(100, 100 - Math.min(diffDays, 90)))
      deadlineFactor = urgency * 0.3
    }
  }

  return normalizeScore(readinessFactor + deadlineFactor)
}

// ─── Core Matching ────────────────────────────────────────────────────────────

/**
 * Evaluate a single student-opportunity match using the Phase 4 engine.
 * This is the ONLY function that calls evaluateOpportunityReadiness.
 */
export function matchStudentToOpportunity(
  opportunity: MatchableOpportunity,
  studentSkills: StudentSkillScore[]
): OpportunityReadinessResult {
  return evaluateOpportunityReadiness(
    {
      id: opportunity.id,
      title: opportunity.title,
      companyName: opportunity.companyName,
      skills: opportunity.skills.map(s => ({
        skillId: s.skillId,
        skillName: s.skillName,
        minimumLevel: s.minimumLevel,
        importance: s.importance,
      })),
    },
    studentSkills
  )
}

/**
 * Rank a list of opportunities for a student by relevance.
 * Returns sorted array: highest relevance first.
 * Passed-deadline opportunities are moved to the bottom.
 */
export function rankOpportunitiesForStudent(
  opportunities: MatchableOpportunity[],
  studentSkills: StudentSkillScore[]
): RankedOpportunityResult[] {
  const ranked: RankedOpportunityResult[] = opportunities.map(opp => {
    const readiness = matchStudentToOpportunity(opp, studentSkills)
    const deadlineStatus = getDeadlineStatus(opp.deadline)
    const relevanceScore = deadlineStatus.isPassed
      ? 0
      : computeRelevanceScore(readiness.matchPercentage, opp.deadline)

    return {
      opportunity: opp,
      readiness,
      relevanceScore,
      isDeadlineSoon: deadlineStatus.isSoon,
      isDeadlinePassed: deadlineStatus.isPassed,
      daysUntilDeadline: deadlineStatus.daysUntilDeadline,
    }
  })

  // Sort: non-passed first by relevance desc, passed last
  return ranked.sort((a, b) => {
    if (a.isDeadlinePassed && !b.isDeadlinePassed) return 1
    if (!a.isDeadlinePassed && b.isDeadlinePassed) return -1
    return b.relevanceScore - a.relevanceScore
  })
}

// ─── Match Explanation ────────────────────────────────────────────────────────

/**
 * Builds a structured, human-readable match explanation for the student.
 * AI Coach may expand on this, but this is the authoritative source.
 */
export function buildMatchExplanation(
  result: OpportunityReadinessResult,
  opportunityId: string
): MatchExplanation {
  const pct = result.matchPercentage
  const readinessLabel = pct >= 85 ? 'Strong Match' : pct >= 65 ? 'Good Match' : pct >= 40 ? 'Developing' : 'Not Ready'
  const readinessVariant: 'success' | 'warning' | 'critical' =
    pct >= 65 ? 'success' : pct >= 40 ? 'warning' : 'critical'

  const strengths = result.skills.filter(s => s.met).map(s => s.skillName)
  const gaps = result.skills
    .filter(s => !s.met)
    .map(s => ({
      skillName: s.skillName,
      currentLevel: s.currentLevel,
      requiredLevel: s.requiredLevel,
      gap: s.gap,
    }))
    .sort((a, b) => b.gap - a.gap)

  const summary =
    pct >= 85
      ? `You meet all core requirements for this opportunity. Apply now.`
      : pct >= 65
        ? `You meet ${result.skillsMetCount} of ${result.totalSkillsCount} required skills. Addressing ${gaps[0]?.skillName || 'the remaining gap'} will boost your readiness.`
        : `You are building toward this opportunity. Close ${gaps.length} skill gap${gaps.length > 1 ? 's' : ''} to become competitive.`

  const recommendedAction = result.mainBlocker
    ? `Focus on improving ${result.mainBlocker} to maximize your match percentage.`
    : `All required skills are satisfied — you are ready to apply!`

  const nextSteps: { action: string; href: string }[] = []

  if (result.mainBlocker) {
    nextSteps.push({ action: `Improve ${result.mainBlocker}`, href: '/student/skills' })
    nextSteps.push({ action: 'Get AI coaching for this opportunity', href: `/student/ai-coach?opportunity=${opportunityId}` })
  }

  if (pct >= 65) {
    nextSteps.push({ action: 'View Skill Passport', href: '/student/passport' })
  }

  return {
    summary,
    strengths,
    gaps,
    mainBlocker: result.mainBlocker,
    readinessLabel,
    readinessVariant,
    recommendedAction,
    nextSteps,
  }
}
