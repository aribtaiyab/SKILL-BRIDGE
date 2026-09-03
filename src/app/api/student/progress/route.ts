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
    .order('completed_at', { ascending: false })

  // 4. Default 6-month growth timeline
  const growthTimeline = [
    { month: 'Month 1', score: 45, label: 'Node.js Initial' },
    { month: 'Month 2', score: 55, label: 'Async Foundations' },
    { month: 'Month 3', score: 65, label: 'Node.js Practical' },
    { month: 'Month 4', score: 72, label: 'REST APIs Verified' },
    { month: 'Month 5', score: 82, label: 'SQL Architecture' },
    { month: 'Current', score: 85, label: 'Verified Readiness' },
  ]

  return apiSuccess({
    growthTimeline,
    progressHistory: progressHistory || [],
    reassessments: reassessments || [],
    recentAttempts: attempts || [],
    summary: {
      overallReadiness: 78,
      verifiedSkillsCount: 4,
      sixMonthGain: '+15%',
    },
  })
}
