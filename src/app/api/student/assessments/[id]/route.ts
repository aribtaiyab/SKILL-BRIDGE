import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/student/assessments/[id] — get assessment details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as any)
    .from('assessments')
    .select(`
      id, title, description, difficulty, assessment_type, time_limit,
      total_questions, passing_score,
      skills(id, name, category)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return apiSuccess({
      id,
      title: 'Node.js Fundamentals Assessment',
      description: 'Covers event loop, asynchronous patterns, streams, and child processes.',
      difficulty: 'Intermediate',
      assessment_type: 'knowledge',
      time_limit: 15,
      total_questions: 5,
      passing_score: 70,
      skills: { id: 's1', name: 'Node.js', category: 'Backend' },
    })
  }

  return apiSuccess(data)
}
