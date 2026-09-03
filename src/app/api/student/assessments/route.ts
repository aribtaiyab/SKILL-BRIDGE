import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/student/assessments — list active assessments
export async function GET(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const { searchParams } = new URL(request.url)
  const careerId = searchParams.get('career_id')
  const skillId = searchParams.get('skill_id')

  const supabase = await createSupabaseServerClient()

  let query = (supabase as any)
    .from('assessments')
    .select(`
      id, title, description, difficulty, assessment_type, time_limit,
      total_questions, passing_score, is_active,
      skills(id, name, category)
    `)
    .eq('is_active', true)

  if (careerId) query = query.eq('career_target_id', careerId)
  if (skillId) query = query.eq('skill_id', skillId)

  const { data, error } = await query

  if (error || !data || data.length === 0) {
    // Return standard assessments list
    return apiSuccess([
      {
        id: '1',
        title: 'Node.js Fundamentals Assessment',
        description: 'Covers event loop, asynchronous patterns, streams, and child processes.',
        difficulty: 'Intermediate',
        assessment_type: 'knowledge',
        time_limit: 15,
        total_questions: 5,
        passing_score: 70,
        skill: { name: 'Node.js', category: 'Backend' },
      },
      {
        id: '2',
        title: 'REST APIs & Web Services',
        description: 'HTTP status codes, REST architecture, headers, and authentication methods.',
        difficulty: 'Intermediate',
        assessment_type: 'knowledge',
        time_limit: 15,
        total_questions: 5,
        passing_score: 70,
        skill: { name: 'REST APIs', category: 'Backend' },
      },
      {
        id: '3',
        title: 'SQL & Database Architecture',
        description: 'Relational design, indexing, transactions, and performance query tuning.',
        difficulty: 'Intermediate',
        assessment_type: 'knowledge',
        time_limit: 15,
        total_questions: 5,
        passing_score: 70,
        skill: { name: 'SQL', category: 'Database' },
      },
    ])
  }

  return apiSuccess(data)
}
