"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DashboardRoleRedirect() {
  const router = useRouter()
  const params = useParams()
  const role = String(params?.role || '').toLowerCase()

  useEffect(() => {
    if (role === 'academia' || role === 'academician' || role === 'institution') {
      router.replace('/academia')
    } else if (role === 'industry') {
      router.replace('/industry')
    } else if (role === 'student') {
      router.replace('/student')
    } else {
      router.replace('/select-role')
    }
  }, [role, router])

  return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  )
}
