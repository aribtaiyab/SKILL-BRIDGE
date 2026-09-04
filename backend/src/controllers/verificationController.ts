import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'

export async function getVerificationQueue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('status', 'under_review')

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch verification queue' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function approveVerification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    const { id } = req.params
    const { feedback } = req.body || {}

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { id, status: 'approved' } })

    const { data: evidence, error: evError } = await supabase
      .from('evidence')
      .update({
        status: 'verified',
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
        reviewer_feedback: feedback,
      })
      .eq('id', id)
      .select()
      .single()

    if (evError || !evidence) return res.status(500).json({ success: false, error: 'Could not approve evidence' })

    // Upgrade student skill status to evidence_verified
    res.status(200).json({ data: evidence })
  } catch (err) {
    next(err)
  }
}

export async function rejectVerification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    const { id } = req.params
    const { feedback } = req.body || {}

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { id, status: 'rejected' } })

    const { data, error } = await supabase
      .from('evidence')
      .update({
        status: 'rejected',
        verified_by: user?.id,
        reviewer_feedback: feedback,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not reject evidence' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function clarifyVerification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    const { id } = req.params
    const { feedback } = req.body || {}

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { id, status: 'clarification_requested' } })

    const { data, error } = await supabase
      .from('evidence')
      .update({
        status: 'needs_clarification',
        verified_by: user?.id,
        reviewer_feedback: feedback,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not request clarification' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}
