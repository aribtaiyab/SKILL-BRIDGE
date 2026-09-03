import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { generatePracticeChallenge } from '@/lib/ai/coach-service'
import { DifficultyLevelSchema } from '@/lib/ai/types'

// POST /api/ai/practice — generate targeted practice challenge
export async function POST(request: Request) {
  const user = await getServerUser()
  const studentId = user?.id || '00000000-0000-0000-0000-000000000001'

  let body: { skillName?: string; difficulty?: string } = {}
  try {
    body = await request.json()
  } catch {}

  const parsedDifficulty = DifficultyLevelSchema.safeParse(body.difficulty || 'Intermediate')
  const difficulty = parsedDifficulty.success ? parsedDifficulty.data : 'Intermediate'

  try {
    const result = await generatePracticeChallenge(studentId, body.skillName || '', difficulty)
    return apiSuccess(result)
  } catch (err: any) {
    console.error('AI practice endpoint error:', err)
    return apiError('AI_SERVICE_ERROR', 'Could not generate practice challenge. Please try again.', 500)
  }
}
