/**
 * Career Navigator - Deterministic Career Comparison Engine
 *
 * Implements the authoritative decision framework for comparing career tracks.
 * Rules:
 * 1. AI never calculates match scores; this deterministic engine computes them.
 * 2. Never confuse Market Opportunity with Student Skill Fit.
 * 3. Configurable weights stored centrally.
 * 4. Can recommend Career A, Career B, Hybrid Path, or Explore Further.
 */

import { CareerBenchmarkProfile, CAREER_BENCHMARK_PROFILES } from '@/lib/benchmarks'
import { CareerMarketData, MarketIntelligenceService } from './market-service'
import { StudentSkillScore } from '@/lib/intelligence/engine'

export interface EngineWeights {
  skillFit: number // default 0.35
  requirementsMet: number // default 0.25
  marketOutlook: number // default 0.20
  preferences: number // default 0.10
  transitionEase: number // default 0.10
}

export const DEFAULT_ENGINE_WEIGHTS: EngineWeights = {
  skillFit: 0.35,
  requirementsMet: 0.25,
  marketOutlook: 0.20,
  preferences: 0.10,
  transitionEase: 0.10,
}

export interface CareerComparisonItem {
  careerId: string
  careerName: string
  careerSlug: string
  fitScore: number // 0-100 (skill readiness)
  overallScore: number // 0-100 (weighted decision framework score)
  skillAdvantage: 'High' | 'Moderate' | 'Low'
  gapLevel: 'Low' | 'Moderate' | 'High'
  marketOutlook: 'Very Strong' | 'Strong' | 'Moderate' | 'Specialized'
  transitionDifficulty: 'Low' | 'Moderate' | 'High'
  requirementsCount: number
  skillsMetCount: number
  topStrengths: string[]
  topGaps: Array<{
    skillName: string
    currentScore: number
    requiredScore: number
    gap: number
    priority: string
  }>
  marketData: CareerMarketData
}

export interface CareerComparisonResult {
  headline: string
  recommendationType: 'single' | 'hybrid' | 'explore'
  recommendedCareerSlug?: string
  recommendedCareerName?: string
  confidence: number // 0-100
  recommendationReason: string
  comparison: CareerComparisonItem[]
  whyReasons: string[]
  missingSkillsForTopGap: Array<{
    careerName: string
    skills: string[]
  }>
  nextMove: {
    title: string
    actionText: string
    bridgeSequence: string[]
    recommendedActionRoute: string
  }
}

export class CareerComparisonEngine {
  private weights: EngineWeights

  constructor(customWeights?: Partial<EngineWeights>) {
    this.weights = { ...DEFAULT_ENGINE_WEIGHTS, ...customWeights }
  }

  /**
   * Evaluates a single career against the student's authentic skill ledger.
   */
  async evaluateCareerFit(
    profile: CareerBenchmarkProfile,
    studentSkills: StudentSkillScore[],
    studentPreferences?: { preferredFields?: string[]; goal?: string }
  ): Promise<CareerComparisonItem> {
    const marketData = await MarketIntelligenceService.getCareerMarketData(profile.slug)

    // Build skill lookup map (name -> score/level)
    const skillMap = new Map<string, number>()
    studentSkills.forEach(s => {
      const name = (s.skillName || '').toLowerCase().trim()
      if (name) {
        skillMap.set(name, s.currentLevel)
      }
    })

    let totalWeight = 0
    let weightedCompliance = 0
    let skillsMetCount = 0
    const strengths: string[] = []
    const gaps: CareerComparisonItem['topGaps'] = []

    const reqEntries = Object.entries(profile.skills)
    const totalReqs = reqEntries.length

    reqEntries.forEach(([skillName, req]) => {
      totalWeight += req.weight

      // Match skill leniently by substring or normalized token
      let currentScore = 0
      const normName = skillName.toLowerCase()
      for (const [sName, sScore] of skillMap.entries()) {
        if (normName.includes(sName) || sName.includes(normName) || (normName.includes('react') && sName.includes('react')) || (normName.includes('sql') && sName.includes('sql'))) {
          currentScore = Math.max(currentScore, sScore)
        }
      }

      const metRatio = Math.min(currentScore / Math.max(req.required, 1), 1)
      weightedCompliance += metRatio * req.weight

      const deficit = Math.max(req.required - currentScore, 0)
      if (deficit === 0) {
        skillsMetCount++
        strengths.push(`${skillName} verified (${currentScore}/${req.required})`)
      } else {
        gaps.push({
          skillName,
          currentScore,
          requiredScore: req.required,
          gap: deficit,
          priority: req.weight >= 0.3 ? 'High' : req.weight >= 0.2 ? 'Medium' : 'Low',
        })
      }
    })

    // Sort gaps by priority deficit
    gaps.sort((a, b) => b.gap - a.gap)

    // 1. Skill Fit Score (0-100) based strictly on benchmark fulfillment
    const fitScore = Math.round((weightedCompliance / (totalWeight || 1)) * 100)

    // 2. Skill Advantage
    const skillAdvantage: CareerComparisonItem['skillAdvantage'] =
      fitScore >= 75 ? 'High' : fitScore >= 50 ? 'Moderate' : 'Low'

    // 3. Gap Level
    const gapLevel: CareerComparisonItem['gapLevel'] =
      gaps.length === 0 ? 'Low' : gaps.some(g => g.gap > 25) ? 'High' : gaps.some(g => g.gap > 10) ? 'Moderate' : 'Low'

    // 4. Market Outlook category
    const marketScore = marketData.marketDataAvailable ? (marketData.demandScore + marketData.growthScore) / 2 : 50
    const marketOutlook: CareerComparisonItem['marketOutlook'] =
      marketScore >= 88 ? 'Very Strong' : marketScore >= 78 ? 'Strong' : marketScore >= 65 ? 'Moderate' : 'Specialized'

    // 5. Transition Difficulty
    // Calculated based on missing foundational skills
    const transitionDifficulty: CareerComparisonItem['transitionDifficulty'] =
      fitScore >= 70 ? 'Low' : fitScore >= 45 ? 'Moderate' : 'High'

    // 6. Preferences multiplier
    let prefScore = 50
    if (studentPreferences?.preferredFields) {
      const isPreferred = studentPreferences.preferredFields.some(f =>
        profile.name.toLowerCase().includes(f.toLowerCase()) || profile.slug.toLowerCase().includes(f.toLowerCase())
      )
      prefScore = isPreferred ? 100 : 40
    }

    // Ease score (inverse of difficulty)
    const easeScore = transitionDifficulty === 'Low' ? 90 : transitionDifficulty === 'Moderate' ? 60 : 30

    // Weighted Overall Decision Framework Score
    const overallScore = Math.round(
      fitScore * this.weights.skillFit +
      (skillsMetCount / Math.max(totalReqs, 1) * 100) * this.weights.requirementsMet +
      marketScore * this.weights.marketOutlook +
      prefScore * this.weights.preferences +
      easeScore * this.weights.transitionEase
    )

    return {
      careerId: profile.id,
      careerName: profile.name,
      careerSlug: profile.slug,
      fitScore,
      overallScore,
      skillAdvantage,
      gapLevel,
      marketOutlook,
      transitionDifficulty,
      requirementsCount: totalReqs,
      skillsMetCount,
      topStrengths: strengths,
      topGaps: gaps,
      marketData,
    }
  }

  /**
   * Compares two or more careers side-by-side and determines honest recommendation.
   */
  async compareCareers(
    careerSlugs: string[],
    studentSkills: StudentSkillScore[],
    studentPreferences?: { preferredFields?: string[]; goal?: string }
  ): Promise<CareerComparisonResult> {
    // Resolve benchmark profiles
    const resolvedProfiles: CareerBenchmarkProfile[] = []
    for (const slug of careerSlugs) {
      const norm = MarketIntelligenceService.normalizeKey(slug)
      const found = CAREER_BENCHMARK_PROFILES.find(p => p.slug === norm || p.id === slug)
      if (found) {
        resolvedProfiles.push(found)
      } else {
        // Fallback default profile
        const defaultProf = CAREER_BENCHMARK_PROFILES.find(p => p.name.toLowerCase().includes(norm))
        if (defaultProf) resolvedProfiles.push(defaultProf)
      }
    }

    // Default to comparing Frontend vs Backend if fewer than 2 matched
    if (resolvedProfiles.length < 2) {
      const f1 = CAREER_BENCHMARK_PROFILES.find(p => p.slug === 'frontend')!
      const f2 = CAREER_BENCHMARK_PROFILES.find(p => p.slug === 'backend')!
      resolvedProfiles.splice(0, resolvedProfiles.length, f1, f2)
    }

    // Evaluate each option deterministically
    const evaluated: CareerComparisonItem[] = []
    for (const p of resolvedProfiles) {
      const evalItem = await this.evaluateCareerFit(p, studentSkills, studentPreferences)
      evaluated.push(evalItem)
    }

    // Sort by overall decision score
    evaluated.sort((a, b) => b.overallScore - a.overallScore)

    const top = evaluated[0]
    const second = evaluated[1]

    // Determine Recommendation Type: Single vs Hybrid vs Explore
    const scoreDiff = top.overallScore - (second?.overallScore || 0)
    let recommendationType: CareerComparisonResult['recommendationType'] = 'single'
    let headline = `Recommended for you: ${top.careerName}`
    let confidence = Math.min(Math.max(top.overallScore, 65), 95)
    let recommendationReason = ''

    // Detect Hybrid path opportunity (e.g. Web Dev + AI, or Full Stack + Cloud)
    const isWebAndAI = (top.careerSlug === 'frontend' || top.careerSlug === 'fullstack' || top.careerSlug === 'backend') &&
      (second?.careerSlug === 'ai-ml')

    if (scoreDiff <= 8 && top.fitScore >= 60 && second.fitScore >= 55) {
      recommendationType = 'hybrid'
      headline = `Both paths are viable — consider a Hybrid Path: ${top.careerName} with ${second.careerName} bridge`
      recommendationReason = `Your current competencies are balanced closely between ${top.careerName} (${top.fitScore}% fit) and ${second.careerName} (${second.fitScore}% fit). Starting with ${top.careerName} gives faster job-readiness while laying the groundwork for ${second.careerName}.`
      confidence = 82
    } else if (top.fitScore < 40 && second?.fitScore < 40) {
      recommendationType = 'explore'
      headline = `Explore Foundational Skills First: ${top.careerName}`
      recommendationReason = `Your profile currently shows early-stage foundations for both tracks. We recommend starting with ${top.careerName} to establish core coding fundamentals before committing to a specialized role.`
      confidence = 68
    } else if (isWebAndAI && second.marketData.growthScore > top.marketData.growthScore) {
      // Classic Match vs Market scenario:
      headline = `Recommended for you: ${top.careerName}`
      recommendationReason = `While ${second.careerName} has stronger current market growth signals, ${top.careerName} is your clear best fit right now (${top.fitScore}% vs ${second.fitScore}%) because your assessed skills already align with production requirements.`
    } else {
      headline = `Recommended for you: ${top.careerName}`
      recommendationReason = `Your assessed skills, project evidence, and lower gap deficit make ${top.careerName} your strongest and most realistic near-term career track.`
    }

    // Formulate 3-5 concise, plain-English "Why" reasons
    const whyReasons: string[] = []
    if (top.topStrengths.length > 0) {
      whyReasons.push(`Strong existing foundations: ${top.topStrengths.slice(0, 2).join(' and ')}.`)
    }
    if (top.gapLevel === 'Low' || top.gapLevel === 'Moderate') {
      whyReasons.push(`Significantly smaller skill deficit (${top.topGaps.length} remaining gap${top.topGaps.length === 1 ? '' : 's'}).`)
    }
    if (top.transitionDifficulty === 'Low') {
      whyReasons.push(`Lowest transition friction — you can become interview-ready in fewer weeks.`)
    }
    if (second && second.topGaps.length > 0) {
      whyReasons.push(`${second.careerName} requires mastering foundational prerequisites (${second.topGaps.slice(0, 2).map(g => g.skillName).join(', ')}) before you can qualify for roles.`)
    }
    whyReasons.push(`Verified market demand for ${top.careerName} remains steady across product engineering teams.`)

    // Missing skills for alternative / gap
    const missingSkillsForTopGap = evaluated.map(item => ({
      careerName: item.careerName,
      skills: item.topGaps.map(g => `${g.skillName} (needs ${g.gap} pts)`),
    }))

    // Construct Next Move & Bridge sequence
    const bridgeSequence = top.topGaps.length > 0
      ? top.topGaps.slice(0, 3).map((g, idx) => `Step ${idx + 1}: Close ${g.gap}-point deficit in ${g.skillName}`)
      : ['Benchmark requirements satisfied — build one capstone production project', 'Verify skills through Level 2 & 3 assessments', 'Apply to matched internships in Opportunity Hub']

    return {
      headline,
      recommendationType,
      recommendedCareerSlug: top.careerSlug,
      recommendedCareerName: top.careerName,
      confidence,
      recommendationReason,
      comparison: evaluated,
      whyReasons,
      missingSkillsForTopGap,
      nextMove: {
        title: `Your Next Move: Accelerate ${top.careerName}`,
        actionText: top.topGaps.length > 0
          ? `Focus on closing your top gap in ${top.topGaps[0]?.skillName || 'core skills'} to elevate your readiness.`
          : `All core benchmarks satisfied! Explore verified opportunities matching your profile.`,
        bridgeSequence,
        recommendedActionRoute: top.topGaps.length > 0 ? '/student/assessment' : '/student/opportunities',
      },
    }
  }
}
