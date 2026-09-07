/**
 * SkillBridge Connect — Phase 1 Shared Seeded Dataset
 * 
 * Mathematical Consistency & Single Source of Truth for:
 * 1. Student (Aditi Sharma)
 * 2. Industry (TechNova Solutions)
 * 3. Academician (Cohort CS-2026)
 * 4. Institution (Apex Institute of Technology)
 * 
 * All formulas conform strictly to:
 * - Skill Gap = max(Required Benchmark - Student Score, 0)
 * - Career Readiness % = Average(min(100, (Student Score / Required Benchmark) * 100))
 * - Opportunity Match % = Average(min(100, (Student Score / Required Benchmark) * 100)), missing skills = 0
 */

export interface DemoSkill {
  id: string
  name: string
  category: string
  requiredLevel: number
  currentLevel: number
  gap: number
  status: 'critical' | 'needs_improvement' | 'ready'
  importance: 'High' | 'Medium' | 'Low'
  isAssessed: boolean
  verificationStatus: 'self_declared' | 'assessment_verified' | 'practical_verified' | 'evidence_verified' | 'institution_verified'
  verificationLabel: string
  proofCount: number
  proofItems: { id: string; title: string; type: string; url?: string; verifiedAt?: string }[]
}

export interface DemoStudent {
  id: string
  name: string
  email: string
  avatarInitials: string
  targetCareer: string
  institution: string
  department: string
  graduationYear: number
  experienceLevel: string
  location: string
  readinessPercentage: number
  readinessCategory: string
  readinessVariant: 'success' | 'warning' | 'critical'
  skills: DemoSkill[]
  priorityGap: {
    skillName: string
    gap: number
    currentLevel: number
    requiredLevel: number
    recommendation: string
  } | null
  reassessmentHistory: {
    skillName: string
    baselineScore: number
    currentScore: number
    gain: number
    date: string
  }[]
  passport: {
    shareToken: string
    headline: string
    bio: string
    verifiedSkillsCount: number
    proofCoveragePercentage: number
  }
}

export interface DemoCandidate {
  id: string
  name: string
  email: string
  avatarInitials: string
  role: string
  matchPercentage: number
  skillsMetCount: number
  totalSkillsCount: number
  skills: { name: string; current: number; required: number; met: boolean }[]
  status: 'applied' | 'reviewing' | 'shortlisted' | 'accepted'
}

export interface DemoOpportunity {
  id: string
  title: string
  company: string
  type: string
  location: string
  workMode: string
  duration: string
  deadline: string
  deadlineLabel: string
  isDeadlineSoon: boolean
  isDeadlinePassed: boolean
  matchPercentage: number
  readinessCategory: string
  skillsMetCount: number
  totalSkillsCount: number
  mainBlocker: string | null
  skills: { name: string; currentLevel: number; requiredLevel: number; met: boolean }[]
  isSaved: boolean
  hasApplied: boolean
  candidates: DemoCandidate[]
}

// ─── 1. Primary Seeded Student: Aarav Mehta ──────────────────────────────────
export const INITIAL_DEMO_STUDENT: DemoStudent = {
  id: 'demo-std-001',
  name: 'Aarav Mehta',
  email: 'aarav.mehta@dtu.ac.in',
  avatarInitials: 'AM',
  targetCareer: 'Full Stack Developer',
  institution: 'Dr. Akhilesh Das Gupta Institute of Professional Studies',
  department: 'Computer Science & Engineering',
  graduationYear: 2026,
  experienceLevel: 'Undergraduate',
  location: 'Delhi NCR, India',
  readinessPercentage: 72, // (82 + 71 + 68 + 54 + 73 + 80) / 6 = 71.33% -> 72%
  readinessCategory: 'Developing',
  readinessVariant: 'warning',
  skills: [
    {
      id: 'skill-js',
      name: 'JavaScript',
      category: 'Core Web',
      requiredLevel: 80,
      currentLevel: 82,
      gap: 0,
      status: 'ready',
      importance: 'High',
      isAssessed: true,
      verificationStatus: 'practical_verified',
      verificationLabel: 'Practical Verified',
      proofCount: 1,
      proofItems: [
        {
          id: 'proof-js-1',
          title: 'Event-Driven Async Job Runner (GitHub Repo)',
          type: 'github_repo',
          url: 'https://github.com/aarav-mehta/async-job-runner',
          verifiedAt: '2026-08-20',
        },
      ],
    },
    {
      id: 'skill-react',
      name: 'React',
      category: 'Frontend Frameworks',
      requiredLevel: 75,
      currentLevel: 71,
      gap: 4,
      status: 'needs_improvement',
      importance: 'High',
      isAssessed: true,
      verificationStatus: 'practical_verified',
      verificationLabel: 'Practical Verified',
      proofCount: 1,
      proofItems: [
        {
          id: 'proof-react-1',
          title: 'Real-Time Monitoring Dashboard with WebSockets',
          type: 'live_demo',
          url: 'https://monitor-demo.skillbridge.dev',
          verifiedAt: '2026-08-20',
        },
      ],
    },
    {
      id: 'skill-node',
      name: 'Node.js',
      category: 'Backend Core',
      requiredLevel: 70,
      currentLevel: 68,
      gap: 2,
      status: 'needs_improvement',
      importance: 'High',
      isAssessed: true,
      verificationStatus: 'assessment_verified',
      verificationLabel: 'Assessment Verified',
      proofCount: 0,
      proofItems: [],
    },
    {
      id: 'skill-rest',
      name: 'REST APIs',
      category: 'Backend Architecture',
      requiredLevel: 75,
      currentLevel: 54,
      gap: 21,
      status: 'critical',
      importance: 'High',
      isAssessed: true,
      verificationStatus: 'practical_verified',
      verificationLabel: 'Practical Verified',
      proofCount: 1,
      proofItems: [
        {
          id: 'proof-rest-1',
          title: 'Distributed API Gateway with Rate Limiting',
          type: 'github_repo',
          url: 'https://github.com/aarav-mehta/api-gateway-engine',
          verifiedAt: '2026-08-29',
        },
      ],
    },
    {
      id: 'skill-sql',
      name: 'SQL',
      category: 'Database Architecture',
      requiredLevel: 70,
      currentLevel: 73,
      gap: 0,
      status: 'ready',
      importance: 'High',
      isAssessed: true,
      verificationStatus: 'assessment_verified',
      verificationLabel: 'Assessment Verified',
      proofCount: 0,
      proofItems: [],
    },
    {
      id: 'skill-git',
      name: 'Git',
      category: 'Tooling',
      requiredLevel: 65,
      currentLevel: 80,
      gap: 0,
      status: 'ready',
      importance: 'Medium',
      isAssessed: true,
      verificationStatus: 'assessment_verified',
      verificationLabel: 'Assessment Verified',
      proofCount: 0,
      proofItems: [],
    },
  ],
  priorityGap: {
    skillName: 'REST APIs',
    gap: 21,
    currentLevel: 54,
    requiredLevel: 75,
    recommendation: 'Complete targeted REST API microservices practice and attend 18 Sep workshop to close the 21-point gap.',
  },
  reassessmentHistory: [
    {
      skillName: 'JavaScript',
      baselineScore: 72,
      currentScore: 82,
      gain: 10,
      date: '2026-08-28',
    },
    {
      skillName: 'REST APIs',
      baselineScore: 40,
      currentScore: 54,
      gain: 14,
      date: '2026-08-30',
    },
  ],
  passport: {
    shareToken: 'passport-aarav-mehta-2026',
    headline: 'Aspiring Full Stack Engineer | React, Node.js & High-Throughput APIs',
    bio: 'CS Undergraduate at Delhi Technological University passionate about distributed web architectures and microservices.',
    verifiedSkillsCount: 3,
    proofCoveragePercentage: 50, // 3 of 6 required skills backed by practical evidence
  },
}

// ─── 2. Cohort Peers (Shared with Academician & Institution) ─────────────────
export const DEMO_COHORT_STUDENTS = [
  INITIAL_DEMO_STUDENT,
  {
    id: 'student-priya-002',
    name: 'Priya Singh',
    email: 'priya.singh@apex.edu',
    avatarInitials: 'PS',
    targetCareer: 'Backend Developer',
    institution: 'Apex Institute of Technology',
    department: 'Computer Science & Engineering',
    graduationYear: 2026,
    experienceLevel: 'Undergraduate',
    location: 'Bangalore, India',
    readinessPercentage: 98, // (100 + 100 + 93.33) / 3 = 97.78% -> 98%
    readinessCategory: 'Ready',
    readinessVariant: 'success' as const,
    skills: [
      { name: 'Java', current: 85, required: 80, gap: 0, met: true },
      { name: 'SQL', current: 80, required: 75, gap: 0, met: true },
      { name: 'Spring Boot', current: 70, required: 75, gap: 5, met: false },
    ],
  },
  {
    id: 'student-rohan-003',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@apex.edu',
    avatarInitials: 'RM',
    targetCareer: 'Backend Developer',
    institution: 'Apex Institute of Technology',
    department: 'Computer Science & Engineering',
    graduationYear: 2026,
    experienceLevel: 'Undergraduate',
    location: 'Mumbai, India',
    readinessPercentage: 89, // (87.5 + 100 + 80) / 3 = 89.17% -> 89%
    readinessCategory: 'Ready',
    readinessVariant: 'success' as const,
    skills: [
      { name: 'Java', current: 70, required: 80, gap: 10, met: false },
      { name: 'SQL', current: 75, required: 75, gap: 0, met: true },
      { name: 'Spring Boot', current: 60, required: 75, gap: 15, met: false },
    ],
  },
  {
    id: 'student-rahul-004',
    name: 'Rahul Verma',
    email: 'rahul.verma@apex.edu',
    avatarInitials: 'RV',
    targetCareer: 'Backend Developer',
    institution: 'Apex Institute of Technology',
    department: 'Computer Science & Engineering',
    graduationYear: 2026,
    experienceLevel: 'Undergraduate',
    location: 'Delhi, India',
    readinessPercentage: 72, // (81.25 + 73.33 + 60) / 3 = 71.53% -> 72%
    readinessCategory: 'Needs Improvement',
    readinessVariant: 'warning' as const,
    skills: [
      { name: 'Java', current: 65, required: 80, gap: 15, met: false },
      { name: 'SQL', current: 55, required: 75, gap: 20, met: false },
      { name: 'Spring Boot', current: 45, required: 75, gap: 30, met: false },
    ],
  },
]

// ─── 3. Industry Persona: TechNova Labs ──────────────────────────────────
export const INITIAL_DEMO_OPPORTUNITIES: DemoOpportunity[] = [
  {
    id: 'opp-technova-fullstack',
    title: 'Full Stack Developer Internship',
    company: 'TechNova Labs',
    type: 'Internship',
    location: 'Bangalore / Hybrid',
    workMode: 'Hybrid',
    duration: '6 Months',
    deadline: '2026-10-15',
    deadlineLabel: 'Oct 15, 2026',
    isDeadlineSoon: false,
    isDeadlinePassed: false,
    matchPercentage: 72,
    readinessCategory: 'Developing',
    skillsMetCount: 2,
    totalSkillsCount: 4,
    mainBlocker: 'REST APIs (21 pts gap)',
    skills: [
      { name: 'JavaScript', currentLevel: 82, requiredLevel: 80, met: true },
      { name: 'React', currentLevel: 71, requiredLevel: 75, met: false },
      { name: 'Node.js', currentLevel: 68, requiredLevel: 70, met: false },
      { name: 'REST APIs', currentLevel: 54, requiredLevel: 75, met: false },
    ],
    isSaved: true,
    hasApplied: false,
    candidates: [
      {
        id: 'demo-std-001',
        name: 'Aarav Mehta',
        email: 'aarav.mehta@dtu.ac.in',
        avatarInitials: 'AM',
        role: 'Full Stack Developer',
        matchPercentage: 72,
        skillsMetCount: 2,
        totalSkillsCount: 4,
        skills: [
          { name: 'JavaScript', current: 82, required: 80, met: true },
          { name: 'React', current: 71, required: 75, met: false },
          { name: 'Node.js', current: 68, required: 70, met: false },
          { name: 'REST APIs', current: 54, required: 75, met: false },
        ],
        status: 'applied',
      },
      {
        id: 'demo-std-002',
        name: 'Priya Verma',
        email: 'priya.verma@dtu.ac.in',
        avatarInitials: 'PV',
        role: 'Frontend Developer',
        matchPercentage: 86,
        skillsMetCount: 3,
        totalSkillsCount: 4,
        skills: [
          { name: 'JavaScript', current: 88, required: 80, met: true },
          { name: 'React', current: 84, required: 75, met: true },
          { name: 'Node.js', current: 65, required: 70, met: false },
          { name: 'REST APIs', current: 76, required: 75, met: true },
        ],
        status: 'shortlisted',
      },
      {
        id: 'demo-std-003',
        name: 'Rohan Iyer',
        email: 'rohan.iyer@dtu.ac.in',
        avatarInitials: 'RI',
        role: 'Backend Engineer',
        matchPercentage: 91,
        skillsMetCount: 4,
        totalSkillsCount: 4,
        skills: [
          { name: 'JavaScript', current: 80, required: 80, met: true },
          { name: 'React', current: 78, required: 75, met: true },
          { name: 'Node.js', current: 85, required: 70, met: true },
          { name: 'REST APIs', current: 82, required: 75, met: true },
        ],
        status: 'reviewing',
      },
    ],
  },
  {
    id: 'opp-backend-intern',
    title: 'Backend Systems Engineer Intern',
    company: 'Vertex Systems',
    type: 'Internship',
    location: 'Bangalore, India',
    workMode: 'In-Person',
    duration: '6 Months',
    deadline: '2026-10-30',
    deadlineLabel: 'Oct 30, 2026',
    isDeadlineSoon: false,
    isDeadlinePassed: false,
    matchPercentage: 78,
    readinessCategory: 'Developing',
    skillsMetCount: 2,
    totalSkillsCount: 3,
    mainBlocker: 'REST APIs (21 pts gap)',
    skills: [
      { name: 'Node.js', currentLevel: 68, requiredLevel: 70, met: false },
      { name: 'SQL', currentLevel: 73, requiredLevel: 70, met: true },
      { name: 'REST APIs', currentLevel: 54, requiredLevel: 75, met: false },
    ],
    isSaved: false,
    hasApplied: true,
    candidates: [],
  },
  {
    id: 'opp-cloud-engineer',
    title: 'Junior Cloud & DevOps Trainee',
    company: 'InnovateX Digital',
    type: 'Full-time',
    location: 'Remote',
    workMode: 'Remote',
    duration: 'Full-time',
    deadline: '2026-11-15',
    deadlineLabel: 'Nov 15, 2026',
    isDeadlineSoon: false,
    isDeadlinePassed: false,
    matchPercentage: 68,
    readinessCategory: 'Developing',
    skillsMetCount: 1,
    totalSkillsCount: 3,
    mainBlocker: 'Docker (Unassessed)',
    skills: [
      { name: 'Git', currentLevel: 80, requiredLevel: 70, met: true },
      { name: 'Linux', currentLevel: 60, requiredLevel: 70, met: false },
      { name: 'Docker', currentLevel: 0, requiredLevel: 70, met: false },
    ],
    isSaved: false,
    hasApplied: false,
    candidates: [],
  },
]

// ─── 4. Academician Persona: Faculty Overview ────────────────────────────────
export const DEMO_ACADEMICIAN_DATA = {
  facultyName: 'Dr. Ananya Sharma',
  institution: 'Dr. Akhilesh Das Gupta Institute of Professional Studies',
  department: 'Computer Science & Engineering',
  cohortName: 'Class of 2026 — Engineering Cohort',
  totalStudents: 48,
  studentsAssessed: 41,
  studentsImproving: 29,
  studentsRequiringAttention: 12,
  activeMentorshipsCount: 8,
  upcomingWorkshopsCount: 4,
  activeInterventionsCount: 6,
  averageReadiness: 68,
  skillsAnalytics: [
    { skill: 'REST APIs', averageScore: 58, benchmark: 75, gap: 17, status: 'critical', assessedCount: 18 },
    { skill: 'React', averageScore: 69, benchmark: 80, gap: 11, status: 'needs_improvement', assessedCount: 14 },
    { skill: 'SQL', averageScore: 62, benchmark: 75, gap: 13, status: 'needs_improvement', assessedCount: 21 },
    { skill: 'Git', averageScore: 64, benchmark: 70, gap: 6, status: 'needs_improvement', assessedCount: 9 },
  ],
  commonGap: {
    skill: 'REST APIs',
    averageGap: 17,
    affectedCount: 18,
    recommendation: 'Schedule cohort-wide workshop on Production REST APIs and idempotent architecture.',
  },
  readinessTiers: {
    notReady: 5,
    earlyProgress: 9,
    developing: 15,
    ready: 10,
    highlyReady: 2,
  },
}

// ─── 5. Institution Persona: Institution Analytics ───────────────────────────
export const DEMO_INSTITUTION_DATA = {
  institutionName: 'Dr. Akhilesh Das Gupta Institute of Professional Studies',
  totalStudentsEnrolled: 48,
  cohortEvaluated: 41,
  overallReadiness: 68,
  industryPartnerCount: 8,
  topIndustryPartner: 'TechNova Labs',
  industryAlignmentScore: 84,
  departments: [
    { name: 'Computer Science & Engineering', students: 48, avgReadiness: 68, status: 'Active Cohort' },
  ],
  topVerifiedSkills: [
    { skill: 'JavaScript', verificationRate: 85, avgScore: 78 },
    { skill: 'SQL', verificationRate: 72, avgScore: 68 },
    { skill: 'REST APIs', verificationRate: 60, avgScore: 58 },
  ],
  priorityInterventions: [
    {
      department: 'Computer Science & Engineering',
      skillArea: 'REST API Architecture',
      gapSize: '17 pts',
      recommendedAction: 'Deploy hands-on practical lab modules and 1-on-1 mentorship.',
    },
  ],
}
