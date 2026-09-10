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
  priority?: 'High' | 'Medium' | 'Low'
  category?: string
  skillId?: string
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
    id: "30000000-0000-0000-0000-000000000003",
    name: "Full Stack Developer",
    slug: "fullstack",
    category: "Engineering",
    description: "Covers end-to-end web development across modern frontend, backend services, databases, and deployment.",
    skills: {
      "HTML": { required: 80, weight: 0.07, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000016' },
      "CSS": { required: 80, weight: 0.07, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000017' },
      "JavaScript": { required: 85, weight: 0.10, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000015' },
      "React.js": { required: 75, weight: 0.10, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000006' },
      "Node.js": { required: 75, weight: 0.10, priority: 'High', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000001' },
      "Express.js": { required: 75, weight: 0.08, priority: 'Medium', category: 'Backend', skillId: 'skill-fs-express' },
      "MongoDB": { required: 70, weight: 0.08, priority: 'Medium', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000008' },
      "SQL / Databases": { required: 75, weight: 0.10, priority: 'High', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "REST APIs": { required: 80, weight: 0.08, priority: 'High', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000002' },
      "Git / GitHub": { required: 70, weight: 0.06, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
      "Authentication": { required: 70, weight: 0.06, priority: 'Medium', category: 'Security', skillId: 'skill-fs-auth' },
      "Deployment": { required: 65, weight: 0.06, priority: 'Medium', category: 'Operations', skillId: 'skill-fs-deploy' },
      "Problem Solving / DSA": { required: 75, weight: 0.08, priority: 'Medium', category: 'Computer Science', skillId: 'skill-fs-dsa' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000001",
    name: "Backend Developer",
    slug: "backend",
    category: "Engineering",
    description: "Focuses on server-side logic, database management, and resilient REST API integration.",
    skills: {
      "Node.js": { required: 80, weight: 0.35, priority: 'High', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000001' },
      "REST APIs": { required: 75, weight: 0.25, priority: 'High', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000002' },
      "SQL": { required: 70, weight: 0.25, priority: 'High', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "Git & Version Control": { required: 60, weight: 0.15, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    name: "Frontend Developer",
    slug: "frontend",
    category: "Engineering",
    description: "Specializes in modern React user interfaces, client-side rendering, and responsive styling.",
    skills: {
      "HTML": { required: 80, weight: 0.15, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000016' },
      "CSS": { required: 80, weight: 0.15, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000017' },
      "JavaScript": { required: 80, weight: 0.20, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000015' },
      "React": { required: 75, weight: 0.15, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000006' },
      "Responsive Design": { required: 75, weight: 0.10, priority: 'Medium', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000018' },
      "Git/GitHub": { required: 65, weight: 0.10, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
      "API Integration": { required: 75, weight: 0.10, priority: 'Medium', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000019' },
      "State Management": { required: 70, weight: 0.05, priority: 'Medium', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000020' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000012",
    name: "Java Developer",
    slug: "java-developer",
    category: "Engineering",
    description: "Enterprise backend development, Spring Framework, microservices, and robust distributed systems.",
    skills: {
      "Java Core": { required: 80, weight: 0.30, priority: 'High', category: 'Backend', skillId: 'skill-java-core' },
      "Spring Boot": { required: 75, weight: 0.25, priority: 'High', category: 'Backend', skillId: 'skill-java-spring' },
      "SQL & Databases": { required: 75, weight: 0.20, priority: 'High', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "REST APIs": { required: 75, weight: 0.15, priority: 'Medium', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000002' },
      "Git & Version Control": { required: 65, weight: 0.10, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000006",
    name: "Data Analyst",
    slug: "data-analyst",
    category: "Data",
    description: "Transforms business and system data into actionable insights, dashboards, and reporting models.",
    skills: {
      "SQL & Query Optimization": { required: 85, weight: 0.35, priority: 'High', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "Python / Pandas": { required: 80, weight: 0.30, priority: 'High', category: 'Data', skillId: '40000000-0000-0000-0000-000000000012' },
      "Data Visualization (PowerBI/Tableau)": { required: 75, weight: 0.20, priority: 'Medium', category: 'Data', skillId: 'skill-data-viz' },
      "Excel & Statistics": { required: 70, weight: 0.15, priority: 'Medium', category: 'Data', skillId: 'skill-data-stats' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000013",
    name: "Data Scientist",
    slug: "data-scientist",
    category: "Data",
    description: "Builds statistical models, machine learning systems, predictive algorithms, and data pipelines.",
    skills: {
      "Python": { required: 85, weight: 0.30, priority: 'High', category: 'Technical', skillId: '40000000-0000-0000-0000-000000000012' },
      "Machine Learning Fundamentals": { required: 80, weight: 0.30, priority: 'High', category: 'Data', skillId: 'skill-ds-ml' },
      "SQL": { required: 75, weight: 0.20, priority: 'Medium', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "Statistics & Mathematics": { required: 80, weight: 0.20, priority: 'High', category: 'Data', skillId: 'skill-ds-stats' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000005",
    name: "Cloud / DevOps Engineer",
    slug: "devops",
    category: "Operations",
    description: "Automates CI/CD pipelines, container orchestration, and cloud infrastructure reliability.",
    skills: {
      "Linux": { required: 80, weight: 0.35, priority: 'High', category: 'Operations', skillId: 'skill-devops-linux' },
      "Docker": { required: 75, weight: 0.25, priority: 'High', category: 'Operations', skillId: '40000000-0000-0000-0000-000000000005' },
      "AWS / GCP": { required: 70, weight: 0.20, priority: 'Medium', category: 'Operations', skillId: '40000000-0000-0000-0000-000000000011' },
      "CI/CD": { required: 65, weight: 0.20, priority: 'Medium', category: 'Operations', skillId: 'skill-devops-cicd' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000004",
    name: "Cybersecurity Analyst",
    slug: "security",
    category: "Security",
    description: "Protects systems, networks, and data from cyber threats, vulnerabilities, and unauthorized access.",
    skills: {
      "REST API Security": { required: 80, weight: 0.35, priority: 'High', category: 'Security', skillId: '40000000-0000-0000-0000-000000000013' },
      "Python": { required: 70, weight: 0.30, priority: 'High', category: 'Technical', skillId: '40000000-0000-0000-0000-000000000012' },
      "System Design Basics": { required: 65, weight: 0.20, priority: 'Medium', category: 'Technical', skillId: '40000000-0000-0000-0000-000000000014' },
      "Git & Version Control": { required: 60, weight: 0.15, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000007",
    name: "AI / Machine Learning Engineer",
    slug: "ai-ml",
    category: "Artificial Intelligence",
    description: "Designs, trains, and deploys machine learning models, neural networks, and generative AI systems.",
    skills: {
      "Python": { required: 85, weight: 0.30, priority: 'High', category: 'Technical', skillId: '40000000-0000-0000-0000-000000000012' },
      "Machine Learning Fundamentals": { required: 80, weight: 0.30, priority: 'High', category: 'Data', skillId: 'skill-ai-ml' },
      "Statistics & Mathematics": { required: 75, weight: 0.25, priority: 'Medium', category: 'Data', skillId: 'skill-ai-math' },
      "Model Evaluation & Deployment": { required: 70, weight: 0.15, priority: 'Medium', category: 'Operations', skillId: 'skill-ai-deploy' },
    },
  },
]

export function findCareerBenchmark(query: string): CareerBenchmarkProfile | null {
  if (!query) return null
  const raw = query.trim().toLowerCase()
  const clean = raw.replace(/[-_]/g, '')
  return (
    CAREER_BENCHMARK_PROFILES.find(
      c => c.id === query ||
           c.slug.toLowerCase() === raw ||
           c.name.toLowerCase() === raw ||
           c.slug.toLowerCase().replace(/[-_]/g, '') === clean ||
           clean.includes(c.slug.toLowerCase().replace(/[-_]/g, '')) ||
           c.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(clean)
    ) || null
  )
}

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
    selfDeclaredLevel?: number
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
 * Formula: sum( (min(StudentVerifiedScore, RequiredScore) / RequiredScore) * Weight ) * 100
 * Strictly adheres to Zero-Inflation: Self-declared skills receive 0 verified credit.
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
    const rawScore = typeof rawData === 'number' ? rawData : (rawData && typeof rawData.score === 'number' ? rawData.score : 0)
    const verifiedStatus = typeof rawData === 'object' && rawData?.verifiedStatus ? rawData.verifiedStatus : "self_declared"

    // Strict verification rule: Only assessment, practical, evidence, or institution verified scores count toward readiness
    const isTrulyVerified = verifiedStatus === 'assessment_verified' ||
      verifiedStatus === 'practical_verified' ||
      verifiedStatus === 'evidence_verified' ||
      verifiedStatus === 'institution_verified' ||
      verifiedStatus === 'academic_verified'

    const currentLevel = isTrulyVerified ? rawScore : 0
    const isAssessed = isTrulyVerified && currentLevel > 0
    const deficit = config.required - currentLevel
    const gap = Math.max(deficit, 0)

    if (deficit > maxDeficit) {
      maxDeficit = deficit
      prioritySkillName = skillName
    }

    if (isAssessed) {
      const ratio = Math.min(currentLevel / config.required, 1.0)
      weightedScore += ratio * config.weight
    }
    totalWeight += config.weight

    const status: "ready" | "improve" | "critical" =
      deficit <= 0 ? "ready" : deficit > 20 ? "critical" : "improve"

    return {
      skillId: config.skillId || `skill-${profile.slug}-${idx + 1}`,
      skillName,
      currentLevel: isTrulyVerified ? currentLevel : 0,
      selfDeclaredLevel: !isTrulyVerified ? rawScore : undefined,
      requiredLevel: config.required,
      gap,
      importance: (config.weight >= 0.15 ? "High" : config.weight >= 0.08 ? "Medium" : "Low") as "High" | "Medium" | "Low",
      isAssessed,
      status,
      verificationStatus: verifiedStatus,
    }
  })

  const readinessPercentage = Math.round((weightedScore / (totalWeight || 1)) * 100)
  const readinessCategory: "Ready" | "Needs Improvement" | "Critical Gap" =
    readinessPercentage === 0 ? "Critical Gap" : maxDeficit > 20 ? "Critical Gap" : maxDeficit > 5 ? "Needs Improvement" : "Ready"
  const readinessVariant: "success" | "warning" | "critical" =
    readinessCategory === "Ready" ? "success" : readinessCategory === "Needs Improvement" ? "warning" : "critical"

  const priorityConfig = profile.skills[prioritySkillName]
  const priorityRaw = studentScores[prioritySkillName] ?? studentScores[prioritySkillName.toLowerCase()]
  const priorityScore = typeof priorityRaw === 'number' ? priorityRaw : (priorityRaw && typeof priorityRaw.score === 'number' ? priorityRaw.score : 0)
  const priorityVerified = (typeof priorityRaw === 'object' && priorityRaw?.verifiedStatus && priorityRaw.verifiedStatus !== 'self_declared') ? priorityScore : 0
  const priorityGapVal = priorityConfig ? Math.max(priorityConfig.required - priorityVerified, 0) : 0

  const priorityGap = priorityConfig
    ? {
        skillName: prioritySkillName,
        required: priorityConfig.required,
        verified: priorityVerified,
        gap: priorityGapVal,
        category: priorityGapVal > 20 ? ("Critical Gap" as const) : priorityGapVal > 5 ? ("Needs Improvement" as const) : ("Ready" as const),
        recommendation: `Focus on establishing or improving verified competency in ${prioritySkillName}. Complete the targeted assessment to satisfy the ${priorityConfig.required} pt role benchmark.`,
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
  { id: '40000000-0000-0000-0000-000000000016', name: 'HTML', slug: 'html', category: 'Frontend Basics' },
  { id: '40000000-0000-0000-0000-000000000017', name: 'CSS', slug: 'css', category: 'Frontend Basics' },
  { id: '40000000-0000-0000-0000-000000000012', name: 'Python', slug: 'python', category: 'Data & Security' },
  { id: '40000000-0000-0000-0000-000000000013', name: 'Security Fundamentals', slug: 'security', category: 'Data & Security' },
  { id: '40000000-0000-0000-0000-000000000014', name: 'System Design', slug: 'system-design', category: 'Backend & APIs' },
  { id: '40000000-0000-0000-0000-000000000015', name: 'JavaScript', slug: 'javascript', category: 'Frontend Basics' },
]
