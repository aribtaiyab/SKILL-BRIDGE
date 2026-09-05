import { NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function GET() {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { adminSupabase } = auth.context

  try {
    // 1. Fetch published opportunities and their required skills
    const { data: opportunities, error: oppErr } = await (adminSupabase as any)
      .from('opportunities')
      .select(`
        id,
        title,
        type,
        created_at,
        opportunity_skills(
          skill_id,
          skills(id, name, category)
        )
      `)
      .eq('status', 'published')

    if (oppErr) {
      console.warn('Industry demand fetch error:', oppErr)
      return NextResponse.json({ success: false, error: 'Could not fetch industry demand' }, { status: 500 })
    }

    const allOpportunities = opportunities || []

    if (allOpportunities.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          hasEnoughData: false,
          message: 'Not enough industry data yet. Industry hiring demand will appear as opportunities are published.',
          topSkills: [],
          topRoles: [],
          totalOpportunitiesCount: 0,
        }
      })
    }

    // 2. Compute skill frequency from real published opportunities
    const skillCounts: Record<string, { name: string; category: string; count: number }> = {}
    const roleCounts: Record<string, number> = {}

    allOpportunities.forEach((opp: any) => {
      // Role grouping
      const roleName = opp.title || 'Software Engineering'
      roleCounts[roleName] = (roleCounts[roleName] || 0) + 1

      // Skills grouping
      ;(opp.opportunity_skills || []).forEach((os: any) => {
        const skillName = os.skills?.name
        if (skillName) {
          if (!skillCounts[skillName]) {
            skillCounts[skillName] = {
              name: skillName,
              category: os.skills?.category || 'Technical',
              count: 0,
            }
          }
          skillCounts[skillName].count++
        }
      })
    })

    const topSkills = Object.values(skillCounts)
      .map(s => ({
        skillName: s.name,
        category: s.category,
        demandCount: s.count,
        demandPercentage: Math.round((s.count / allOpportunities.length) * 100),
      }))
      .sort((a, b) => b.demandCount - a.demandCount)
      .slice(0, 10)

    const topRoles = Object.entries(roleCounts)
      .map(([role, count]) => ({
        roleName: role,
        count,
        percentage: Math.round((count / allOpportunities.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return NextResponse.json({
      success: true,
      data: {
        hasEnoughData: topSkills.length > 0,
        totalOpportunitiesCount: allOpportunities.length,
        topSkills,
        topRoles,
      }
    })
  } catch (err: any) {
    console.error('Industry demand API error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
