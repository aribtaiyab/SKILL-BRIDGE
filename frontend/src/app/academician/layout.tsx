"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AcademicianRedirectLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Seamlessly forward /academician/* routes to the official production /academia portal
    const target = pathname ? pathname.replace(/^\/academician/, '/academia') : '/academia'
    router.replace(target)
  }, [pathname, router])

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        <p className="text-xs text-[var(--color-text-muted)]">Redirecting to Academia Portal...</p>
      </div>
    </div>
  )
}