import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/student/projects — list current student's projects
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as any)
    .from('projects')
    .select('id, title, description, github_url, project_url, technologies, start_date, end_date, created_at')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return apiError('FETCH_FAILED', 'Could not retrieve projects.', 500)

  return apiSuccess(data || [])
}

// POST /api/student/projects — create a new project
export async function POST(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: {
    title?: string
    description?: string
    github_url?: string
    project_url?: string
    technologies?: string[]
    start_date?: string
    end_date?: string
  }

  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid request body.', 400)
  }

  const title = String(body.title || '').trim()
  const description = String(body.description || '').trim()

  if (!title || title.length < 3) {
    return apiError('VALIDATION_ERROR', 'Project title must be at least 3 characters.', 422)
  }
  if (!description || description.length < 10) {
    return apiError('VALIDATION_ERROR', 'Project description must be at least 10 characters.', 422)
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as any)
    .from('projects')
    .insert({
      student_id: user.id,
      title,
      description,
      github_url: body.github_url || null,
      project_url: body.project_url || null,
      technologies: body.technologies || [],
      start_date: body.start_date || null,
      end_date: body.end_date || null,
    })
    .select()
    .single()

  if (error) return apiError('CREATE_FAILED', 'Could not create project.', 500)

  return apiSuccess(data, 201)
}
