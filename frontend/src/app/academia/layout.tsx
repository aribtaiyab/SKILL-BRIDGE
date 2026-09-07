"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import {
  LayoutDashboard, Award, Users, AlertTriangle, BookOpen,
  Presentation, GitMerge, Briefcase, TrendingUp, Bell,
  UserCheck, Settings, LogOut, Loader2, Menu, X, ShieldCheck
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
  const { user, profile, loading, signOut } = useAuth()
  const { isDemo } = useDemo()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Auth & Role Guard
  useEffect(() => {
    if (!loading) {
      if (!user && !isDemo) {
        router.replace('/login')
        return
      }
      if (user && profile && profile.role && profile.role !== 'academician' && !isDemo) {
        if (profile.role === 'student') router.replace('/student')
        else if (profile.role === 'industry') router.replace('/industry')
      }
    }
  }, [loading, user, profile, isDemo, router])

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
    { href: "/academia/my-experience", label: "My Experience", icon: Award },
    { href: "/academia/students", label: "Students", icon: Users },
    { href: "/academia/skill-gaps", label: "Skill Gaps", icon: AlertTriangle },
    { href: "/academia/mentorship", label: "Mentorship", icon: BookOpen },
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
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  if (loading && !isDemo) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-xs font-semibold text-slate-500">Verifying authorized Academia credentials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 justify-between">
          <Link href="/academia" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white font-black text-xs shadow-xs">
              SC
            </div>
            <div>
              <div className="font-black text-base tracking-tight text-slate-900">SkillBridge</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Academia
              </div>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white text-[var(--color-accent)]' : 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-border-primary)]'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">{displayName}</div>
              <div className="text-[10px] text-slate-500 truncate">{displayEmail}</div>
            </div>
          </div>
          {!isDemo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 h-8 rounded-lg"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
            </Button>
          )}
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xs z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">Portal:</span>
              <span className="text-xs font-bold text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-2.5 py-0.5 rounded-full">
                Academia Ecosystem
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/academia/notifications" className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100">
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-accent)] ring-2 ring-white" />
              )}
            </Link>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="h-7 w-7 rounded-lg bg-[var(--color-accent)] text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <span className="text-xs font-bold text-slate-800 hidden md:inline">{displayName}</span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full shadow-2xl flex flex-col p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="font-black text-sm text-slate-900">Academia Portal</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${
                        isActive ? 'bg-[var(--color-accent)] text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>

              <div className="pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-xs font-bold text-rose-600">
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
                </Button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
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
