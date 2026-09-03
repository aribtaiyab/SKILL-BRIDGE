import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'

export async function getApplications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('applications')
      .select('*, opportunities(id, title, opportunity_type, location, industry_profiles(organization_name))')
      .eq('student_id', user.id)

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch applications' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function submitApplication(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const { opportunity_id, cover_letter, match_score_at_application } = req.body || {}
    if (!opportunity_id) return res.status(422).json({ success: false, error: 'opportunity_id is required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(201).json({ data: { id: 'demo-app-id', opportunity_id, student_id: user.id } })

    const { data, error } = await supabase
      .from('applications')
      .insert({
        opportunity_id,
        student_id: user.id,
        cover_letter,
        match_score_at_application: match_score_at_application || 80,
        status: 'applied',
      })
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not submit application' })
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}
