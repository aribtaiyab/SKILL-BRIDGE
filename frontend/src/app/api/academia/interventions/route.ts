import { NextRequest, NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function GET(req: NextRequest) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { academicianProfile, adminSupabase } = auth.context
  const institutionId = academicianProfile?.institution_id

  try {
    let query = (adminSupabase as any)
      .from('interventions')
      .select(`
        id,
        institution_id,
        department_id,
        skill_id,
        title,
        description,
        intervention_type,
        target_students,
        status,
        start_date,
        end_date,
        created_at,
        skills(id, name, category)
      `)
      .order('created_at', { ascending: false })

    if (institutionId) {
      query = query.eq('institution_id', institutionId)
    }

    const { data: interventions, error } = await query

    if (error) {
      console.warn('Interventions fetch error:', error)
      return NextResponse.json({ success: false, error: 'Could not fetch interventions' }, { status: 500 })
    }

    // For each intervention, calculate real longitudinal metrics from intervention_students or reassessments
    const interventionIds = (interventions || []).map((i: any) => i.id)
    let participantsByIntervention: Record<string, any[]> = {}

    if (interventionIds.length > 0) {
      try {
        const { data: stdRecords } = await (adminSupabase as any)
          .from('intervention_students')
          .select('intervention_id, student_id, pre_score, post_score, status')
          .in('intervention_id', interventionIds)

        ;(stdRecords || []).forEach((r: any) => {
          if (!participantsByIntervention[r.intervention_id]) {
            participantsByIntervention[r.intervention_id] = []
          }
          participantsByIntervention[r.intervention_id].push(r)
        })
      } catch {
        // ignore if table empty
      }
    }

    const formatted = (interventions || []).map((item: any) => {
      const records = participantsByIntervention[item.id] || []
      const enrolledCount = Math.max(item.target_students || 0, records.length)

      let preAvg = 0
      let postAvg = 0
      let reassessedCount = 0

      if (records.length > 0) {
        let preSum = 0
        let postSum = 0
        records.forEach((r: any) => {
          preSum += r.pre_score || 0
          if (r.post_score !== null && r.post_score !== undefined) {
            postSum += r.post_score
            reassessedCount++
          }
        })
        preAvg = Math.round(preSum / records.length)
        postAvg = reassessedCount > 0 ? Math.round(postSum / reassessedCount) : preAvg
      }

      const netLift = postAvg - preAvg

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        interventionType: item.intervention_type,
        skillName: item.skills?.name || 'Technical Competency',
        skillId: item.skill_id,
        status: item.status,
        startDate: item.start_date,
        endDate: item.end_date,
        enrolledCount,
        reassessedCount,
        preReadinessAvg: preAvg,
        postReadinessAvg: postAvg,
        netImprovementLift: netLift,
        createdAt: item.created_at,
      }
    })

    return NextResponse.json({
      success: true,
      data: formatted,
    })
  } catch (err: any) {
    console.error('Interventions GET error:', err)
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
    const { title, description, skillId, interventionType = 'workshop', targetStudents = 0, startDate, endDate } = body

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const institutionId = academicianProfile?.institution_id || '10000000-0000-0000-0000-000000000001'
    const departmentId = academicianProfile?.department_id || null

    const { data: newIntervention, error } = await (adminSupabase as any)
      .from('interventions')
      .insert({
        institution_id: institutionId,
        department_id: departmentId,
        skill_id: skillId || null,
        title,
        description: description || 'Academic intervention deployed to address measured cohort skill deficits.',
        intervention_type: interventionType,
        target_students: Number(targetStudents) || 0,
        status: 'in_progress',
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || null,
      })
      .select(`
        id,
        title,
        description,
        intervention_type,
        target_students,
        status,
        start_date,
        end_date,
        created_at,
        skills(id, name)
      `)
      .single()

    if (error) {
      console.error('Intervention insert error:', error)
      return NextResponse.json({ success: false, error: 'Could not create intervention' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newIntervention,
    }, { status: 201 })
  } catch (err: any) {
    console.error('Intervention POST error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
