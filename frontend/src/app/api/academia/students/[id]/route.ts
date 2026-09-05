import { NextRequest, NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { id: studentId } = await params
  if (!studentId) {
    return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 })
  }

  const { academicianProfile, adminSupabase, user } = auth.context
  const institutionId = academicianProfile?.institution_id

  try {
    // 1. Fetch student profile and verify tenancy
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
        profiles!inner(id, full_name, email, avatar_url, phone, bio, location),
        institutions(name),
        departments(name),
        career_targets(id, name, slug, description)
      `)
      .eq('profile_id', studentId)

    if (institutionId) {
      query = query.eq('institution_id', institutionId)
    }

    const { data: student, error: stdErr } = await query.maybeSingle()

    if (stdErr || !student) {
      return NextResponse.json({ success: false, error: 'Student not found or unauthorized' }, { status: 404 })
    }

    // 2. Fetch student's skill scores, target requirements, gaps, assessment attempts, evidence, and mentorships
    const targetCareerId = student.target_career_id

    const [scoresRes, reqsRes, attemptsRes, reassessRes, evidenceRes, mentorshipRes, workshopsRes] = await Promise.all([
      (adminSupabase as any)
        .from('skill_scores')
        .select('skill_id, current_level, verification_status, last_assessed_at, skills(id, name, category, description)')
        .eq('student_id', studentId),
      targetCareerId ? (adminSupabase as any)
        .from('career_target_skills')
        .select('skill_id, required_level, importance, skills(id, name, category)')
        .eq('career_target_id', targetCareerId) : Promise.resolve({ data: [] }),
      (adminSupabase as any)
        .from('assessment_attempts')
        .select('id, assessment_id, score, status, started_at, completed_at, assessments(title, type)')
        .eq('student_id', studentId)
        .order('started_at', { ascending: false })
        .limit(10),
      (adminSupabase as any)
        .from('reassessments')
        .select('id, skill_id, previous_score, new_score, improvement_points, reassessed_at, skills(name)')
        .eq('student_id', studentId)
        .order('reassessed_at', { ascending: false }),
      (adminSupabase as any)
        .from('skill_evidence')
        .select('id, skill_id, title, description, evidence_type, github_url, live_demo_url, verification_status, created_at, skills(name)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false }),
      (adminSupabase as any)
        .from('mentorships')
        .select('id, skill_id, status, start_date, end_date, notes, created_at, skills(name), profiles!mentorships_academician_id_fkey(full_name, email)')
        .eq('student_id', studentId),
      (adminSupabase as any)
        .from('workshop_participants')
        .select('workshop_id, status, enrolled_at, attended_at, workshops(title, date, duration, skills(name))')
        .eq('student_id', studentId)
    ])

    const scores = scoresRes.data || []
    const requirements = reqsRes.data || []
    const attempts = attemptsRes.data || []
    const reassessments = reassessRes.data || []
    const evidenceList = evidenceRes.data || []
    const mentorships = mentorshipRes.data || []
    const workshops = workshopsRes.data || []

    // 3. Calculate skill gaps against target career
    const scoreMap = new Map<string, any>()
    scores.forEach((s: any) => scoreMap.set(s.skill_id, s))

    const skillsBreakdown = requirements.map((req: any) => {
      const scoreObj = scoreMap.get(req.skill_id)
      const currentLevel = scoreObj?.current_level || 0
      const isAssessed = !!scoreObj
      const gap = Math.max(0, req.required_level - currentLevel)
      const severity = gap >= 15 ? 'critical' : gap > 0 ? 'needs_improvement' : 'ready'

      return {
        skillId: req.skill_id,
        skillName: req.skills?.name || 'Skill',
        category: req.skills?.category || 'Technical',
        requiredLevel: req.required_level,
        currentLevel,
        isAssessed,
        gap,
        severity,
        importance: req.importance || 'High',
        verificationStatus: scoreObj?.verification_status || 'unassessed',
        lastAssessedAt: scoreObj?.last_assessed_at || null,
      }
    })

    // Priority gap
    const criticalGaps = skillsBreakdown.filter((s: any) => s.severity === 'critical')
    const nearReadyGaps = skillsBreakdown.filter((s: any) => s.severity === 'needs_improvement')
    const priorityGap = criticalGaps[0] || nearReadyGaps[0] || null

    // Overall readiness
    const totalAssessed = skillsBreakdown.filter((s: any) => s.isAssessed).length
    const avgScore = totalAssessed > 0
      ? Math.round(skillsBreakdown.reduce((sum: number, s: any) => sum + s.currentLevel, 0) / skillsBreakdown.length)
      : 0

    // Recommended action
    let recommendedAction = 'Student has fulfilled benchmark requirements. Direct towards advanced projects or industry opportunities.'
    if (priorityGap) {
      recommendedAction = `Prioritize closing the ${priorityGap.gap}-point gap in ${priorityGap.skillName}. Recommended: 1-on-1 coaching or assign remedial workshop.`
    }

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.profile_id,
          name: student.profiles?.full_name || 'Student',
          email: student.profiles?.email || '',
          avatarUrl: student.profiles?.avatar_url || null,
          phone: student.profiles?.phone || null,
          bio: student.profiles?.bio || null,
          location: student.profiles?.location || null,
          education: student.education || 'Undergraduate',
          graduationYear: student.graduation_year || 2026,
          institution: student.institutions?.name || 'Institution',
          department: student.departments?.name || 'Department',
        },
        careerTarget: student.career_targets ? {
          id: student.career_targets.id,
          name: student.career_targets.name,
          description: student.career_targets.description,
          readiness: avgScore,
          readinessCategory: avgScore >= 85 ? 'Highly Ready' : avgScore >= 70 ? 'Ready' : avgScore >= 55 ? 'Developing' : avgScore >= 40 ? 'Early Progress' : 'Not Ready',
        } : null,
        skillsBreakdown,
        priorityGap,
        recommendedAction,
        assessmentHistory: attempts.map((a: any) => ({
          id: a.id,
          title: a.assessments?.title || 'Skill Assessment',
          type: a.assessments?.type || 'knowledge',
          score: a.score,
          status: a.status,
          completedAt: a.completed_at || a.started_at,
        })),
        reassessments: reassessments.map((r: any) => ({
          id: r.id,
          skillName: r.skills?.name || 'Skill',
          previousScore: r.previous_score,
          newScore: r.new_score,
          improvementPoints: r.improvement_points,
          reassessedAt: r.reassessed_at,
        })),
        evidence: evidenceList.map((e: any) => ({
          id: e.id,
          skillName: e.skills?.name || 'Skill',
          title: e.title,
          description: e.description,
          type: e.evidence_type,
          githubUrl: e.github_url,
          liveDemoUrl: e.live_demo_url,
          verificationStatus: e.verification_status,
          submittedAt: e.created_at,
        })),
        mentorshipHistory: mentorships.map((m: any) => ({
          id: m.id,
          skillName: m.skills?.name || 'General',
          mentorName: m.profiles?.full_name || 'Faculty',
          status: m.status,
          notes: m.notes,
          startDate: m.start_date,
          endDate: m.end_date,
        })),
        workshopParticipation: workshops.map((w: any) => ({
          workshopId: w.workshop_id,
          title: w.workshops?.title || 'Workshop',
          skillName: w.workshops?.skills?.name || 'Technical',
          status: w.status,
          enrolledAt: w.enrolled_at,
          attendedAt: w.attended_at,
        })),
      }
    })
  } catch (err: any) {
    console.error('Student detail API error:', err)
    return NextResponse.json({ success: false, error: 'Could not fetch student detail' }, { status: 500 })
  }
}
