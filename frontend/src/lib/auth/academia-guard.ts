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
    const { data: profile, error: profileError } = await (adminSupabase as any)
      .from('profiles')
      .select('id, full_name, email, role, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return { success: false, status: 403, error: 'User profile not found.' }
    }

    if (profile.role !== 'academician') {
      return { success: false, status: 403, error: 'Unauthorized. Academician access required.' }
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
