/**
 * SkillBridge Connect - Pre-loaded Opportunity Hub Seed & Match Engine
 *
 * Implements Opportunity Hub with 6 categories:
 * - Internships, Apprenticeships, Jobs, Training, Workshops, Mentorship
 * Intelligent Match Percentage based on verified skills vs required benchmarks.
 */

export interface OpportunityItem {
  id: string
  title: string
  company: string
  type: "Internship" | "Apprenticeship" | "Job" | "Training" | "Workshop" | "Mentorship"
  location: string
  workMode: "remote" | "hybrid" | "onsite"
  stipend?: string
  duration: string
  deadline: string
  deadlineLabel: string
  description: string
  requiredSkills: Array<{
    name: string
    benchmark: number
    importance: "Required" | "Preferred"
  }>
}

export const SEED_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "opp-01-fintech-backend",
    title: "Backend Engineering Intern",
    company: "FinTech Innovations Ltd.",
    type: "Internship",
    location: "San Francisco, CA / Remote",
    workMode: "remote",
    stipend: "₹25,000 / month",
    duration: "6 Months",
    deadline: "2026-12-15",
    deadlineLabel: "Dec 15, 2026",
    description: "Build low-latency payment processing pipelines and distributed microservices. Work directly with senior platform engineers on PostgreSQL optimization and secure REST endpoints.",
    requiredSkills: [
      { name: "Node.js", benchmark: 80, importance: "Required" },
      { name: "REST APIs", benchmark: 75, importance: "Required" },
      { name: "SQL", benchmark: 70, importance: "Required" },
    ],
  },
  {
    id: "opp-02-cloudscale-devops",
    title: "Junior Cloud & DevOps Associate",
    company: "CloudScale Systems",
    type: "Job",
    location: "Bangalore, India (Hybrid)",
    workMode: "hybrid",
    stipend: "₹8,50,000 / year",
    duration: "Full-Time",
    deadline: "2026-11-30",
    deadlineLabel: "Nov 30, 2026",
    description: "Manage containerized infrastructure, build automated CI/CD deployments, and configure Kubernetes clusters for enterprise SaaS workloads.",
    requiredSkills: [
      { name: "Linux", benchmark: 80, importance: "Required" },
      { name: "Docker", benchmark: 75, importance: "Required" },
      { name: "Git & Version Control", benchmark: 70, importance: "Required" },
    ],
  },
  {
    id: "opp-03-ainexus-mentorship",
    title: "Industry Research & Mentorship Program",
    company: "AI Nexus Research",
    type: "Mentorship",
    location: "Remote",
    workMode: "remote",
    stipend: "Sponsored Grant",
    duration: "3 Months",
    deadline: "2026-12-31",
    deadlineLabel: "Dec 31, 2026",
    description: "Collaborate 1-on-1 with Staff Research Engineers on production machine learning pipelines, model inference optimization, and distributed data structures.",
    requiredSkills: [
      { name: "Python / Pandas", benchmark: 80, importance: "Required" },
      { name: "SQL & Query Optimization", benchmark: 70, importance: "Required" },
    ],
  },
  {
    id: "opp-04-datasync-training",
    title: "Industrial Database Architecture Training",
    company: "DataSync Global",
    type: "Training",
    location: "Chicago, IL / Virtual",
    workMode: "remote",
    stipend: "Tuition Sponsored",
    duration: "4 Weeks",
    deadline: "2026-11-20",
    deadlineLabel: "Nov 20, 2026",
    description: "Intensive laboratory on high-throughput database replication, indexing tuning, and relational query profiling for backend architects.",
    requiredSkills: [
      { name: "SQL", benchmark: 65, importance: "Required" },
      { name: "Node.js", benchmark: 60, importance: "Preferred" },
    ],
  },
  {
    id: "opp-05-apex-apprenticeship",
    title: "Frontend Engineering Apprenticeship",
    company: "Apex Digital Labs",
    type: "Apprenticeship",
    location: "Austin, TX (Hybrid)",
    workMode: "hybrid",
    stipend: "₹30,000 / month",
    duration: "1 Year",
    deadline: "2026-12-05",
    deadlineLabel: "Dec 5, 2026",
    description: "Structured career apprenticeship pathway covering modern React, accessible UI components, and client-side performance engineering.",
    requiredSkills: [
      { name: "React.js", benchmark: 75, importance: "Required" },
      { name: "JavaScript / TypeScript", benchmark: 70, importance: "Required" },
    ],
  },
  {
    id: "opp-06-api-security-workshop",
    title: "Masterclass Workshop: Microservice API Security",
    company: "CyberGate Institute",
    type: "Workshop",
    location: "Virtual Hands-on Lab",
    workMode: "remote",
    stipend: "Certificate Included",
    duration: "2 Days",
    deadline: "2026-11-15",
    deadlineLabel: "Nov 15, 2026",
    description: "Hands-on vulnerability remediation workshop covering JWT verification, rate-limiting algorithms, and zero-trust API architectures.",
    requiredSkills: [
      { name: "REST APIs", benchmark: 70, importance: "Required" },
      { name: "Node.js", benchmark: 65, importance: "Preferred" },
    ],
  },
]

export interface OpportunityMatchResult {
  opportunity: OpportunityItem
  matchPercentage: number
  skillsMetCount: number
  totalSkillsCount: number
  mainBlocker: string | null
  skills: Array<{
    name: string
    requiredLevel: number
    currentLevel: number
    met: boolean
  }>
}

/**
 * Calculates match percentage comparing student verified skills against required benchmarks.
 */
export function calculateOpportunityMatch(
  opportunity: OpportunityItem,
  studentScores: Record<string, number> = { "Node.js": 72, "REST APIs": 75, "SQL": 82, "Git & Version Control": 75 }
): OpportunityMatchResult {
  let totalPoints = 0
  let earnedPoints = 0
  let skillsMetCount = 0
  let mainBlocker: string | null = null
  let maxDeficit = -Infinity

  const skills = opportunity.requiredSkills.map((req) => {
    const studentScore = studentScores[req.name] || studentScores[req.name.toLowerCase()] || 0
    const weight = req.importance === "Required" ? 1.5 : 1.0
    totalPoints += req.benchmark * weight
    earnedPoints += Math.min(studentScore, req.benchmark) * weight

    const met = studentScore >= req.benchmark
    if (met) skillsMetCount++

    const deficit = req.benchmark - studentScore
    if (deficit > 0 && deficit > maxDeficit) {
      maxDeficit = deficit
      mainBlocker = `${req.name} (${deficit} pts below benchmark)`
    }

    return {
      name: req.name,
      requiredLevel: req.benchmark,
      currentLevel: studentScore,
      met,
    }
  })

  const matchPercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100

  return {
    opportunity,
    matchPercentage,
    skillsMetCount,
    totalSkillsCount: opportunity.requiredSkills.length,
    mainBlocker: skillsMetCount === opportunity.requiredSkills.length ? null : mainBlocker,
    skills,
  }
}
