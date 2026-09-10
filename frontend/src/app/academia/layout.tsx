"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import {
  ArrowLeft,
  LayoutDashboard, Award, Users, AlertTriangle,
  Presentation, GitMerge, Briefcase, TrendingUp, Bell,
  UserCheck, Settings, LogOut, Loader2, Menu, X, ShieldCheck, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export default function AcademiaLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, authState, signOut } = useAuth()
  const { isDemo } = useDemo()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Auth & Role Guard
  useEffect(() => {
    if (authState === 'unauthenticated' && !isDemo) {
      router.replace('/login')
      return
    }

    if (authState === 'authenticated' && user && !isDemo) {
      if (profile && profile.role && profile.role !== 'academician' && profile.role !== 'institution') {
        if (profile.role === 'student') router.replace('/student')
        else if (profile.role === 'industry') router.replace('/industry')
      }
    }
  }, [authState, user, profile, isDemo, router])

  // Fetch real notification count
  useEffect(() => {
    if (user || isDemo) {
      apiClient('/api/academia/notifications')
        .then(res => {
          if (res?.success && typeof res.unreadCount === 'number') {
            setUnreadNotifications(res.unreadCount)
          }
        })
        .catch(() => {})
    }
  }, [user, isDemo, pathname])

  const navItems: NavItem[] = [
    { href: "/academia", label: "Dashboard", icon: LayoutDashboard },
    { href: "/academia/verification", label: "Skill Verifications", icon: ShieldCheck },
    { href: "/academia/students", label: "Students", icon: Users },
    { href: "/academia/skill-gaps", label: "Skill Gaps", icon: AlertTriangle },
    { href: "/academia/my-experience", label: "My Experience", icon: Award },
    { href: "/academia/workshops", label: "Workshops", icon: Presentation },
    { href: "/academia/interventions", label: "Interventions", icon: GitMerge },
    { href: "/academia/opportunities", label: "Opportunities", icon: Briefcase },
    { href: "/academia/industry", label: "Industry Demand", icon: TrendingUp },
    { href: "/academia/notifications", label: "Notifications", icon: Bell, badge: unreadNotifications },
    { href: "/academia/profile", label: "Profile / Settings", icon: Settings },
  ]

  const displayName = isDemo
    ? 'Dr. Sarah Mitchell (Faculty)'
    : (profile?.full_name || user?.email?.split('@')[0] || 'Academician')
  const displayEmail = isDemo ? 'faculty.cs@dtu.edu' : (user?.email || '')
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  if ((loading || authState === 'checking') && !isDemo) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          </div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] tracking-wider uppercase">Verifying credentials...</p>
        </div>
      </div>
    )
  }

  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="h-20 flex items-center px-4 border-b border-white/6 justify-between shrink-0">
        <Link href="/academia" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white text-xs font-black shadow-lg group-hover:scale-105 transition-transform">
            SC
          </div>
          <div>
            <div className="text-[13px] font-bold text-white">SkillBridge</div>
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.15em] text-sky-400">
              <ShieldCheck className="h-2.5 w-2.5" />
              Academia
            </div>
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/academia' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-sky-500/15 border border-sky-500/25 text-sky-300'
                  : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/6'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && item.badge > 0 ? (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    isActive ? 'bg-sky-400 text-white' : 'bg-sky-400/20 text-sky-400 border border-sky-400/30'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
                {isActive && <ChevronRight className="h-3 w-3 text-sky-400" />}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/6 space-y-1.5 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-xs font-bold text-sky-300 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{displayName}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] truncate">{displayEmail}</div>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:text-white hover:bg-white/6 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit Portal</span>
        </Link>
        <Link
          href="/select-role"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-sky-400/70 hover:text-sky-400 hover:bg-sky-400/8 transition-all"
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>Switch Role</span>
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-400/8 transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          {isDemo ? 'Exit Demo' : 'Sign Out'}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-[var(--color-surface)] border-r border-white/6">
        <NavContent />
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-white/6 bg-[var(--color-surface)]/80 backdrop-blur z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[var(--color-text-muted)] hover:text-white hover:bg-white/8 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] hidden sm:inline">Portal:</span>
              <span className="text-xs font-bold text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2.5 py-1 rounded-full">
                Academia Ecosystem
              </span>
            </div>
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-white hover:bg-white/6 px-3 py-1.5 rounded-xl transition-colors border border-white/6 ml-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/academia/notifications" className="relative p-2 rounded-xl text-[var(--color-text-muted)] hover:text-white hover:bg-white/8 transition-colors">
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sky-400 ring-2 ring-[var(--color-surface)]" />
              )}
            </Link>

            <div className="flex items-center gap-2.5 pl-3 border-l border-white/6">
              <div className="h-7 w-7 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-xs font-bold text-sky-300">
                {initials}
              </div>
              <span className="text-xs font-bold text-white hidden md:inline">{displayName}</span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="w-72 bg-[var(--color-surface)] h-full shadow-2xl flex flex-col border-r border-white/8">
              <NavContent />
            </div>
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
