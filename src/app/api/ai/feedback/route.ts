import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { evaluatePracticeSubmission } from '@/lib/ai/coach-service'

// POST /api/ai/feedback — evaluate practice submission
export async function POST(request: Request) {
  const user = await getServerUser()
  const studentId = user?.id || '00000000-0000-0000-0000-000000000001'

  let body: { practiceId?: string; skillName?: string; studentAnswer?: string }
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid JSON body.', 400)
  }

  if (!body.practiceId || !body.studentAnswer) {
    return apiError('VALIDATION_ERROR', 'practiceId and studentAnswer are required.', 422)
  }

  try {
    const feedback = await evaluatePracticeSubmission(
      studentId,
      body.practiceId,
      body.skillName || '',
      body.studentAnswer
    )
    return apiSuccess(feedback)
  } catch (err: any) {
    console.error('AI feedback endpoint error:', err)
    return apiError('AI_SERVICE_ERROR', 'Could not evaluate practice answer. Please try again.', 500)
  }
}
