/**
 * Server-side auth utilities.
 * Import these only in Server Components, Server Actions, and Route Handlers.
 * Never import in Client Components.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { UserRole } from '@/types/database'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
}

export interface AuthProfile {
  id: string
  full_name: string | null
  email: string
  role: UserRole | null
  onboarding_completed: boolean
  avatar_url: string | null
}

/**
 * Gets the currently authenticated Supabase user server-side.
 * Returns null if unauthenticated.
 */
export async function getServerUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return { id: user.id, email: user.email! }
  } catch {
    return null
  }
}

/**
 * Gets the profile record for the currently authenticated user.
 * Also checks the role-specific profile to determine if onboarding is done.
 * Returns null if unauthenticated or profile not found.
 */
export async function getServerProfile(): Promise<AuthProfile | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return null

    const { data: profileData, error } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email, role, avatar_url')
      .eq('id', user.id)
      .single()

    if (error || !profileData) return null

    const profile = profileData as {
      id: string
      full_name: string | null
      email: string
      role: UserRole | null
      avatar_url: string | null
    }

    // Check if role-specific profile exists to determine onboarding completion
    let onboarding_completed = false
    const role = profile.role
    if (role) {
      const roleTableMap: Record<string, string> = {
        student: 'student_profiles',
        industry: 'industry_profiles',
        academician: 'academician_profiles',
        institution: 'institution_profiles',
      }
      const table = roleTableMap[role]
      if (table) {
        const { data: roleProfile } = await (supabase as any)
          .from(table)
          .select('profile_id, onboarding_completed')
          .eq('profile_id', user.id)
          .single()
        onboarding_completed = Boolean(roleProfile?.onboarding_completed)
      }
    }

    return {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      role: role,
      onboarding_completed,
      avatar_url: profile.avatar_url,
    }
  } catch {
    return null
  }
}

/**
 * Requires the user to be authenticated. Redirects to /login if not.
 * Returns the authenticated user and their profile.
 */
export async function requireAuth(): Promise<{ user: AuthUser; profile: AuthProfile }> {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const profile = await getServerProfile()
  if (!profile) redirect('/login')

  return { user, profile }
}

/**
 * Requires the user to have a specific role. Returns 403 redirect if wrong role.
 */
export async function requireRole(requiredRole: UserRole): Promise<{ user: AuthUser; profile: AuthProfile }> {
  const { user, profile } = await requireAuth()

  if (profile.role !== requiredRole) {
    const dashboardMap: Record<string, string> = {
      student: '/student',
      industry: '/industry',
      academician: '/academician',
      institution: '/institution',
    }
    redirect(dashboardMap[profile.role ?? 'student'] ?? '/login')
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return { user, profile }
}

/**
 * Gets the appropriate dashboard URL for a given role.
 */
export function getDashboardForRole(role: UserRole | null): string {
  const map: Record<string, string> = {
    student: '/student',
    industry: '/industry',
    academician: '/academician',
    institution: '/institution',
  }
  return map[role ?? ''] ?? '/onboarding'
}

/**
 * Validates a UUID string.
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Creates a standardized API success response.
 */
export function apiSuccess<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

/**
 * Creates a standardized API error response.
 */
export function apiError(code: string, message: string, status: number) {
  return Response.json({
    success: false,
    error: { code, message }
  }, { status })
}
