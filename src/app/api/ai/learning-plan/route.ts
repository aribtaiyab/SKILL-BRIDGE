import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { getOrGenerateLearningPlan } from '@/lib/ai/coach-service'

// POST /api/ai/learning-plan — generate/retrieve personalized learning plan
export async function POST(request: Request) {
  const user = await getServerUser()
  const studentId = user?.id || '00000000-0000-0000-0000-000000000001'

  let body: { skillName?: string; targetCareerId?: string } = {}
  try {
    body = await request.json()
  } catch {}

  try {
    const result = await getOrGenerateLearningPlan(studentId, body.skillName || '', {
      targetCareerId: body.targetCareerId,
    })
    return apiSuccess(result)
  } catch (err: any) {
    console.error('AI learning plan endpoint error:', err)
    return apiError('AI_SERVICE_ERROR', 'Could not generate learning plan. Please try again.', 500)
  }
}
