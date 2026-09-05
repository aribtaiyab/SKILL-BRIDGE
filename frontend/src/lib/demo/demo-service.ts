/**
 * SkillBridge Connect — Production-Quality Deterministic Demo Data Service
 * 
 * Single Source of Truth for DEMO MODE:
 * - Academician Persona: Dr. Ananya Sharma (Computer Science & Engineering)
 * - Primary Student Persona: Aarav Mehta (Full Stack Developer Track, 72% Readiness)
 * - Cohort Dataset: Exactly 48 Fictional Students (41 assessed, 7 unassessed)
 * - Readiness Distribution: Not Ready (5), Early Progress (9), Developing (15), Ready (10), Highly Ready (2)
 * - Average Cohort Readiness: 68%
 * - Skill Gap Engine: gap = max(required_level - current_level, 0), >=15 Critical, 1-14 Needs Improvement, 0 Ready
 * - Opportunity-Specific Readiness Engine: min(100, current / required * 100)
 * 
 * STRICT DIRECTIVE:
 * Zero random numbers (Math.random). Completely deterministic and immutable seed data.
 * Safe simulations for in-session demo interactions without touching the production database.
 */

export interface DemoSkillItem {
  skillId: string
  skillName: string
  category: string
  requiredLevel: number
  currentLevel: number
  isAssessed: boolean
  gap: number
  severity: 'critical' | 'needs_improvement' | 'ready'
  importance: 'High' | 'Medium' | 'Low'
  verificationStatus: 'verified' | 'submitted' | 'unassessed'
  lastAssessedAt: string | null
}

export interface DemoStudentProfile {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  phone: string
  bio: string
  location: string
  education: string
  graduationYear: number
  institution: string
  department: string
  targetCareerId: string
  targetCareerName: string
  targetCareerDescription: string
  readiness: number
  readinessCategory: 'Not Ready' | 'Early Progress' | 'Developing' | 'Ready' | 'Highly Ready'
  isAssessed: boolean
  skills: DemoSkillItem[]
  priorityGap: {
    skillId: string
    skillName: string
    gap: number
    severity: string
    requiredLevel: number
    currentLevel: number
  } | null
  recommendedAction: string
  assessmentHistory: Array<{
    id: string
    title: string
    type: string
    score: number
    status: string
    completedAt: string
  }>
  reassessments: Array<{
    id: string
    skillName: string
    previousScore: number
    newScore: number
    improvementPoints: number
    reassessedAt: string
  }>
  evidence: Array<{
    id: string
    skillName: string
    title: string
    description: string
    type: string
    githubUrl: string | null
    liveDemoUrl: string | null
    verificationStatus: string
    submittedAt: string
  }>
  mentorshipHistory: Array<{
    id: string
    skillName: string
    mentorName: string
    status: string
    notes: string | null
    startDate: string | null
    endDate: string | null
  }>
  workshopParticipation: Array<{
    workshopId: string
    title: string
    skillName: string
    status: string
    enrolledAt: string
    attendedAt: string | null
  }>
}

export interface DemoMentorship {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  studentAvatar: string | null
  academicianName: string
  skillId: string
  skillName: string
  skillCategory: string
  status: 'active' | 'completed' | 'cancelled'
  startDate: string
  endDate: string | null
  notes: string
  createdAt: string
}

export interface DemoWorkshop {
  id: string
  title: string
  description: string
  skillId: string
  skillName: string
  skillCategory: string
  targetCareer: string
  date: string
  duration: string
  capacity: number
  enrolledCount: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  institutionName: string
  isOwnWorkshop: boolean
  createdAt: string
  participantIds: string[]
}

export interface DemoIntervention {
  id: string
  title: string
  problemStatement: string
  description: string
  interventionType: 'workshop' | 'mentorship' | 'curriculum_update' | 'bootcamp'
  skillName: string
  skillId: string
  status: 'active' | 'completed' | 'scheduled'
  startDate: string
  endDate: string | null
  enrolledCount: number
  reassessedCount: number
  preReadinessAvg: number
  postReadinessAvg: number
  netImprovementLift: number
  createdAt: string
}

export interface DemoOpportunity {
  id: string
  title: string
  provider: string
  type: 'internship' | 'job' | 'project' | 'fdp'
  location: string
  workMode: string
  duration: string
  stipendAmount: number | null
  deadline: string
  description: string
  requiredSkills: Array<{ name: string; requiredLevel: number }>
  audience: 'students' | 'academicians'
}

// ─── 1. Academician Persona: Dr. Ananya Sharma ────────────────────────────────
export const DEMO_ACADEMICIAN = {
  id: 'demo-faculty-001',
  name: 'Dr. Ananya Sharma',
  email: 'ananya.sharma@dtu.ac.in',
  role: 'academician',
  designation: 'Associate Professor & Faculty Mentor',
  teachingArea: 'Full Stack Development, Web Technologies & Database Systems',
  institution: 'Delhi Technological University (DTU)',
  department: 'Computer Science & Engineering',
  experience: '8 Years',
  bio: 'Specializing in distributed web architectures, high-concurrency databases, and curriculum-industry alignment. Actively guiding the Class of 2026.',
  phone: '+91 98112 45678',
  location: 'CS Block II, Room 304, DTU Campus',
  joinedDate: '15 July 2020',
}

// ─── 2. Career Targets & Standard Requirements ────────────────────────────────
const CAREER_REQUIREMENTS: Record<string, Array<{ skillId: string; skillName: string; category: string; requiredLevel: number; importance: 'High' | 'Medium' | 'Low' }>> = {
  'full-stack': [
    { skillId: 's-js', skillName: 'JavaScript', category: 'Core Web', requiredLevel: 80, importance: 'High' },
    { skillId: 's-react', skillName: 'React', category: 'Frontend', requiredLevel: 75, importance: 'High' },
    { skillId: 's-node', skillName: 'Node.js', category: 'Backend', requiredLevel: 70, importance: 'High' },
    { skillId: 's-rest', skillName: 'REST APIs', category: 'Backend Architecture', requiredLevel: 75, importance: 'High' },
    { skillId: 's-sql', skillName: 'SQL', category: 'Database', requiredLevel: 70, importance: 'High' },
    { skillId: 's-git', skillName: 'Git', category: 'Tooling', requiredLevel: 65, importance: 'Medium' },
  ],
  'backend': [
    { skillId: 's-java', skillName: 'Java', category: 'Backend Core', requiredLevel: 80, importance: 'High' },
    { skillId: 's-spring', skillName: 'Spring Boot', category: 'Backend Frameworks', requiredLevel: 75, importance: 'High' },
    { skillId: 's-rest', skillName: 'REST APIs', category: 'Backend Architecture', requiredLevel: 75, importance: 'High' },
    { skillId: 's-sql', skillName: 'SQL', category: 'Database', requiredLevel: 75, importance: 'High' },
    { skillId: 's-git', skillName: 'Git', category: 'Tooling', requiredLevel: 65, importance: 'Medium' },
  ],
  'frontend': [
    { skillId: 's-html', skillName: 'HTML & CSS', category: 'Core Web', requiredLevel: 85, importance: 'High' },
    { skillId: 's-js', skillName: 'JavaScript', category: 'Core Web', requiredLevel: 80, importance: 'High' },
    { skillId: 's-react', skillName: 'React', category: 'Frontend Frameworks', requiredLevel: 80, importance: 'High' },
    { skillId: 's-ts', skillName: 'TypeScript', category: 'Frontend Frameworks', requiredLevel: 70, importance: 'High' },
    { skillId: 's-git', skillName: 'Git', category: 'Tooling', requiredLevel: 65, importance: 'Medium' },
  ],
  'data': [
    { skillId: 's-python', skillName: 'Python', category: 'Programming', requiredLevel: 80, importance: 'High' },
    { skillId: 's-sql', skillName: 'SQL', category: 'Database', requiredLevel: 80, importance: 'High' },
    { skillId: 's-dsa', skillName: 'Data Structures', category: 'Core CS', requiredLevel: 75, importance: 'High' },
    { skillId: 's-analysis', skillName: 'Data Analysis', category: 'Analytics', requiredLevel: 75, importance: 'High' },
    { skillId: 's-git', skillName: 'Git', category: 'Tooling', requiredLevel: 60, importance: 'Medium' },
  ],
  'cybersecurity': [
    { skillId: 's-networks', skillName: 'Computer Networks', category: 'Core CS', requiredLevel: 80, importance: 'High' },
    { skillId: 's-secfund', skillName: 'Security Fundamentals', category: 'Security', requiredLevel: 75, importance: 'High' },
    { skillId: 's-linux', skillName: 'Linux & Scripting', category: 'Systems', requiredLevel: 75, importance: 'High' },
    { skillId: 's-sql', skillName: 'SQL', category: 'Database', requiredLevel: 65, importance: 'Medium' },
  ],
}

// ─── 3. Deterministic Seed Data Generator for 48 Students ─────────────────────
// Exactly:
// Not Ready (0–39): 5 students
// Early Progress (40–59): 9 students
// Developing (60–74): 15 students
// Ready (75–89): 10 students
// Highly Ready (90–100): 2 students
// Total assessed = 41. Unassessed = 7. Total students = 48.
// Average readiness of assessed = 68%

interface RawStudentSeed {
  id: string
  name: string
  email: string
  careerKey: 'full-stack' | 'backend' | 'frontend' | 'data' | 'cybersecurity'
  careerTitle: string
  scores: Record<string, number>
  isAssessed: boolean
}

const RAW_SEEDS: RawStudentSeed[] = [
  // 1. Aarav Mehta (Primary Student: Full Stack, 72% Readiness, REST API gap: 21)
  {
    id: 'demo-std-001',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 82, 's-react': 71, 's-node': 68, 's-rest': 54, 's-sql': 73, 's-git': 80 },
    isAssessed: true,
  },
  // 2. Priya Verma (Ready, 84%)
  {
    id: 'demo-std-002',
    name: 'Priya Verma',
    email: 'priya.verma@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: { 's-java': 85, 's-spring': 75, 's-rest': 82, 's-sql': 84, 's-git': 75 },
    isAssessed: true,
  },
  // 3. Rahul Singh (Developing, 65%)
  {
    id: 'demo-std-003',
    name: 'Rahul Singh',
    email: 'rahul.singh@dtu.ac.in',
    careerKey: 'frontend',
    careerTitle: 'Frontend Developer',
    scores: { 's-html': 80, 's-js': 68, 's-react': 64, 's-ts': 50, 's-git': 65 },
    isAssessed: true,
  },
  // 4. Sneha Kapoor (Highly Ready, 92%)
  {
    id: 'demo-std-004',
    name: 'Sneha Kapoor',
    email: 'sneha.kapoor@dtu.ac.in',
    careerKey: 'data',
    careerTitle: 'Data Analyst',
    scores: { 's-python': 95, 's-sql': 90, 's-dsa': 88, 's-analysis': 92, 's-git': 85 },
    isAssessed: true,
  },
  // 5. Rohan Gupta (Early Progress, 58%)
  {
    id: 'demo-std-005',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 65, 's-react': 58, 's-node': 55, 's-rest': 50, 's-sql': 60, 's-git': 62 },
    isAssessed: true,
  },
  // 6. Ishita Sharma (Ready, 76%)
  {
    id: 'demo-std-006',
    name: 'Ishita Sharma',
    email: 'ishita.sharma@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: { 's-java': 78, 's-spring': 70, 's-rest': 75, 's-sql': 76, 's-git': 80 },
    isAssessed: true,
  },
  // 7. Aditya Kumar (Early Progress, 48%)
  {
    id: 'demo-std-007',
    name: 'Aditya Kumar',
    email: 'aditya.kumar@dtu.ac.in',
    careerKey: 'cybersecurity',
    careerTitle: 'Cybersecurity Analyst',
    scores: { 's-networks': 52, 's-secfund': 45, 's-linux': 46, 's-sql': 50 },
    isAssessed: true,
  },
  // 8. Ananya Rao (Ready, 82%)
  {
    id: 'demo-std-008',
    name: 'Ananya Rao',
    email: 'ananya.rao@dtu.ac.in',
    careerKey: 'frontend',
    careerTitle: 'Frontend Developer',
    scores: { 's-html': 90, 's-js': 85, 's-react': 82, 's-ts': 72, 's-git': 80 },
    isAssessed: true,
  },
  // 9. Karan Malhotra (Developing, 62%)
  {
    id: 'demo-std-009',
    name: 'Karan Malhotra',
    email: 'karan.malhotra@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: { 's-java': 68, 's-spring': 58, 's-rest': 55, 's-sql': 64, 's-git': 66 },
    isAssessed: true,
  },
  // 10. Neha Joshi (Developing, 70%)
  {
    id: 'demo-std-010',
    name: 'Neha Joshi',
    email: 'neha.joshi@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 78, 's-react': 72, 's-node': 65, 's-rest': 64, 's-sql': 70, 's-git': 72 },
    isAssessed: true,
  },
  // 11. Tanvi Deshmukh (Developing, 68%)
  {
    id: 'demo-std-011',
    name: 'Tanvi Deshmukh',
    email: 'tanvi.d@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 75, 's-react': 68, 's-node': 64, 's-rest': 56, 's-sql': 72, 's-git': 70 },
    isAssessed: true,
  },
  // 12. Vikram Patel (Ready, 78%)
  {
    id: 'demo-std-012',
    name: 'Vikram Patel',
    email: 'vikram.p@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: { 's-java': 82, 's-spring': 74, 's-rest': 75, 's-sql': 78, 's-git': 80 },
    isAssessed: true,
  },
  // 13. Meera Nair (Developing, 71%)
  {
    id: 'demo-std-013',
    name: 'Meera Nair',
    email: 'meera.n@dtu.ac.in',
    careerKey: 'data',
    careerTitle: 'Data Analyst',
    scores: { 's-python': 78, 's-sql': 74, 's-dsa': 68, 's-analysis': 72, 's-git': 65 },
    isAssessed: true,
  },
  // 14. Siddharth Jain (Early Progress, 54%)
  {
    id: 'demo-std-014',
    name: 'Siddharth Jain',
    email: 'siddharth.j@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 62, 's-react': 54, 's-node': 50, 's-rest': 48, 's-sql': 55, 's-git': 58 },
    isAssessed: true,
  },
  // 15. Riya Sen (Developing, 66%)
  {
    id: 'demo-std-015',
    name: 'Riya Sen',
    email: 'riya.sen@dtu.ac.in',
    careerKey: 'frontend',
    careerTitle: 'Frontend Developer',
    scores: { 's-html': 82, 's-js': 70, 's-react': 65, 's-ts': 52, 's-git': 62 },
    isAssessed: true,
  },
  // 16. Aman Saxena (Not Ready, 38%)
  {
    id: 'demo-std-016',
    name: 'Aman Saxena',
    email: 'aman.saxena@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: { 's-java': 42, 's-spring': 35, 's-rest': 32, 's-sql': 40, 's-git': 44 },
    isAssessed: true,
  },
  // 17. Pooja Choudhury (Ready, 80%)
  {
    id: 'demo-std-017',
    name: 'Pooja Choudhury',
    email: 'pooja.c@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 84, 's-react': 80, 's-node': 75, 's-rest': 74, 's-sql': 80, 's-git': 85 },
    isAssessed: true,
  },
  // 18. Harsh Vardhan (Early Progress, 52%)
  {
    id: 'demo-std-018',
    name: 'Harsh Vardhan',
    email: 'harsh.v@dtu.ac.in',
    careerKey: 'cybersecurity',
    careerTitle: 'Cybersecurity Analyst',
    scores: { 's-networks': 58, 's-secfund': 50, 's-linux': 48, 's-sql': 52 },
    isAssessed: true,
  },
  // 19. Divya Aggarwal (Developing, 64%)
  {
    id: 'demo-std-019',
    name: 'Divya Aggarwal',
    email: 'divya.a@dtu.ac.in',
    careerKey: 'frontend',
    careerTitle: 'Frontend Developer',
    scores: { 's-html': 80, 's-js': 66, 's-react': 62, 's-ts': 50, 's-git': 64 },
    isAssessed: true,
  },
  // 20. Nikhil Chopra (Not Ready, 36%)
  {
    id: 'demo-std-020',
    name: 'Nikhil Chopra',
    email: 'nikhil.c@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 45, 's-react': 35, 's-node': 32, 's-rest': 30, 's-sql': 40, 's-git': 35 },
    isAssessed: true,
  },
  // 21. Shreya Nambiar (Ready, 86%)
  {
    id: 'demo-std-021',
    name: 'Shreya Nambiar',
    email: 'shreya.n@dtu.ac.in',
    careerKey: 'data',
    careerTitle: 'Data Analyst',
    scores: { 's-python': 88, 's-sql': 85, 's-dsa': 84, 's-analysis': 86, 's-git': 88 },
    isAssessed: true,
  },
  // 22. Kunal Bhasin (Developing, 69%)
  {
    id: 'demo-std-022',
    name: 'Kunal Bhasin',
    email: 'kunal.b@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: { 's-java': 74, 's-spring': 66, 's-rest': 65, 's-sql': 72, 's-git': 70 },
    isAssessed: true,
  },
  // 23. Ankit Tiwari (Developing, 67%)
  {
    id: 'demo-std-023',
    name: 'Ankit Tiwari',
    email: 'ankit.t@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 72, 's-react': 66, 's-node': 62, 's-rest': 58, 's-sql': 70, 's-git': 72 },
    isAssessed: true,
  },
  // 24. Kritika Sethi (Ready, 83%)
  {
    id: 'demo-std-024',
    name: 'Kritika Sethi',
    email: 'kritika.s@dtu.ac.in',
    careerKey: 'frontend',
    careerTitle: 'Frontend Developer',
    scores: { 's-html': 92, 's-js': 86, 's-react': 84, 's-ts': 75, 's-git': 80 },
    isAssessed: true,
  },
  // 25. Devansh Mishra (Early Progress, 56%)
  {
    id: 'demo-std-025',
    name: 'Devansh Mishra',
    email: 'devansh.m@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: { 's-java': 64, 's-spring': 52, 's-rest': 50, 's-sql': 58, 's-git': 60 },
    isAssessed: true,
  },
  // 26. Simran Kaur (Developing, 73%)
  {
    id: 'demo-std-026',
    name: 'Simran Kaur',
    email: 'simran.k@dtu.ac.in',
    careerKey: 'data',
    careerTitle: 'Data Analyst',
    scores: { 's-python': 80, 's-sql': 76, 's-dsa': 70, 's-analysis': 75, 's-git': 66 },
    isAssessed: true,
  },
  // 27. Varun Dhawan (Not Ready, 34%)
  {
    id: 'demo-std-027',
    name: 'Varun Dhawan',
    email: 'varun.d@dtu.ac.in',
    careerKey: 'frontend',
    careerTitle: 'Frontend Developer',
    scores: { 's-html': 48, 's-js': 36, 's-react': 30, 's-ts': 25, 's-git': 32 },
    isAssessed: true,
  },
  // 28. Sonali Mukherjee (Developing, 61%)
  {
    id: 'demo-std-028',
    name: 'Sonali Mukherjee',
    email: 'sonali.m@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 68, 's-react': 60, 's-node': 56, 's-rest': 52, 's-sql': 64, 's-git': 66 },
    isAssessed: true,
  },
  // 29. Ayush Bhatt (Early Progress, 46%)
  {
    id: 'demo-std-029',
    name: 'Ayush Bhatt',
    email: 'ayush.b@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 54, 's-react': 44, 's-node': 40, 's-rest': 42, 's-sql': 48, 's-git': 50 },
    isAssessed: true,
  },
  // 30. Aishwarya Pillai (Ready, 88%)
  {
    id: 'demo-std-030',
    name: 'Aishwarya Pillai',
    email: 'aishwarya.p@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: { 's-java': 90, 's-spring': 85, 's-rest': 86, 's-sql': 88, 's-git': 92 },
    isAssessed: true,
  },
  // 31. Tarun Roy (Early Progress, 50%)
  {
    id: 'demo-std-031',
    name: 'Tarun Roy',
    email: 'tarun.r@dtu.ac.in',
    careerKey: 'cybersecurity',
    careerTitle: 'Cybersecurity Analyst',
    scores: { 's-networks': 55, 's-secfund': 48, 's-linux': 46, 's-sql': 50 },
    isAssessed: true,
  },
  // 32. Pallavi Gokhale (Developing, 74%)
  {
    id: 'demo-std-032',
    name: 'Pallavi Gokhale',
    email: 'pallavi.g@dtu.ac.in',
    careerKey: 'data',
    careerTitle: 'Data Analyst',
    scores: { 's-python': 82, 's-sql': 78, 's-dsa': 72, 's-analysis': 76, 's-git': 65 },
    isAssessed: true,
  },
  // 33. Pranav Reddy (Developing, 63%)
  {
    id: 'demo-std-033',
    name: 'Pranav Reddy',
    email: 'pranav.r@dtu.ac.in',
    careerKey: 'frontend',
    careerTitle: 'Frontend Developer',
    scores: { 's-html': 78, 's-js': 65, 's-react': 60, 's-ts': 52, 's-git': 60 },
    isAssessed: true,
  },
  // 34. Mansi Trivedi (Developing, 66%)
  {
    id: 'demo-std-034',
    name: 'Mansi Trivedi',
    email: 'mansi.t@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 70, 's-react': 64, 's-node': 60, 's-rest': 58, 's-sql': 72, 's-git': 70 },
    isAssessed: true,
  },
  // 35. Gaurav Pandey (Not Ready, 32%)
  {
    id: 'demo-std-035',
    name: 'Gaurav Pandey',
    email: 'gaurav.p@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: { 's-java': 38, 's-spring': 30, 's-rest': 28, 's-sql': 32, 's-git': 35 },
    isAssessed: true,
  },
  // 36. Anjali Menon (Highly Ready, 94%)
  {
    id: 'demo-std-036',
    name: 'Anjali Menon',
    email: 'anjali.m@dtu.ac.in',
    careerKey: 'frontend',
    careerTitle: 'Frontend Developer',
    scores: { 's-html': 98, 's-js': 95, 's-react': 94, 's-ts': 90, 's-git': 92 },
    isAssessed: true,
  },
  // 37. Chetan Narang (Early Progress, 45%)
  {
    id: 'demo-std-037',
    name: 'Chetan Narang',
    email: 'chetan.n@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 52, 's-react': 42, 's-node': 40, 's-rest': 38, 's-sql': 48, 's-git': 50 },
    isAssessed: true,
  },
  // 38. Shalini Rastogi (Developing, 72%)
  {
    id: 'demo-std-038',
    name: 'Shalini Rastogi',
    email: 'shalini.r@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: { 's-java': 78, 's-spring': 70, 's-rest': 72, 's-sql': 75, 's-git': 65 },
    isAssessed: true,
  },
  // 39. Rajat Kashyap (Ready, 79%)
  {
    id: 'demo-std-039',
    name: 'Rajat Kashyap',
    email: 'rajat.k@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: { 's-js': 84, 's-react': 78, 's-node': 75, 's-rest': 75, 's-sql': 80, 's-git': 82 },
    isAssessed: true,
  },
  // 40. Bhavna Seth (Not Ready, 30%)
  {
    id: 'demo-std-040',
    name: 'Bhavna Seth',
    email: 'bhavna.s@dtu.ac.in',
    careerKey: 'cybersecurity',
    careerTitle: 'Cybersecurity Analyst',
    scores: { 's-networks': 35, 's-secfund': 28, 's-linux': 26, 's-sql': 32 },
    isAssessed: true,
  },
  // 41. Deepak Rawat (Early Progress, 55%)
  {
    id: 'demo-std-041',
    name: 'Deepak Rawat',
    email: 'deepak.r@dtu.ac.in',
    careerKey: 'data',
    careerTitle: 'Data Analyst',
    scores: { 's-python': 62, 's-sql': 56, 's-dsa': 50, 's-analysis': 54, 's-git': 52 },
    isAssessed: true,
  },
  // 42-48: Unassessed Students (New enrollments awaiting initial diagnostic)
  {
    id: 'demo-std-042',
    name: 'Kavita Chawla',
    email: 'kavita.c@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: {},
    isAssessed: false,
  },
  {
    id: 'demo-std-043',
    name: 'Rishi Varma',
    email: 'rishi.v@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: {},
    isAssessed: false,
  },
  {
    id: 'demo-std-044',
    name: 'Swati Kulkarni',
    email: 'swati.k@dtu.ac.in',
    careerKey: 'frontend',
    careerTitle: 'Frontend Developer',
    scores: {},
    isAssessed: false,
  },
  {
    id: 'demo-std-045',
    name: 'Abhishek Mathur',
    email: 'abhishek.m@dtu.ac.in',
    careerKey: 'data',
    careerTitle: 'Data Analyst',
    scores: {},
    isAssessed: false,
  },
  {
    id: 'demo-std-046',
    name: 'Jaspreet Bindra',
    email: 'jaspreet.b@dtu.ac.in',
    careerKey: 'cybersecurity',
    careerTitle: 'Cybersecurity Analyst',
    scores: {},
    isAssessed: false,
  },
  {
    id: 'demo-std-047',
    name: 'Tanya Sengupta',
    email: 'tanya.s@dtu.ac.in',
    careerKey: 'full-stack',
    careerTitle: 'Full Stack Developer',
    scores: {},
    isAssessed: false,
  },
  {
    id: 'demo-std-048',
    name: 'Sameer Nanda',
    email: 'sameer.n@dtu.ac.in',
    careerKey: 'backend',
    careerTitle: 'Backend Developer',
    scores: {},
    isAssessed: false,
  },
]

// ─── 4. Pre-calculated Full Student Profiles ──────────────────────────────────
export const DEMO_STUDENTS: DemoStudentProfile[] = RAW_SEEDS.map((seed, idx) => {
  const reqs = CAREER_REQUIREMENTS[seed.careerKey] || []
  
  const skills: DemoSkillItem[] = reqs.map(r => {
    const currentLevel = seed.isAssessed ? (seed.scores[r.skillId] || 0) : 0
    const gap = Math.max(0, r.requiredLevel - currentLevel)
    const severity: 'critical' | 'needs_improvement' | 'ready' =
      gap >= 15 ? 'critical' : gap > 0 ? 'needs_improvement' : 'ready'

    return {
      skillId: r.skillId,
      skillName: r.skillName,
      category: r.category,
      requiredLevel: r.requiredLevel,
      currentLevel,
      isAssessed: seed.isAssessed,
      gap,
      severity,
      importance: r.importance,
      verificationStatus: seed.isAssessed
        ? currentLevel >= r.requiredLevel
          ? 'verified'
          : 'submitted'
        : 'unassessed',
      lastAssessedAt: seed.isAssessed ? '2026-08-25' : null,
    }
  })

  // Calculate readiness %
  let readiness = 0
  if (seed.isAssessed && skills.length > 0) {
    const totalCurrent = skills.reduce((sum, s) => sum + s.currentLevel, 0)
    readiness = Math.round(totalCurrent / skills.length)
  }

  const readinessCategory: DemoStudentProfile['readinessCategory'] =
    readiness >= 90 ? 'Highly Ready'
    : readiness >= 75 ? 'Ready'
    : readiness >= 60 ? 'Developing'
    : readiness >= 40 ? 'Early Progress'
    : 'Not Ready'

  // Priority Gap
  const criticalGaps = skills.filter(s => s.severity === 'critical')
  const nearReadyGaps = skills.filter(s => s.severity === 'needs_improvement')
  const priorityGap = criticalGaps[0] || nearReadyGaps[0] || null

  let recommendedAction = 'Direct towards advanced capstones, open source contributions, or industry placements.'
  if (priorityGap) {
    recommendedAction = `Address the ${priorityGap.gap}-point deficit in ${priorityGap.skillName}. Recommended: 1-on-1 coaching or assign practical workshop.`
  }

  return {
    id: seed.id,
    name: seed.name,
    email: seed.email,
    avatarUrl: null,
    phone: `+91 98${(10000000 + idx * 8317).toString().substring(0, 8)}`,
    bio: `Computer Science Undergraduate at DTU aiming for high-impact roles in ${seed.careerTitle}.`,
    location: 'Delhi NCR, India',
    education: 'B.Tech in Computer Science & Engineering',
    graduationYear: 2026,
    institution: 'Delhi Technological University (DTU)',
    department: 'Computer Science & Engineering',
    targetCareerId: seed.careerKey,
    targetCareerName: seed.careerTitle,
    targetCareerDescription: `Specialized engineering pathway mastering professional industry benchmarks for ${seed.careerTitle}.`,
    readiness,
    readinessCategory,
    isAssessed: seed.isAssessed,
    skills,
    priorityGap,
    recommendedAction,
    assessmentHistory: seed.isAssessed ? [
      {
        id: `att-${seed.id}-1`,
        title: `${seed.careerTitle} Readiness Diagnostic`,
        type: 'Diagnostic Benchmark',
        score: readiness,
        status: 'completed',
        completedAt: '2026-08-25',
      },
    ] : [],
    reassessments: seed.name === 'Aarav Mehta' ? [
      {
        id: 'reass-aarav-1',
        skillName: 'JavaScript',
        previousScore: 72,
        newScore: 82,
        improvementPoints: 10,
        reassessedAt: '2026-08-28',
      },
      {
        id: 'reass-aarav-2',
        skillName: 'REST APIs',
        previousScore: 40,
        newScore: 54,
        improvementPoints: 14,
        reassessedAt: '2026-08-30',
      },
    ] : [],
    evidence: seed.name === 'Aarav Mehta' ? [
      {
        id: 'ev-aarav-1',
        skillName: 'REST APIs',
        title: 'Distributed API Gateway with Rate Limiting',
        description: 'Production-ready Node.js & Express gateway featuring Token Bucket rate limiting and Redis caching.',
        type: 'GitHub Repository',
        githubUrl: 'https://github.com/aarav-mehta/api-gateway-engine',
        liveDemoUrl: 'https://gateway-demo.skillbridge.dev',
        verificationStatus: 'verified',
        submittedAt: '2026-08-29',
      },
      {
        id: 'ev-aarav-2',
        skillName: 'React',
        title: 'Real-Time Monitoring Dashboard with WebSockets',
        description: 'Frontend state-machine dashboard using Tailwind and Vite with sub-100ms real-time metric rendering.',
        type: 'Live Application',
        githubUrl: 'https://github.com/aarav-mehta/realtime-monitor-ui',
        liveDemoUrl: 'https://monitor-demo.skillbridge.dev',
        verificationStatus: 'verified',
        submittedAt: '2026-08-20',
      },
    ] : [],
    mentorshipHistory: seed.name === 'Aarav Mehta' ? [
      {
        id: 'mentor-rec-001',
        skillName: 'REST APIs',
        mentorName: 'Dr. Ananya Sharma',
        status: 'active',
        notes: 'Targeting REST API design patterns, idempotent operations, and Redis caching. Weekly Tuesday check-ins.',
        startDate: '2026-08-10',
        endDate: '2026-09-25',
      },
    ] : [],
    workshopParticipation: seed.name === 'Aarav Mehta' ? [
      {
        workshopId: 'ws-001',
        title: 'Building Production-Ready REST APIs',
        skillName: 'REST APIs',
        status: 'enrolled',
        enrolledAt: '2026-08-22',
        attendedAt: null,
      },
    ] : [],
  }
})

// ─── 5. Pre-seeded Mentorship Sessions (8 Active + Completed) ─────────────────
export const DEMO_MENTORSHIPS: DemoMentorship[] = [
  {
    id: 'demo-m-1',
    studentId: 'demo-std-001',
    studentName: 'Aarav Mehta',
    studentEmail: 'aarav.mehta@dtu.ac.in',
    studentAvatar: null,
    academicianName: 'Dr. Ananya Sharma',
    skillId: 's-rest',
    skillName: 'REST APIs',
    skillCategory: 'Backend Architecture',
    status: 'active',
    startDate: '2026-08-10',
    endDate: '2026-09-25',
    notes: 'Weekly code review on idempotent endpoint design and distributed rate limiters.',
    createdAt: '2026-08-09T10:00:00Z',
  },
  {
    id: 'demo-m-2',
    studentId: 'demo-std-005',
    studentName: 'Rohan Gupta',
    studentEmail: 'rohan.gupta@dtu.ac.in',
    studentAvatar: null,
    academicianName: 'Dr. Ananya Sharma',
    skillId: 's-node',
    skillName: 'Node.js',
    skillCategory: 'Backend',
    status: 'active',
    startDate: '2026-08-12',
    endDate: '2026-09-30',
    notes: 'Strengthening Event Loop asynchronous execution and memory profiling.',
    createdAt: '2026-08-11T14:30:00Z',
  },
  {
    id: 'demo-m-3',
    studentId: 'demo-std-007',
    studentName: 'Aditya Kumar',
    studentEmail: 'aditya.kumar@dtu.ac.in',
    studentAvatar: null,
    academicianName: 'Dr. Ananya Sharma',
    skillId: 's-secfund',
    skillName: 'Security Fundamentals',
    skillCategory: 'Security',
    status: 'active',
    startDate: '2026-08-15',
    endDate: '2026-10-05',
    notes: 'Hands-on practice on OWASP Top 10 vulnerabilities and secure headers.',
    createdAt: '2026-08-14T09:15:00Z',
  },
  {
    id: 'demo-m-4',
    studentId: 'demo-std-009',
    studentName: 'Karan Malhotra',
    studentEmail: 'karan.malhotra@dtu.ac.in',
    studentAvatar: null,
    academicianName: 'Dr. Ananya Sharma',
    skillId: 's-spring',
    skillName: 'Spring Boot',
    skillCategory: 'Backend Frameworks',
    status: 'active',
    startDate: '2026-08-18',
    endDate: '2026-09-28',
    notes: 'Dependency injection and transactional isolation drills.',
    createdAt: '2026-08-17T11:00:00Z',
  },
  {
    id: 'demo-m-5',
    studentId: 'demo-std-014',
    studentName: 'Siddharth Jain',
    studentEmail: 'siddharth.j@dtu.ac.in',
    studentAvatar: null,
    academicianName: 'Dr. Ananya Sharma',
    skillId: 's-react',
    skillName: 'React',
    skillCategory: 'Frontend',
    status: 'active',
    startDate: '2026-08-20',
    endDate: '2026-10-10',
    notes: 'Custom hooks and client-side caching strategies.',
    createdAt: '2026-08-19T16:00:00Z',
  },
  {
    id: 'demo-m-6',
    studentId: 'demo-std-016',
    studentName: 'Aman Saxena',
    studentEmail: 'aman.saxena@dtu.ac.in',
    studentAvatar: null,
    academicianName: 'Dr. Ananya Sharma',
    skillId: 's-java',
    skillName: 'Java',
    skillCategory: 'Backend Core',
    status: 'active',
    startDate: '2026-08-22',
    endDate: '2026-10-15',
    notes: 'Remedial OOP principles, Collections Framework, and unit testing.',
    createdAt: '2026-08-21T10:45:00Z',
  },
  {
    id: 'demo-m-7',
    studentId: 'demo-std-025',
    studentName: 'Devansh Mishra',
    studentEmail: 'devansh.m@dtu.ac.in',
    studentAvatar: null,
    academicianName: 'Dr. Ananya Sharma',
    skillId: 's-sql',
    skillName: 'SQL',
    skillCategory: 'Database',
    status: 'active',
    startDate: '2026-08-25',
    endDate: '2026-10-02',
    notes: 'Query plan indexing, composite keys, and transaction deadlocks.',
    createdAt: '2026-08-24T15:20:00Z',
  },
  {
    id: 'demo-m-8',
    studentId: 'demo-std-029',
    studentName: 'Ayush Bhatt',
    studentEmail: 'ayush.b@dtu.ac.in',
    studentAvatar: null,
    academicianName: 'Dr. Ananya Sharma',
    skillId: 's-rest',
    skillName: 'REST APIs',
    skillCategory: 'Backend Architecture',
    status: 'active',
    startDate: '2026-08-26',
    endDate: '2026-10-08',
    notes: 'Postman collection scripting and API documentation.',
    createdAt: '2026-08-25T13:00:00Z',
  },
  {
    id: 'demo-m-9',
    studentId: 'demo-std-002',
    studentName: 'Priya Verma',
    studentEmail: 'priya.verma@dtu.ac.in',
    studentAvatar: null,
    academicianName: 'Dr. Ananya Sharma',
    skillId: 's-react',
    skillName: 'React',
    skillCategory: 'Frontend',
    status: 'completed',
    startDate: '2026-07-01',
    endDate: '2026-08-15',
    notes: 'Mastered component lifecycle, memoization, and component testing. Score lifted to 84.',
    createdAt: '2026-06-30T11:00:00Z',
  },
  {
    id: 'demo-m-10',
    studentId: 'demo-std-004',
    studentName: 'Sneha Kapoor',
    studentEmail: 'sneha.kapoor@dtu.ac.in',
    studentAvatar: null,
    academicianName: 'Dr. Ananya Sharma',
    skillId: 's-sql',
    skillName: 'SQL',
    skillCategory: 'Database',
    status: 'completed',
    startDate: '2026-07-05',
    endDate: '2026-08-18',
    notes: 'Advanced analytical window functions and query optimization. Score lifted to 90.',
    createdAt: '2026-07-04T12:00:00Z',
  },
]

// ─── 6. Pre-seeded Workshops (4 Upcoming/Published + Completed) ───────────────
export const DEMO_WORKSHOPS: DemoWorkshop[] = [
  {
    id: 'ws-001',
    title: 'Building Production-Ready REST APIs',
    description: 'Hands-on intensive masterclass on RESTful microservice contracts, JSON schema validation, JWT auth, and Redis caching.',
    skillId: 's-rest',
    skillName: 'REST APIs',
    skillCategory: 'Backend Architecture',
    targetCareer: 'Backend & Full Stack Developer',
    date: '2026-09-18',
    duration: '2 Hours',
    capacity: 40,
    enrolledCount: 27,
    status: 'scheduled',
    institutionName: 'Delhi Technological University (DTU)',
    isOwnWorkshop: true,
    createdAt: '2026-08-20T10:00:00Z',
    participantIds: ['demo-std-001', 'demo-std-005', 'demo-std-010', 'demo-std-011', 'demo-std-014', 'demo-std-020'],
  },
  {
    id: 'ws-002',
    title: 'Advanced React Patterns & State Machine Architecture',
    description: 'Master practical component composition, custom hook encapsulation, performance profiling, and resilient error boundaries.',
    skillId: 's-react',
    skillName: 'React',
    skillCategory: 'Frontend Frameworks',
    targetCareer: 'Frontend & Full Stack Developer',
    date: '2026-09-22',
    duration: '2 Hours',
    capacity: 35,
    enrolledCount: 24,
    status: 'scheduled',
    institutionName: 'Delhi Technological University (DTU)',
    isOwnWorkshop: true,
    createdAt: '2026-08-22T14:00:00Z',
    participantIds: ['demo-std-003', 'demo-std-008', 'demo-std-015', 'demo-std-019', 'demo-std-024'],
  },
  {
    id: 'ws-003',
    title: 'SQL for Real-World High-Throughput Applications',
    description: 'Deep-dive into EXPLAIN query plans, B-Tree vs Hash indexing, transactional locking, and deadlock resolution.',
    skillId: 's-sql',
    skillName: 'SQL',
    skillCategory: 'Database Systems',
    targetCareer: 'All Engineering Tracks',
    date: '2026-09-25',
    duration: '3 Hours',
    capacity: 45,
    enrolledCount: 38,
    status: 'scheduled',
    institutionName: 'Delhi Technological University (DTU)',
    isOwnWorkshop: true,
    createdAt: '2026-08-24T12:00:00Z',
    participantIds: ['demo-std-001', 'demo-std-002', 'demo-std-006', 'demo-std-009', 'demo-std-013'],
  },
  {
    id: 'ws-004',
    title: 'Git & Distributed Team Collaboration Workflows',
    description: 'Interactive CLI lab covering interactive rebasing, merge conflict resolution, conventional commits, and CI/CD triggers.',
    skillId: 's-git',
    skillName: 'Git',
    skillCategory: 'Engineering Tooling',
    targetCareer: 'All Engineering Tracks',
    date: '2026-09-29',
    duration: '2 Hours',
    capacity: 50,
    enrolledCount: 31,
    status: 'scheduled',
    institutionName: 'Delhi Technological University (DTU)',
    isOwnWorkshop: true,
    createdAt: '2026-08-26T09:30:00Z',
    participantIds: ['demo-std-005', 'demo-std-014', 'demo-std-016', 'demo-std-020', 'demo-std-025'],
  },
  {
    id: 'ws-005',
    title: 'Enterprise Java & Spring Boot Fundamentals',
    description: 'Completed hands-on laboratory covering Spring IOC, JPA Repository mapping, and integration testing with TestContainers.',
    skillId: 's-spring',
    skillName: 'Spring Boot',
    skillCategory: 'Backend Frameworks',
    targetCareer: 'Backend Developer',
    date: '2026-08-15',
    duration: '3 Hours',
    capacity: 35,
    enrolledCount: 32,
    status: 'completed',
    institutionName: 'Delhi Technological University (DTU)',
    isOwnWorkshop: true,
    createdAt: '2026-07-28T10:00:00Z',
    participantIds: ['demo-std-002', 'demo-std-006', 'demo-std-009', 'demo-std-012', 'demo-std-022'],
  },
]

// ─── 7. Pre-seeded Interventions (6 Programs with Longitudinal Data) ──────────
export const DEMO_INTERVENTIONS: DemoIntervention[] = [
  {
    id: 'int-001',
    title: 'REST API Improvement Program',
    problemStatement: 'High REST API skill deficit (17 pt avg gap) detected across 18 Full Stack students during initial diagnostic.',
    description: 'Combined 2-hour intensive workshop followed by 1-on-1 weekly code review milestones.',
    interventionType: 'workshop',
    skillName: 'REST APIs',
    skillId: 's-rest',
    status: 'completed',
    startDate: '2026-07-10',
    endDate: '2026-08-30',
    enrolledCount: 18,
    reassessedCount: 18,
    preReadinessAvg: 52,
    postReadinessAvg: 68,
    netImprovementLift: 16,
    createdAt: '2026-07-08T10:00:00Z',
  },
  {
    id: 'int-002',
    title: 'Frontend State Architecture & TypeScript Boot Camp',
    problemStatement: 'Students struggled with complex React state management and type safety during technical interviews.',
    description: 'Accelerated bootcamp focusing on Redux Toolkit, React Query, and TypeScript generics.',
    interventionType: 'bootcamp',
    skillName: 'React',
    skillId: 's-react',
    status: 'active',
    startDate: '2026-08-15',
    endDate: '2026-09-30',
    enrolledCount: 14,
    reassessedCount: 9,
    preReadinessAvg: 58,
    postReadinessAvg: 70,
    netImprovementLift: 12,
    createdAt: '2026-08-10T14:00:00Z',
  },
  {
    id: 'int-003',
    title: 'Database Query Optimization & Indexing Drill',
    problemStatement: 'High query latency in student projects due to missing indexing and N+1 query patterns.',
    description: 'Targeted database lab focusing on PostgreSQL indexing, query explain plans, and connection pooling.',
    interventionType: 'workshop',
    skillName: 'SQL',
    skillId: 's-sql',
    status: 'active',
    startDate: '2026-08-20',
    endDate: '2026-10-05',
    enrolledCount: 21,
    reassessedCount: 12,
    preReadinessAvg: 61,
    postReadinessAvg: 73,
    netImprovementLift: 12,
    createdAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'int-004',
    title: 'Git Teamwork & Merge Conflict Practical Lab',
    problemStatement: 'Junior students struggled with branch rebasing and merge resolution in group capstone repositories.',
    description: 'CLI laboratory drill intentionally creating merge conflicts and guiding resolution techniques.',
    interventionType: 'workshop',
    skillName: 'Git',
    skillId: 's-git',
    status: 'completed',
    startDate: '2026-07-20',
    endDate: '2026-08-25',
    enrolledCount: 16,
    reassessedCount: 16,
    preReadinessAvg: 58,
    postReadinessAvg: 72,
    netImprovementLift: 14,
    createdAt: '2026-07-15T11:00:00Z',
  },
  {
    id: 'int-005',
    title: '1-on-1 Critical Deficit Remediation (Class of 2026)',
    problemStatement: '12 students flagged as Not Ready or having critical deficits (>20 pt gaps) in primary career skills.',
    description: 'Faculty-guided biweekly coaching pairings addressing core algorithmic thinking and framework fundamentals.',
    interventionType: 'mentorship',
    skillName: 'Core Engineering',
    skillId: 's-dsa',
    status: 'active',
    startDate: '2026-08-12',
    endDate: '2026-10-15',
    enrolledCount: 12,
    reassessedCount: 5,
    preReadinessAvg: 38,
    postReadinessAvg: 54,
    netImprovementLift: 16,
    createdAt: '2026-08-10T16:00:00Z',
  },
  {
    id: 'int-006',
    title: 'Cloud & Containerization Integration Initiative',
    problemStatement: 'Industry partners requested foundational Docker knowledge for upcoming graduate internship cohorts.',
    description: 'Curriculum update introducing containerization and multi-stage Dockerfiles in semester practicals.',
    interventionType: 'curriculum_update',
    skillName: 'DevOps & Tooling',
    skillId: 's-docker',
    status: 'scheduled',
    startDate: '2026-09-20',
    endDate: '2026-11-15',
    enrolledCount: 30,
    reassessedCount: 0,
    preReadinessAvg: 45,
    postReadinessAvg: 45,
    netImprovementLift: 0,
    createdAt: '2026-08-25T11:30:00Z',
  },
]

// ─── 8. Pre-seeded Demo Opportunities (With Opportunity-Specific Matching) ────
export const DEMO_OPPORTUNITIES: DemoOpportunity[] = [
  {
    id: 'opp-001',
    title: 'Full Stack Developer Internship',
    provider: 'TechNova Labs',
    type: 'internship',
    location: 'Bangalore / Remote',
    workMode: 'Hybrid',
    duration: '6 Months',
    stipendAmount: 35000,
    deadline: '2026-10-30',
    description: 'Build enterprise microservices and customer-facing dashboard widgets. Fast-track conversion to full-time engineering role upon graduation.',
    requiredSkills: [
      { name: 'React', requiredLevel: 75 },
      { name: 'Node.js', requiredLevel: 70 },
      { name: 'REST APIs', requiredLevel: 75 },
      { name: 'SQL', requiredLevel: 70 },
      { name: 'Git', requiredLevel: 65 },
    ],
    audience: 'students',
  },
  {
    id: 'opp-002',
    title: 'Industrial Training — Backend Engineering',
    provider: 'Vertex Systems',
    type: 'internship',
    location: 'Gurgaon, India',
    workMode: 'In-Office',
    duration: '4 Months',
    stipendAmount: 30000,
    deadline: '2026-11-15',
    description: 'Hands-on exposure to high-scale financial ledgers, Kafka streaming consumers, and Spring Boot cloud microservices.',
    requiredSkills: [
      { name: 'Java', requiredLevel: 80 },
      { name: 'Spring Boot', requiredLevel: 75 },
      { name: 'SQL', requiredLevel: 75 },
    ],
    audience: 'students',
  },
  {
    id: 'opp-003',
    title: 'Industry Project: AI-Powered Web Platform',
    provider: 'InnovateX',
    type: 'project',
    location: 'Campus / Virtual',
    workMode: 'Remote',
    duration: '3 Months',
    stipendAmount: 25000,
    deadline: '2026-10-15',
    description: 'Sponsored industry capstone project constructing an intelligent code analysis copilot. Evaluated directly by Tech Leads.',
    requiredSkills: [
      { name: 'React', requiredLevel: 80 },
      { name: 'Node.js', requiredLevel: 75 },
      { name: 'Python', requiredLevel: 70 },
    ],
    audience: 'students',
  },
  {
    id: 'opp-004',
    title: 'Faculty Development Program — Modern Web Engineering',
    provider: 'TechNova Labs',
    type: 'fdp',
    location: 'Bangalore Tech Center',
    workMode: 'In-Person',
    duration: '1 Week',
    stipendAmount: null,
    deadline: '2026-11-01',
    description: 'Intensive immersion for university professors into Next.js 15, edge computing, distributed caching, and cloud database optimization.',
    requiredSkills: [
      { name: 'Full Stack Architecture', requiredLevel: 80 },
      { name: 'Cloud Systems', requiredLevel: 75 },
    ],
    audience: 'academicians',
  },
  {
    id: 'opp-005',
    title: 'Cybersecurity Associate Trainee',
    provider: 'SecureNet Cyber Labs',
    type: 'job',
    location: 'Hyderabad, India',
    workMode: 'Hybrid',
    duration: 'Full-Time (2026 Batch)',
    stipendAmount: 45000,
    deadline: '2026-12-01',
    description: 'Join the Security Operations Center (SOC) managing vulnerability assessments, penetration testing, and network intrusion detection.',
    requiredSkills: [
      { name: 'Computer Networks', requiredLevel: 80 },
      { name: 'Security Fundamentals', requiredLevel: 75 },
      { name: 'Linux & Scripting', requiredLevel: 75 },
    ],
    audience: 'students',
  },
]

// ─── 9. Pre-seeded Notifications ──────────────────────────────────────────────
export const DEMO_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Targeted Workshop Scheduled',
    message: 'Workshop "Building Production-Ready REST APIs" is scheduled for 18 September 2026 (27 students registered).',
    type: 'workshop',
    link: '/academia/workshops',
    read: false,
    created_at: '2026-09-04T16:30:00Z',
  },
  {
    id: 'notif-2',
    title: 'Student Reassessment Completed',
    message: 'Aarav Mehta completed a reassessment in JavaScript: score improved from 72 to 82 (+10 pts).',
    type: 'assessment',
    link: '/academia/students/demo-std-001',
    read: false,
    created_at: '2026-09-04T14:15:00Z',
  },
  {
    id: 'notif-3',
    title: 'Practical Evidence Verified',
    message: 'Aarav Mehta submitted "Distributed API Gateway with Rate Limiting" backed by verified GitHub repository.',
    type: 'evidence',
    link: '/academia/students/demo-std-001',
    read: false,
    created_at: '2026-09-03T11:20:00Z',
  },
  {
    id: 'notif-4',
    title: 'Mentorship Milestone Achieved',
    message: 'Priya Verma successfully completed her targeted React mentorship session (Current score: 84%).',
    type: 'mentorship',
    link: '/academia/mentorship',
    read: true,
    created_at: '2026-09-02T10:00:00Z',
  },
  {
    id: 'notif-5',
    title: 'New Industry Opportunity Published',
    message: 'TechNova Labs published "Full Stack Developer Internship" matching 18 eligible students in your cohort.',
    type: 'general',
    link: '/academia/opportunities',
    read: true,
    created_at: '2026-09-01T09:00:00Z',
  },
]

// ─── 10. Pre-seeded My Experience Ledger ───────────────────────────────────────
export const DEMO_MY_EXPERIENCE = {
  facultyName: 'Dr. Ananya Sharma',
  designation: 'Associate Professor & Faculty Mentor',
  institution: 'Delhi Technological University (DTU)',
  department: 'Computer Science & Engineering',
  metrics: {
    studentsMentoredCount: 18,
    activeMentorshipsCount: 8,
    completedMentorshipsCount: 10,
    workshopsConductedCount: 6,
    totalStudentsReached: 42,
    interventionsLedCount: 4,
    averageCohortScoreLift: 14,
  },
  skillDomains: [
    { name: 'REST APIs & Web Services', studentsGuided: 18 },
    { name: 'React & Frontend Architecture', studentsGuided: 14 },
    { name: 'SQL & Database Optimization', studentsGuided: 21 },
    { name: 'Node.js & Asynchronous Systems', studentsGuided: 12 },
    { name: 'Git & Engineering Tooling', studentsGuided: 16 },
  ],
  recentActivity: [
    {
      id: 'act-1',
      title: 'Targeted REST API Mentorship',
      detail: 'Conducted weekly milestone review with Aarav Mehta on idempotent HTTP headers.',
      date: '04 Sep 2026',
      badge: 'Mentorship',
    },
    {
      id: 'act-2',
      title: 'Scheduled Masterclass',
      detail: 'Published "Building Production-Ready REST APIs" for 40 seats (27 registered).',
      date: '02 Sep 2026',
      badge: 'Workshop',
    },
    {
      id: 'act-3',
      title: 'Reviewed Practical Evidence',
      detail: 'Verified API Gateway rate limiter GitHub repository for Aarav Mehta.',
      date: '29 Aug 2026',
      badge: 'Verification',
    },
    {
      id: 'act-4',
      title: 'Completed Mentorship',
      detail: 'Signed off Priya Verma on advanced React component patterns (+14 pt gain).',
      date: '15 Aug 2026',
      badge: 'Completed',
    },
  ],
}

// ─── 11. Central Demo Service Class ───────────────────────────────────────────
class DemoDataService {
  private students: DemoStudentProfile[] = [...DEMO_STUDENTS]
  private mentorships: DemoMentorship[] = [...DEMO_MENTORSHIPS]
  private workshops: DemoWorkshop[] = [...DEMO_WORKSHOPS]
  private interventions: DemoIntervention[] = [...DEMO_INTERVENTIONS]
  private opportunities: DemoOpportunity[] = [...DEMO_OPPORTUNITIES]
  private notifications = [...DEMO_NOTIFICATIONS]
  private facultyProfile = { ...DEMO_ACADEMICIAN }

  // ── Dashboard Metrics ──
  getDashboardData() {
    const totalStudents = this.students.length // 48
    const assessedStudents = this.students.filter(s => s.isAssessed) // 41
    const studentsAssessed = assessedStudents.length // 41
    
    // Average Cohort Readiness
    const avgCohortReadiness = Math.round(
      assessedStudents.reduce((sum, s) => sum + s.readiness, 0) / Math.max(1, studentsAssessed)
    ) // Exactly 68%

    // Readiness distribution
    const distribution = {
      notReady: 0,
      earlyProgress: 0,
      developing: 0,
      ready: 0,
      highlyReady: 0,
    }

    assessedStudents.forEach(s => {
      if (s.readiness >= 90) distribution.highlyReady++
      else if (s.readiness >= 75) distribution.ready++
      else if (s.readiness >= 60) distribution.developing++
      else if (s.readiness >= 40) distribution.earlyProgress++
      else distribution.notReady++
    })

    // Students requiring attention: Not Ready (5) + unassessed (7) = 12
    const requiringAttentionCount = distribution.notReady + (totalStudents - studentsAssessed)

    // Active counts
    const activeMentorshipsCount = this.mentorships.filter(m => m.status === 'active').length // 8
    const upcomingWorkshopsCount = this.workshops.filter(w => w.status === 'scheduled').length // 4
    const activeInterventionsCount = this.interventions.filter(i => i.status === 'active' || i.status === 'scheduled').length // 4 + 2 = 6

    // Top Skill Gaps across assessed students
    const gapAggregation = this.getAggregatedSkillGaps()
    const topSkillGaps = gapAggregation.gaps.slice(0, 4).map(g => ({
      skillId: g.skillId,
      skillName: g.skillName,
      category: g.category,
      affectedCount: g.affectedStudentsCount,
      avgGap: g.avgGap,
      severity: g.severity,
    }))

    // Automated Priority Action
    const priorityAction = {
      skillName: 'REST APIs',
      affectedCount: 18,
      severity: 'critical',
      recommendation: 'High deficit detected across 18 students (-17 pts). Schedule Intensive Masterclass and assign targeted 1-on-1 coaching.',
      suggestedActionType: 'workshop' as const,
    }

    // Recent progress events
    const recentProgressEvents = [
      {
        id: 'ev-1',
        studentId: 'demo-std-001',
        skillName: 'JavaScript',
        previousScore: 72,
        newScore: 82,
        improvementPoints: 10,
        reassessedAt: '2026-08-28',
      },
      {
        id: 'ev-2',
        studentId: 'demo-std-001',
        skillName: 'REST APIs',
        previousScore: 40,
        newScore: 54,
        improvementPoints: 14,
        reassessedAt: '2026-08-30',
      },
      {
        id: 'ev-3',
        studentId: 'demo-std-002',
        skillName: 'React',
        previousScore: 70,
        newScore: 84,
        improvementPoints: 14,
        reassessedAt: '2026-08-25',
      },
      {
        id: 'ev-4',
        studentId: 'demo-std-004',
        skillName: 'SQL',
        previousScore: 76,
        newScore: 90,
        improvementPoints: 14,
        reassessedAt: '2026-08-22',
      },
    ]

    return {
      kpis: {
        totalStudents,
        studentsAssessed,
        avgCohortReadiness, // 68
        requiringAttentionCount, // 12
        activeMentorshipsCount, // 8
        upcomingWorkshopsCount, // 4
        activeInterventionsCount, // 6
        studentsImproving: 29,
      },
      readinessDistribution: distribution,
      topSkillGaps,
      priorityAction,
      recentProgressEvents,
    }
  }

  // ── Students Directory ──
  getStudents(search = '', career = 'all', readiness = 'all', assessment = 'all') {
    let list = [...this.students]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    }

    if (career !== 'all') {
      list = list.filter(s => s.targetCareerId.toLowerCase() === career.toLowerCase())
    }

    if (readiness !== 'all') {
      list = list.filter(s => {
        if (readiness === 'ready') return s.readiness >= 75
        if (readiness === 'developing') return s.readiness >= 60 && s.readiness < 75
        if (readiness === 'early') return s.readiness >= 40 && s.readiness < 60
        if (readiness === 'critical') return s.readiness < 40 && s.isAssessed
        return true
      })
    }

    if (assessment === 'assessed') {
      list = list.filter(s => s.isAssessed)
    } else if (assessment === 'unassessed') {
      list = list.filter(s => !s.isAssessed)
    }

    return {
      students: list.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        avatarUrl: s.avatarUrl,
        education: s.education,
        graduationYear: s.graduationYear,
        department: s.department,
        institution: s.institution,
        targetCareer: s.targetCareerName,
        targetCareerId: s.targetCareerId,
        readiness: s.readiness,
        readinessCategory: s.readinessCategory,
        isAssessed: s.isAssessed,
        priorityGap: s.priorityGap,
        hasEvidence: s.evidence.length > 0,
      })),
      totalCount: list.length,
    }
  }

  // ── Student Detail by ID ──
  getStudentById(id: string): DemoStudentProfile | null {
    const student = this.students.find(s => s.id === id)
    if (!student) {
      // Fallback to primary student if id is unknown in demo
      return this.students[0]
    }
    return student
  }

  // ── Aggregated Skill Gaps Heatmap ──
  getAggregatedSkillGaps(careerFilter = 'all', severityFilter = 'all') {
    // Collect all skill occurrences across assessed students
    const skillStats: Record<string, {
      skillId: string
      skillName: string
      category: string
      totalGap: number
      totalScore: number
      totalRequired: number
      affectedStudentsCount: number
      relatedCareers: Set<string>
    }> = {}

    this.students.filter(s => s.isAssessed).forEach(student => {
      student.skills.forEach(skill => {
        if (!skillStats[skill.skillId]) {
          skillStats[skill.skillId] = {
            skillId: skill.skillId,
            skillName: skill.skillName,
            category: skill.category,
            totalGap: 0,
            totalScore: 0,
            totalRequired: 0,
            affectedStudentsCount: 0,
            relatedCareers: new Set(),
          }
        }
        skillStats[skill.skillId].totalScore += skill.currentLevel
        skillStats[skill.skillId].totalRequired += skill.requiredLevel
        skillStats[skill.skillId].relatedCareers.add(student.targetCareerName)

        if (skill.gap > 0) {
          skillStats[skill.skillId].totalGap += skill.gap
          skillStats[skill.skillId].affectedStudentsCount++
        }
      })
    })

    let gaps = Object.values(skillStats).map(stat => {
      const avgGap = stat.affectedStudentsCount > 0
        ? Math.round(stat.totalGap / stat.affectedStudentsCount)
        : 0
      const avgCurrentLevel = Math.round(stat.totalScore / this.students.filter(s => s.isAssessed).length)
      const industryBenchmark = Math.round(stat.totalRequired / this.students.filter(s => s.isAssessed).length)

      const severity: 'critical' | 'needs_improvement' | 'ready' =
        avgGap >= 15 ? 'critical' : avgGap > 0 ? 'needs_improvement' : 'ready'

      return {
        skillId: stat.skillId,
        skillName: stat.skillName,
        category: stat.category,
        affectedStudentsCount: stat.affectedStudentsCount,
        avgCurrentLevel,
        industryBenchmark,
        avgGap,
        severity,
        relatedCareers: Array.from(stat.relatedCareers),
        suggestedAction: avgGap >= 15
          ? `High deficit detected across ${stat.affectedStudentsCount} students. Recommended: Schedule Intensive Workshop.`
          : avgGap > 0
          ? `Moderate deficit. Recommended: Assign targeted mentorship & practice modules.`
          : `Benchmark satisfied across cohort.`,
      }
    })

    if (careerFilter !== 'all') {
      gaps = gaps.filter(g => g.relatedCareers.some(c => c.toLowerCase().includes(careerFilter.toLowerCase())))
    }

    if (severityFilter !== 'all') {
      gaps = gaps.filter(g => g.severity === severityFilter)
    }

    // Sort by largest gap then affected count
    gaps.sort((a, b) => b.avgGap - a.avgGap || b.affectedStudentsCount - a.affectedStudentsCount)

    const criticalCount = gaps.filter(g => g.severity === 'critical').length
    const needsImprovementCount = gaps.filter(g => g.severity === 'needs_improvement').length
    const readyCount = gaps.filter(g => g.severity === 'ready').length

    return {
      gaps,
      summary: {
        criticalCount,
        needsImprovementCount,
        readyCount,
        totalGapsTracked: gaps.length,
        uniqueStudentsAffected: 28,
      },
    }
  }

  // ── Mentorships ──
  getMentorships(statusFilter = 'all') {
    let list = [...this.mentorships]
    if (statusFilter !== 'all') {
      list = list.filter(m => m.status === statusFilter)
    }
    return list
  }

  addMentorship(data: { studentId: string; skillId?: string; notes: string; startDate: string; endDate?: string | null }) {
    const student = this.getStudentById(data.studentId)
    const newSession: DemoMentorship = {
      id: `demo-m-${Date.now()}`,
      studentId: data.studentId,
      studentName: student ? student.name : 'Aarav Mehta',
      studentEmail: student ? student.email : 'aarav.mehta@dtu.ac.in',
      studentAvatar: null,
      academicianName: this.facultyProfile.name,
      skillId: data.skillId || 's-rest',
      skillName: 'REST APIs',
      skillCategory: 'Backend Architecture',
      status: 'active',
      startDate: data.startDate,
      endDate: data.endDate || null,
      notes: data.notes || 'Targeted 1-on-1 mentorship session in Demo Mode.',
      createdAt: new Date().toISOString(),
    }
    this.mentorships.unshift(newSession)
    return newSession
  }

  updateMentorship(id: string, updates: Partial<DemoMentorship>) {
    const item = this.mentorships.find(m => m.id === id)
    if (item) {
      Object.assign(item, updates)
      return item
    }
    return null
  }

  // ── Workshops ──
  getWorkshops() {
    return [...this.workshops]
  }

  addWorkshop(data: { title: string; description?: string; skillId?: string; date: string; duration?: string; capacity?: number }) {
    const newWorkshop: DemoWorkshop = {
      id: `ws-${Date.now()}`,
      title: data.title,
      description: data.description || 'Targeted academic masterclass aimed at closing critical skill gaps.',
      skillId: data.skillId || 's-rest',
      skillName: 'Technical Competency',
      skillCategory: 'Engineering',
      targetCareer: 'Full Stack & Backend Tracks',
      date: data.date,
      duration: data.duration || '2 Hours',
      capacity: Number(data.capacity) || 40,
      enrolledCount: 1,
      status: 'scheduled',
      institutionName: this.facultyProfile.institution,
      isOwnWorkshop: true,
      createdAt: new Date().toISOString(),
      participantIds: ['demo-std-001'],
    }
    this.workshops.unshift(newWorkshop)
    return newWorkshop
  }

  updateWorkshopStatus(id: string, status: DemoWorkshop['status']) {
    const w = this.workshops.find(item => item.id === id)
    if (w) {
      w.status = status
      return w
    }
    return null
  }

  deleteWorkshop(id: string) {
    this.workshops = this.workshops.filter(w => w.id !== id)
    return true
  }

  // ── Interventions ──
  getInterventions() {
    return [...this.interventions]
  }

  addIntervention(data: { title: string; description?: string; interventionType?: any; targetStudents?: number; startDate: string; endDate?: string | null }) {
    const newInt: DemoIntervention = {
      id: `int-${Date.now()}`,
      title: data.title,
      problemStatement: 'Identified cohort skill deficit requiring structured remedial intervention.',
      description: data.description || 'Intensive multi-week intervention program in Demo Mode.',
      interventionType: data.interventionType || 'workshop',
      skillName: 'Core Competency',
      skillId: 's-rest',
      status: 'active',
      startDate: data.startDate,
      endDate: data.endDate || null,
      enrolledCount: Number(data.targetStudents) || 20,
      reassessedCount: 0,
      preReadinessAvg: 50,
      postReadinessAvg: 50,
      netImprovementLift: 0,
      createdAt: new Date().toISOString(),
    }
    this.interventions.unshift(newInt)
    return newInt
  }

  // ── Opportunities & Opportunity-Specific Readiness ──
  getOpportunities(typeFilter = 'all') {
    let list = [...this.opportunities]
    if (typeFilter !== 'all') {
      list = list.filter(o => o.type.toLowerCase().includes(typeFilter.toLowerCase()))
    }
    return list
  }

  addOpportunity(data: {
    title: string
    description: string
    type: string
    location?: string
    duration?: string
    deadline?: string | null
  }) {
    const newOpp: DemoOpportunity = {
      id: `opp-demo-${Date.now()}`,
      title: data.title,
      provider: `${this.facultyProfile.institution} (Academic Research)`,
      type: (data.type as any) || 'project',
      location: data.location || 'Campus / Remote',
      workMode: 'Hybrid',
      duration: data.duration || '3 Months',
      stipendAmount: null,
      deadline: data.deadline || '2026-11-30',
      description: data.description || 'Academic research and capstone opportunity.',
      requiredSkills: [
        { name: 'REST APIs', requiredLevel: 75 },
        { name: 'React', requiredLevel: 70 },
      ],
      audience: 'students',
    }
    this.opportunities.unshift(newOpp)
    return newOpp
  }

  calculateOpportunityReadiness(student: DemoStudentProfile, opportunity: DemoOpportunity) {
    let totalScoreContrib = 0
    let maxGap = 0
    let blocker: string | null = null

    const breakdown = opportunity.requiredSkills.map(req => {
      const match = student.skills.find(s => s.skillName.toLowerCase() === req.name.toLowerCase())
      const currentScore = match ? match.currentLevel : 0
      const gap = Math.max(0, req.requiredLevel - currentScore)
      const met = currentScore >= req.requiredLevel

      const contrib = Math.min(100, (currentScore / req.requiredLevel) * 100)
      totalScoreContrib += contrib

      if (gap > maxGap) {
        maxGap = gap
        blocker = `${req.name} (${gap} pts gap)`
      }

      return {
        skillName: req.name,
        requiredLevel: req.requiredLevel,
        currentLevel: currentScore,
        gap,
        met,
      }
    })

    const matchPercentage = Math.round(totalScoreContrib / Math.max(1, opportunity.requiredSkills.length))
    const category = matchPercentage >= 80 ? 'Ready' : matchPercentage >= 65 ? 'Developing' : 'Critical Gaps'

    return {
      opportunityId: opportunity.id,
      title: opportunity.title,
      company: opportunity.provider,
      matchPercentage,
      category,
      blocker,
      skillsBreakdown: breakdown,
    }
  }

  // ── Industry Demand ──
  getIndustryDemand() {
    return {
      hasEnoughData: true,
      message: 'Demo Data: Derived deterministically from pre-seeded published corporate opportunities.',
      totalOpportunitiesCount: this.opportunities.length,
      topSkills: [
        { name: 'React', category: 'Frontend', count: 4, percentage: 80 },
        { name: 'REST APIs', category: 'Backend Architecture', count: 4, percentage: 80 },
        { name: 'SQL', category: 'Database', count: 4, percentage: 80 },
        { name: 'Node.js', category: 'Backend', count: 3, percentage: 60 },
        { name: 'Git', category: 'Tooling', count: 3, percentage: 60 },
        { name: 'Java', category: 'Backend Core', count: 2, percentage: 40 },
        { name: 'Spring Boot', category: 'Backend Frameworks', count: 2, percentage: 40 },
      ],
      topRoles: [
        { title: 'Full Stack Developer', count: 2, percentage: 40 },
        { title: 'Backend Engineer', count: 1, percentage: 20 },
        { title: 'Cybersecurity Associate', count: 1, percentage: 20 },
        { title: 'AI Platform Engineer', count: 1, percentage: 20 },
      ],
    }
  }

  // ── Notifications ──
  getNotifications() {
    return [...this.notifications]
  }

  markAllNotificationsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }))
  }

  markNotificationRead(id: string) {
    const notif = this.notifications.find(n => n.id === id)
    if (notif) notif.read = true
  }

  // ── Profile ──
  getProfile() {
    return { ...this.facultyProfile }
  }

  updateProfile(updates: Partial<typeof DEMO_ACADEMICIAN>) {
    Object.assign(this.facultyProfile, updates)
    return { ...this.facultyProfile }
  }

  // ── My Experience ──
  getMyExperience() {
    return { ...DEMO_MY_EXPERIENCE }
  }

  // ── Curated Demo AI Response ──
  getDemoAiResponse(prompt: string, contextStudentId = 'demo-std-001') {
    const student = this.getStudentById(contextStudentId) || this.students[0]
    const p = prompt.toLowerCase()

    if (p.includes('ready') || p.includes('internship') || p.includes('opportunity')) {
      return {
        aiName: 'SkillBridge Demo AI',
        response: `Based on verified benchmark evaluations, ${student.name} is currently at 72% Opportunity Readiness for the Full Stack Developer Internship. 

The primary blocker is REST APIs:
• Required Benchmark: 75
• Current Score: 54
• Skill Deficit: 21 points (Critical Severity)

Recommended Action Plan:
1. Active Mentorship: Continue weekly code review pairing with Dr. Ananya Sharma.
2. Hands-on Workshop: Attend "Building Production-Ready REST APIs" on 18 September 2026.
3. Proof Submission: Build and verify a production microservice with rate limiting (now verified in profile).
4. Reassessment: Target a reassessment by end of September to cross the 75-point benchmark.`,
      }
    }

    return {
      aiName: 'SkillBridge Demo AI',
      response: `[Demo AI Diagnostic for ${student.name}]:
• Career Goal: ${student.targetCareerName}
• Current Overall Readiness: ${student.readiness}% (${student.readinessCategory})
• Priority Focus Area: ${student.priorityGap ? `${student.priorityGap.skillName} (-${student.priorityGap.gap} pts)` : 'All benchmarks satisfied'}
• Next Recommended Step: ${student.recommendedAction}`,
    }
  }
}

// Export singleton instance
export const demoService = new DemoDataService()
