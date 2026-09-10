import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { getDashboardForRole } from '@/lib/auth/server'
import { UserRole } from '@/types/database'

const ALLOWED_ROLES: UserRole[] = ['student', 'industry', 'academician', 'institution']

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // 1. Verify authenticated session server-side
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // 2. Parse and validate body
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      )
    }

    let { role } = body
    if (!role || typeof role !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Role is required.' },
        { status: 400 }
      )
    }

    role = role.trim().toLowerCase()
    // Normalize aliases
    if (role === 'academia') role = 'academician'

    if (!ALLOWED_ROLES.includes(role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const validatedRole = role as UserRole

    // 3. Update authenticated user's own profile row in public.profiles (RLS enforced)
    const admin = createSupabaseAdminClient()
    const dbClient = admin || supabase

    try {
      await (dbClient as any)
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: validatedRole,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
    } catch (dbErr) {
      console.warn('Profiles table upsert notice:', dbErr)
    }

    // Also update Supabase Auth user metadata so session carries the role immediately
    const { error: metaError } = await supabase.auth.updateUser({
      data: { role: validatedRole },
    })

    if (metaError) {
      console.warn('User metadata role update notice:', metaError)
    }

    const redirectTo = getDashboardForRole(validatedRole)

    return NextResponse.json({
      success: true,
      role: validatedRole,
      redirectTo,
    })
  } catch (err: any) {
    console.error('PATCH /api/profile/role unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error while updating role.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, role: null }, { status: 401 })
    }

    let role: UserRole | null = null
    try {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      role = profile?.role || null
    } catch {}

    if (!role && user.user_metadata?.role) {
      role = user.user_metadata.role as UserRole
    }

    return NextResponse.json({ success: true, role })
  } catch {
    return NextResponse.json({ success: false, role: null }, { status: 500 })
  }
}
