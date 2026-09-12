import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { getAllCombinedOpportunities } from '@/lib/opportunities-seed'
import { getAllApplications } from '@/lib/database/applications-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    let applications: any[] = []

    try {
      const admin = createSupabaseAdminClient()

      let query = (admin as any)
        .from('applications')
        .select(`
          id,
          status,
          cover_letter,
          created_at,
          updated_at,
          opportunities(
            id,
            title,
            industry_id,
            company_name
          ),
          profiles:student_id(
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter.toLowerCase())
      }

      // If logged in as industry, filter by industry's opportunities
      if (user?.id) {
        query = query.eq('opportunities.industry_id', user.id)
      }

      const { data: dbApps } = await query

      if (dbApps && Array.isArray(dbApps)) {
        applications = dbApps.map((a: any) => ({
          id: String(a.id),
          status: a.status || 'applied',
          cover_letter: a.cover_letter || null,
          created_at: a.created_at || new Date().toISOString(),
          opportunities: {
            id: String(a.opportunities?.id || ''),
            title: a.opportunities?.title || 'Software Engineering Role',
          },
          profiles: {
            id: String(a.profiles?.id || 'p-1'),
            full_name: a.profiles?.full_name || 'Verified Student Candidate',
            email: a.profiles?.email || 'candidate@university.edu',
          },
        }))
      }
    } catch (dbErr) {
      console.warn('[Industry Applications API] Supabase read fallback:', dbErr)
    }

    // Merge in-memory applications
    const inMemApps = getAllApplications()
    if (inMemApps.length > 0) {
      const allCombinedOpps = getAllCombinedOpportunities()
      const existingIds = new Set(applications.map(a => a.id))

      inMemApps.forEach(memApp => {
        if (!existingIds.has(memApp.id)) {
          if (statusFilter && statusFilter !== 'all' && memApp.status.toLowerCase() !== statusFilter.toLowerCase()) {
            return
          }
          const matchedOpp = allCombinedOpps.find(o => o.id === memApp.opportunity_id)
          applications.unshift({
            id: memApp.id,
            status: memApp.status,
            cover_letter: memApp.cover_letter,
            created_at: memApp.created_at,
            opportunities: {
              id: memApp.opportunity_id,
              title: matchedOpp?.title || 'Software Engineering Role',
            },
            profiles: {
              id: memApp.student_id,
              full_name: memApp.student_name || 'Verified Student Candidate',
              email: memApp.student_email || 'candidate@university.edu',
            },
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: applications,
    })
  } catch (err: any) {
    console.error('[Industry Applications API GET Error]:', err)
    return NextResponse.json({
      success: false,
      error: { message: err?.message || 'Failed to fetch industry applications' },
    }, { status: 500 })
  }
}
