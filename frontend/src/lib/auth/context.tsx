'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { UserRole } from '@/types/database'

interface UserProfile {
  id: string
  full_name: string | null
  email: string
  role: UserRole | null
  onboarding_completed: boolean
  avatar_url: string | null
}

export type AuthState = 'checking' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  authState: AuthState
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  authState: 'checking',
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authState, setAuthState] = useState<AuthState>('checking')

  // Use singleton browser client instance
  const fetchProfile = useCallback(async (userId: string, fallbackUser?: User | null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, onboarding_completed, avatar_url')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data as UserProfile)
        return
      }
    } catch {
      // ignore table query error
    }

    // Graceful fallback to session user metadata if profiles table is unseeded/unavailable
    if (fallbackUser && fallbackUser.id === userId) {
      const meta = fallbackUser.user_metadata || {}
      setProfile({
        id: fallbackUser.id,
        full_name: (meta.full_name as string) || (fallbackUser.email?.split('@')[0]) || 'User',
        email: fallbackUser.email || '',
        role: (meta.role as UserRole) || null,
        onboarding_completed: Boolean(meta.onboarding_completed),
        avatar_url: (meta.avatar_url as string) || null,
      })
    } else {
      setProfile(null)
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id, user)
  }, [user, fetchProfile])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Sign out error:', err)
    }
    setUser(null)
    setSession(null)
    setProfile(null)
    setAuthState('unauthenticated')
    setLoading(false)
    if (typeof window !== 'undefined') {
      document.cookie = 'sb_demo_mode=; path=/; max-age=0'
      sessionStorage.removeItem('sb_demo_mode')
      sessionStorage.removeItem('sb_demo_role')
    }
    router.replace('/login')
    router.refresh()
  }, [supabase, router])

  useEffect(() => {
    let isMounted = true

    // 1. Check initial session from storage/cookies
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setAuthState('authenticated')
        fetchProfile(session.user.id, session.user).finally(() => {
          if (isMounted) setLoading(false)
        })
      } else {
        setAuthState('unauthenticated')
        setLoading(false)
      }
    }).catch(() => {
      if (isMounted) {
        setAuthState('unauthenticated')
        setLoading(false)
      }
    })

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          setAuthState('authenticated')
          await fetchProfile(session.user.id, session.user)
        } else {
          setProfile(null)
          setAuthState('unauthenticated')
        }

        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const authValue = useMemo(() => ({
    user,
    session,
    profile,
    role: profile?.role ?? null,
    loading,
    authState,
    signOut,
    refreshProfile,
  }), [user, session, profile, loading, authState, signOut, refreshProfile])

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}


