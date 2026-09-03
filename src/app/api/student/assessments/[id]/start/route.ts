import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { startAssessment } from '@/lib/intelligence/assessment'

// POST /api/student/assessments/[id]/start — start assessment attempt
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  const attemptData = await startAssessment(user.id, id)

  return apiSuccess(attemptData)
}
