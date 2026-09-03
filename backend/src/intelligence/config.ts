/**
 * Intelligence Engine Configuration
 * Centralized, authoritative constants for deterministic skill, gap, and readiness intelligence.
 * No magic numbers scattered across components.
 */

export const INTELLIGENCE_CONFIG = {
  // Score bounds
  SCORE_MIN: 0,
  SCORE_MAX: 100,

  // Importance weights for readiness calculation
  IMPORTANCE_WEIGHTS: {
    High: 1.0,
    Medium: 0.7,
    Low: 0.4,
  } as Record<string, number>,

  // Skill Gap threshold classification
  GAP_THRESHOLDS: {
    CRITICAL: 15, // gap >= 15 is Critical
    NEEDS_IMPROVEMENT: 1, // gap 1 - 14 is Needs Improvement
    READY: 0, // gap <= 0 is Ready
  },

  // Skill Level interpretation brackets (0 - 100)
  SKILL_LEVEL_BRACKETS: [
    { min: 90, max: 100, label: 'Advanced' },
    { min: 75, max: 89, label: 'Strong' },
    { min: 60, max: 74, label: 'Intermediate' },
    { min: 40, max: 59, label: 'Developing' },
    { min: 0, max: 39, label: 'Beginner' },
  ],

  // Readiness brackets (0 - 100%)
  READINESS_CATEGORIES: [
    { min: 90, max: 100, label: 'Highly Ready', variant: 'success' as const },
    { min: 75, max: 89, label: 'Ready', variant: 'success' as const },
    { min: 60, max: 74, label: 'Developing', variant: 'warning' as const },
    { min: 40, max: 59, label: 'Early Progress', variant: 'warning' as const },
    { min: 0, max: 39, label: 'Not Ready', variant: 'critical' as const },
  ],

  // Verification hierarchy quality ranking
  VERIFICATION_HIERARCHY: {
    institution_verified: 5,
    evidence_verified: 4,
    practical_verified: 3,
    assessment_verified: 2,
    self_declared: 1,
  } as Record<string, number>,

  // Default passing score for assessments
  ASSESSMENT_PASSING_PERCENT: 70,
} as const
