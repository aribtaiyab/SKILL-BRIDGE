import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { interactWithCoach } from '@/lib/ai/coach-service'

// POST /api/ai/coach — chat with AI Skill Coach
export async function POST(request: Request) {
  const user = await getServerUser()
  const studentId = user?.id || '00000000-0000-0000-0000-000000000001'

  let body: { message?: string; history?: any[]; targetCareerId?: string; opportunityId?: string }
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid JSON body.', 400)
  }

  const message = (body.message || '').trim()
  if (!message) {
    return apiError('VALIDATION_ERROR', 'Message is required.', 422)
  }

  try {
    const result = await interactWithCoach(studentId, message, body.history || [], {
      targetCareerId: body.targetCareerId,
      opportunityId: body.opportunityId,
    })
    return apiSuccess(result)
  } catch (err: any) {
    console.error('AI coach endpoint error:', err)
    return apiError('AI_SERVICE_ERROR', 'Could not process coaching request. Please try again.', 500)
  }
}
