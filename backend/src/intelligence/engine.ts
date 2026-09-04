import { INTELLIGENCE_CONFIG } from './config'

export interface SkillRequirement {
  skillId: string
  skillName: string
  category?: string
  requiredLevel: number
  importance: 'High' | 'Medium' | 'Low' | string
}

export interface StudentSkillScore {
  skillId: string
  skillName?: string
  currentLevel: number
  verificationStatus?: string
  lastAssessedAt?: string
}

export interface EvaluatedSkillGap {
  skillId: string
  skillName: string
  category?: string
  requiredLevel: number
  currentLevel: number
  gap: number
  status: 'critical' | 'needs_improvement' | 'ready'
  importance: string
  priorityScore: number
  isAssessed: boolean
  recommendation: string
}

export interface CareerReadinessResult {
  careerId?: string
  careerName?: string
  readinessPercentage: number
  readinessCategory: string
  readinessVariant: 'success' | 'warning' | 'critical'
  skills: EvaluatedSkillGap[]
  strengths: EvaluatedSkillGap[]
  nearReadySkills: EvaluatedSkillGap[]
  criticalGaps: EvaluatedSkillGap[]
  priorityGap: EvaluatedSkillGap | null
  explanation: {
    strengthsText: string[]
    nearReadyText: string[]
    criticalText: string[]
    recommendedAction: string
  }
}

export interface OpportunityReadinessResult {
  opportunityId: string
  opportunityTitle: string
  companyName: string
  matchPercentage: number
  readinessCategory: string
  skillsMetCount: number
  totalSkillsCount: number
  skills: {
    skillId: string
    skillName: string
    requiredLevel: number
    currentLevel: number
    met: boolean
    gap: number
    importance: string
  }[]
  strengths: string[]
  missingSkills: string[]
  mainBlocker: string | null
  isEligible: boolean
}

/**
 * Normalizes any score to strict [0, 100] bounds.
 */
export function normalizeScore(score: number): number {
  if (isNaN(score) || score === null || score === undefined) return 0
  return Math.max(INTELLIGENCE_CONFIG.SCORE_MIN, Math.min(INTELLIGENCE_CONFIG.SCORE_MAX, Math.round(score)))
}

/**
 * Calculates raw gap: max(required - current, 0).
 */
export function calculateGap(requiredLevel: number, currentLevel: number): number {
  const req = normalizeScore(requiredLevel)
  const curr = normalizeScore(currentLevel)
  return Math.max(req - curr, 0)
}

/**
 * Classifies a gap based on gap size and importance.
 */
export function classifyGap(gap: number, importance: string = 'High'): 'critical' | 'needs_improvement' | 'ready' {
  if (gap <= INTELLIGENCE_CONFIG.GAP_THRESHOLDS.READY) {
    return 'ready'
  }
  if (gap >= INTELLIGENCE_CONFIG.GAP_THRESHOLDS.CRITICAL || (importance === 'High' && gap >= 10)) {
    return 'critical'
  }
  return 'needs_improvement'
}

/**
 * Calculates deterministic priority score: (gap / required) * importance_weight.
 */
export function calculatePriorityScore(gap: number, requiredLevel: number, importance: string = 'High'): number {
  if (gap <= 0 || requiredLevel <= 0) return 0
  const weight = INTELLIGENCE_CONFIG.IMPORTANCE_WEIGHTS[importance] ?? 0.7
  const gapRatio = gap / Math.max(requiredLevel, 1)
  return Number((gapRatio * weight).toFixed(4))
}

/**
 * Calculates individual skill readiness capped at 1.0 (100%).
 */
export function calculateSkillReadiness(currentLevel: number, requiredLevel: number): number {
  if (requiredLevel <= 0) return 1.0
  const curr = normalizeScore(currentLevel)
  const req = normalizeScore(requiredLevel)
  return Math.min(curr / req, 1.0)
}

/**
 * Calculates overall weighted career readiness:
 * sum(skill_readiness * importance_weight) / sum(importance_weight) * 100
 */
export function calculateOverallReadiness(
  requirements: SkillRequirement[],
  studentSkills: StudentSkillScore[]
): number {
  if (!requirements || requirements.length === 0) return 0

  const studentSkillMap = new Map<string, number>()
  studentSkills.forEach(s => {
    studentSkillMap.set(s.skillId, s.currentLevel)
    if (s.skillName) {
      studentSkillMap.set(s.skillName.toLowerCase(), s.currentLevel)
    }
  })

  let weightedSum = 0
  let totalWeight = 0

  for (const req of requirements) {
    const weight = INTELLIGENCE_CONFIG.IMPORTANCE_WEIGHTS[req.importance] ?? 0.7
    const currentScore = studentSkillMap.get(req.skillId) ?? studentSkillMap.get(req.skillName.toLowerCase()) ?? 0
    const readinessContribution = calculateSkillReadiness(currentScore, req.requiredLevel)

    weightedSum += readinessContribution * weight
    totalWeight += weight
  }

  if (totalWeight === 0) return 0
  const rawPercentage = (weightedSum / totalWeight) * 100
  return normalizeScore(rawPercentage)
}

/**
 * Calculates score improvement (+/- points).
 */
export function calculateImprovement(newScore: number, previousScore: number): number {
  return normalizeScore(newScore) - normalizeScore(previousScore)
}

/**
 * Maps score to standard skill level label.
 */
export function getSkillLevelInterpretation(score: number): string {
  const normalized = normalizeScore(score)
  for (const bracket of INTELLIGENCE_CONFIG.SKILL_LEVEL_BRACKETS) {
    if (normalized >= bracket.min && normalized <= bracket.max) {
      return bracket.label
    }
  }
  return 'Beginner'
}

/**
 * Maps readiness percentage to category label and badge variant.
 */
export function getReadinessCategory(readiness: number): { label: string; variant: 'success' | 'warning' | 'critical' } {
  const normalized = normalizeScore(readiness)
  for (const cat of INTELLIGENCE_CONFIG.READINESS_CATEGORIES) {
    if (normalized >= cat.min && normalized <= cat.max) {
      return { label: cat.label, variant: cat.variant }
    }
  }
  return { label: 'Not Ready', variant: 'critical' }
}

/**
 * Full Career Readiness Evaluator
 * Evaluates skill gaps, priority gap, strengths, and plain-English explainability.
 */
export function evaluateCareerReadiness(
  careerName: string,
  requirements: SkillRequirement[],
  studentSkills: StudentSkillScore[]
): CareerReadinessResult {
  const studentSkillMap = new Map<string, StudentSkillScore>()
  studentSkills.forEach(s => {
    studentSkillMap.set(s.skillId, s)
    if (s.skillName) {
      studentSkillMap.set(s.skillName.toLowerCase(), s)
    }
  })

  const evaluatedGaps: EvaluatedSkillGap[] = requirements.map(req => {
    const studentSkill = studentSkillMap.get(req.skillId) ?? studentSkillMap.get(req.skillName.toLowerCase())
    const currentLevel = studentSkill ? studentSkill.currentLevel : 0
    const isAssessed = Boolean(studentSkill && studentSkill.verificationStatus && studentSkill.verificationStatus !== 'self_declared')

    const gap = calculateGap(req.requiredLevel, currentLevel)
    const status = classifyGap(gap, req.importance)
    const priorityScore = calculatePriorityScore(gap, req.requiredLevel, req.importance)

    let recommendation = ''
    if (status === 'ready') {
      recommendation = `Target met (${currentLevel}/${req.requiredLevel}). Keep maintaining practical skills.`
    } else if (status === 'critical') {
      recommendation = `Complete targeted practice and take the ${req.skillName} practical challenge to close the ${gap}-point gap.`
    } else {
      recommendation = `Review ${req.skillName} concepts to close the small ${gap}-point gap.`
    }

    return {
      skillId: req.skillId,
      skillName: req.skillName,
      category: req.category,
      requiredLevel: req.requiredLevel,
      currentLevel,
      gap,
      status,
      importance: req.importance,
      priorityScore,
      isAssessed,
      recommendation,
    }
  })

  // Sort gaps by priority score descending
  evaluatedGaps.sort((a, b) => b.priorityScore - a.priorityScore)

  const strengths = evaluatedGaps.filter(g => g.status === 'ready')
  const criticalGaps = evaluatedGaps.filter(g => g.status === 'critical')
  const nearReadySkills = evaluatedGaps.filter(g => g.status === 'needs_improvement')
  const priorityGap = evaluatedGaps.find(g => g.gap > 0) ?? null

  const overallReadiness = calculateOverallReadiness(requirements, studentSkills)
  const hasVerifiedSkill = studentSkills.some(skill => skill.verificationStatus && skill.verificationStatus !== 'self_declared')
  const categoryInfo = hasVerifiedSkill
    ? getReadinessCategory(overallReadiness)
    : { label: 'Not Assessed', variant: 'warning' as const }

  const strengthsText = strengths.map(s => `${s.skillName} (${s.currentLevel}/${s.requiredLevel} req)`)
  const nearReadyText = nearReadySkills.map(s => `${s.skillName} (${s.currentLevel}/${s.requiredLevel}, ${s.gap} pts to close)`)
  const criticalText = criticalGaps.map(s => `${s.skillName} (${s.currentLevel}/${s.requiredLevel}, ${s.gap} pt gap)`)

  const recommendedAction = priorityGap
    ? `Focus on closing the ${priorityGap.gap}-point gap in ${priorityGap.skillName} (${priorityGap.importance} priority) to maximize your ${careerName} readiness.`
    : `All core skill benchmarks for ${careerName} are currently satisfied!`

  return {
    careerName,
    readinessPercentage: overallReadiness,
    readinessCategory: categoryInfo.label,
    readinessVariant: categoryInfo.variant,
    skills: evaluatedGaps,
    strengths,
    nearReadySkills,
    criticalGaps,
    priorityGap,
    explanation: {
      strengthsText,
      nearReadyText,
      criticalText,
      recommendedAction,
    },
  }
}

/**
 * Opportunity Readiness Evaluator
 * Evaluates student skills against specific opportunity requirements.
 */
export function evaluateOpportunityReadiness(
  opportunity: {
    id: string
    title: string
    companyName: string
    skills: { skillId: string; skillName: string; minimumLevel: number; importance?: string }[]
  },
  studentSkills: StudentSkillScore[]
): OpportunityReadinessResult {
  const studentSkillMap = new Map<string, number>()
  studentSkills.forEach(s => {
    studentSkillMap.set(s.skillId, s.currentLevel)
    if (s.skillName) {
      studentSkillMap.set(s.skillName.toLowerCase(), s.currentLevel)
    }
  })

  let totalWeightedReadiness = 0
  let totalWeight = 0
  let skillsMetCount = 0

  const skillDetails = opportunity.skills.map(req => {
    const current = studentSkillMap.get(req.skillId) ?? studentSkillMap.get(req.skillName.toLowerCase()) ?? 0
    const met = current >= req.minimumLevel
    if (met) skillsMetCount++

    const gap = Math.max(req.minimumLevel - current, 0)
    const importance = req.importance || 'High'
    const weight = INTELLIGENCE_CONFIG.IMPORTANCE_WEIGHTS[importance] ?? 0.7

    const skillReadiness = calculateSkillReadiness(current, req.minimumLevel)
    totalWeightedReadiness += skillReadiness * weight
    totalWeight += weight

    return {
      skillId: req.skillId,
      skillName: req.skillName,
      requiredLevel: req.minimumLevel,
      currentLevel: current,
      met,
      gap,
      importance,
    }
  })

  const rawMatch = totalWeight > 0 ? (totalWeightedReadiness / totalWeight) * 100 : 0
  const matchPercentage = normalizeScore(rawMatch)
  const readinessCategory = getReadinessCategory(matchPercentage).label

  const strengths = skillDetails.filter(s => s.met).map(s => s.skillName)
  const missingSkills = skillDetails.filter(s => !s.met).map(s => s.skillName)
  const worstGapSkill = [...skillDetails].sort((a, b) => b.gap - a.gap)[0]
  const mainBlocker = worstGapSkill && worstGapSkill.gap > 0 ? worstGapSkill.skillName : null

  return {
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    companyName: opportunity.companyName,
    matchPercentage,
    readinessCategory,
    skillsMetCount,
    totalSkillsCount: opportunity.skills.length,
    skills: skillDetails,
    strengths,
    missingSkills,
    mainBlocker,
    isEligible: matchPercentage >= 60,
  }
}
