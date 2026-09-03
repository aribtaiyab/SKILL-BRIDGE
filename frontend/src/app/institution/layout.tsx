"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    router.replace('/academician')
  }, [router])

  return null
}