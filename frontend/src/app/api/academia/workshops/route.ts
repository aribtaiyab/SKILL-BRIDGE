import { NextRequest, NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function GET(req: NextRequest) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { user, academicianProfile, adminSupabase } = auth.context
  const institutionId = academicianProfile?.institution_id

  try {
    let query = (adminSupabase as any)
      .from('workshops')
      .select(`
        id,
        academician_id,
        institution_id,
        title,
        description,
        skill_id,
        date,
        duration,
        capacity,
        status,
        created_at,
        skills(id, name, category),
        institutions(name)
      `)
      .order('date', { ascending: false })

    if (institutionId) {
      query = query.or(`academician_id.eq.${user.id},institution_id.eq.${institutionId}`)
    } else {
      query = query.eq('academician_id', user.id)
    }

    const { data: workshops, error } = await query

    if (error) {
      console.warn('Workshops fetch error:', error)
      return NextResponse.json({ success: false, error: 'Could not fetch workshops' }, { status: 500 })
    }

    // Fetch enrolled participants count for each workshop
    const workshopIds = (workshops || []).map((w: any) => w.id)
    let participantCounts: Record<string, number> = {}

    if (workshopIds.length > 0) {
      try {
        const { data: participants } = await (adminSupabase as any)
          .from('workshop_participants')
          .select('workshop_id')
          .in('workshop_id', workshopIds)

        ;(participants || []).forEach((p: any) => {
          participantCounts[p.workshop_id] = (participantCounts[p.workshop_id] || 0) + 1
        })
      } catch {
        // ignore if participants table empty
      }
    }

    return NextResponse.json({
      success: true,
      data: (workshops || []).map((w: any) => ({
        id: w.id,
        title: w.title,
        description: w.description,
        skillId: w.skill_id,
        skillName: w.skills?.name || 'Technical Competency',
        skillCategory: w.skills?.category || 'Engineering',
        date: w.date,
        duration: w.duration || '2 Hours',
        capacity: w.capacity || 30,
        enrolledCount: participantCounts[w.id] || 0,
        status: w.status,
        institutionName: w.institutions?.name || 'Institution',
        isOwnWorkshop: w.academician_id === user.id,
        createdAt: w.created_at,
      }))
    })
  } catch (err: any) {
    console.error('Workshops GET error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { user, academicianProfile, adminSupabase } = auth.context

  try {
    const body = await req.json()
    const { title, description, skillId, date, duration = '2 Hours', capacity = 40, status = 'scheduled' } = body

    if (!title || !date) {
      return NextResponse.json({ success: false, error: 'Title and scheduled date are required' }, { status: 400 })
    }

    // Default to existing institution or seed ID if unassociated
    const institutionId = academicianProfile?.institution_id || '10000000-0000-0000-0000-000000000001'

    const { data: newWorkshop, error } = await (adminSupabase as any)
      .from('workshops')
      .insert({
        academician_id: user.id,
        institution_id: institutionId,
        title,
        description: description || 'Practical intensive workshop aimed at closing critical cohort skill gaps.',
        skill_id: skillId || null,
        date: new Date(date).toISOString(),
        duration,
        capacity: Number(capacity) || 40,
        status,
      })
      .select(`
        id,
        title,
        description,
        date,
        duration,
        capacity,
        status,
        created_at,
        skills(id, name)
      `)
      .single()

    if (error) {
      console.error('Workshop insert error:', error)
      return NextResponse.json({ success: false, error: 'Could not create workshop' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newWorkshop,
    }, { status: 201 })
  } catch (err: any) {
    console.error('Workshop POST error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
