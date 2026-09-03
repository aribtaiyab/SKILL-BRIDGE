"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuth } from "@/lib/auth/context"
import { LayoutDashboard, Briefcase, Users, PlusCircle, ListTodo, LineChart, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function IndustryLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  const navItems = [
    { href: "/industry", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/industry/opportunities", label: "Opportunities", icon: <Briefcase size={20} /> },
    { href: "/industry/candidates", label: "Candidates", icon: <Users size={20} /> },
    { href: "/industry/opportunities/create", label: "Create Opportunity", icon: <PlusCircle size={20} /> },
    { href: "/industry/applications", label: "Applications", icon: <ListTodo size={20} /> },
    { href: "/industry/insights", label: "Insights", icon: <LineChart size={20} /> },
  ]

  // Try to get org name from profile (stored in industry_profiles via context eventually)
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Industry'
  const initials = displayName.substring(0, 2).toUpperCase()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[var(--color-background)]">
      <aside className="w-64 hidden md:flex flex-col border-r border-[var(--color-border-primary)] bg-[var(--color-surface-card)]">
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--color-accent)] text-white">SC</div>
            Industry Portal
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar items={navItems} />
        </div>
        <div className="border-t border-[var(--color-border-primary)] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] flex items-center justify-center text-xs font-semibold text-[var(--color-text-secondary)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{displayName}</div>
              <div className="text-xs text-[var(--color-text-secondary)] truncate">{user?.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-[var(--color-text-secondary)] hover:text-[var(--color-critical)] hover:bg-red-50 text-xs" onClick={signOut}>
            <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border-primary)] bg-[var(--color-surface-card)]">
          <div className="md:hidden flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--color-accent)] text-white">SC</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="h-8 w-8 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-full flex items-center justify-center text-xs font-semibold text-[var(--color-text-secondary)]">
                {initials}
              </div>
              <span className="hidden sm:block">{displayName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-[var(--color-text-secondary)]">
              <LogOut className="h-4 w-4" /><span className="sr-only">Sign Out</span>
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </div>
      </main>
    </div>
  )
}