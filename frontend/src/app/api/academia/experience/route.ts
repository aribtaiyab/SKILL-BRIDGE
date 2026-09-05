import { NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function GET() {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { user, profile, academicianProfile, adminSupabase } = auth.context

  try {
    // 1. Fetch real mentorships
    const { data: mentorships, error: mentorErr } = await (adminSupabase as any)
      .from('mentorships')
      .select(`
        id,
        student_id,
        skill_id,
        status,
        start_date,
        end_date,
        notes,
        created_at,
        skills(id, name, category),
        profiles!mentorships_student_id_fkey(full_name, email)
      `)
      .eq('academician_id', user.id)
      .order('created_at', { ascending: false })

    if (mentorErr) console.warn('Experience mentorships error:', mentorErr)

    const allMentorships = mentorships || []
    const activeMentorships = allMentorships.filter((m: any) => m.status === 'active')
    const completedMentorships = allMentorships.filter((m: any) => m.status === 'completed')
    const uniqueStudentsMentored = new Set(allMentorships.map((m: any) => m.student_id)).size

    // 2. Fetch real workshops
    const { data: workshops, error: workErr } = await (adminSupabase as any)
      .from('workshops')
      .select(`
        id,
        title,
        description,
        skill_id,
        date,
        duration,
        capacity,
        status,
        created_at,
        skills(id, name, category)
      `)
      .eq('academician_id', user.id)
      .order('date', { ascending: false })

    if (workErr) console.warn('Experience workshops error:', workErr)

    const allWorkshops = workshops || []
    const completedWorkshops = allWorkshops.filter((w: any) => w.status === 'completed')
    const upcomingWorkshops = allWorkshops.filter((w: any) => w.status === 'scheduled' || w.status === 'in_progress')

    // 3. Fetch interventions
    let interventions: any[] = []
    if (academicianProfile?.institution_id) {
      const { data: intData } = await (adminSupabase as any)
        .from('interventions')
        .select('id, title, status, intervention_type, target_students, created_at, skills(name)')
        .eq('institution_id', academicianProfile.institution_id)
        .order('created_at', { ascending: false })
      interventions = intData || []
    }

    // 4. Determine unique skill areas supported
    const skillSet = new Set<string>()
    allMentorships.forEach((m: any) => {
      if (m.skills?.name) skillSet.add(m.skills.name)
    })
    allWorkshops.forEach((w: any) => {
      if (w.skills?.name) skillSet.add(w.skills.name)
    })

    // 5. Build recent activity log from real records
    const activities: Array<{
      id: string
      type: 'mentorship' | 'workshop' | 'intervention'
      title: string
      timestamp: string
      status: string
    }> = []

    allMentorships.forEach((m: any) => {
      activities.push({
        id: m.id,
        type: 'mentorship',
        title: `Mentorship: ${m.profiles?.full_name || 'Student'} (${m.skills?.name || 'General Guidance'})`,
        timestamp: m.created_at,
        status: m.status,
      })
    })

    allWorkshops.forEach((w: any) => {
      activities.push({
        id: w.id,
        type: 'workshop',
        title: `Workshop: ${w.title}`,
        timestamp: w.created_at,
        status: w.status,
      })
    })

    interventions.forEach((i: any) => {
      activities.push({
        id: i.id,
        type: 'intervention',
        title: `Intervention: ${i.title}`,
        timestamp: i.created_at,
        status: i.status,
      })
    })

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      success: true,
      data: {
        academician: {
          name: profile.full_name,
          email: profile.email,
          designation: academicianProfile?.designation || 'Academician',
          teachingArea: academicianProfile?.teaching_area || null,
        },
        stats: {
          totalStudentsMentored: uniqueStudentsMentored,
          activeMentorshipsCount: activeMentorships.length,
          completedMentorshipsCount: completedMentorships.length,
          workshopsConductedCount: completedWorkshops.length,
          upcomingWorkshopsCount: upcomingWorkshops.length,
          interventionsContributedCount: interventions.length,
          supportedSkillsCount: skillSet.size,
          supportedSkills: Array.from(skillSet),
        },
        mentorships: allMentorships.map((m: any) => ({
          id: m.id,
          studentName: m.profiles?.full_name || 'Student',
          studentEmail: m.profiles?.email || '',
          skillName: m.skills?.name || 'General Guidance',
          status: m.status,
          notes: m.notes,
          startDate: m.start_date,
          endDate: m.end_date,
          createdAt: m.created_at,
        })),
        workshops: allWorkshops.map((w: any) => ({
          id: w.id,
          title: w.title,
          description: w.description,
          skillName: w.skills?.name || 'Technical',
          date: w.date,
          duration: w.duration,
          capacity: w.capacity,
          status: w.status,
        })),
        recentActivity: activities.slice(0, 10),
      }
    })
  } catch (err: any) {
    console.error('Experience API error:', err)
    return NextResponse.json({ success: false, error: 'Could not load experience data' }, { status: 500 })
  }
}
