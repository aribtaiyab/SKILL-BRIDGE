import { NextRequest, NextResponse } from 'next/server'
import { getAllCombinedOpportunities, addDynamicOpportunity, calculateOpportunityMatch, OpportunityItem } from '@/lib/opportunities-seed'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')
    const searchFilter = searchParams.get('search')?.toLowerCase()
    const workModeFilter = searchParams.get('work_mode')

    const studentScores: Record<string, number> = {
      "Node.js": 80,
      "REST APIs": 75,
      "SQL": 82,
      "Git & Version Control": 75,
      "React.js": 60,
      "Docker": 50,
      "Linux": 65,
      "Python / Pandas": 70,
    }

    let allOpps = getAllCombinedOpportunities()

    // Try fetching live opportunities from Supabase
    try {
      const supabase = await createSupabaseServerClient()
      const { data: dbOpps } = await (supabase as any)
        .from('opportunities')
        .select(`
          id,
          title,
          description,
          opportunity_type,
          location,
          work_mode,
          duration,
          deadline,
          stipend,
          industry_profiles(organization_name),
          opportunity_skills(minimum_level, importance, skills(name))
        `)
        .eq('status', 'published')

      if (dbOpps && dbOpps.length > 0) {
        const mappedDbOpps: OpportunityItem[] = dbOpps.map((o: any) => ({
          id: o.id,
          title: o.title,
          company: o.industry_profiles?.organization_name || 'Enterprise Partner',
          type: (o.opportunity_type === 'internship' ? 'Internship' : o.opportunity_type === 'mentorship' ? 'Mentorship' : o.opportunity_type === 'training' ? 'Training' : 'Job') as any,
          location: o.location || 'Remote',
          workMode: (o.work_mode || 'hybrid') as any,
          stipend: o.stipend ? `$${o.stipend}/mo` : undefined,
          duration: o.duration || '3 Months',
          deadline: o.deadline || '2026-12-31',
          deadlineLabel: o.deadline || 'Rolling',
          description: o.description || '',
          requiredSkills: (o.opportunity_skills || []).map((os: any) => ({
            name: os.skills?.name || 'Technical Competency',
            benchmark: os.minimum_level || 75,
            importance: os.importance === 'preferred' ? 'Preferred' : 'Required',
          })),
        }))

        // Merge without duplicates
        const existingIds = new Set(allOpps.map(o => o.id))
        mappedDbOpps.forEach(m => {
          if (!existingIds.has(m.id)) {
            allOpps.unshift(m)
          }
        })
      }
    } catch {
      // Use in-memory and seed list
    }

    let filtered = allOpps

    if (typeFilter && typeFilter !== 'All' && typeFilter !== 'All Types') {
      filtered = filtered.filter(opp =>
        opp.type.toLowerCase() === typeFilter.toLowerCase()
      )
    }

    if (workModeFilter && workModeFilter !== 'all') {
      filtered = filtered.filter(opp =>
        opp.workMode.toLowerCase() === workModeFilter.toLowerCase()
      )
    }

    if (searchFilter) {
      filtered = filtered.filter(opp =>
        opp.title.toLowerCase().includes(searchFilter) ||
        opp.company.toLowerCase().includes(searchFilter) ||
        opp.description.toLowerCase().includes(searchFilter)
      )
    }

    const results = filtered.map(opp => {
      const match = calculateOpportunityMatch(opp, studentScores)
      return {
        id: opp.id,
        title: opp.title,
        company: opp.company,
        type: opp.type,
        location: opp.location,
        workMode: opp.workMode,
        stipend: opp.stipend,
        duration: opp.duration,
        deadline: opp.deadline,
        deadlineLabel: opp.deadlineLabel,
        description: opp.description,
        matchPercentage: match.matchPercentage,
        skillsMetCount: match.skillsMetCount,
        totalSkillsCount: match.totalSkillsCount,
        mainBlocker: match.mainBlocker,
        skills: match.skills,
        isSaved: false,
        hasApplied: false,
      }
    })

    // Sort descending by match percentage
    results.sort((a, b) => b.matchPercentage - a.matchPercentage)

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to fetch opportunities',
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
      company = 'TechNova Solutions',
      skills = [],
    } = body

    if (!title || !description) {
      return NextResponse.json({
        success: false,
        error: 'Title and description are required',
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
      company,
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

    // Add to in-memory store immediately
    addDynamicOpportunity(newOpp)

    // Attempt to persist in Supabase if available
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
    } catch {
      // Ignored if table not configured
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newId,
        title,
        message: 'Opportunity created successfully',
      },
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to create opportunity',
    }, { status: 500 })
  }
}
