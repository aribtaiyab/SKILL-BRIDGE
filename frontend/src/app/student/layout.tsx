"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import {
  LayoutDashboard, Target, FileText, Code, AlertTriangle,
  Compass, Award, Briefcase, ListTodo, TrendingUp, LogOut,
  Loader2, ShieldCheck, Menu, X, ChevronRight
} from "lucide-react"
import { DemoBar } from "@/components/layout/demo-bar"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, authState, signOut } = useAuth()
  const { isDemo, student } = useDemo()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (authState === 'unauthenticated' && !isDemo) {
      router.replace('/login')
    }
  }, [authState, isDemo, router])

  const navItems = [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/student/career", label: "Career Target", icon: Target },
    { href: "/student/assessment", label: "Assessments", icon: FileText },
    { href: "/student/skills", label: "Skills", icon: Code },
    { href: "/student/verification", label: "Verification", icon: ShieldCheck },
    { href: "/student/skill-gap", label: "Skill Gap", icon: AlertTriangle },
    { href: "/student/career-navigator", label: "Career Navigator", icon: Compass },
    { href: "/student/passport", label: "Skill Passport", icon: Award },
    { href: "/student/opportunities", label: "Opportunities", icon: Briefcase },
    { href: "/student/applications", label: "Applications", icon: ListTodo },
    { href: "/student/progress", label: "Progress", icon: TrendingUp },
  ]

  const displayName = isDemo ? student.name : (profile?.full_name || user?.email?.split('@')[0] || 'Student')
  const displayEmail = isDemo ? student.email : (user?.email || '')
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  if ((loading || authState === 'checking') && !isDemo) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-indigo-500 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          </div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] tracking-wider uppercase">Loading</p>
        </div>
      </div>
    )
  }

  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-white/6 shrink-0">
        <Link href="/student" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-indigo-500 text-white text-xs font-black shadow-lg group-hover:scale-105 transition-transform">
            SC
          </div>
          <div>
            <div className="text-[13px] font-bold text-white">SkillBridge</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-400">Student Portal</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                isActive
                  ? 'nav-item-active'
                  : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/6'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]'}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 text-violet-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/6 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[var(--color-accent)]/30 to-indigo-500/20 border border-[var(--color-accent)]/30 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{displayName}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] truncate">{displayEmail}</div>
          </div>
        </div>
        {!isDemo && (
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-400/8 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        )}
      </div>
    </>
  )

  return (
    <div className="flex flex-col h-screen bg-[var(--color-background)] overflow-hidden">
      <DemoBar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-60 hidden md:flex flex-col bg-[var(--color-surface)] border-r border-white/6">
          <NavContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="w-64 flex flex-col bg-[var(--color-surface)] border-r border-white/8 shadow-2xl">
              <NavContent />
            </div>
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top header */}
          <header className="h-16 flex items-center justify-between px-5 sm:px-8 border-b border-white/6 bg-[var(--color-surface)]/80 backdrop-blur shrink-0">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-xl text-[var(--color-text-muted)] hover:text-white hover:bg-white/8 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <div className="hidden md:block text-sm font-semibold text-white">
                {navItems.find(i => i.exact ? pathname === i.href : pathname.startsWith(i.href))?.label || 'Dashboard'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--color-accent)]/30 to-indigo-500/20 border border-[var(--color-accent)]/30 flex items-center justify-center text-[10px] font-bold text-violet-300">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-white">{displayName}</span>
              </div>
              {!isDemo && (
                <button
                  onClick={signOut}
                  className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-400/8 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}