"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuth } from "@/lib/auth/context"
import {
  LayoutDashboard, Target, FileText, Code, AlertTriangle,
  Bot, Award, Briefcase, ListTodo, TrendingUp, LogOut, Loader2, User
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, role, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  const navItems = [
    { href: "/student", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/student/career", label: "Career Target", icon: <Target size={20} /> },
    { href: "/student/assessment", label: "Assessments", icon: <FileText size={20} /> },
    { href: "/student/skills", label: "Skills", icon: <Code size={20} /> },
    { href: "/student/skill-gap", label: "Skill Gap", icon: <AlertTriangle size={20} /> },
    { href: "/student/ai-coach", label: "AI Skill Coach", icon: <Bot size={20} /> },
    { href: "/student/passport", label: "Skill Passport", icon: <Award size={20} /> },
    { href: "/student/opportunities", label: "Opportunities", icon: <Briefcase size={20} /> },
    { href: "/student/applications", label: "Applications", icon: <ListTodo size={20} /> },
    { href: "/student/progress", label: "Progress", icon: <TrendingUp size={20} /> },
  ]

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Student'
  const initials = (profile?.full_name || 'ST').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

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
            SkillBridge
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar items={navItems} />
        </div>
        {/* User info + logout in sidebar footer */}
        <div className="border-t border-[var(--color-border-primary)] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{displayName}</div>
              <div className="text-xs text-[var(--color-text-secondary)] truncate">{user?.email}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-[var(--color-text-secondary)] hover:text-[var(--color-critical)] hover:bg-red-50 text-xs"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border-primary)] bg-white">
          <div className="flex items-center gap-2 font-semibold md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--color-accent)] text-white">SC</div>
            SkillBridge
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="h-8 w-8 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
              <span className="hidden sm:block">{displayName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-[var(--color-text-secondary)]">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign Out</span>
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}