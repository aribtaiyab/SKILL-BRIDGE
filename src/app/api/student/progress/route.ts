import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'

// GET /api/student/progress — progress history, reassessment tracking, and growth timeline
export async function GET() {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  const supabase = await createSupabaseServerClient()

  // 1. Fetch progress history records
  const { data: progressHistory } = await (supabase as any)
    .from('progress_history')
    .select('id, score, source, recorded_at, skills(id, name, category)')
    .eq('student_id', user.id)
    .order('recorded_at', { ascending: true })

  // 2. Fetch reassessments
  const { data: reassessments } = await (supabase as any)
    .from('reassessments')
    .select('id, previous_score, new_score, recorded_at, skills(id, name)')
    .eq('student_id', user.id)
    .order('recorded_at', { ascending: false })

  // 3. Fetch completed assessment attempts
  const { data: attempts } = await (supabase as any)
    .from('assessment_attempts')
    .select('id, score, percentage, status, started_at, completed_at, assessments(title, skills(name))')
    .eq('student_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: true })

  // 4. Fetch verified skills count & current levels
  const { data: studentSkills } = await (supabase as any)
    .from('student_skills')
    .select('current_level, verification_status')
    .eq('student_id', user.id)

  const verifiedSkillsCount = (studentSkills || []).filter(
    (s: any) => s.verification_status && s.verification_status !== 'self_declared'
  ).length

  // 5. Build dynamic growth timeline from actual user attempts & progress records
  let growthTimeline: { month: string; score: number; label: string }[] = []

  if (attempts && attempts.length > 0) {
    growthTimeline = attempts.map((att: any, idx: number) => {
      const dateStr = att.completed_at ? new Date(att.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Attempt ${idx + 1}`
      const skillName = att.assessments?.skills?.name || att.assessments?.title || 'Assessment'
      return {
        month: dateStr,
        score: att.score || att.percentage || 0,
        label: `${skillName} (${att.score || att.percentage}%)`,
      }
    })
  } else if (progressHistory && progressHistory.length > 0) {
    growthTimeline = progressHistory.map((ph: any, idx: number) => {
      const dateStr = ph.recorded_at ? new Date(ph.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Record ${idx + 1}`
      return {
        month: dateStr,
        score: ph.score || 0,
        label: `${ph.skills?.name || 'Skill'} (${ph.score}%)`,
      }
    })
  }

  // Compute gain from first attempt to latest attempt
  let sixMonthGain = '0 pts'
  if (growthTimeline.length >= 2) {
    const firstScore = growthTimeline[0].score
    const latestScore = growthTimeline[growthTimeline.length - 1].score
    const diff = latestScore - firstScore
    sixMonthGain = diff >= 0 ? `+${diff} pts` : `${diff} pts`
  }

  const avgReadiness = (studentSkills && studentSkills.length > 0)
    ? Math.round(studentSkills.reduce((acc: number, s: any) => acc + (s.current_level || 0), 0) / studentSkills.length)
    : 0

  return apiSuccess({
    growthTimeline,
    progressHistory: progressHistory || [],
    reassessments: reassessments || [],
    recentAttempts: (attempts || []).slice().reverse(),
    summary: {
      overallReadiness: avgReadiness,
      verifiedSkillsCount,
      sixMonthGain,
    },
  })
}
