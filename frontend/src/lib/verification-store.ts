export interface VerificationItem {
  id: string
  student_id: string
  student_name: string
  student_email: string
  department: string
  skill_name: string
  verification_tier: string
  score: number
  proof_url: string | null
  proof_notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  faculty_feedback?: string | null
  reviewed_at?: string | null
  created_at: string
}

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
    proof_url: 'https://github.com/aaravmehta/scalable-express-api',
    proof_notes: 'Implemented cluster workers, JWT auth middleware, and comprehensive unit tests with 94% code coverage.',
    status: 'pending',
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
    proof_url: 'https://github.com/snehapatel/rest-ecommerce-backend',
    proof_notes: 'Achieved 92/100 on official benchmarking assessment. Verified pagination, rate-limiting, and error handling.',
    status: 'pending',
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
    proof_url: 'https://github.com/rohanverma/sql-indexer-benchmarks',
    proof_notes: 'Demonstrated index optimization reducing query latency from 320ms to 8ms on 1M simulated row dataset.',
    status: 'pending',
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
  vGlobal.__skillbridge_verification_queue.unshift(item)
}

export function getVerificationRequests(): VerificationItem[] {
  if (!vGlobal.__skillbridge_verification_queue) {
    vGlobal.__skillbridge_verification_queue = [...INITIAL_QUEUE]
  }
  return vGlobal.__skillbridge_verification_queue
}

export function updateVerificationRequest(
  id: string,
  action: 'approved' | 'rejected',
  feedback?: string
): VerificationItem | null {
  const queue = getVerificationRequests()
  const item = queue.find(q => q.id === id)
  if (item) {
    item.status = action
    item.faculty_feedback = feedback || null
    item.reviewed_at = new Date().toISOString()
    return item
  }
  return null
}
