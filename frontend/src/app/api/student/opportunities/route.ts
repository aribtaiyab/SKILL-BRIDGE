import { NextRequest, NextResponse } from 'next/server'
import { getAllCombinedOpportunities, calculateOpportunityMatch, OpportunityItem } from '@/lib/opportunities-seed'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')
    const searchFilter = searchParams.get('search')?.toLowerCase()
    const workModeFilter = searchParams.get('work_mode')

    let studentScores: Record<string, number> = {
      "Node.js": 80,
      "REST APIs": 75,
      "SQL": 82,
      "Git & Version Control": 75,
      "Git": 75,
      "React.js": 60,
      "React": 60,
      "HTML": 80,
      "CSS": 80,
      "JavaScript": 85,
      "Java": 75,
      "Java/C++": 75,
      "C++": 70,
      "DSA": 80,
      "Data Structures": 80,
      "Algorithms": 75,
      "Problem Solving": 75,
      "OOP": 75,
      "Docker": 50,
      "Linux": 65,
      "Python / Pandas": 70,
      "Python": 75,
      "Machine Learning": 60,
      "Linear Algebra": 65,
      "NumPy": 65,
      "Excel": 75,
      "Communication": 75,
    }

    let allOpps = getAllCombinedOpportunities()

    // Try fetching user skills & live opportunities from Supabase
    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.id) {
        const { data: userSkills } = await (supabase as any)
          .from('student_skills')
          .select('skills(name), verified_score, self_rating')
          .eq('student_id', user.id)

        if (userSkills && userSkills.length > 0) {
          userSkills.forEach((us: any) => {
            if (us.skills?.name) {
              studentScores[us.skills.name] = us.verified_score || us.self_rating || 60
            }
          })
        }
      }

      const { data: dbOpps } = await (supabase as any)
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
        .or('status.eq.published,status.is.null')
        .order('created_at', { ascending: false })

      if (dbOpps && dbOpps.length > 0) {
        const mappedDbOpps: OpportunityItem[] = dbOpps.map((o: any) => {
          const oppType = (o.type || o.opportunity_type || 'internship').toLowerCase()
          const oppTypeFormatted = oppType === 'internship' ? 'Internship' : oppType === 'mentorship' ? 'Mentorship' : oppType === 'training' ? 'Training' : 'Job'
          const workModeVal = (o.work_setting || o.work_mode || 'hybrid').toLowerCase()

          const skillsArray = (o.opportunity_skills || []).map((os: any) => ({
            name: os.skill_name || os.skills?.name || 'Core Competency',
            benchmark: os.required_score || os.minimum_level || 75,
            importance: (os.importance === 'preferred' ? 'Preferred' : 'Required') as any,
          }))

          return {
            id: String(o.id),
            title: o.title,
            company: o.company_name || o.industry_profiles?.organization_name || 'Enterprise Partner',
            type: oppTypeFormatted as any,
            location: o.location || 'Remote',
            workMode: workModeVal as any,
            stipend: o.stipend ? `$${o.stipend}/mo` : undefined,
            duration: o.duration || '6 Months',
            deadline: o.deadline ? o.deadline.split('T')[0] : '2026-12-31',
            deadlineLabel: o.deadline ? new Date(o.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Rolling',
            description: o.description || '',
            requiredSkills: skillsArray.length > 0 ? skillsArray : [
              { name: 'Node.js', benchmark: 80, importance: 'Required' as const },
              { name: 'REST APIs', benchmark: 75, importance: 'Required' as const },
            ],
          }
        })

        const existingIds = new Set(allOpps.map(o => o.id))
        mappedDbOpps.forEach(m => {
          if (!existingIds.has(m.id)) {
            allOpps.unshift(m)
          }
        })
      }
    } catch {
      // Ignored
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
        readinessCategory: match.matchPercentage >= 85 ? 'Ready' : match.matchPercentage >= 65 ? 'Needs Improvement' : 'Critical Gap',
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
      error: err?.message || 'Failed to fetch student opportunities',
    }, { status: 500 })
  }
}
