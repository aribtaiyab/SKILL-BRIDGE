import { Request, Response, NextFunction } from 'express'
import { getSupabasePublic, getSupabaseAdmin } from '../config/supabase.js'

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
    if (req.headers['x-demo-mode'] === 'true' && process.env.NODE_ENV !== 'production') {
      const demoRole = ((req.headers['x-demo-role'] as string) ||
        (req.baseUrl.includes('academician') || req.baseUrl.includes('academia') ? 'academician' :
         req.baseUrl.includes('industry') ? 'industry' :
         req.baseUrl.includes('institution') ? 'institution' : 'student')).toLowerCase()

      req.user = {
        id: (req.headers['x-user-id'] as string) || `demo-${demoRole}-id`,
        email: `${demoRole}.demo@skillbridge.edu`,
        role: demoRole,
        user_metadata: {
          full_name: demoRole === 'student' ? 'Alex Chen' : demoRole === 'academician' ? 'Dr. Sarah Jenkins' : 'TechCorp Partner',
          role: demoRole,
        },
      }
      return next()
    }
    res.status(401).json({ success: false, error: 'Authentication required' })
    return
  }

  const supabase = getSupabasePublic()
  if (!supabase) {
    res.status(503).json({ success: false, error: 'Authentication service is not configured' })
    return
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      res.status(401).json({ success: false, error: 'Invalid or expired authentication token' })
      return
    }

    let userRole = user.user_metadata?.role || (user as any).role
    let fullName = user.user_metadata?.full_name || user.user_metadata?.name

    // Check profiles table if role is not directly on metadata
    const dbClient = getSupabaseAdmin() || supabase
    if (dbClient) {
      try {
        const { data: profile } = await dbClient
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle()
        if (profile) {
          if (profile.role) userRole = profile.role
          if (profile.full_name && !fullName) fullName = profile.full_name
        }
      } catch {
        // ignore if profiles table lookup fails
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: userRole,
      user_metadata: {
        ...user.user_metadata,
        full_name: fullName,
        role: userRole,
      },
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
    if (req.headers['x-demo-mode'] === 'true') {
      const demoRole = ((req.headers['x-demo-role'] as string) || 'student').toLowerCase()
      req.user = {
        id: `demo-${demoRole}-id`,
        email: `${demoRole}.demo@skillbridge.edu`,
        role: demoRole,
        user_metadata: { role: demoRole },
      }
    }
    return next()
  }

  const supabase = getSupabasePublic()
  if (!supabase) {
    return next()
  }

  try {
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) {
      let userRole = user.user_metadata?.role || (user as any).role
      let fullName = user.user_metadata?.full_name || user.user_metadata?.name

      const dbClient = getSupabaseAdmin() || supabase
      if (dbClient) {
        try {
          const { data: profile } = await dbClient
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .maybeSingle()
          if (profile) {
            if (profile.role) userRole = profile.role
            if (profile.full_name && !fullName) fullName = profile.full_name
          }
        } catch {
          // ignore
        }
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: userRole,
        user_metadata: {
          ...user.user_metadata,
          full_name: fullName,
          role: userRole,
        },
      }
      req.token = token
    }
  } catch {
    // ignore optional auth error
  }
  next()
}

export function requireRole(...allowedRoles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }

    let userRole = (req.user.role || req.user.user_metadata?.role || '').toLowerCase()
    
    // Fallback: If role wasn't resolved yet, try querying profiles table
    if (!userRole && req.user.id) {
      try {
        const dbClient = getSupabaseAdmin() || getSupabasePublic()
        if (dbClient) {
          const { data: profile } = await dbClient
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .maybeSingle()
          if (profile?.role) {
            userRole = profile.role.toLowerCase()
            req.user.role = userRole
            if (req.user.user_metadata) req.user.user_metadata.role = userRole
          }
        }
      } catch {
        // ignore
      }
    }

    if (!userRole) {
      userRole = 'student'
    }

    // Check direct match, admin bypass, or aliases (academician <-> faculty/institution/academia, industry <-> recruiter/employer)
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase())
    const isAllowed =
      userRole === 'admin' ||
      normalizedAllowed.includes(userRole) ||
      (normalizedAllowed.includes('academician') && (userRole === 'faculty' || userRole === 'professor' || userRole === 'institution' || userRole === 'academia' || userRole === 'academician' || userRole === 'educator')) ||
      (normalizedAllowed.includes('institution') && (userRole === 'academician' || userRole === 'faculty' || userRole === 'professor' || userRole === 'academia' || userRole === 'institution')) ||
      (normalizedAllowed.includes('industry') && (userRole === 'recruiter' || userRole === 'partner' || userRole === 'employer' || userRole === 'company')) ||
      (normalizedAllowed.includes('student') && (userRole === 'learner' || userRole === 'candidate'))

    if (!isAllowed) {
      res.status(403).json({ success: false, error: `Forbidden: requires ${allowedRoles.join(' or ')} role` })
      return
    }
    next()
  }
}

