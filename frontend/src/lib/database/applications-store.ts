export interface StoredApplication {
  id: string
  opportunity_id: string
  student_id: string
  student_name?: string
  student_email?: string
  cover_letter: string | null
  status: string
  created_at: string
  updated_at: string
}

// Global in-memory cache shared across API routes
const globalApplications: StoredApplication[] = []

export function getApplicationsByStudent(studentId: string): StoredApplication[] {
  return globalApplications.filter(a => a.student_id === studentId)
}

export function getAllApplications(): StoredApplication[] {
  return globalApplications
}

export function addApplication(app: StoredApplication): void {
  const existingIdx = globalApplications.findIndex(
    a => a.opportunity_id === app.opportunity_id && a.student_id === app.student_id
  )
  if (existingIdx >= 0) {
    globalApplications[existingIdx] = app
  } else {
    globalApplications.unshift(app)
  }
}

export function updateApplicationStatus(id: string, newStatus: string): boolean {
  const target = globalApplications.find(a => a.id === id)
  if (target) {
    target.status = newStatus
    target.updated_at = new Date().toISOString()
    return true
  }
  return false
}

export function hasStudentApplied(studentId: string, opportunityId: string): boolean {
  return globalApplications.some(
    a => a.student_id === studentId && a.opportunity_id === opportunityId
  )
}
