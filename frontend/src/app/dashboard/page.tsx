"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import { Loader2 } from "lucide-react"

export default function DashboardRedirect() {
  const router = useRouter()
  const { profile, loading } = useAuth()
  const { isDemo, demoRole } = useDemo()

  useEffect(() => {
    if (loading) return

    if (isDemo) {
      if (demoRole === 'industry') router.replace('/industry?demo=true')
      else if (demoRole === 'academician' || demoRole === 'institution') router.replace('/academia?demo=true')
      else router.replace('/student?demo=true')
      return
    }

    if (profile?.role) {
      if (profile.role === 'industry') router.replace('/industry')
      else if (profile.role === 'academician' || profile.role === 'institution') router.replace('/academia')
      else router.replace('/student')
    } else {
      router.replace('/select-role')
    }
  }, [loading, profile, isDemo, demoRole, router])

  return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  )
}
