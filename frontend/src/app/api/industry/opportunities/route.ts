import { NextRequest, NextResponse } from 'next/server'
import { getAllCombinedOpportunities, addDynamicOpportunity, OpportunityItem } from '@/lib/opportunities-seed'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    let allOpps = getAllCombinedOpportunities()

    try {
      const supabase = await createSupabaseServerClient()
      const { data: dbOpps } = await (supabase as any)
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false })

      if (dbOpps && dbOpps.length > 0) {
        const existingIds = new Set(allOpps.map(o => o.id))
        dbOpps.forEach((o: any) => {
          if (!existingIds.has(o.id)) {
            allOpps.unshift({
              id: o.id,
              title: o.title,
              company: 'TechNova Solutions',
              type: o.opportunity_type || 'Internship',
              location: o.location || 'Remote',
              workMode: o.work_mode || 'hybrid',
              stipend: o.stipend ? `$${o.stipend}/mo` : undefined,
              duration: o.duration || '6 Months',
              deadline: o.deadline || '2026-12-31',
              deadlineLabel: o.deadline || 'Rolling',
              description: o.description || '',
              requiredSkills: [],
            })
          }
        })
      }
    } catch {}

    return NextResponse.json({
      success: true,
      data: allOpps,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to fetch industry opportunities',
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      type = 'internship',
      location = 'Remote',
      work_mode = 'hybrid',
      duration = '6 Months',
      application_deadline,
      stipend,
      skills = [],
    } = body

    if (!title || !description) {
      return NextResponse.json({
        success: false,
        error: { message: 'Title and description are required' },
      }, { status: 400 })
    }

    const newId = `opp-${Date.now()}`
    const oppTypeFormatted = type === 'internship' ? 'Internship' : type === 'mentorship' ? 'Mentorship' : type === 'training' ? 'Training' : 'Job'

    const requiredSkillsFormatted = Array.isArray(skills) && skills.length > 0
      ? skills.map((s: any) => ({
          name: typeof s === 'string' ? s : s.name || 'Core Skill',
          benchmark: typeof s === 'object' && s.level ? Number(s.level) : 75,
          importance: 'Required' as const,
        }))
      : [
          { name: 'Node.js', benchmark: 80, importance: 'Required' as const },
          { name: 'REST APIs', benchmark: 75, importance: 'Required' as const },
        ]

    const newOpp: OpportunityItem = {
      id: newId,
      title,
      company: 'TechNova Solutions',
      type: oppTypeFormatted as any,
      location,
      workMode: work_mode as any,
      stipend: stipend ? `$${stipend}/mo` : undefined,
      duration: duration || '6 Months',
      deadline: application_deadline || '2026-12-31',
      deadlineLabel: application_deadline ? new Date(application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Rolling',
      description,
      requiredSkills: requiredSkillsFormatted,
    }

    // Add to in-memory store
    addDynamicOpportunity(newOpp)

    // Attempt to persist in Supabase
    try {
      const admin = createSupabaseAdminClient()
      await (admin as any).from('opportunities').insert({
        id: newId,
        title,
        description,
        opportunity_type: type,
        location,
        work_mode,
        duration,
        deadline: application_deadline || null,
        stipend: stipend ? Number(stipend) : null,
        status: 'published',
      })
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        id: newId,
        title,
        status: 'published',
      },
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: { message: err?.message || 'Failed to create opportunity' },
    }, { status: 500 })
  }
}
