/**
 * SkillBridge Connect - Pre-loaded Opportunity Hub Seed & Match Engine
 *
 * Implements realistic technology demonstration opportunities for the Opportunity Hub.
 * Features deterministic skill matching and detailed 'Why this match?' explanations.
 */

export interface OpportunityItem {
  id: string
  title: string
  company: string
  type: "Internship" | "Apprenticeship" | "Job" | "Training" | "Workshop" | "Mentorship"
  location: string
  workMode: "remote" | "hybrid" | "onsite"
  experience?: string
  stipend?: string
  duration: string
  deadline: string
  deadlineLabel: string
  description: string
  responsibilities?: string[]
  eligibility?: string
  requiredSkills: Array<{
    name: string
    benchmark: number
    importance: "Required" | "Preferred"
  }>
}

export const SEED_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "opp-microsoft-sde",
    title: "Software Engineering Intern",
    company: "Microsoft",
    type: "Internship",
    location: "Bengaluru",
    workMode: "hybrid",
    experience: "Student / 0–1 years",
    stipend: "₹1,25,000 / month",
    duration: "6 Months",
    deadline: "2026-09-18",
    deadlineLabel: "18 Sep 2026",
    description: "Work with engineering teams to design, develop, and test scalable software systems and cloud-connected developer platforms.",
    responsibilities: [
      "Design robust algorithmic modules and data structures for high-throughput cloud services",
      "Write clean, maintainable code in C++ and Python following modern engineering standards",
      "Collaborate with senior developers and participate in code reviews on Azure developer tooling",
      "Diagnose and optimize application bottlenecks with automated unit and integration test suites",
    ],
    eligibility: "Currently pursuing B.Tech / M.Tech in Computer Science, IT, or related technical disciplines graduating in 2026/2027.",
    requiredSkills: [
      { name: "DSA", benchmark: 80, importance: "Required" },
      { name: "C++", benchmark: 75, importance: "Required" },
      { name: "Python", benchmark: 75, importance: "Required" },
      { name: "Git", benchmark: 70, importance: "Required" },
      { name: "Problem Solving", benchmark: 75, importance: "Required" },
    ],
  },
  {
    id: "opp-razorpay-frontend",
    title: "Frontend Engineering Intern",
    company: "Razorpay",
    type: "Internship",
    location: "Bengaluru",
    workMode: "hybrid",
    experience: "0–1 years",
    stipend: "₹45,000 / month",
    duration: "6 Months",
    deadline: "2026-09-28",
    deadlineLabel: "28 Sep 2026",
    description: "Work with the frontend engineering team to build, test, and improve responsive product interfaces and payment workflows.",
    responsibilities: [
      "Build accessible, high-performance UI components using React and TypeScript",
      "Optimize frontend bundle sizes, rendering lifecycles, and core web vitals across web checkouts",
      "Collaborate with UX designers to translate wireframes into interactive pixel-perfect designs",
      "Integrate resilient REST API clients and manage state across multi-step merchant onboarding",
    ],
    eligibility: "Hands-on experience with modern JavaScript, React state management, and responsive CSS.",
    requiredSkills: [
      { name: "HTML", benchmark: 80, importance: "Required" },
      { name: "CSS", benchmark: 80, importance: "Required" },
      { name: "JavaScript", benchmark: 85, importance: "Required" },
      { name: "React", benchmark: 75, importance: "Required" },
      { name: "Git", benchmark: 70, importance: "Required" },
    ],
  },
  {
    id: "opp-zoho-sde",
    title: "Software Developer Intern",
    company: "Zoho",
    type: "Internship",
    location: "Chennai",
    workMode: "hybrid",
    experience: "0–1 years",
    stipend: "₹35,000 / month",
    duration: "6 Months",
    deadline: "2026-09-24",
    deadlineLabel: "24 Sep 2026",
    description: "Develop robust enterprise cloud software, optimize relational database queries, and implement clean object-oriented architectures.",
    responsibilities: [
      "Implement server-side logic and core business workflows using Java and OOP principles",
      "Design database schemas and write optimized SQL queries for high-volume transactions",
      "Apply algorithmic problem-solving to real-world cloud office suite features",
      "Write unit test cases and maintain version-controlled code repositories with Git",
    ],
    eligibility: "Strong core Java fundamentals, object-oriented concepts, and relational database knowledge.",
    requiredSkills: [
      { name: "Java", benchmark: 80, importance: "Required" },
      { name: "OOP", benchmark: 75, importance: "Required" },
      { name: "SQL", benchmark: 75, importance: "Required" },
      { name: "DSA", benchmark: 75, importance: "Required" },
      { name: "Git", benchmark: 70, importance: "Required" },
    ],
  },
  {
    id: "opp-deloitte-analyst",
    title: "Analyst – Technology",
    company: "Deloitte",
    type: "Job",
    location: "Gurugram / Bengaluru / Hyderabad",
    workMode: "hybrid",
    experience: "0–2 years",
    stipend: "₹9,00,000 / year",
    duration: "Full-Time",
    deadline: "2026-10-03",
    deadlineLabel: "03 Oct 2026",
    description: "Analyze technology requirements, build automated data transformation workflows, and support client digital transformation initiatives.",
    responsibilities: [
      "Process and structure enterprise data pipelines using Python and SQL scripts",
      "Build dynamic analytics dashboards and structured Excel financial models for business stakeholders",
      "Troubleshoot data anomalies and deliver technical solutions to international clients",
      "Communicate findings and technical specifications across cross-functional consulting teams",
    ],
    eligibility: "Bachelor's degree in Engineering, Computer Science, Data Science, or allied fields.",
    requiredSkills: [
      { name: "Python", benchmark: 75, importance: "Required" },
      { name: "SQL", benchmark: 75, importance: "Required" },
      { name: "Excel", benchmark: 70, importance: "Preferred" },
      { name: "Problem Solving", benchmark: 75, importance: "Required" },
      { name: "Communication", benchmark: 70, importance: "Preferred" },
    ],
  },
  {
    id: "opp-infosys-systems-eng",
    title: "Systems Engineer",
    company: "Infosys",
    type: "Job",
    location: "Bengaluru / Pune / Hyderabad",
    workMode: "hybrid",
    experience: "0–2 years",
    stipend: "₹4,50,000 / year",
    duration: "Full-Time",
    deadline: "2026-10-10",
    deadlineLabel: "10 Oct 2026",
    description: "Design and implement full lifecycle enterprise software solutions, maintain high-availability systems, and collaborate with agile product squads.",
    responsibilities: [
      "Develop and maintain enterprise applications using Java and Python backend components",
      "Execute database queries, optimize stored procedures, and ensure data integrity in SQL",
      "Participate in daily agile stand-ups, code reviews, and defect triage sessions",
      "Contribute to continuous integration pipelines and automated regression testing",
    ],
    eligibility: "Graduating 2026 B.Tech/BE/MCA with a solid foundation in computer engineering fundamentals.",
    requiredSkills: [
      { name: "Java", benchmark: 75, importance: "Required" },
      { name: "Python", benchmark: 70, importance: "Required" },
      { name: "SQL", benchmark: 70, importance: "Required" },
      { name: "OOP", benchmark: 70, importance: "Required" },
      { name: "Problem Solving", benchmark: 70, importance: "Required" },
    ],
  },
  {
    id: "opp-accenture-assoc-se",
    title: "Associate Software Engineer",
    company: "Accenture",
    type: "Job",
    location: "Bengaluru / Hyderabad / Pune",
    workMode: "hybrid",
    experience: "0–2 years",
    stipend: "₹5,00,000 / year",
    duration: "Full-Time",
    deadline: "2026-10-15",
    deadlineLabel: "15 Oct 2026",
    description: "Participate in agile engineering sprints, build web services, write unit tests, and deploy reliable software components across client systems.",
    responsibilities: [
      "Develop enterprise application modules using Java and object-oriented paradigms",
      "Manage relational schemas and perform structured data queries using SQL",
      "Follow standard Git branching workflows and resolve code merge conflicts efficiently",
      "Diagnose system issues and build automated scripts for reliability and performance",
    ],
    eligibility: "BE / B.Tech / MCA graduates with analytical problem-solving skills and passion for software development.",
    requiredSkills: [
      { name: "Java", benchmark: 75, importance: "Required" },
      { name: "SQL", benchmark: 70, importance: "Required" },
      { name: "Git", benchmark: 70, importance: "Required" },
      { name: "OOP", benchmark: 70, importance: "Required" },
      { name: "Problem Solving", benchmark: 70, importance: "Required" },
    ],
  },
  {
    id: "opp-nvidia-aiml-intern",
    title: "AI/ML Software Intern",
    company: "NVIDIA",
    type: "Internship",
    location: "Bengaluru",
    workMode: "onsite",
    experience: "Student",
    stipend: "₹1,10,000 / month",
    duration: "6 Months",
    deadline: "2026-09-22",
    deadlineLabel: "22 Sep 2026",
    description: "Develop accelerated machine learning pipelines, optimize computational workloads on GPU architectures, and evaluate deep learning models.",
    responsibilities: [
      "Build high-performance tensor computing routines using Python and NumPy",
      "Benchmark neural network inference latency and optimize memory allocation patterns",
      "Implement foundational machine learning algorithms and evaluate validation metrics",
      "Collaborate with GPU architecture researchers on mathematical modeling and linear algebra kernels",
    ],
    eligibility: "Undergraduate or Graduate student in CS, AI/ML, or Math with strong linear algebra grounding.",
    requiredSkills: [
      { name: "Python", benchmark: 85, importance: "Required" },
      { name: "Machine Learning", benchmark: 75, importance: "Required" },
      { name: "Data Structures", benchmark: 80, importance: "Required" },
      { name: "Linear Algebra", benchmark: 75, importance: "Required" },
      { name: "NumPy", benchmark: 75, importance: "Required" },
    ],
  },
  {
    id: "opp-flipkart-sde-intern",
    title: "Software Development Engineer Intern",
    company: "Flipkart",
    type: "Internship",
    location: "Bengaluru",
    workMode: "hybrid",
    experience: "Student",
    stipend: "₹1,00,000 / month",
    duration: "6 Months",
    deadline: "2026-09-30",
    deadlineLabel: "30 Sep 2026",
    description: "Engineer high-throughput e-commerce platform services, optimize critical search and checkout flows, and solve complex algorithmic problems.",
    responsibilities: [
      "Design and implement low-latency microservice components in Java or C++",
      "Analyze time and space complexity of critical inventory lookup and checkout paths",
      "Solve advanced data structure problems to handle millions of concurrent flash sale requests",
      "Participate in design discussions on caching strategies, fault tolerance, and event queues",
    ],
    eligibility: "Pre-final or final year B.Tech/Dual Degree students in Computer Science with competitive coding proficiency.",
    requiredSkills: [
      { name: "DSA", benchmark: 85, importance: "Required" },
      { name: "Java/C++", benchmark: 80, importance: "Required" },
      { name: "Algorithms", benchmark: 80, importance: "Required" },
      { name: "Git", benchmark: 70, importance: "Required" },
      { name: "Problem Solving", benchmark: 80, importance: "Required" },
    ],
  },
]

export interface OpportunitySkillBreakdown {
  name: string
  requiredLevel: number
  currentLevel: number
  met: boolean
  gap: number
  status: 'met' | 'close' | 'missing'
  statusLabel: string
  isAssessed: boolean
}

export interface OpportunityMatchResult {
  opportunity: OpportunityItem
  matchPercentage: number
  matchStatus: 'Strong Match' | 'Good Match' | 'Partial Match' | 'Low Match'
  matchStatusVariant: 'success' | 'warning' | 'secondary' | 'critical'
  readyStatus: 'Ready to Apply' | 'Improve Skills First'
  isReadyToApply: boolean
  skillsMetCount: number
  totalSkillsCount: number
  mainBlocker: string | null
  matchedSkillNames: string[]
  missingSkillNames: string[]
  matchExplanation: string
  skills: OpportunitySkillBreakdown[]
}

export const READY_THRESHOLD = 70
export const ALMOST_READY_THRESHOLD = 40
export const CLOSE_THRESHOLD = 15

/**
 * Normalizes skill name lookup to gracefully resolve synonyms and composite names.
 */
function resolveStudentScoreForSkill(reqSkillName: string, studentScores: Record<string, number>): number {
  const norm = reqSkillName.toLowerCase().trim()

  // 1. Direct match
  if (studentScores[reqSkillName] !== undefined) return studentScores[reqSkillName]
  if (studentScores[norm] !== undefined) return studentScores[norm]

  // 2. Canonical synonyms & aliases
  if (norm === 'react' || norm === 'react.js') {
    return studentScores['React'] ?? studentScores['React.js'] ?? studentScores['react'] ?? 0
  }
  if (norm === 'javascript' || norm === 'js') {
    return studentScores['JavaScript'] ?? studentScores['JavaScript / TypeScript'] ?? studentScores['javascript'] ?? 0
  }
  if (norm === 'git' || norm === 'git & version control' || norm === 'git/github') {
    return studentScores['Git'] ?? studentScores['Git & Version Control'] ?? studentScores['Git / GitHub'] ?? studentScores['git'] ?? 0
  }
  if (norm === 'dsa' || norm === 'data structures' || norm === 'algorithms' || norm === 'problem solving / dsa') {
    return studentScores['DSA'] ?? studentScores['Data Structures'] ?? studentScores['Problem Solving / DSA'] ?? studentScores['Problem Solving'] ?? studentScores['dsa'] ?? 0
  }
  if (norm === 'java/c++' || norm === 'java' || norm === 'c++') {
    const javaScore = studentScores['Java'] ?? studentScores['Java Core'] ?? 0
    const cppScore = studentScores['C++'] ?? 0
    const javaCppScore = studentScores['Java/C++'] ?? 0
    return Math.max(javaCppScore, javaScore, cppScore)
  }
  if (norm === 'oop') {
    return studentScores['OOP'] ?? studentScores['Java'] ?? studentScores['C++'] ?? studentScores['Python'] ?? 0
  }
  if (norm === 'problem solving') {
    return studentScores['Problem Solving'] ?? studentScores['Problem Solving / DSA'] ?? studentScores['DSA'] ?? 0
  }
  if (norm === 'python' || norm === 'python / pandas') {
    return studentScores['Python'] ?? studentScores['Python / Pandas'] ?? studentScores['python'] ?? 0
  }
  if (norm === 'sql') {
    return studentScores['SQL'] ?? studentScores['SQL & Databases'] ?? studentScores['SQL / Databases'] ?? studentScores['sql'] ?? 0
  }
  if (norm === 'html' || norm === 'html/css' || norm === 'css') {
    return studentScores[reqSkillName] ?? studentScores['HTML'] ?? studentScores['CSS'] ?? studentScores['HTML/CSS'] ?? 0
  }
  if (norm === 'machine learning') {
    return studentScores['Machine Learning'] ?? studentScores['Python'] ?? 0
  }
  if (norm === 'numpy' || norm === 'linear algebra') {
    return studentScores[reqSkillName] ?? studentScores['Python'] ?? 0
  }

  // 3. Fallback partial search
  for (const [k, v] of Object.entries(studentScores)) {
    if (k.toLowerCase().includes(norm) || norm.includes(k.toLowerCase())) {
      return v
    }
  }

  return 0
}

/**
 * Calculates match percentage comparing student verified skills against required benchmarks.
 * Computes overall match %, status category ('Strong Match' | 'Good Match' | 'Partial Match' | 'Low Match'),
 * readiness action ('Ready to Apply' vs 'Improve Skills First'), and detailed explanation.
 */
export function calculateOpportunityMatch(
  opportunity: OpportunityItem,
  studentScores: Record<string, number> = {}
): OpportunityMatchResult {
  let totalPoints = 0
  let earnedPoints = 0
  let skillsMetCount = 0
  let mainBlocker: string | null = null
  let maxDeficit = -Infinity

  const reqSkills = opportunity.requiredSkills ?? []
  const matchedSkillNames: string[] = []
  const missingSkillNames: string[] = []

  const skills: OpportunitySkillBreakdown[] = reqSkills.map((req: any) => {
    const benchmark = Number(req.benchmark ?? req.minScore ?? req.min_score ?? 70)
    const studentScore = resolveStudentScoreForSkill(req.name, studentScores)
    const weight = req.importance === "Preferred" ? 1.0 : 1.5
    totalPoints += benchmark * weight
    earnedPoints += Math.min(studentScore, benchmark) * weight

    const met = studentScore >= benchmark
    if (met) {
      skillsMetCount++
      matchedSkillNames.push(req.name)
    } else {
      missingSkillNames.push(req.name)
    }

    const gap = Math.max(0, benchmark - studentScore)
    if (gap > 0 && gap > maxDeficit) {
      maxDeficit = gap
      mainBlocker = `${req.name} (${gap} pts below benchmark)`
    }

    const isAssessed = studentScore > 0
    let status: 'met' | 'close' | 'missing' = 'missing'
    let statusLabel = ''

    if (met) {
      status = 'met'
      statusLabel = 'Met'
    } else if (isAssessed && gap <= CLOSE_THRESHOLD) {
      status = 'close'
      statusLabel = `close — ${gap} pts short`
    } else if (!isAssessed) {
      status = 'missing'
      statusLabel = 'not assessed'
    } else {
      status = 'missing'
      statusLabel = `${gap} pts deficit`
    }

    return {
      name: req.name,
      requiredLevel: benchmark,
      currentLevel: studentScore,
      met,
      gap,
      status,
      statusLabel,
      isAssessed,
    }
  })

  const matchPercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100

  // Determine Match Status
  let matchStatus: 'Strong Match' | 'Good Match' | 'Partial Match' | 'Low Match' = 'Low Match'
  let matchStatusVariant: 'success' | 'warning' | 'secondary' | 'critical' = 'secondary'

  if (matchPercentage >= 85) {
    matchStatus = 'Strong Match'
    matchStatusVariant = 'success'
  } else if (matchPercentage >= 70) {
    matchStatus = 'Good Match'
    matchStatusVariant = 'success'
  } else if (matchPercentage >= 50) {
    matchStatus = 'Partial Match'
    matchStatusVariant = 'warning'
  } else {
    matchStatus = 'Low Match'
    matchStatusVariant = 'critical'
  }

  // Determine Ready to Apply action
  const hasCriticalMissing = skills.some(s => !s.met && s.gap > 25)
  const isReadyToApply = matchPercentage >= 70 && !hasCriticalMissing
  const readyStatus: 'Ready to Apply' | 'Improve Skills First' = isReadyToApply
    ? 'Ready to Apply'
    : 'Improve Skills First'

  // Build transparent match explanation
  let matchExplanation = ''
  if (missingSkillNames.length === 0) {
    matchExplanation = `You meet all ${reqSkills.length} required skill benchmarks for this opportunity.`
  } else if (matchedSkillNames.length > 0) {
    matchExplanation = `You match ${matchedSkillNames.join(', ')}. Improving ${missingSkillNames.slice(0, 2).join(' and ')} would maximize your qualification.`
  } else {
    matchExplanation = `Complete skill benchmarking in ${missingSkillNames.slice(0, 3).join(', ')} to calculate your match rating.`
  }

  return {
    opportunity,
    matchPercentage,
    matchStatus,
    matchStatusVariant,
    readyStatus,
    isReadyToApply,
    skillsMetCount,
    totalSkillsCount: reqSkills.length,
    mainBlocker: skillsMetCount === reqSkills.length ? null : mainBlocker,
    matchedSkillNames,
    missingSkillNames,
    matchExplanation,
    skills,
  }
}

/**
 * Maps a skill name to its corresponding active assessment route.
 */
export function getAssessmentRouteForSkill(skillName: string): string {
  const norm = (skillName || '').toLowerCase()
  let assessmentId = 'assess-l1-backend-core'
  let skill = skillName
  if (norm.includes('rest') || norm.includes('api')) {
    assessmentId = 'assess-l1-rest-design'
    skill = 'REST APIs'
  } else if (norm.includes('sql') || norm.includes('database') || norm.includes('query')) {
    assessmentId = 'assess-l1-sql-indexing'
    skill = 'SQL'
  } else if (norm.includes('node')) {
    assessmentId = 'assess-l1-nodejs-loop'
    skill = 'Node.js'
  } else if (norm.includes('git') || norm.includes('version')) {
    assessmentId = 'assess-l1-git-workflows'
    skill = 'Git & Version Control'
  } else if (norm.includes('react')) {
    assessmentId = 'assess-l1-react-basics'
    skill = 'React'
  } else if (norm.includes('dsa') || norm.includes('data structure') || norm.includes('algorithm') || norm.includes('problem')) {
    assessmentId = 'assess-l1-backend-core'
    skill = 'DSA'
  } else if (norm.includes('java')) {
    assessmentId = 'assess-l1-backend-core'
    skill = 'Java'
  } else if (norm.includes('python')) {
    assessmentId = 'assess-l1-backend-core'
    skill = 'Python'
  } else if (norm.includes('html') || norm.includes('css')) {
    assessmentId = 'assess-l1-html-basics'
    skill = 'HTML/CSS'
  }
  return `/student/assessment?skill=${encodeURIComponent(skill)}&assessmentId=${assessmentId}&autostart=true`
}

// Global in-memory storage for opportunities created during session
type GlobalWithOpps = typeof globalThis & { __skillbridge_dynamic_opps?: OpportunityItem[] }
const oppGlobal = globalThis as GlobalWithOpps
if (!oppGlobal.__skillbridge_dynamic_opps) {
  oppGlobal.__skillbridge_dynamic_opps = []
}

export function addDynamicOpportunity(opp: OpportunityItem) {
  if (!oppGlobal.__skillbridge_dynamic_opps) {
    oppGlobal.__skillbridge_dynamic_opps = []
  }
  oppGlobal.__skillbridge_dynamic_opps.unshift(opp)
}

export function getAllCombinedOpportunities(): OpportunityItem[] {
  const dynamic = oppGlobal.__skillbridge_dynamic_opps || []
  return [...dynamic, ...SEED_OPPORTUNITIES]
}
