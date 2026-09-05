/**
 * SkillBridge Connect - Deterministic Benchmark Engine & Career Target Profiles
 *
 * Implements the official Opportunity-Specific Skill Readiness Engine specifications.
 * Zero-crash guarantee: If database or external AI service is unavailable,
 * calculates weighted readiness deterministically.
 */

export interface SkillBenchmark {
  required: number
  weight: number
}

export interface CareerBenchmarkProfile {
  id: string
  name: string
  slug: string
  category: string
  description: string
  skills: Record<string, SkillBenchmark>
}

export const CAREER_BENCHMARK_PROFILES: CareerBenchmarkProfile[] = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    name: "Backend Developer (Internship/Junior)",
    slug: "backend",
    category: "Engineering",
    description: "Focuses on server-side logic, database management, and resilient REST API integration.",
    skills: {
      "Node.js": { required: 80, weight: 0.35 },
      "REST APIs": { required: 75, weight: 0.25 },
      "SQL": { required: 70, weight: 0.25 },
      "Git & Version Control": { required: 60, weight: 0.15 },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    name: "Frontend Developer",
    slug: "frontend",
    category: "Engineering",
    description: "Specializes in modern React user interfaces, client-side rendering, and responsive styling.",
    skills: {
      "React.js": { required: 80, weight: 0.35 },
      "JavaScript / TypeScript": { required: 75, weight: 0.25 },
      "Tailwind CSS / HTML": { required: 70, weight: 0.20 },
      "Git & GitHub": { required: 65, weight: 0.20 },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000003",
    name: "Full Stack Engineer",
    slug: "fullstack",
    category: "Engineering",
    description: "Covers end-to-end web development across modern frontend, backend services, and databases.",
    skills: {
      "React.js": { required: 75, weight: 0.25 },
      "Node.js & Express": { required: 75, weight: 0.25 },
      "PostgreSQL / Database Design": { required: 70, weight: 0.25 },
      "Docker & Deployment": { required: 60, weight: 0.25 },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000006",
    name: "Data Analyst",
    slug: "data-analyst",
    category: "Data",
    description: "Transforms business and system data into actionable insights, dashboards, and reporting models.",
    skills: {
      "SQL & Query Optimization": { required: 85, weight: 0.35 },
      "Python / Pandas": { required: 80, weight: 0.30 },
      "Data Visualization (PowerBI/Tableau)": { required: 75, weight: 0.20 },
      "Excel & Statistics": { required: 70, weight: 0.15 },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000004",
    name: "Cybersecurity Analyst",
    slug: "security",
    category: "Security",
    description: "Protects systems, networks, and data from cyber threats, vulnerabilities, and unauthorized access.",
    skills: {
      "REST API Security": { required: 80, weight: 0.35 },
      "Python": { required: 70, weight: 0.30 },
      "System Design Basics": { required: 65, weight: 0.20 },
      "Git & Version Control": { required: 60, weight: 0.15 },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000005",
    name: "Cloud / DevOps Engineer",
    slug: "devops",
    category: "Operations",
    description: "Automates CI/CD pipelines, container orchestration, and cloud infrastructure reliability.",
    skills: {
      "Linux": { required: 80, weight: 0.35 },
      "Docker": { required: 75, weight: 0.25 },
      "AWS / GCP": { required: 70, weight: 0.20 },
      "CI/CD": { required: 65, weight: 0.20 },
    },
  },
]

export interface ComputedReadiness {
  careerId: string
  careerName: string
  readinessPercentage: number
  readinessCategory: "Ready" | "Needs Improvement" | "Critical Gap"
  readinessVariant: "success" | "warning" | "critical"
  priorityGap: {
    skillName: string
    required: number
    verified: number
    gap: number
    category: "Ready" | "Needs Improvement" | "Critical Gap"
    recommendation: string
  } | null
  skills: Array<{
    skillId: string
    skillName: string
    currentLevel: number
    requiredLevel: number
    gap: number
    importance: "High" | "Medium" | "Low"
    isAssessed: boolean
    status: "ready" | "improve" | "critical"
    verificationStatus: string
  }>
}

/**
 * Calculates Career Readiness deterministically:
 * Formula: sum( (min(StudentScore, RequiredScore) / RequiredScore) * Weight ) * 100
 */
export function computeDeterministicReadiness(
  profile: CareerBenchmarkProfile,
  studentScores: Record<string, number | { score: number; verifiedStatus?: string }> = {}
): ComputedReadiness {
  let weightedScore = 0
  let totalWeight = 0
  let maxDeficit = -Infinity
  let prioritySkillName = Object.keys(profile.skills)[0] || "General"

  const skillEntries = Object.entries(profile.skills)

  const formattedSkills = skillEntries.map(([skillName, config], idx) => {
    const rawData = studentScores[skillName] ?? studentScores[skillName.toLowerCase()]
    const currentLevel = typeof rawData === 'number' ? rawData : (rawData && typeof rawData.score === 'number' ? rawData.score : 0)
    const isAssessed = rawData !== undefined && currentLevel > 0
    const deficit = config.required - currentLevel
    const gap = Math.max(deficit, 0)

    if (deficit > maxDeficit) {
      maxDeficit = deficit
      prioritySkillName = skillName
    }

    const ratio = Math.min(currentLevel / config.required, 1.0)
    weightedScore += ratio * config.weight
    totalWeight += config.weight

    const status: "ready" | "improve" | "critical" =
      deficit <= 0 ? "ready" : deficit > 20 ? "critical" : "improve"

    const verifiedStatus = typeof rawData === 'object' && rawData?.verifiedStatus ? rawData.verifiedStatus : (isAssessed ? "assessment_verified" : "self_declared")

    return {
      skillId: `skill-${profile.slug}-${idx + 1}`,
      skillName,
      currentLevel,
      requiredLevel: config.required,
      gap,
      importance: (config.weight >= 0.3 ? "High" : "Medium") as "High" | "Medium" | "Low",
      isAssessed,
      status,
      verificationStatus: verifiedStatus,
    }
  })

  const readinessPercentage = Math.round((weightedScore / (totalWeight || 1)) * 100)
  const readinessCategory: "Ready" | "Needs Improvement" | "Critical Gap" =
    maxDeficit > 20 ? "Critical Gap" : maxDeficit > 5 ? "Needs Improvement" : "Ready"
  const readinessVariant: "success" | "warning" | "critical" =
    readinessCategory === "Ready" ? "success" : readinessCategory === "Needs Improvement" ? "warning" : "critical"

  const priorityConfig = profile.skills[prioritySkillName]
  const priorityRaw = studentScores[prioritySkillName] ?? studentScores[prioritySkillName.toLowerCase()]
  const priorityScore = typeof priorityRaw === 'number' ? priorityRaw : (priorityRaw && typeof priorityRaw.score === 'number' ? priorityRaw.score : 0)
  const priorityGapVal = priorityConfig ? Math.max(priorityConfig.required - priorityScore, 0) : 0

  const priorityGap = priorityConfig
    ? {
        skillName: prioritySkillName,
        required: priorityConfig.required,
        verified: priorityScore,
        gap: priorityGapVal,
        category: priorityGapVal > 20 ? ("Critical Gap" as const) : priorityGapVal > 5 ? ("Needs Improvement" as const) : ("Ready" as const),
        recommendation: `Focus on closing the ${priorityGapVal} point deficit in ${prioritySkillName}. Complete targeted practical challenges before reassessing.`,
      }
    : null

  return {
    careerId: profile.id,
    careerName: profile.name,
    readinessPercentage,
    readinessCategory,
    readinessVariant,
    priorityGap,
    skills: formattedSkills,
  }
}

export const CANONICAL_SKILLS = [
  { id: '40000000-0000-0000-0000-000000000001', name: 'Node.js', slug: 'nodejs', category: 'Backend & APIs' },
  { id: '40000000-0000-0000-0000-000000000002', name: 'REST APIs', slug: 'rest-apis', category: 'Backend & APIs' },
  { id: '40000000-0000-0000-0000-000000000003', name: 'SQL', slug: 'sql', category: 'Databases & Infrastructure' },
  { id: '40000000-0000-0000-0000-000000000004', name: 'Git & Version Control', slug: 'git', category: 'Tools & DevOps' },
  { id: '40000000-0000-0000-0000-000000000005', name: 'Docker', slug: 'docker', category: 'Tools & DevOps' },
  { id: '40000000-0000-0000-0000-000000000006', name: 'React', slug: 'react', category: 'Frontend Basics' },
  { id: '40000000-0000-0000-0000-000000000007', name: 'HTML/CSS', slug: 'html-css', category: 'Frontend Basics' },
  { id: '40000000-0000-0000-0000-000000000012', name: 'Python', slug: 'python', category: 'Data & Security' },
  { id: '40000000-0000-0000-0000-000000000013', name: 'Security Fundamentals', slug: 'security', category: 'Data & Security' },
  { id: '40000000-0000-0000-0000-000000000014', name: 'System Design', slug: 'system-design', category: 'Backend & APIs' },
  { id: '40000000-0000-0000-0000-000000000015', name: 'JavaScript', slug: 'javascript', category: 'Frontend Basics' },
]
