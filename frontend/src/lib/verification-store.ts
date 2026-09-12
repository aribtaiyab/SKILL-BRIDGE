export interface SupportingEvidenceItem {
  title: string
  type: string // 'github_repo' | 'live_project' | 'certificate' | 'document' | 'project'
  url?: string
  description?: string
}

export interface VerificationItem {
  id: string
  student_id: string
  student_name: string
  student_email: string
  department: string
  skill_name: string
  skill_id?: string
  verification_tier: string
  score: number
  claimed_level?: string // 'Beginner' | 'Developing' | 'Intermediate' | 'Strong' | 'Advanced' | 'Expert'
  description?: string | null
  project_title?: string | null
  project_url?: string | null
  tech_stack?: string | null
  proof_url: string | null
  proof_notes: string | null
  supporting_evidence?: SupportingEvidenceItem[]
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  academician_id?: string | null
  academician_name?: string | null
  academician_institution?: string | null
  academician_department?: string | null
  faculty_feedback?: string | null
  rejection_reason?: string | null
  verified_level?: number | null
  reviewed_at?: string | null
  created_at: string
  updated_at?: string
}

export interface AcademicianProfile {
  id: string
  profile_id: string
  full_name: string
  title: string
  institution_name: string
  department: string
  expertise_skills: string[]
  availability: string
  verified_count: number
  avatar_url?: string | null
}

export const PRESET_ACADEMICIANS: AcademicianProfile[] = [
  {
    id: 'fac-01-sarah-mitchell',
    profile_id: 'fac-01-sarah-mitchell',
    full_name: 'Dr. Sarah Mitchell',
    title: 'Associate Professor & Dept. Chair',
    institution_name: 'Delhi Technological University (DTU)',
    department: 'Computer Science & Engineering',
    expertise_skills: ['React', 'Node.js', 'Web Architecture', 'Full Stack Development', 'TypeScript'],
    availability: 'Mon - Thu, 10:00 AM - 4:00 PM IST',
    verified_count: 48,
    avatar_url: null,
  },
  {
    id: 'fac-02-rajesh-raman',
    profile_id: 'fac-02-rajesh-raman',
    full_name: 'Prof. Rajesh Raman',
    title: 'Professor & Head of Systems Lab',
    institution_name: 'Indian Institute of Technology (IIT Delhi)',
    department: 'Information Technology',
    expertise_skills: ['Java', 'Spring Boot', 'SQL', 'Distributed Systems', 'Microservices'],
    availability: 'Mon, Wed, Fri, 2:00 PM - 6:00 PM IST',
    verified_count: 62,
    avatar_url: null,
  },
  {
    id: 'fac-03-ananya-sen',
    profile_id: 'fac-03-ananya-sen',
    full_name: 'Dr. Ananya Sen',
    title: 'Lead AI/ML Faculty Fellow',
    institution_name: 'IIIT Hyderabad',
    department: 'Data Science & Artificial Intelligence',
    expertise_skills: ['Python', 'Machine Learning', 'Data Structures', 'SQL', 'Statistical Modeling'],
    availability: 'Tue, Thu, Sat, 11:00 AM - 5:00 PM IST',
    verified_count: 35,
    avatar_url: null,
  },
  {
    id: 'fac-04-david-chen',
    profile_id: 'fac-04-david-chen',
    full_name: 'Dr. David Chen',
    title: 'Faculty of Cloud & DevOps Infrastructure',
    institution_name: 'National University of Singapore',
    department: 'Cloud Systems & Networks',
    expertise_skills: ['Docker', 'Kubernetes', 'Cloud Infrastructure', 'CI/CD Pipelines', 'Linux'],
    availability: 'Wed & Fri, 1:00 PM - 5:00 PM SGT',
    verified_count: 29,
    avatar_url: null,
  },
]

const INITIAL_QUEUE: VerificationItem[] = [
  {
    id: 'vr-seed-001',
    student_id: 'std-2026-001',
    student_name: 'Aarav Mehta',
    student_email: 'aarav.mehta@dtu.ac.in',
    department: 'Computer Science & Engineering',
    skill_name: 'Node.js & Express',
    verification_tier: 'Practical Verified',
    score: 88,
    claimed_level: 'Strong',
    description: 'Built high-throughput backend services using Node.js clustering, JWT authentication, redis caching, and comprehensive Jest unit tests with 94% code coverage.',
    project_title: 'Scalable Microservice Architecture',
    project_url: 'https://github.com/aaravmehta/scalable-express-api',
    tech_stack: 'Node.js, Express, Redis, Docker, Jest',
    proof_url: 'https://github.com/aaravmehta/scalable-express-api',
    proof_notes: 'Implemented cluster workers, JWT auth middleware, and comprehensive unit tests with 94% code coverage.',
    supporting_evidence: [
      {
        title: 'Production Express API Repository',
        type: 'github_repo',
        url: 'https://github.com/aaravmehta/scalable-express-api',
        description: 'Complete source code with modular routing, middleware pipelines, and integration tests.',
      },
      {
        title: 'Backend Architecture Certification',
        type: 'certificate',
        url: 'https://certificates.skillbridge.edu/node-backend-mastery',
        description: 'Official verified coursework certification in Node.js event loop & API design.',
      },
    ],
    status: 'pending',
    academician_id: 'fac-01-sarah-mitchell',
    academician_name: 'Dr. Sarah Mitchell',
    academician_institution: 'Delhi Technological University (DTU)',
    academician_department: 'Computer Science & Engineering',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'vr-seed-002',
    student_id: 'std-2026-002',
    student_name: 'Sneha Patel',
    student_email: 'sneha.patel@dtu.ac.in',
    department: 'Computer Science & Engineering',
    skill_name: 'REST API Architecture',
    verification_tier: 'Assessment Verified',
    score: 92,
    claimed_level: 'Advanced',
    description: 'Designed and implemented RESTful endpoints with idempotency keys, OpenAPI/Swagger 3.0 documentation, rate-limiting, and error handling middleware.',
    project_title: 'E-Commerce Backend REST API',
    project_url: 'https://github.com/snehapatel/rest-ecommerce-backend',
    tech_stack: 'Express.js, TypeScript, PostgreSQL, Swagger',
    proof_url: 'https://github.com/snehapatel/rest-ecommerce-backend',
    proof_notes: 'Achieved 92/100 on official benchmarking assessment. Verified pagination, rate-limiting, and error handling.',
    supporting_evidence: [
      {
        title: 'E-Commerce API Repository',
        type: 'github_repo',
        url: 'https://github.com/snehapatel/rest-ecommerce-backend',
        description: 'Clean TypeScript codebase with RESTful standards.',
      },
    ],
    status: 'pending',
    academician_id: 'fac-01-sarah-mitchell',
    academician_name: 'Dr. Sarah Mitchell',
    academician_institution: 'Delhi Technological University (DTU)',
    academician_department: 'Computer Science & Engineering',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'vr-seed-003',
    student_id: 'std-2026-003',
    student_name: 'Rohan Verma',
    student_email: 'rohan.verma@dtu.ac.in',
    department: 'Information Technology',
    skill_name: 'PostgreSQL & Query Optimization',
    verification_tier: 'Evidence Verified',
    score: 85,
    claimed_level: 'Proficient',
    description: 'Optimized relational schemas using B-Tree and GIN indexes, wrote complex SQL aggregations, and reduced query latency by 97% on a 1M simulated row dataset.',
    project_title: 'SQL Indexing & Query Benchmarking Tool',
    project_url: 'https://github.com/rohanverma/sql-indexer-benchmarks',
    tech_stack: 'PostgreSQL, SQL, Node.js, pgbench',
    proof_url: 'https://github.com/rohanverma/sql-indexer-benchmarks',
    proof_notes: 'Demonstrated index optimization reducing query latency from 320ms to 8ms on 1M simulated row dataset.',
    supporting_evidence: [
      {
        title: 'Benchmark Results & Source Code',
        type: 'github_repo',
        url: 'https://github.com/rohanverma/sql-indexer-benchmarks',
        description: 'Benchmark script, EXPLAIN ANALYZE logs, and database schema migrations.',
      },
    ],
    status: 'approved',
    academician_id: 'fac-02-rajesh-raman',
    academician_name: 'Prof. Rajesh Raman',
    academician_institution: 'Indian Institute of Technology (IIT Delhi)',
    academician_department: 'Information Technology',
    faculty_feedback: 'Outstanding query analysis report. EXPLAIN ANALYZE benchmarks clearly demonstrate deep understanding of indexing strategies and query planning.',
    verified_level: 88,
    reviewed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
]

type GlobalWithVerification = typeof globalThis & {
  __skillbridge_verification_queue?: VerificationItem[]
}

const vGlobal = globalThis as GlobalWithVerification

if (!vGlobal.__skillbridge_verification_queue) {
  vGlobal.__skillbridge_verification_queue = [...INITIAL_QUEUE]
}

export function addVerificationRequest(item: VerificationItem) {
  if (!vGlobal.__skillbridge_verification_queue) {
    vGlobal.__skillbridge_verification_queue = [...INITIAL_QUEUE]
  }
  vGlobal.__skillbridge_verification_queue = vGlobal.__skillbridge_verification_queue.filter(q => q.id !== item.id)
  vGlobal.__skillbridge_verification_queue.unshift(item)
}

export function getVerificationRequests(filter?: { studentId?: string; status?: string; academicianId?: string }): VerificationItem[] {
  if (!vGlobal.__skillbridge_verification_queue) {
    vGlobal.__skillbridge_verification_queue = [...INITIAL_QUEUE]
  }
  let items = vGlobal.__skillbridge_verification_queue

  if (filter && filter.studentId) {
    const sId = filter.studentId.toLowerCase()
    items = items.filter(i => i.student_id === filter.studentId || (i.student_email && i.student_email.toLowerCase() === sId))
  }
  if (filter && filter.status && filter.status !== 'all') {
    items = items.filter(i => i.status === filter.status)
  }
  if (filter && filter.academicianId) {
    items = items.filter(i => i.academician_id === filter.academicianId)
  }

  return items
}

export function updateVerificationRequest(
  id: string,
  action: 'approved' | 'rejected' | 'in_review',
  feedback?: string,
  rejectionReason?: string,
  verifiedLevel?: number,
  reviewerName?: string
): VerificationItem | null {
  const queue = getVerificationRequests()
  const item = queue.find(q => q.id === id)
  if (item) {
    item.status = action
    if (feedback) item.faculty_feedback = feedback
    if (rejectionReason) item.rejection_reason = rejectionReason
    if (verifiedLevel) item.verified_level = verifiedLevel
    if (reviewerName) item.academician_name = reviewerName
    item.reviewed_at = new Date().toISOString()
    item.updated_at = new Date().toISOString()
    return item
  }
  return null
}
