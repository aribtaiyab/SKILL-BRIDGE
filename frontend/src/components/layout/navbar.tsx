"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/context"

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const { user, profile } = useAuth()

  const portals = [
    { label: "Student", href: "/student" },
    { label: "Academia", href: "/academia" },
    { label: "Industry", href: "/industry" },
  ]

  const getPortalDestination = (href: string) => {
    if (user) {
      if (!profile?.role) return "/select-role"
      return href
    }
    return `/login?redirect=${encodeURIComponent(href)}`
  }

  const myPortalHref = user
    ? (profile?.role === 'student' ? '/student' : profile?.role === 'industry' ? '/industry' : profile?.role ? '/academia' : '/select-role')
    : '/login'

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 pointer-events-none">
      <nav className="pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-white/8 bg-[rgba(13,15,20,0.8)] px-5 sm:px-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all">
        {/* Brand */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-indigo-500 text-white text-xs font-black shadow-lg group-hover:scale-105 transition-transform">
              SC
            </div>
            <span className="hidden sm:inline-block text-[14px] font-bold tracking-tight text-white">
              SkillBridge <span className="text-gradient font-black">Connect</span>
            </span>
          </Link>

          {/* Portal switcher pill */}
          <div className="hidden sm:flex items-center gap-0.5 rounded-xl border border-white/8 bg-white/4 p-1">
            {portals.map((portal) => {
              const dest = getPortalDestination(portal.href)
              const isActive = pathname.startsWith(portal.href)
              return (
                <Link
                  key={portal.label}
                  href={dest}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                    isActive
                      ? "bg-[var(--color-accent)] text-white shadow-sm"
                      : "text-[var(--color-text-muted)] hover:text-white hover:bg-white/8"
                  )}
                >
                  {portal.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/student?demo=true">
            <button className="h-8 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 text-xs font-semibold text-violet-400 hover:bg-[var(--color-accent)]/20 transition-colors">
              Demo ✨
            </button>
          </Link>
          {user ? (
            <Link href={myPortalHref}>
              <button className="h-8 rounded-xl btn-gradient px-5 text-xs font-semibold text-white">
                <span>My Portal</span>
              </button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <button className="h-8 rounded-xl px-4 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-white hover:bg-white/6 transition-colors">
                  Sign In
                </button>
              </Link>
              <Link href="/signup">
                <button className="h-8 rounded-xl btn-gradient px-5 text-xs font-semibold text-white">
                  <span>Get Started</span>
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-white/8 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="pointer-events-auto mt-2 rounded-2xl border border-white/8 bg-[rgba(13,15,20,0.95)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] px-1 mb-1">
              Select Portal
            </div>
            <div className="grid grid-cols-3 gap-2">
              {portals.map((portal) => (
                <Link
                  key={portal.label}
                  href={getPortalDestination(portal.href)}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-center py-2.5 rounded-xl text-xs font-bold border transition-all",
                    pathname.startsWith(portal.href)
                      ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/15 text-violet-400"
                      : "border-white/8 bg-white/4 text-[var(--color-text-muted)] hover:text-white hover:bg-white/8"
                  )}
                >
                  {portal.label}
                </Link>
              ))}
            </div>

            <div className="h-px bg-white/6 my-1" />

            <Link href="/student?demo=true" onClick={() => setIsOpen(false)}>
              <button className="w-full h-9 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-xs font-semibold text-violet-400 hover:bg-[var(--color-accent)]/20 transition-colors">
                Explore Demo ✨
              </button>
            </Link>

            {user ? (
              <Link href={myPortalHref} onClick={() => setIsOpen(false)}>
                <button className="w-full h-9 rounded-xl btn-gradient text-xs font-semibold text-white">
                  <span>Open My Portal</span>
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <button className="w-full h-9 rounded-xl border border-white/8 bg-white/4 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-white transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link href="/signup" onClick={() => setIsOpen(false)}>
                  <button className="w-full h-9 rounded-xl btn-gradient text-xs font-semibold text-white">
                    <span>Get Started</span>
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}