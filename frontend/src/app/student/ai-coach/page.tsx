"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Compass, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RedirectToCareerNavigator() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/student/career-navigator')
  }, [router])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] text-[var(--color-accent)] shadow-sm">
        <Compass className="h-6 w-6 animate-spin" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900">Redirecting to Career Navigator...</h2>
        <p className="text-xs text-slate-500">
          AI Skill Coach has been elevated to Career Navigator: "Don't guess your career. Compare your paths."
        </p>
      </div>
      <Link href="/student/career-navigator">
        <Button size="sm" className="rounded-xl text-xs font-semibold">
          Open Career Navigator Now →
        </Button>
      </Link>
    </div>
  )
}