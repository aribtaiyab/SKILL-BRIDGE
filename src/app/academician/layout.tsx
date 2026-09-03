"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { DemoBar } from "@/components/layout/demo-bar"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import { LayoutDashboard, Users, AlertTriangle, BookOpen, TrendingUp, Briefcase, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AcademicianLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const { isDemo, academicianData } = useDemo()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && !isDemo) router.replace('/login')
  }, [loading, user, isDemo, router])

  const navItems = [
    { href: "/academician", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/academician/students", label: "Students", icon: <Users size={20} /> },
    { href: "/academician/skill-gaps", label: "Skill Gaps", icon: <AlertTriangle size={20} /> },
    { href: "/academician/mentorship", label: "Mentorship", icon: <BookOpen size={20} /> },
    { href: "/academician/progress", label: "Progress", icon: <TrendingUp size={20} /> },
    { href: "/academician/industry", label: "Industry Demand", icon: <Briefcase size={20} /> },
  ]

  const displayName = isDemo ? 'Dr. Sarah Mitchell (Faculty)' : (profile?.full_name || user?.email?.split('@')[0] || 'Academician')
  const displayEmail = isDemo ? 'faculty.cs@apex.edu' : (user?.email || '')
  const initials = isDemo ? 'SM' : (profile?.full_name || 'DR').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  if (loading && !isDemo) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--color-background)] overflow-hidden">
      <DemoBar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="w-64 hidden md:flex flex-col border-r border-[var(--color-border-primary)] bg-[var(--color-surface-card)]">
          <div className="h-16 flex items-center px-6 border-b border-[var(--color-border-primary)]">
            <div className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--color-accent)] text-white">SC</div>
              Academic Portal
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar items={navItems} />
          </div>
          <div className="border-t border-[var(--color-border-primary)] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{displayName}</div>
                <div className="text-xs text-[var(--color-text-secondary)] truncate">{displayEmail}</div>
              </div>
            </div>
            {!isDemo && (
              <Button variant="ghost" size="sm" className="w-full justify-start text-[var(--color-text-secondary)] hover:text-[var(--color-critical)] hover:bg-red-50 text-xs" onClick={signOut}>
                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
              </Button>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border-primary)] bg-white">
            <div className="md:hidden flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--color-accent)] text-white">SC</div>
              Academic Portal
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="h-8 w-8 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <span className="hidden sm:block">{displayName}</span>
              </div>
              {!isDemo && (
                <Button variant="ghost" size="sm" onClick={signOut} className="text-[var(--color-text-secondary)]">
                  <LogOut className="h-4 w-4" /><span className="sr-only">Sign Out</span>
                </Button>
              )}
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}