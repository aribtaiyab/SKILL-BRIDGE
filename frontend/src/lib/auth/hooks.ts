'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './context'
import { UserRole } from '@/types/database'

/**
 * Client-side guard hook.
 * Redirects to /login if unauthenticated, or to the user's role dashboard if role doesn't match.
 */
export function useRequireAuth(requiredRole?: UserRole) {
  const { user, profile, role, loading, authState, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && authState === 'unauthenticated') {
      router.replace('/login')
      return
    }

    if (!loading && authState === 'authenticated' && user) {
      if (requiredRole && role && role !== requiredRole) {
        const dashboardMap: Record<string, string> = {
          student: '/student',
          industry: '/industry',
          academician: '/academia',
          institution: '/academia',
        }
        router.replace(dashboardMap[role] || '/login')
      }
    }
  }, [authState, loading, user, role, requiredRole, router])

  return { user, profile, role, loading, authState, signOut }
}
