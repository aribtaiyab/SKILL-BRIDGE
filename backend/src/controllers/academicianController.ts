import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'

export async function getCohortStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('student_profiles')
      .select('profile_id, education, graduation_year, profiles(full_name, email, avatar_url), career_targets(name), student_skills(current_level, verification_status, skills(name))')

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch students' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function getStudentDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(404).json({ success: false, error: 'Student not found' })

    const { data, error } = await supabase
      .from('student_profiles')
      .select('profile_id, education, graduation_year, profiles(full_name, email, avatar_url), career_targets(name), student_skills(current_level, verification_status, skills(name)), evidence(*)')
      .eq('profile_id', id)
      .single()

    if (error || !data) return res.status(404).json({ success: false, error: 'Student not found' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getAcademicianInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.status(200).json({
      data: {
        totalStudents: 142,
        averageCohortReadiness: 76,
        topGaps: [
          { skill: 'Docker & Kubernetes', count: 48 },
          { skill: 'System Design', count: 35 },
          { skill: 'GraphQL', count: 29 },
        ],
        verificationQueueCount: 14,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getMentorshipSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    const supabase = getSupabaseAdmin()
    if (!supabase || !user) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .select('*, student_profiles(profiles(full_name, email))')
      .eq('academician_id', user.id)

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch mentorship sessions' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function createMentorshipSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(201).json({ data: { id: 'demo-session-id', ...body, academician_id: user.id } })

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .insert({ academician_id: user.id, ...body, status: 'scheduled' })
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not create session' })
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getWorkshops(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase.from('workshops').select('*')
    if (error) return res.status(500).json({ success: false, error: 'Could not fetch workshops' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function createWorkshop(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(201).json({ data: { id: 'demo-ws-id', ...body, instructor_id: user.id } })

    const { data, error } = await supabase
      .from('workshops')
      .insert({ instructor_id: user.id, ...body })
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not create workshop' })
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}
