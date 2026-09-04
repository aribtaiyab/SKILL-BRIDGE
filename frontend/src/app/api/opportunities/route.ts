import { NextRequest, NextResponse } from 'next/server'
import { SEED_OPPORTUNITIES, calculateOpportunityMatch } from '@/lib/opportunities-seed'

export async function GET(request: NextRequest) {
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

  let filtered = SEED_OPPORTUNITIES

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
}
