import { NextRequest, NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function GET(req: NextRequest) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { academicianProfile, adminSupabase } = auth.context
  const institutionId = academicianProfile?.institution_id
  const departmentId = academicianProfile?.department_id

  const { searchParams } = new URL(req.url)
  const careerFilter = searchParams.get('career') || 'all'
  const severityFilter = searchParams.get('severity') || 'all'

  try {
    // 1. Fetch authorized students
    let query = (adminSupabase as any)
      .from('student_profiles')
      .select('profile_id, target_career_id, career_targets(id, name)')

    if (institutionId) query = query.eq('institution_id', institutionId)
    if (departmentId) query = query.eq('department_id', departmentId)

    const { data: students, error: stdError } = await query
    if (stdError || !students || students.length === 0) {
      return NextResponse.json({ success: true, data: { gaps: [], summary: { criticalCount: 0, needsImprovementCount: 0, readyCount: 0 } } })
    }

    const studentIds = students.map((s: any) => s.profile_id)
    const studentCareerMap = new Map<string, string>()
    students.forEach((s: any) => {
      if (s.career_targets?.name) studentCareerMap.set(s.profile_id, s.career_targets.name)
    })

    // 2. Fetch all skill_gaps for authorized students
    const { data: gaps, error: gapsError } = await (adminSupabase as any)
      .from('skill_gaps')
      .select(`
        student_id,
        skill_id,
        required_level,
        current_level,
        gap,
        gap_status,
        skills(id, name, category)
      `)
      .in('student_id', studentIds)

    if (gapsError) {
      console.warn('Skill gaps fetch error:', gapsError)
      return NextResponse.json({ success: false, error: 'Could not fetch skill gaps' }, { status: 500 })
    }

    // 3. Aggregate gaps by Skill
    const gapMap: Record<string, {
      skillId: string
      skillName: string
      category: string
      totalScore: number
      totalRequired: number
      totalGap: number
      affectedStudents: Set<string>
      maxGap: number
      careers: Set<string>
    }> = {}

    ;(gaps || []).forEach((g: any) => {
      const skillId = g.skill_id
      const skillName = g.skills?.name || 'Skill'
      const category = g.skills?.category || 'Technical'
      const studentCareer = studentCareerMap.get(g.student_id) || 'General Engineering'

      if (!gapMap[skillId]) {
        gapMap[skillId] = {
          skillId,
          skillName,
          category,
          totalScore: 0,
          totalRequired: 0,
          totalGap: 0,
          affectedStudents: new Set(),
          maxGap: 0,
          careers: new Set(),
        }
      }

      gapMap[skillId].totalScore += g.current_level || 0
      gapMap[skillId].totalRequired += g.required_level || 0
      gapMap[skillId].totalGap += g.gap || 0
      gapMap[skillId].affectedStudents.add(g.student_id)
      gapMap[skillId].careers.add(studentCareer)
      if ((g.gap || 0) > gapMap[skillId].maxGap) {
        gapMap[skillId].maxGap = g.gap
      }
    })

    let aggregated = Object.values(gapMap).map(item => {
      const count = item.affectedStudents.size
      const avgScore = count > 0 ? Math.round(item.totalScore / count) : 0
      const avgRequired = count > 0 ? Math.round(item.totalRequired / count) : 0
      const avgGap = Math.max(0, avgRequired - avgScore)

      // Central logic: >=15 = Critical, 1-14 = Needs Improvement, 0 = Ready
      const severity = avgGap >= 15 ? 'critical' : avgGap > 0 ? 'needs_improvement' : 'ready'

      return {
        skillId: item.skillId,
        skillName: item.skillName,
        category: item.category,
        affectedStudentsCount: count,
        avgCurrentLevel: avgScore,
        industryBenchmark: avgRequired,
        avgGap,
        severity,
        relatedCareers: Array.from(item.careers),
        suggestedAction: avgGap >= 15 
          ? `High deficit detected across ${count} students. Recommended: Schedule Intensive Workshop.`
          : avgGap > 0 
          ? `Moderate deficit. Recommended: Assign targeted mentorship & practice modules.`
          : `Benchmark satisfied across cohort.`,
      }
    })

    // 4. Apply Filters
    if (careerFilter !== 'all') {
      aggregated = aggregated.filter(item =>
        item.relatedCareers.some(c => c.toLowerCase().includes(careerFilter.toLowerCase()))
      )
    }

    if (severityFilter !== 'all') {
      aggregated = aggregated.filter(item => item.severity === severityFilter)
    }

    // Sort by largest gap then affected count
    aggregated.sort((a, b) => b.avgGap - a.avgGap || b.affectedStudentsCount - a.affectedStudentsCount)

    const criticalCount = aggregated.filter(g => g.severity === 'critical').length
    const needsImprovementCount = aggregated.filter(g => g.severity === 'needs_improvement').length
    const readyCount = aggregated.filter(g => g.severity === 'ready').length

    return NextResponse.json({
      success: true,
      data: {
        gaps: aggregated,
        summary: {
          totalSkillsTracked: aggregated.length,
          criticalCount,
          needsImprovementCount,
          readyCount,
        }
      }
    })
  } catch (err: any) {
    console.error('Skill gaps API error:', err)
    return NextResponse.json({ success: false, error: 'Could not fetch skill gaps' }, { status: 500 })
  }
}
