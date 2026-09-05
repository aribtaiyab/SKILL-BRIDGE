import { NextRequest, NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function GET() {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { user, profile, academicianProfile, adminSupabase } = auth.context

  try {
    // Fetch full profile and institution details
    const { data: fullProfile } = await (adminSupabase as any)
      .from('profiles')
      .select('id, full_name, email, role, phone, bio, location, avatar_url, created_at')
      .eq('id', user.id)
      .single()

    let institutionName = 'Delhi Technological University (DTU)'
    let departmentName = 'Computer Science & Engineering'

    if (academicianProfile?.institution_id) {
      const { data: inst } = await (adminSupabase as any)
        .from('institutions')
        .select('name')
        .eq('id', academicianProfile.institution_id)
        .maybeSingle()
      if (inst?.name) institutionName = inst.name
    }

    if (academicianProfile?.department_id) {
      const { data: dept } = await (adminSupabase as any)
        .from('departments')
        .select('name')
        .eq('id', academicianProfile.department_id)
        .maybeSingle()
      if (dept?.name) departmentName = dept.name
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: fullProfile?.full_name || profile.full_name,
        email: fullProfile?.email || user.email,
        role: 'academician',
        designation: academicianProfile?.designation || 'Faculty Mentor',
        teachingArea: academicianProfile?.teaching_area || 'Software Engineering & Cloud Architecture',
        institution: institutionName,
        department: departmentName,
        bio: fullProfile?.bio || '',
        phone: fullProfile?.phone || '',
        location: fullProfile?.location || '',
        avatarUrl: fullProfile?.avatar_url || null,
        joinedDate: fullProfile?.created_at ? new Date(fullProfile.created_at).toLocaleDateString() : 'Active',
      }
    })
  } catch (err: any) {
    console.error('Profile GET error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { user, adminSupabase } = auth.context

  try {
    const body = await req.json()
    const { name, bio, phone, location, designation, teachingArea } = body

    // 1. Update profiles table (Do NOT allow changing role)
    const profileUpdates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    if (name !== undefined) profileUpdates.full_name = name
    if (bio !== undefined) profileUpdates.bio = bio
    if (phone !== undefined) profileUpdates.phone = phone
    if (location !== undefined) profileUpdates.location = location

    await (adminSupabase as any)
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id)

    // 2. Update academician_profiles table
    const acadUpdates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    if (designation !== undefined) acadUpdates.designation = designation
    if (teachingArea !== undefined) acadUpdates.teaching_area = teachingArea

    await (adminSupabase as any)
      .from('academician_profiles')
      .update(acadUpdates)
      .eq('profile_id', user.id)

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (err: any) {
    console.error('Profile PATCH error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
