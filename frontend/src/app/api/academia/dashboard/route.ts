import { NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function GET() {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { user, academicianProfile, adminSupabase } = auth.context
  const institutionId = academicianProfile?.institution_id
  const departmentId = academicianProfile?.department_id

  try {
    // 1. Fetch authorized students
    let studentsQuery = (adminSupabase as any)
      .from('student_profiles')
      .select(`
        profile_id,
        target_career_id,
        profiles!inner(id, full_name, email, avatar_url)
      `)

    if (institutionId) {
      studentsQuery = studentsQuery.eq('institution_id', institutionId)
    }
    if (departmentId) {
      studentsQuery = studentsQuery.eq('department_id', departmentId)
    }

    const { data: students, error: studentsError } = await studentsQuery

    if (studentsError) {
      console.warn('Dashboard students fetch warning:', studentsError)
    }

    const authorizedStudents = students || []
    const studentIds = authorizedStudents.map((s: any) => s.profile_id)

    // 2. Fetch skill scores & gaps for authorized students
    let studentScores: any[] = []
    let studentGaps: any[] = []
    let reassessments: any[] = []

    if (studentIds.length > 0) {
      const [scoresRes, gapsRes, reassessRes] = await Promise.all([
        (adminSupabase as any)
          .from('skill_scores')
          .select('student_id, skill_id, current_level, skills(id, name, category)')
          .in('student_id', studentIds),
        (adminSupabase as any)
          .from('skill_gaps')
          .select('student_id, skill_id, required_level, current_level, gap, gap_status, skills(id, name, category)')
          .in('student_id', studentIds),
        (adminSupabase as any)
          .from('reassessments')
          .select('id, student_id, skill_id, previous_score, new_score, improvement_points, reassessed_at, skills(name)')
          .in('student_id', studentIds)
          .order('reassessed_at', { ascending: false })
          .limit(5)
      ])

      studentScores = scoresRes.data || []
      studentGaps = gapsRes.data || []
      reassessments = reassessRes.data || []
    }

    // 3. Aggregate student readiness
    // A student is assessed if they have at least 1 record in skill_scores
    const assessedStudentIds = new Set(studentScores.map((s: any) => s.student_id))
    const totalStudents = authorizedStudents.length
    const studentsAssessed = assessedStudentIds.size

    // Calculate average readiness across assessed students
    // Average score across all skill scores for the student
    const studentAvgReadiness: Record<string, number> = {}
    studentScores.forEach((s: any) => {
      if (!studentAvgReadiness[s.student_id]) studentAvgReadiness[s.student_id] = 0
      studentAvgReadiness[s.student_id] += s.current_level
    })
    const studentScoreCounts: Record<string, number> = {}
    studentScores.forEach((s: any) => {
      studentScoreCounts[s.student_id] = (studentScoreCounts[s.student_id] || 0) + 1
    })

    const readinessDistribution = {
      notReady: 0,       // < 40
      earlyProgress: 0,  // 40 - 54
      developing: 0,     // 55 - 69
      ready: 0,          // 70 - 84
      highlyReady: 0,    // 85 - 100
    }

    let totalReadinessSum = 0
    let requiringAttentionCount = 0

    Object.keys(studentAvgReadiness).forEach(id => {
      const avg = Math.round(studentAvgReadiness[id] / Math.max(1, studentScoreCounts[id]))
      totalReadinessSum += avg
      if (avg < 60) requiringAttentionCount++

      if (avg >= 85) readinessDistribution.highlyReady++
      else if (avg >= 70) readinessDistribution.ready++
      else if (avg >= 55) readinessDistribution.developing++
      else if (avg >= 40) readinessDistribution.earlyProgress++
      else readinessDistribution.notReady++
    })

    const avgCohortReadiness = studentsAssessed > 0 ? Math.round(totalReadinessSum / studentsAssessed) : 0

    // 4. Aggregate top skill gaps
    const gapMap: Record<string, {
      skillId: string
      skillName: string
      category: string
      totalGap: number
      affectedStudents: Set<string>
      maxSeverity: string
    }> = {}

    studentGaps.forEach((g: any) => {
      if ((g.gap || 0) > 0) {
        const skillId = g.skill_id
        const skillName = g.skills?.name || 'Technical Competency'
        const category = g.skills?.category || 'General'

        if (!gapMap[skillId]) {
          gapMap[skillId] = {
            skillId,
            skillName,
            category,
            totalGap: 0,
            affectedStudents: new Set(),
            maxSeverity: 'needs_improvement',
          }
        }
        gapMap[skillId].totalGap += g.gap
        gapMap[skillId].affectedStudents.add(g.student_id)
        if (g.gap >= 15 || g.gap_status === 'critical') {
          gapMap[skillId].maxSeverity = 'critical'
        }
      }
    })

    const aggregatedGaps = Object.values(gapMap)
      .map(item => ({
        skillId: item.skillId,
        skillName: item.skillName,
        category: item.category,
        affectedCount: item.affectedStudents.size,
        avgGap: Math.round(item.totalGap / Math.max(1, item.affectedStudents.size)),
        severity: item.maxSeverity === 'critical' ? 'Critical' : 'Needs Improvement',
      }))
      .sort((a, b) => b.affectedCount - a.affectedCount)
      .slice(0, 5)

    // 5. Active interventions, workshops, and mentorships count
    const [mentorshipRes, workshopRes, interventionRes] = await Promise.all([
      (adminSupabase as any)
        .from('mentorships')
        .select('id, status')
        .eq('academician_id', user.id)
        .eq('status', 'active'),
      (adminSupabase as any)
        .from('workshops')
        .select('id, status, date')
        .eq('academician_id', user.id)
        .in('status', ['scheduled', 'in_progress']),
      (adminSupabase as any)
        .from('interventions')
        .select('id, status')
        .in('status', ['planned', 'in_progress'])
    ])

    const activeMentorshipsCount = (mentorshipRes.data || []).length
    const upcomingWorkshopsCount = (workshopRes.data || []).length
    const activeInterventionsCount = (interventionRes.data || []).length

    // 6. Formulate priority action
    let priorityAction = null
    if (aggregatedGaps.length > 0) {
      const topGap = aggregatedGaps[0]
      priorityAction = {
        skillName: topGap.skillName,
        affectedCount: topGap.affectedCount,
        severity: topGap.severity,
        recommendation: `${topGap.affectedCount} students have a significant ${topGap.skillName} deficit (avg gap: ${topGap.avgGap} pts). Schedule a targeted workshop or intensive mentorship.`,
        suggestedActionType: topGap.affectedCount >= 5 ? 'workshop' : 'mentorship',
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalStudents,
          studentsAssessed,
          avgCohortReadiness,
          requiringAttentionCount,
          activeMentorshipsCount,
          upcomingWorkshopsCount,
          activeInterventionsCount,
        },
        readinessDistribution,
        topSkillGaps: aggregatedGaps,
        priorityAction,
        recentProgressEvents: reassessments.map((r: any) => ({
          id: r.id,
          studentId: r.student_id,
          skillName: r.skills?.name || 'Skill',
          previousScore: r.previous_score,
          newScore: r.new_score,
          improvementPoints: r.improvement_points,
          reassessedAt: r.reassessed_at,
        })),
      }
    })
  } catch (err: any) {
    console.error('Academia dashboard API error:', err)
    return NextResponse.json({ success: false, error: 'Could not load dashboard data' }, { status: 500 })
  }
}
