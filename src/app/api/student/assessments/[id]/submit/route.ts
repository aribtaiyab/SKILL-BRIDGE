import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { submitAssessment } from '@/lib/intelligence/assessment'

// POST /api/student/assessments/[id]/submit — evaluate and record assessment result
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params

  let body: {
    attemptId?: string
    answers?: { questionId: string; selectedOptionId: string }[]
  }

  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const attemptId = body.attemptId || `attempt-${Date.now()}`
  const answers = Array.isArray(body.answers) ? body.answers : []

  if (answers.length === 0) {
    return apiError('VALIDATION_ERROR', 'No answers provided for submission.', 422)
  }

  const result = await submitAssessment(user.id, attemptId, id, answers)

  return apiSuccess(result)
}
