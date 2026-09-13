import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch user base profile
    const { data: baseProfile } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email, role, avatar_url, bio, phone, location')
      .eq('id', user.id)
      .maybeSingle()

    // 2. Fetch student profile details
    const { data: studentProfile } = await (supabase as any)
      .from('student_profiles')
      .select('*, career_targets(id, name, slug, description)')
      .eq('profile_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      data: {
        profile_id: user.id,
        full_name: baseProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        email: user.email || baseProfile?.email || '',
        avatar_url: baseProfile?.avatar_url || user.user_metadata?.avatar_url || null,
        bio: baseProfile?.bio || '',
        phone: baseProfile?.phone || '',
        location: baseProfile?.location || '',
        college_name: studentProfile?.college_name || '',
        degree: studentProfile?.degree || '',
        branch: studentProfile?.branch || '',
        academic_year: studentProfile?.academic_year || '',
        education: studentProfile?.education || 'Undergraduate',
        graduation_year: studentProfile?.graduation_year || 2026,
        experience_level: studentProfile?.experience_level || 'Student / Entry-level',
        linkedin_url: studentProfile?.linkedin_url || '',
        github_url: studentProfile?.github_url || '',
        portfolio_url: studentProfile?.portfolio_url || '',
        target_career_id: studentProfile?.target_career_id || null,
        career_targets: studentProfile?.career_targets || null,
        created_at: studentProfile?.created_at || baseProfile?.created_at || new Date().toISOString()
      }
    })
  } catch (err: any) {
    console.error('Error fetching student profile:', err)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // 1. Update profiles table
    const profileUpdates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    if (body.full_name !== undefined) profileUpdates.full_name = body.full_name
    if (body.bio !== undefined) profileUpdates.bio = body.bio
    if (body.phone !== undefined) profileUpdates.phone = body.phone
    if (body.location !== undefined) profileUpdates.location = body.location
    if (body.avatar_url !== undefined) profileUpdates.avatar_url = body.avatar_url

    if (Object.keys(profileUpdates).length > 1) {
      await (supabase as any)
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
    }

    // 2. Update student_profiles table
    const studentUpdates: Record<string, any> = {
      profile_id: user.id,
      updated_at: new Date().toISOString()
    }
    if (body.college_name !== undefined) studentUpdates.college_name = body.college_name
    if (body.degree !== undefined) studentUpdates.degree = body.degree
    if (body.branch !== undefined) studentUpdates.branch = body.branch
    if (body.academic_year !== undefined) studentUpdates.academic_year = body.academic_year
    if (body.education !== undefined) studentUpdates.education = body.education
    if (body.graduation_year !== undefined) studentUpdates.graduation_year = Number(body.graduation_year)
    if (body.experience_level !== undefined) studentUpdates.experience_level = body.experience_level
    if (body.linkedin_url !== undefined) studentUpdates.linkedin_url = body.linkedin_url
    if (body.github_url !== undefined) studentUpdates.github_url = body.github_url
    if (body.portfolio_url !== undefined) studentUpdates.portfolio_url = body.portfolio_url

    await (supabase as any)
      .from('student_profiles')
      .upsert(studentUpdates, { onConflict: 'profile_id' })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })
  } catch (err: any) {
    console.error('Error updating student profile:', err)
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 })
  }
}
