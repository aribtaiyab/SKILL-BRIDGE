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
  const search = searchParams.get('search')?.toLowerCase().trim() || ''
  const careerFilter = searchParams.get('career') || 'all'
  const readinessFilter = searchParams.get('readiness') || 'all'
  const assessmentFilter = searchParams.get('assessment') || 'all'

  try {
    // 1. Query authorized student profiles
    let query = (adminSupabase as any)
      .from('student_profiles')
      .select(`
        profile_id,
        education,
        graduation_year,
        experience_level,
        target_career_id,
        institution_id,
        department_id,
        profiles!inner(id, full_name, email, avatar_url),
        career_targets(id, name, slug)
      `)

    if (institutionId) {
      query = query.eq('institution_id', institutionId)
    }
    if (departmentId) {
      query = query.eq('department_id', departmentId)
    }

    const { data: students, error: stdError } = await query

    if (stdError) {
      console.warn('Students query error:', stdError)
      return NextResponse.json({ success: false, error: 'Could not fetch students' }, { status: 500 })
    }

    const authorizedStudents = students || []
    if (authorizedStudents.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const studentIds = authorizedStudents.map((s: any) => s.profile_id)

    // 2. Fetch skill scores, gaps, and evidence for these students
    const [scoresRes, gapsRes, evidenceRes] = await Promise.all([
      (adminSupabase as any)
        .from('skill_scores')
        .select('student_id, skill_id, current_level, verification_status, skills(name)')
        .in('student_id', studentIds),
      (adminSupabase as any)
        .from('skill_gaps')
        .select('student_id, skill_id, gap, gap_status, skills(name)')
        .in('student_id', studentIds)
        .order('gap', { ascending: false }),
      (adminSupabase as any)
        .from('skill_evidence')
        .select('student_id, verification_status')
        .in('student_id', studentIds)
    ])

    const scoresByStudent: Record<string, any[]> = {}
    ;(scoresRes.data || []).forEach((sc: any) => {
      if (!scoresByStudent[sc.student_id]) scoresByStudent[sc.student_id] = []
      scoresByStudent[sc.student_id].push(sc)
    })

    const gapsByStudent: Record<string, any[]> = {}
    ;(gapsRes.data || []).forEach((gp: any) => {
      if (!gapsByStudent[gp.student_id]) gapsByStudent[gp.student_id] = []
      gapsByStudent[gp.student_id].push(gp)
    })

    const evidenceByStudent: Record<string, any[]> = {}
    ;(evidenceRes.data || []).forEach((ev: any) => {
      if (!evidenceByStudent[ev.student_id]) evidenceByStudent[ev.student_id] = []
      evidenceByStudent[ev.student_id].push(ev)
    })

    // 3. Assemble student items with real computed metrics
    let items = authorizedStudents.map((std: any) => {
      const studentId = std.profile_id
      const scores = scoresByStudent[studentId] || []
      const gaps = gapsByStudent[studentId] || []
      const evidence = evidenceByStudent[studentId] || []

      const isAssessed = scores.length > 0
      const totalScore = scores.reduce((sum, s) => sum + (s.current_level || 0), 0)
      const readiness = isAssessed ? Math.round(totalScore / scores.length) : 0

      // Priority gap is the gap with highest deficit
      const topGapObj = gaps.find((g: any) => (g.gap || 0) > 0)
      const priorityGap = topGapObj 
        ? `${topGapObj.skills?.name || 'Technical'} (${topGapObj.gap} pts gap)`
        : isAssessed ? 'Benchmarks Satisfied' : 'Pending Assessment'

      const verifiedSkillsCount = scores.filter((s: any) => s.verification_status && s.verification_status !== 'self_declared').length
      const hasPendingEvidence = evidence.some((e: any) => e.verification_status === 'pending')

      return {
        id: studentId,
        name: std.profiles?.full_name || 'Student',
        email: std.profiles?.email || '',
        avatarUrl: std.profiles?.avatar_url || null,
        careerTarget: std.career_targets?.name || 'Undeclared Target',
        careerTargetId: std.target_career_id || null,
        education: std.education || 'Undergraduate',
        graduationYear: std.graduation_year || 2026,
        isAssessed,
        readiness,
        readinessCategory: readiness >= 85 ? 'Highly Ready' : readiness >= 70 ? 'Ready' : readiness >= 55 ? 'Developing' : readiness >= 40 ? 'Early Progress' : 'Not Ready',
        priorityGap,
        topGapSkill: topGapObj?.skills?.name || null,
        topGapPoints: topGapObj?.gap || 0,
        verifiedSkillsCount,
        totalSkillsCount: scores.length,
        hasPendingEvidence,
      }
    })

    // 4. Apply Filters
    if (search) {
      items = items.filter((item: any) =>
        item.name.toLowerCase().includes(search) ||
        item.email.toLowerCase().includes(search) ||
        item.priorityGap.toLowerCase().includes(search)
      )
    }

    if (careerFilter !== 'all') {
      items = items.filter((item: any) => item.careerTargetId === careerFilter || item.careerTarget.toLowerCase().includes(careerFilter.toLowerCase()))
    }

    if (assessmentFilter === 'assessed') {
      items = items.filter((item: any) => item.isAssessed)
    } else if (assessmentFilter === 'unassessed') {
      items = items.filter((item: any) => !item.isAssessed)
    }

    if (readinessFilter === 'ready') {
      items = items.filter((item: any) => item.readiness >= 70)
    } else if (readinessFilter === 'developing') {
      items = items.filter((item: any) => item.readiness >= 50 && item.readiness < 70)
    } else if (readinessFilter === 'critical') {
      items = items.filter((item: any) => item.readiness < 50)
    }

    return NextResponse.json({
      success: true,
      data: items,
      total: items.length,
    })
  } catch (err: any) {
    console.error('Students API error:', err)
    return NextResponse.json({ success: false, error: 'Could not fetch students' }, { status: 500 })
  }
}
