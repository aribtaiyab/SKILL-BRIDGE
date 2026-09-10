"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LogOut, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/context"

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  const portals = [
    { label: "Student", href: "/student" },
    { label: "Academia", href: "/academia" },
    { label: "Industry", href: "/industry" },
  ]

  const handlePortalClick = (href: string) => {
    const role = href.replace('/', '')
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeRole', role)
      localStorage.setItem('demo_persona', role)
      if (role === 'academia') {
        localStorage.setItem('role', 'faculty')
      }
    }
  }

  const getPortalDestination = (href: string) => {
    if (user) {
      if (!profile?.role) return "/select-role"
      return href
    }
    const role = href.replace('/', '')
    return `/login?role=${encodeURIComponent(role)}&redirect=${encodeURIComponent(href)}`
  }

  return (
    <header className="sticky top-3 z-50 mx-auto max-w-7xl px-4 sm:px-6">
      <nav className="h-16 px-5 sm:px-6 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_-8px_rgba(15,23,42,0.06)] flex items-center justify-between gap-4 transition-all">
        
        {/* Left: Brand Identity */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            SC
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            SkillBridge <span className="text-emerald-600 font-semibold">Connect</span>
          </span>
        </Link>

        {/* Center: Segmented Role Selector */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
          {portals.map((portal) => {
            const dest = getPortalDestination(portal.href)
            const isActive = pathname.startsWith(portal.href)
            return (
              <Link
                key={portal.label}
                href={dest}
                onClick={() => handlePortalClick(portal.href)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  isActive
                    ? "font-bold text-slate-900 bg-white shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                )}
              >
                {portal.label}
              </Link>
            )
          })}
        </div>

        {/* Right: Unified Action Buttons (Harmonized h-10 Height & rounded-xl) */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Explore Demo */}
          <Link href="/demo">
            <button className="inline-flex items-center gap-1.5 h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/80 hover:border-emerald-300 active:scale-[0.98] transition-all cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Explore Demo</span>
            </button>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href={profile?.role ? (profile.role === 'student' ? '/student' : profile.role === 'industry' ? '/industry' : '/academia') : '/select-role'}>
                <button className="h-10 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer">
                  My Portal
                </button>
              </Link>
              <button
                onClick={() => signOut()}
                className="h-10 w-10 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Sign In */}
              <Link href="/login">
                <button className="h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:scale-[0.98] transition-all cursor-pointer">
                  Sign In
                </button>
              </Link>

              {/* Get Started */}
              <Link href="/signup">
                <button className="h-10 px-4 sm:px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer">
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </nav>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="mt-2 rounded-2xl border border-slate-200/80 bg-white/98 p-4 shadow-xl backdrop-blur-xl sm:hidden animate-in fade-in duration-200">
          <div className="flex flex-col space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Select Portal
            </div>
            <div className="grid grid-cols-3 gap-2">
              {portals.map((portal) => (
                <Link
                  key={portal.label}
                  href={getPortalDestination(portal.href)}
                  onClick={() => {
                    handlePortalClick(portal.href)
                    setIsOpen(false)
                  }}
                  className="text-center py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  {portal.label}
                </Link>
              ))}
            </div>

            <div className="h-px bg-slate-100 my-1" />

            <Link href="/demo" onClick={() => setIsOpen(false)}>
              <button className="w-full inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Explore Demo</span>
              </button>
            </Link>

            {user ? (
              <div className="space-y-2">
                <Link
                  href={profile?.role ? (profile.role === 'student' ? '/student' : profile.role === 'industry' ? '/industry' : '/academia') : '/select-role'}
                  onClick={() => setIsOpen(false)}
                >
                  <button className="w-full h-10 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700">
                    Open My Portal
                  </button>
                </Link>
                <button
                  onClick={() => { setIsOpen(false); signOut(); }}
                  className="w-full h-9 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <button className="w-full h-10 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-100">
                    Sign In
                  </button>
                </Link>
                <Link href="/signup" onClick={() => setIsOpen(false)}>
                  <button className="w-full h-10 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700">
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar