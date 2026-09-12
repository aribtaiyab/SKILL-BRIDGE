"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { DemoBar } from "@/components/layout/demo-bar"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import {
  LayoutDashboard, Target, FileText, Code, AlertTriangle,
  Compass, Award, Briefcase, ListTodo, TrendingUp, LogOut, Loader2, User, ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, authState, signOut } = useAuth()
  const { isDemo, student } = useDemo()
  const router = useRouter()

  useEffect(() => {
    if (!loading && authState === 'unauthenticated' && !isDemo) {
      router.replace('/login')
    }
  }, [loading, authState, isDemo, router])

  const navItems = [
    { href: "/student", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/student/career", label: "Career Target", icon: <Target size={18} /> },
    { href: "/student/assessment", label: "Assignments & Assessments", icon: <FileText size={18} /> },
    { href: "/student/skills", label: "Skills", icon: <Code size={18} /> },
    { href: "/student/verification", label: "Academician Verification", icon: <ShieldCheck size={18} /> },
    { href: "/student/career-navigator", label: "Career Navigator", icon: <Compass size={18} /> },
    { href: "/student/passport", label: "Skill Passport", icon: <Award size={18} /> },
    { href: "/student/opportunities", label: "Opportunities", icon: <Briefcase size={18} /> },
    { href: "/student/applications", label: "Applications", icon: <ListTodo size={18} /> },
    { href: "/student/progress", label: "Progress", icon: <TrendingUp size={18} /> },
  ]

  const displayName = isDemo ? student.name : (profile?.full_name || user?.email?.split('@')[0] || 'Student')
  const displayEmail = isDemo ? student.email : (user?.email || '')
  const initials = isDemo ? student.avatarInitials : ((profile?.full_name || 'ST').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase())

  if ((loading || authState === 'checking') && !isDemo) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">
      <DemoBar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Desktop Sidebar */}
        <aside className="w-64 hidden md:flex flex-col border-r border-slate-200/80 bg-white">
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-3 font-black tracking-tight text-slate-900">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white text-xs font-black shadow-xs">
                SC
              </div>
              <div>
                <div className="text-sm font-black leading-tight">SkillBridge</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 leading-tight">Student Portal</div>
              </div>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Sidebar items={navItems} />
          </div>

          {/* User profile footer */}
          <div className="border-t border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate text-slate-900">{displayName}</div>
                <div className="text-[11px] text-slate-400 truncate">{displayEmail}</div>
              </div>
            </div>
            {!isDemo && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs h-8 rounded-lg"
                onClick={signOut}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
              </Button>
            )}
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-5 sm:px-8 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
            <div className="flex items-center gap-2 font-black md:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white text-xs">SC</div>
              <span className="text-sm text-slate-900">Student Portal</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
                <span className="hidden sm:block">{displayName}</span>
              </div>
              {!isDemo && (
                <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg h-8 px-2.5">
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sign Out</span>
                </Button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}