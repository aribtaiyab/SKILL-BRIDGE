import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/student/skills — returns the current student's skills
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as any)
    .from('student_skills')
    .select('id, current_level, verification_status, skills(id, name, category, description)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return apiError('FETCH_FAILED', 'Could not retrieve skills.', 500)

  return apiSuccess(data || [])
}

// POST /api/student/skills — add a self-declared skill
export async function POST(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: { skill_id: string; current_level: number }
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  if (!body.skill_id) {
    return apiError('VALIDATION_ERROR', 'skill_id is required.', 422)
  }

  const level = Number(body.current_level)
  if (isNaN(level) || level < 0 || level > 100) {
    return apiError('VALIDATION_ERROR', 'current_level must be between 0 and 100.', 422)
  }

  const supabase = await createSupabaseServerClient()

  // Check skill exists
  const { data: skill } = await (supabase as any)
    .from('skills')
    .select('id')
    .eq('id', body.skill_id)
    .single()

  if (!skill) return apiError('NOT_FOUND', 'Skill not found.', 404)

  // Upsert — prevents duplicates
  const { data, error } = await (supabase as any)
    .from('student_skills')
    .upsert({
      student_id: user.id,
      skill_id: body.skill_id,
      current_level: level,
      self_declared_level: level,
      verification_status: 'self_declared',
    }, { onConflict: 'student_id,skill_id' })
    .select()
    .single()

  if (error) return apiError('CREATE_FAILED', 'Could not add skill.', 500)

  return apiSuccess(data, 201)
}
