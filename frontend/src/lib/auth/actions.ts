'use server'

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { getDashboardForRole } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { UserRole } from '@/types/database'

// ─── Validation Helpers ───────────────────────────────────────────────────────

function validateEmail(email: string): string | null {
  if (!email || !email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.'
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.'
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  return null
}

function humanizeAuthError(error: { message?: string } | null): string {
  if (!error?.message) return 'Something went wrong. Please try again.'
  const msg = error.message.toLowerCase()

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Incorrect email or password. Please try again.'
  }
  if (msg.includes('email already registered') || msg.includes('user already registered')) {
    return 'An account with this email already exists. Please sign in instead.'
  }
  if (msg.includes('password should be at least')) {
    return 'Password must be at least 8 characters long.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Please verify your email before signing in. Check your inbox.'
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment before trying again.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}

// ─── Auth Action Results ───────────────────────────────────────────────────────

export interface ActionResult {
  success: boolean
  error?: string
  redirectTo?: string
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const fullName = String(formData.get('fullName') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const confirmPassword = String(formData.get('confirmPassword') || '')

  // Validate
  if (!fullName || fullName.length < 2) {
    return { success: false, error: 'Full name must be at least 2 characters.' }
  }

  const emailError = validateEmail(email)
  if (emailError) return { success: false, error: emailError }

  const passwordError = validatePassword(password)
  if (passwordError) return { success: false, error: passwordError }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' }
  }

  try {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return { success: false, error: humanizeAuthError(error) }
    }

    if (!data.user) {
      return { success: false, error: 'Could not create account. Please try again.' }
    }

    // If email confirmation is required, the session will be null
    if (data.session === null) {
      return { success: true, redirectTo: '/auth/verify-email' }
    }

    // Session is active — go to onboarding
    return { success: true, redirectTo: '/onboarding' }
  } catch {
    return { success: false, error: 'We couldn\'t connect right now. Please try again.' }
  }
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  const emailError = validateEmail(email)
  if (emailError) return { success: false, error: emailError }

  if (!password) return { success: false, error: 'Password is required.' }

  try {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: humanizeAuthError(error) }
    }

    if (!data.user || !data.session) {
      return { success: false, error: 'Login succeeded, but your session could not be established.' }
    }

    return resolveAuthenticatedRedirect(supabase, data.user.id)
  } catch {
    return { success: false, error: 'Couldn\'t reach the authentication service. Please check your connection and try again.' }
  }
}

async function resolveAuthenticatedRedirect(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string): Promise<ActionResult> {
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const role = (profile as { role?: UserRole })?.role || null
  let onboardingComplete = false
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
        .select('onboarding_completed')
        .eq('profile_id', userId)
        .single()
      onboardingComplete = Boolean((roleProfile as { onboarding_completed?: boolean })?.onboarding_completed)
    }
  }

  if (!role || !onboardingComplete) return { success: true, redirectTo: '/onboarding' }
  return { success: true, redirectTo: getDashboardForRole(role as UserRole) }
}

export async function resolveLoginRedirectAction(): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return { success: false, error: 'Signed in, but your session could not be restored. Please try again.' }
    return resolveAuthenticatedRedirect(supabase, user.id)
  } catch {
    return { success: false, error: 'You\'re signed in, but we couldn\'t load your account. Please refresh.' }
  }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') || '').trim()

  const emailError = validateEmail(email)
  if (emailError) return { success: false, error: emailError }

  try {
    const supabase = await createSupabaseServerClient()

    await supabase.auth.resetPasswordForEmail(email)

    return { success: true }
  } catch {
    return { success: false, error: 'We couldn\'t send the reset email. Please try again.' }
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get('password') || '')
  const confirmPassword = String(formData.get('confirmPassword') || '')

  const passwordError = validatePassword(password)
  if (passwordError) return { success: false, error: passwordError }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' }
  }

  try {
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return { success: false, error: humanizeAuthError(error) }
    }

    return { success: true, redirectTo: '/login?reset=success' }
  } catch {
    return { success: false, error: 'Password reset failed. The link may have expired.' }
  }
}

// ─── Complete Onboarding ──────────────────────────────────────────────────────

interface OnboardingStudentData {
  educationLevel: string
  institution: string
  department: string
  graduationYear: string
  experienceLevel: string
  careerTargetId?: string
  location?: string
}

interface OnboardingIndustryData {
  organizationName: string
  industryType: string
  organizationSize: string
  location: string
  website?: string
  description?: string
}

interface OnboardingAcademicianData {
  institution: string
  department: string
  designation: string
  teachingArea: string
  mentorshipInterest: boolean
}

interface OnboardingInstitutionData {
  institutionName: string
  institutionType: string
  location: string
  website?: string
  description?: string
}

export async function completeOnboardingAction(
  role: UserRole,
  data: OnboardingStudentData | OnboardingIndustryData | OnboardingAcademicianData | OnboardingInstitutionData
): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Session expired. Please sign in again.' }
    }

    // 1. Update user metadata in Supabase Auth so session immediately has role and onboarding_completed
    await supabase.auth.updateUser({
      data: {
        role,
        onboarding_completed: true,
        ...data,
      },
    })

    const admin = createSupabaseAdminClient()
    const dbClient = admin || supabase

    // 2. Ensure central profile record exists in public.profiles
    const profilePayload: any = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      role: role,
      updated_at: new Date().toISOString(),
    }
    if ((data as any).location) {
      profilePayload.location = (data as any).location
    }

    try {
      await (dbClient as any)
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
    } catch (e) {
      console.warn('Profiles table upsert notice:', e)
    }

    // 3. Create role-specific profile record
    try {
      if (role === 'student') {
        const d = data as OnboardingStudentData
        await (dbClient as any)
          .from('student_profiles')
          .upsert({
            profile_id: user.id,
            education: d.educationLevel || null,
            graduation_year: d.graduationYear ? parseInt(d.graduationYear) : null,
            experience_level: d.experienceLevel || null,
            onboarding_completed: true,
          }, { onConflict: 'profile_id' })
      } else if (role === 'industry') {
        const d = data as OnboardingIndustryData
        await (dbClient as any)
          .from('industry_profiles')
          .upsert({
            profile_id: user.id,
            organization_name: d.organizationName || 'My Organization',
            industry_type: d.industryType || 'Technology',
            organization_size: d.organizationSize || null,
            location: d.location || null,
            website: d.website || null,
            description: d.description || null,
            onboarding_completed: true,
          }, { onConflict: 'profile_id' })
      } else if (role === 'academician') {
        const d = data as OnboardingAcademicianData
        await (dbClient as any)
          .from('academician_profiles')
          .upsert({
            profile_id: user.id,
            designation: d.designation || null,
            teaching_area: d.teachingArea || null,
            mentorship_interest: d.mentorshipInterest,
            onboarding_completed: true,
          }, { onConflict: 'profile_id' })
      } else if (role === 'institution') {
        const d = data as OnboardingInstitutionData
        await (dbClient as any)
          .from('institution_profiles')
          .upsert({
            profile_id: user.id,
            institution_name: d.institutionName || 'My Institution',
            institution_type: d.institutionType || 'University',
            location: d.location || null,
            website: d.website || null,
            description: d.description || null,
            onboarding_completed: true,
          }, { onConflict: 'profile_id' })
      }

      // Ensure user_settings record exists
      await (dbClient as any)
        .from('user_settings')
        .upsert({ user_id: user.id }, { onConflict: 'user_id' })
    } catch (e) {
      console.warn('Role profiles table upsert notice:', e)
    }

    const dashboard = getDashboardForRole(role)
    return { success: true, redirectTo: dashboard }
  } catch {
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

// ─── Update Role (Step 1 of onboarding) ──────────────────────────────────────

export async function saveRoleAction(role: UserRole): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Session expired. Please sign in again.' }
    }

    // Update user metadata in Supabase Auth
    await supabase.auth.updateUser({
      data: { role },
    })

    const admin = createSupabaseAdminClient()
    const dbClient = admin || supabase

    try {
      await (dbClient as any)
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: role,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
    } catch (e) {
      console.warn('saveRoleAction table notice:', e)
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
