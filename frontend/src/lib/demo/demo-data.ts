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

// ─── 1. Primary Seeded Student: Aditi Sharma ──────────────────────────────────
export const INITIAL_DEMO_STUDENT: DemoStudent = {
  id: 'student-aditi-001',
  name: 'Aditi Sharma',
  email: 'aditi.sharma@apex.edu',
  avatarInitials: 'AS',
  targetCareer: 'Backend Developer',
  institution: 'Apex Institute of Technology',
  department: 'Computer Science & Engineering',
  graduationYear: 2026,
  experienceLevel: 'Undergraduate',
  location: 'Delhi, India',
  readinessPercentage: 82, // (min(100, 80/80*100) + min(100, 60/75*100) + min(100, 50/75*100)) / 3 = (100 + 80 + 66.67) / 3 = 82.22%
  readinessCategory: 'Ready',
  readinessVariant: 'success',
  skills: [
    {
      id: 'skill-java',
      name: 'Java',
      category: 'Backend Core',
      requiredLevel: 80,
      currentLevel: 80,
      gap: 0,
      status: 'ready',
      importance: 'High',
      isAssessed: true,
      verificationStatus: 'practical_verified',
      verificationLabel: 'Practical Verified',
      proofCount: 1,
      proofItems: [
        {
          id: 'proof-1',
          title: 'Distributed Cache Engine (GitHub Repo)',
          type: 'github_repo',
          url: 'https://github.com/aditi/distributed-cache',
          verifiedAt: '2026-08-15',
        },
      ],
    },
    {
      id: 'skill-sql',
      name: 'SQL',
      category: 'Database Architecture',
      requiredLevel: 75,
      currentLevel: 60,
      gap: 15,
      status: 'needs_improvement',
      importance: 'High',
      isAssessed: true,
      verificationStatus: 'assessment_verified',
      verificationLabel: 'Assessment Verified',
      proofCount: 0,
      proofItems: [],
    },
    {
      id: 'skill-springboot',
      name: 'Spring Boot',
      category: 'Backend Frameworks',
      requiredLevel: 75,
      currentLevel: 50,
      gap: 25,
      status: 'critical',
      importance: 'High',
      isAssessed: true,
      verificationStatus: 'assessment_verified',
      verificationLabel: 'Assessment Verified',
      proofCount: 0,
      proofItems: [],
    },
  ],
  priorityGap: {
    skillName: 'Spring Boot',
    gap: 25,
    currentLevel: 50,
    requiredLevel: 75,
    recommendation: 'Complete targeted Spring Boot microservices practice to close the 25-point gap.',
  },
  reassessmentHistory: [
    {
      skillName: 'Java',
      baselineScore: 68,
      currentScore: 80,
      gain: 12,
      date: '2026-08-20',
    },
  ],
  passport: {
    shareToken: 'passport-aditi-sharma-2026',
    headline: 'Aspiring Backend Developer | Java & Distributed Systems Enthusiast',
    bio: 'CS Undergraduate at Apex Institute of Technology passionate about cloud architecture and high-performance backend systems.',
    verifiedSkillsCount: 2,
    proofCoveragePercentage: 33, // 1 of 3 required skills backed by practical evidence
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

// ─── 3. Industry Persona: TechNova Solutions ──────────────────────────────────
export const INITIAL_DEMO_OPPORTUNITIES: DemoOpportunity[] = [
  {
    id: 'opp-backend-intern',
    title: 'Backend Developer Internship',
    company: 'TechNova Solutions',
    type: 'Internship',
    location: 'Bangalore, India',
    workMode: 'Hybrid',
    duration: '6 Months',
    deadline: '2026-10-30',
    deadlineLabel: 'Oct 30, 2026',
    isDeadlineSoon: false,
    isDeadlinePassed: false,
    matchPercentage: 82, // Aditi: (min(100, 80/80*100) + min(100, 60/75*100) + min(100, 50/75*100)) / 3 = 82%
    readinessCategory: 'Ready',
    skillsMetCount: 1,
    totalSkillsCount: 3,
    mainBlocker: 'Spring Boot (25 pts gap)',
    skills: [
      { name: 'Java', currentLevel: 80, requiredLevel: 80, met: true },
      { name: 'SQL', currentLevel: 60, requiredLevel: 75, met: false },
      { name: 'Spring Boot', currentLevel: 50, requiredLevel: 75, met: false },
    ],
    isSaved: true,
    hasApplied: true,
    candidates: [
      {
        id: 'student-priya-002',
        name: 'Priya Singh',
        email: 'priya.singh@apex.edu',
        avatarInitials: 'PS',
        role: 'Backend Developer',
        matchPercentage: 98,
        skillsMetCount: 2,
        totalSkillsCount: 3,
        skills: [
          { name: 'Java', current: 85, required: 80, met: true },
          { name: 'SQL', current: 80, required: 75, met: true },
          { name: 'Spring Boot', current: 70, required: 75, met: false },
        ],
        status: 'shortlisted',
      },
      {
        id: 'student-rohan-003',
        name: 'Rohan Mehta',
        email: 'rohan.mehta@apex.edu',
        avatarInitials: 'RM',
        role: 'Backend Developer',
        matchPercentage: 89,
        skillsMetCount: 1,
        totalSkillsCount: 3,
        skills: [
          { name: 'Java', current: 70, required: 80, met: false },
          { name: 'SQL', current: 75, required: 75, met: true },
          { name: 'Spring Boot', current: 60, required: 75, met: false },
        ],
        status: 'reviewing',
      },
      {
        id: 'student-aditi-001',
        name: 'Aditi Sharma',
        email: 'aditi.sharma@apex.edu',
        avatarInitials: 'AS',
        role: 'Backend Developer',
        matchPercentage: 82,
        skillsMetCount: 1,
        totalSkillsCount: 3,
        skills: [
          { name: 'Java', current: 80, required: 80, met: true },
          { name: 'SQL', current: 60, required: 75, met: false },
          { name: 'Spring Boot', current: 50, required: 75, met: false },
        ],
        status: 'applied',
      },
      {
        id: 'student-rahul-004',
        name: 'Rahul Verma',
        email: 'rahul.verma@apex.edu',
        avatarInitials: 'RV',
        role: 'Backend Developer',
        matchPercentage: 72,
        skillsMetCount: 0,
        totalSkillsCount: 3,
        skills: [
          { name: 'Java', current: 65, required: 80, met: false },
          { name: 'SQL', current: 55, required: 75, met: false },
          { name: 'Spring Boot', current: 45, required: 75, met: false },
        ],
        status: 'applied',
      },
    ],
  },
  {
    id: 'opp-cloud-engineer',
    title: 'Junior Cloud / Systems Engineer',
    company: 'TechNova Solutions',
    type: 'Full-time',
    location: 'Remote',
    workMode: 'Remote',
    duration: 'Full-time',
    deadline: '2026-11-15',
    deadlineLabel: 'Nov 15, 2026',
    isDeadlineSoon: false,
    isDeadlinePassed: false,
    matchPercentage: 67, // Aditi: Java 80/70 (100%) + SQL 60/60 (100%) + AWS 0/70 (0%) -> (100 + 100 + 0) / 3 = 66.67% -> 67%
    readinessCategory: 'Needs Improvement',
    skillsMetCount: 2,
    totalSkillsCount: 3,
    mainBlocker: 'AWS (Unassessed / 0 pts)',
    skills: [
      { name: 'Java', currentLevel: 80, requiredLevel: 70, met: true },
      { name: 'SQL', currentLevel: 60, requiredLevel: 60, met: true },
      { name: 'AWS', currentLevel: 0, requiredLevel: 70, met: false },
    ],
    isSaved: false,
    hasApplied: false,
    candidates: [],
  },
]

// ─── 4. Academician Persona: Faculty Overview ────────────────────────────────
export const DEMO_ACADEMICIAN_DATA = {
  institution: 'Apex Institute of Technology',
  department: 'Computer Science & Engineering',
  cohortName: 'Class of 2026 — Backend Developer Track',
  totalStudents: 4,
  averageReadiness: 85, // (82.22 + 97.78 + 89.17 + 71.53) / 4 = 85.18% -> 85%
  skillsAnalytics: [
    { skill: 'Java', averageScore: 75, benchmark: 80, gap: 5, status: 'near', assessedCount: 4 },
    { skill: 'SQL', averageScore: 68, benchmark: 75, gap: 7, status: 'near', assessedCount: 4 },
    { skill: 'Spring Boot', averageScore: 56, benchmark: 75, gap: 19, status: 'critical', assessedCount: 4 },
  ],
  commonGap: {
    skill: 'Spring Boot',
    averageGap: 19,
    affectedCount: 4,
    recommendation: 'Schedule cohort-wide workshop on Spring Boot Dependency Injection & REST Controller Testing.',
  },
  readinessTiers: {
    high: 2, // Priya (98%), Rohan (89%)
    medium: 2, // Aditi (82%), Rahul (72%)
    critical: 0,
  },
}

// ─── 5. Institution Persona: Institution Analytics ───────────────────────────
export const DEMO_INSTITUTION_DATA = {
  institutionName: 'Apex Institute of Technology',
  totalStudentsEnrolled: 120,
  cohortEvaluated: 4,
  overallReadiness: 85,
  industryPartnerCount: 8,
  topIndustryPartner: 'TechNova Solutions',
  industryAlignmentScore: 88,
  departments: [
    { name: 'Computer Science & Engineering', students: 120, avgReadiness: 85, status: 'High' },
    { name: 'Information Technology', students: 95, avgReadiness: 81, status: 'High' },
    { name: 'Electronics & Communication', students: 80, avgReadiness: 74, status: 'Medium' },
  ],
  topVerifiedSkills: [
    { skill: 'Java', verificationRate: 100, avgScore: 75 },
    { skill: 'SQL', verificationRate: 100, avgScore: 68 },
    { skill: 'Spring Boot', verificationRate: 100, avgScore: 56 },
  ],
  priorityInterventions: [
    {
      department: 'Computer Science & Engineering',
      skillArea: 'Spring Boot Frameworks',
      gapSize: '19 pts',
      recommendedAction: 'Deploy hands-on practical lab modules before placement season.',
    },
  ],
}
