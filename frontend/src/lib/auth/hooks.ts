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
  const { user, profile, role, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
        return
      }

      if (requiredRole && role && role !== requiredRole) {
        const dashboardMap: Record<string, string> = {
          student: '/student',
          industry: '/industry',
          academician: '/academician',
          institution: '/institution',
        }
        router.replace(dashboardMap[role] || '/login')
      }
    }
  }, [loading, user, role, requiredRole, router])

  return { user, profile, role, loading, signOut }
}
