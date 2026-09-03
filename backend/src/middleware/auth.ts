import { Request, Response, NextFunction } from 'express'
import { getSupabasePublic } from '../config/supabase.js'

export interface AuthenticatedUser {
  id: string
  email?: string
  role?: string
  user_metadata?: Record<string, any>
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser
  token?: string
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  let token: string | undefined

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  } else if (req.cookies && req.cookies.sb_access_token) {
    token = req.cookies.sb_access_token
  }

  if (!token) {
    // If running in development / test without auth header, check demo header
    if (req.headers['x-demo-mode'] === 'true') {
      req.user = {
        id: 'demo-student-id',
        email: 'alex.chen@university.edu',
        role: 'student',
      }
      return next()
    }
    res.status(401).json({ success: false, error: 'Authentication required' })
    return
  }

  const supabase = getSupabasePublic()
  if (!supabase) {
    // Fallback if supabase not configured locally
    req.user = {
      id: 'demo-user-id',
      email: 'user@skillbridge.local',
      role: 'student',
    }
    req.token = token
    return next()
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      res.status(401).json({ success: false, error: 'Invalid or expired authentication token' })
      return
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || (user as any).role,
      user_metadata: user.user_metadata,
    }
    req.token = token
    next()
  } catch (err: any) {
    res.status(401).json({ success: false, error: 'Authentication failed: ' + (err.message || 'Unknown error') })
  }
}

export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  let token: string | undefined

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  if (!token) {
    return next()
  }

  const supabase = getSupabasePublic()
  if (!supabase) {
    return next()
  }

  try {
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || (user as any).role,
        user_metadata: user.user_metadata,
      }
      req.token = token
    }
  } catch {
    // ignore optional auth error
  }
  next()
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }

    const userRole = req.user.role || req.user.user_metadata?.role
    if (userRole && !allowedRoles.includes(userRole) && userRole !== 'admin') {
      res.status(403).json({ success: false, error: `Forbidden: requires ${allowedRoles.join(' or ')} role` })
      return
    }
    next()
  }
}
