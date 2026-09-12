import { NextRequest, NextResponse } from 'next/server'
import { getAllCombinedOpportunities } from '@/lib/opportunities-seed'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Opportunity ID is required' }, { status: 400 })
    }

    // 1. Try Supabase first
    try {
      const supabase = await createSupabaseServerClient()
      const { data: dbOpp } = await (supabase as any)
        .from('opportunities')
        .select(`
          id,
          title,
          company_name,
          description,
          type,
          opportunity_type,
          location,
          work_setting,
          work_mode,
          duration,
          deadline,
          stipend,
          status,
          created_at,
          industry_profiles(organization_name),
          opportunity_skills(
            id,
            skill_name,
            required_score,
            minimum_level,
            importance,
            skills(name)
          )
        `)
        .eq('id', id)
        .maybeSingle()

      if (dbOpp) {
        const oppType = (dbOpp.type || dbOpp.opportunity_type || 'internship').toLowerCase()
        const oppTypeFormatted = oppType === 'internship' ? 'Internship' : oppType === 'mentorship' ? 'Mentorship' : oppType === 'training' ? 'Training' : 'Job'
        const workModeVal = (dbOpp.work_setting || dbOpp.work_mode || 'hybrid').toLowerCase()

        const skillsArray = (dbOpp.opportunity_skills || []).map((os: any) => ({
          name: os.skill_name || os.skills?.name || 'Core Competency',
          benchmark: os.required_score || os.minimum_level || 75,
          importance: (os.importance === 'preferred' ? 'Preferred' : 'Required') as any,
        }))

        return NextResponse.json({
          success: true,
          data: {
            id: String(dbOpp.id),
            title: dbOpp.title,
            company: dbOpp.company_name || dbOpp.industry_profiles?.organization_name || 'Enterprise Partner',
            type: oppTypeFormatted,
            location: dbOpp.location || 'Remote',
            workMode: workModeVal,
            stipend: dbOpp.stipend ? `$${dbOpp.stipend}/mo` : undefined,
            duration: dbOpp.duration || '6 Months',
            deadline: dbOpp.deadline ? dbOpp.deadline.split('T')[0] : '2026-12-31',
            deadlineLabel: dbOpp.deadline ? new Date(dbOpp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Rolling',
            description: dbOpp.description || '',
            requiredSkills: skillsArray,
          },
        })
      }
    } catch {
      // Fall through to memory seed
    }

    // 2. Check seed opportunities
    const allOpps = getAllCombinedOpportunities()
    const matched = allOpps.find(o => o.id === id)

    if (matched) {
      return NextResponse.json({
        success: true,
        data: matched,
      })
    }

    return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 })
  } catch (err: any) {
    console.error('Error in GET /api/opportunities/[id]:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch opportunity' }, { status: 500 })
  }
}
