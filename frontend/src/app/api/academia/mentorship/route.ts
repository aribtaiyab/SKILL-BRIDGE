import { NextRequest, NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function GET(req: NextRequest) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { user, adminSupabase } = auth.context
  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status') || 'all'

  try {
    let query = (adminSupabase as any)
      .from('mentorships')
      .select(`
        id,
        student_id,
        academician_id,
        skill_id,
        status,
        start_date,
        end_date,
        notes,
        created_at,
        skills(id, name, category),
        profiles!mentorships_student_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('academician_id', user.id)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: mentorships, error } = await query

    if (error) {
      console.warn('Mentorships fetch error:', error)
      return NextResponse.json({ success: false, error: 'Could not fetch mentorships' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: (mentorships || []).map((m: any) => ({
        id: m.id,
        studentId: m.student_id,
        studentName: m.profiles?.full_name || 'Student',
        studentEmail: m.profiles?.email || '',
        studentAvatar: m.profiles?.avatar_url || null,
        skillId: m.skill_id,
        skillName: m.skills?.name || 'General Guidance',
        skillCategory: m.skills?.category || 'Technical',
        status: m.status,
        startDate: m.start_date,
        endDate: m.end_date,
        notes: m.notes,
        createdAt: m.created_at,
      }))
    })
  } catch (err: any) {
    console.error('Mentorship GET error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { user, profile, academicianProfile, adminSupabase } = auth.context

  try {
    const body = await req.json()
    const { studentId, skillId, notes, startDate, endDate, status = 'active' } = body

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 })
    }

    // 1. Verify student belongs to academician's institution if specified
    if (academicianProfile?.institution_id) {
      const { data: studentCheck } = await (adminSupabase as any)
        .from('student_profiles')
        .select('profile_id')
        .eq('profile_id', studentId)
        .eq('institution_id', academicianProfile.institution_id)
        .maybeSingle()

      if (!studentCheck) {
        // Fallback check if student profile exists at all
        const { data: generalCheck } = await (adminSupabase as any)
          .from('profiles')
          .select('id')
          .eq('id', studentId)
          .maybeSingle()
        if (!generalCheck) {
          return NextResponse.json({ success: false, error: 'Student not found or unauthorized' }, { status: 404 })
        }
      }
    }

    // 2. Insert mentorship record
    const { data: newMentorship, error: insertError } = await (adminSupabase as any)
      .from('mentorships')
      .insert({
        academician_id: user.id,
        student_id: studentId,
        skill_id: skillId || null,
        status,
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || null,
        notes: notes || 'Targeted 1-on-1 mentorship session initiated by faculty.',
      })
      .select(`
        id,
        student_id,
        skill_id,
        status,
        start_date,
        end_date,
        notes,
        created_at,
        skills(id, name)
      `)
      .single()

    if (insertError) {
      console.error('Mentorship insert error:', insertError)
      return NextResponse.json({ success: false, error: 'Could not create mentorship' }, { status: 500 })
    }

    // 3. Create real notification for student
    try {
      await (adminSupabase as any)
        .from('notifications')
        .insert({
          user_id: studentId,
          title: 'New Mentorship Session Scheduled',
          message: `${profile.full_name || 'Your faculty mentor'} has scheduled a mentorship session for ${newMentorship.skills?.name || 'skill development'}.`,
          type: 'mentorship',
          link: '/student',
        })
    } catch {
      // ignore notification error if table newly created
    }

    return NextResponse.json({
      success: true,
      data: newMentorship,
    }, { status: 201 })
  } catch (err: any) {
    console.error('Mentorship POST error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
