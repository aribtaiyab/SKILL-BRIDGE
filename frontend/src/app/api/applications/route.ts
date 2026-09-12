import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { getAllCombinedOpportunities } from '@/lib/opportunities-seed'
import { addApplication, getApplicationsByStudent, hasStudentApplied } from '@/lib/database/applications-store'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Determine current student user ID (fallback to default student if not logged in)
    const studentId = user?.id || '00000000-0000-0000-0000-000000000001'

    let applications: any[] = []

    try {
      const admin = createSupabaseAdminClient()
      const { data: dbApps } = await (admin as any)
        .from('applications')
        .select(`
          id,
          opportunity_id,
          student_id,
          cover_letter,
          status,
          created_at,
          updated_at,
          opportunities(
            id,
            title,
            company_name,
            type,
            opportunity_type,
            location,
            work_setting,
            work_mode
          ),
          application_status_history(
            status,
            note,
            changed_at
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (dbApps && Array.isArray(dbApps) && dbApps.length > 0) {
        applications = dbApps.map((app: any) => {
          const opp = app.opportunities || {}
          const oppType = opp.type || opp.opportunity_type || 'Internship'
          const companyName = opp.company_name || 'Enterprise Partner'

          const history = Array.isArray(app.application_status_history) && app.application_status_history.length > 0
            ? app.application_status_history.map((h: any) => ({
                status: h.status,
                note: h.note || null,
                changed_at: h.changed_at || app.created_at,
              }))
            : [
                { status: 'applied', note: 'Application submitted', changed_at: app.created_at },
                ...(app.status !== 'applied' ? [{ status: app.status, note: `Status updated to ${app.status}`, changed_at: app.updated_at }] : [])
              ]

          return {
            id: String(app.id),
            status: app.status || 'applied',
            created_at: app.created_at || new Date().toISOString(),
            updated_at: app.updated_at || app.created_at || new Date().toISOString(),
            opportunities: {
              id: String(opp.id || app.opportunity_id),
              title: opp.title || 'Software Engineering Role',
              opportunity_type: oppType,
              location: opp.location || 'Remote',
              industry_profiles: {
                organization_name: companyName,
              },
            },
            readinessSnapshot: {
              readinessPercentage: 85,
              skillsMet: 3,
              totalSkills: 4,
              snapshotAt: app.created_at,
            },
            timeline: history,
          }
        })
      }
    } catch (dbErr) {
      console.warn('[Applications API] Supabase read fallback:', dbErr)
    }

    // Merge in-memory applications for this student
    const inMem = getApplicationsByStudent(studentId)
    if (inMem.length > 0) {
      const allCombinedOpps = getAllCombinedOpportunities()
      const existingIds = new Set(applications.map(a => a.id))
      inMem.forEach(memApp => {
        if (!existingIds.has(memApp.id)) {
          const matchedOpp = allCombinedOpps.find(o => o.id === memApp.opportunity_id)
          applications.unshift({
            id: memApp.id,
            status: memApp.status,
            created_at: memApp.created_at,
            updated_at: memApp.updated_at,
            opportunities: {
              id: memApp.opportunity_id,
              title: matchedOpp?.title || 'Software Engineering Role',
              opportunity_type: matchedOpp?.type || 'Internship',
              location: matchedOpp?.location || 'Remote',
              industry_profiles: {
                organization_name: matchedOpp?.company || 'Enterprise Partner',
              },
            },
            readinessSnapshot: {
              readinessPercentage: 90,
              skillsMet: 3,
              totalSkills: 3,
              snapshotAt: memApp.created_at,
            },
            timeline: [
              { status: 'applied', note: 'Application submitted', changed_at: memApp.created_at },
              ...(memApp.status !== 'applied' ? [{ status: memApp.status, note: `Status updated to ${memApp.status}`, changed_at: memApp.updated_at }] : [])
            ],
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: applications,
    })
  } catch (err: any) {
    console.error('[Applications API GET Error]:', err)
    return NextResponse.json({
      success: false,
      error: { message: err?.message || 'Failed to fetch applications' },
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { opportunity_id, cover_letter } = body

    if (!opportunity_id) {
      return NextResponse.json({
        success: false,
        error: { message: 'Opportunity ID is required' },
      }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Determine student ID
    const studentId = user?.id || '00000000-0000-0000-0000-000000000001'

    // Check duplicate in shared store
    if (hasStudentApplied(studentId, opportunity_id)) {
      return NextResponse.json({
        success: false,
        error: { code: 'DUPLICATE', message: 'You have already applied to this opportunity.' },
      }, { status: 400 })
    }

    const newAppId = `app-${Date.now()}`
    const timestamp = new Date().toISOString()

    let studentFullName = 'Elena Rostova'
    let studentEmail = 'elena.rostova@university.edu'

    // Try Supabase insert and profile lookup
    try {
      const admin = createSupabaseAdminClient()
      
      const { data: prof } = await (admin as any)
        .from('profiles')
        .select('full_name, email')
        .eq('id', studentId)
        .maybeSingle()

      if (prof?.full_name) {
        studentFullName = prof.full_name
        studentEmail = prof.email || studentEmail
      }

      const { data: existingApp } = await (admin as any)
        .from('applications')
        .select('id')
        .eq('opportunity_id', opportunity_id)
        .eq('student_id', studentId)
        .maybeSingle()

      if (existingApp) {
        return NextResponse.json({
          success: false,
          error: { code: 'DUPLICATE', message: 'You have already applied to this opportunity.' },
        }, { status: 400 })
      }

      const { data: insertedApp, error: insertErr } = await (admin as any)
        .from('applications')
        .insert({
          opportunity_id,
          student_id: studentId,
          cover_letter: cover_letter || null,
          status: 'applied',
        })
        .select('id')
        .single()

      if (!insertErr && insertedApp) {
        await (admin as any).from('application_status_history').insert({
          application_id: insertedApp.id,
          status: 'applied',
          note: 'Application submitted',
        })
      }
    } catch (dbErr: any) {
      console.warn('[Applications API] Supabase application insert fallback:', dbErr.message)
    }

    // Save in shared memory store
    addApplication({
      id: newAppId,
      opportunity_id,
      student_id: studentId,
      student_name: studentFullName,
      student_email: studentEmail,
      cover_letter: cover_letter || null,
      status: 'applied',
      created_at: timestamp,
      updated_at: timestamp,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newAppId,
        opportunity_id,
        status: 'applied',
        created_at: timestamp,
        message: 'Application submitted successfully',
      },
    })
  } catch (err: any) {
    console.error('[Applications API POST Error]:', err)
    return NextResponse.json({
      success: false,
      error: { message: err?.message || 'Failed to submit application' },
    }, { status: 500 })
  }
}
