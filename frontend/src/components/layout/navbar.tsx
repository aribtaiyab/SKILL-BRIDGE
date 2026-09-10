"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 pointer-events-none">
      <nav className="pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-[var(--color-border-primary)] bg-white/90 px-5 sm:px-6 shadow-[var(--shadow-soft)] backdrop-blur-xl transition-all">
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white text-xs font-black shadow-xs group-hover:scale-105 transition-transform">
              SC
            </div>
            <span className="hidden sm:inline-block text-[15px] font-black tracking-tight text-[var(--color-foreground)]">
              SkillBridge <span className="font-semibold text-[var(--color-accent)]">Connect</span>
            </span>
          </Link>
          
          {/* Three Main Portal Entry Points */}
          <div className="flex items-center gap-1 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] p-1">
            {portals.map((portal) => {
              const dest = getPortalDestination(portal.href)
              const isActive = pathname.startsWith(portal.href)
              return (
                <Link
                  key={portal.label}
                  href={dest}
                  className={cn(
                    "rounded-full px-3 sm:px-4 py-1 text-xs font-bold transition-all",
                    isActive
                      ? "bg-white text-[var(--color-accent)] shadow-xs border border-[var(--color-border-primary)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] hover:bg-white/60"
                  )}
                >
                  {portal.label}
                </Link>
              )
            })}
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-3">
          <Link href="/demo">
            <Button variant="outline" className="border-[var(--color-accent)]/30 bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] font-medium hover:bg-[var(--color-accent)]/20 text-xs h-8.5 rounded-xl px-3.5 shadow-xs">
              Explore Demo ✨
            </Button>
          </Link>
          {user ? (
            <Link href={profile?.role ? (profile.role === 'student' ? '/student' : profile.role === 'industry' ? '/industry' : '/academia') : '/select-role'}>
              <Button className="px-4 text-xs h-8.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold shadow-xs">
                My Portal
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-[var(--color-text-secondary)] font-semibold text-xs h-8.5 hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-secondary)] rounded-xl">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="px-4 text-xs h-8.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold shadow-xs">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5 text-[var(--color-foreground)]" /> : <Menu className="h-5 w-5 text-[var(--color-foreground)]" />}
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>
      </nav>

      {isOpen && (
        <div className="pointer-events-auto mt-2 rounded-2xl border border-[var(--color-border-primary)] bg-white/95 p-4 shadow-lg backdrop-blur-xl md:hidden">
          <div className="flex flex-col space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-1">
              Select Portal
            </div>
            <div className="grid grid-cols-3 gap-2">
              {portals.map((portal) => (
                <Link
                  key={portal.label}
                  href={getPortalDestination(portal.href)}
                  onClick={() => setIsOpen(false)}
                  className="text-center py-2 rounded-xl text-xs font-bold border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-white"
                >
                  {portal.label}
                </Link>
              ))}
            </div>
            <div className="h-px bg-[var(--color-border-primary)] my-1" />
            <Link href="/demo" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-center text-xs h-9 rounded-xl border-[var(--color-accent)]/30 bg-[var(--color-accent-light)] text-[var(--color-accent-hover)]">
                Explore Demo ✨
              </Button>
            </Link>
            {user ? (
              <Link href={profile?.role ? (profile.role === 'student' ? '/student' : profile.role === 'industry' ? '/industry' : '/academia') : '/select-role'} onClick={() => setIsOpen(false)}>
                <Button className="w-full justify-center text-xs h-9 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold">
                  Open My Workspace
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full justify-center text-xs h-9 rounded-xl border-[var(--color-border-primary)]">Sign In</Button>
                </Link>
                <Link href="/signup" onClick={() => setIsOpen(false)}>
                  <Button className="w-full justify-center text-xs h-9 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}