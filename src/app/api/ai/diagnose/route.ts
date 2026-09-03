import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { diagnoseSkillGap } from '@/lib/ai/coach-service'

// POST /api/ai/diagnose — diagnose skill gap
export async function POST(request: Request) {
  const user = await getServerUser()
  const studentId = user?.id || '00000000-0000-0000-0000-000000000001'

  let body: { skillName?: string; targetCareerId?: string; opportunityId?: string } = {}
  try {
    body = await request.json()
  } catch {}

  try {
    const result = await diagnoseSkillGap(studentId, body.skillName || '', {
      targetCareerId: body.targetCareerId,
      opportunityId: body.opportunityId,
    })
    return apiSuccess(result)
  } catch (err: any) {
    console.error('AI diagnose endpoint error:', err)
    return apiError('AI_SERVICE_ERROR', 'Could not diagnose skill gap. Please try again.', 500)
  }
}
