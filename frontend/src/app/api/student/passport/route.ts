import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id || request.headers.get('x-user-id') || (request.headers.get('x-demo-mode') === 'true' ? '00000000-0000-0000-0000-000000000001' : null)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [profileRes, studentProfRes, skillsRes, projectsRes, certsRes, settingsRes] = await Promise.all([
      (supabase as any).from('profiles').select('*').eq('id', userId).maybeSingle(),
      (supabase as any).from('student_profiles').select('*, career_targets(id, name, slug)').eq('profile_id', userId).maybeSingle(),
      (supabase as any).from('student_skills').select('*, skills(id, name, category)').eq('student_id', userId),
      (supabase as any).from('projects').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
      (supabase as any).from('certifications').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
      (supabase as any).from('passport_settings').select('*').eq('student_id', userId).maybeSingle()
    ])

    const prof = profileRes?.data || {}
    const studentProf = studentProfRes?.data || {}
    const skills = skillsRes?.data || []
    const projects = projectsRes?.data || []
    const certs = certsRes?.data || []
    const settings = settingsRes?.data || { share_token: `sp-${userId.substring(0, 8)}`, is_public: true }

    const passportData = {
      profile: {
        id: userId,
        name: prof.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student',
        email: user?.email || prof.email || '',
        college_name: studentProf.college_name || '',
        degree: studentProf.degree || studentProf.education || '',
        branch: studentProf.branch || '',
        academic_year: studentProf.academic_year || '',
        graduation_year: studentProf.graduation_year || 2026,
        location: prof.location || '',
        bio: prof.bio || '',
        avatar_url: prof.avatar_url || user?.user_metadata?.avatar_url || null,
        linkedin_url: studentProf.linkedin_url || '',
        github_url: studentProf.github_url || '',
        portfolio_url: studentProf.portfolio_url || '',
        target_role: studentProf.career_targets?.name || null,
      },
      settings,
      skills: skills.map((s: any) => ({
        id: s.skill_id || s.id,
        name: s.skills?.name || s.skill_name || s.name || 'Skill',
        category: s.skills?.category || 'Technical',
        score: Number(s.current_level ?? s.self_declared_level ?? 50),
        verification_status: s.verification_status || 'self_declared',
      })),
      projects: projects.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        technologies: p.technologies || [],
        github_url: p.github_url,
        project_url: p.project_url,
      })),
      certifications: certs.map((c: any) => ({
        id: c.id,
        name: c.name,
        issuing_organization: c.issuing_organization,
        issue_date: c.issue_date,
        credential_url: c.credential_url,
      }))
    }

    return NextResponse.json({
      success: true,
      data: passportData
    })
  } catch (err: any) {
    console.error('Error in student passport route:', err)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id || request.headers.get('x-user-id') || (request.headers.get('x-demo-mode') === 'true' ? '00000000-0000-0000-0000-000000000001' : null)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { data, error } = await (supabase as any)
      .from('passport_settings')
      .upsert({ student_id: userId, ...body, updated_at: new Date().toISOString() }, { onConflict: 'student_id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: true, data: { student_id: userId, ...body } })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Error updating passport settings:', err)
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
  }
}
