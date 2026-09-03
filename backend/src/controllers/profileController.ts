import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return res.status(200).json({
        data: {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Demo User',
          email: user.email || 'user@skillbridge.local',
          role: user.role || 'student',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      return res.status(404).json({ success: false, error: 'Profile not found.' })
    }

    res.status(200).json({ data: profile })
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    const body = req.body || {}
    const allowedFields: Record<string, unknown> = {}

    if (body.full_name !== undefined) {
      const name = String(body.full_name).trim()
      if (name.length < 2 || name.length > 100) {
        return res.status(422).json({ success: false, error: 'Full name must be between 2 and 100 characters.' })
      }
      allowedFields.full_name = name
    }
    if (body.avatar_url !== undefined) {
      allowedFields.avatar_url = String(body.avatar_url)
    }

    if (Object.keys(allowedFields).length === 0) {
      return res.status(422).json({ success: false, error: 'No valid fields provided to update.' })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return res.status(200).json({
        data: {
          id: user.id,
          ...allowedFields,
          email: user.email,
          role: user.role,
        },
      })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...allowedFields, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('id, full_name, email, role, avatar_url')
      .single()

    if (error) {
      return res.status(500).json({ success: false, error: 'Could not update profile. Please try again.' })
    }

    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}
