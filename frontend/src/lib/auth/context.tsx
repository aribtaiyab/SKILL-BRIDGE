'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
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

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Use singleton browser client instance
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, onboarding_completed, avatar_url')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data as UserProfile)
      } else {
        setProfile(null)
      }
    } catch {
      setProfile(null)
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
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
    if (typeof window !== 'undefined') {
      document.cookie = 'sb_demo_mode=; path=/; max-age=0'
      sessionStorage.removeItem('sb_demo_mode')
      sessionStorage.removeItem('sb_demo_role')
    }
    router.push('/login')
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
        fetchProfile(session.user.id).finally(() => {
          if (isMounted) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }).catch(() => {
      if (isMounted) setLoading(false)
    })

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role: profile?.role ?? null,
      loading,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

