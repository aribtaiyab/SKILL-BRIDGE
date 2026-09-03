import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { explainCareerReadiness } from '@/lib/ai/coach-service'

// POST /api/ai/explain-readiness — structured explainable career readiness
export async function POST(request: Request) {
  const user = await getServerUser()
  const studentId = user?.id || '00000000-0000-0000-0000-000000000001'

  let body: { targetCareerId?: string } = {}
  try {
    body = await request.json()
  } catch {}

  try {
    const result = await explainCareerReadiness(studentId, {
      targetCareerId: body.targetCareerId,
    })
    return apiSuccess(result)
  } catch (err: any) {
    console.error('AI explain-readiness error:', err)
    return apiError('AI_SERVICE_ERROR', 'Could not explain readiness. Please try again.', 500)
  }
}
