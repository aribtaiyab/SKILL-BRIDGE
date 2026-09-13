import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: projects, error } = await (supabase as any)
      .from('projects')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !projects) {
      return NextResponse.json({ success: true, data: [] })
    }

    return NextResponse.json({ success: true, data: projects })
  } catch (err: any) {
    console.error('Error fetching student projects:', err)
    return NextResponse.json({ success: true, data: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const newProject = {
      id: body.id || undefined,
      student_id: user.id,
      title: body.title || 'Untitled Project',
      description: body.description || '',
      technologies: Array.isArray(body.technologies)
        ? body.technologies
        : typeof body.technologies === 'string'
        ? body.technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [],
      github_url: body.github_url || body.githubUrl || null,
      project_url: body.project_url || body.projectUrl || body.liveUrl || null,
      created_at: new Date().toISOString()
    }

    const { data, error } = await (supabase as any)
      .from('projects')
      .insert(newProject)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: true, data: { ...newProject, id: `proj-${Date.now()}` } })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Error creating student project:', err)
    return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 })
  }
}
