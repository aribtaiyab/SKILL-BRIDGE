import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

export interface AcademicianAuthContext {
  user: User
  profile: {
    id: string
    full_name: string
    email: string
    role: string
    avatar_url: string | null
  }
  academicianProfile: {
    institution_id: string | null
    department_id: string | null
    designation: string | null
    teaching_area: string | null
  } | null
  adminSupabase: ReturnType<typeof createSupabaseAdminClient>
}

export type AuthGuardResult = 
  | { success: true; context: AcademicianAuthContext }
  | { success: false; status: number; error: string }

/**
 * Validates that the request comes from an authenticated user with the 'academician' role.
 * Retrieves their institution and department associations and provides the admin client
 * for authorized institutional data aggregation.
 */
export async function requireAcademicianAuth(): Promise<AuthGuardResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, status: 401, error: 'Authentication required. Please sign in.' }
    }

    const adminSupabase = createSupabaseAdminClient()

    // 1. Verify user profile and role
    let profile: any = null
    try {
      const { data, error: profileError } = await (adminSupabase as any)
        .from('profiles')
        .select('id, full_name, email, role, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
      if (!profileError && data) {
        profile = data
      }
    } catch {
      // Table unmigrated
    }

    const userRole = (profile?.role || user.user_metadata?.role || 'academician').toLowerCase()

    if (!profile) {
      profile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Academician',
        email: user.email || '',
        role: userRole,
        avatar_url: user.user_metadata?.avatar_url || null,
      }
    }

    const allowedRoles = ['academician', 'institution', 'faculty', 'professor', 'admin', 'academia', 'educator']
    if (!allowedRoles.includes(userRole)) {
      return { success: false, status: 403, error: 'Unauthorized. Academician or institution access required.' }
    }

    // 2. Fetch academician specific profile details
    const { data: acadProfile } = await (adminSupabase as any)
      .from('academician_profiles')
      .select('institution_id, department_id, designation, teaching_area')
      .eq('profile_id', user.id)
      .maybeSingle()

    return {
      success: true,
      context: {
        user,
        profile,
        academicianProfile: acadProfile || null,
        adminSupabase,
      }
    }
  } catch (err: any) {
    console.error('requireAcademicianAuth exception:', err)
    return { success: false, status: 500, error: 'Internal authorization error.' }
  }
}
