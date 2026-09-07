"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()

  const links = [
    { href: "/product", label: "Product" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/academia", label: "Academia" },
  ]

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 pointer-events-none">
      <nav className="pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-[var(--color-border-primary)] bg-white/90 px-5 sm:px-6 shadow-[var(--shadow-soft)] backdrop-blur-xl transition-all">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white text-xs font-black shadow-xs group-hover:scale-105 transition-transform">
              SC
            </div>
            <span className="hidden sm:inline-block text-[15px] font-black tracking-tight text-[var(--color-foreground)]">
              SkillBridge <span className="font-semibold text-[var(--color-accent)]">Connect</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] p-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-1 text-xs font-semibold transition-all hover:text-[var(--color-foreground)]",
                  pathname === link.href
                    ? "bg-white text-[var(--color-accent)] shadow-xs border border-[var(--color-border-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-white/60"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-3">
          <Link href="/demo">
            <Button variant="outline" className="border-[var(--color-accent)]/30 bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] font-medium hover:bg-[var(--color-accent)]/20 text-xs h-8.5 rounded-xl px-3.5 shadow-xs">
              Explore Demo ✨
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="text-[var(--color-text-secondary)] font-semibold text-xs h-8.5 hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-secondary)] rounded-xl">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button className="px-4 text-xs h-8.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold shadow-xs">Get Started</Button>
          </Link>
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
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-[var(--color-border-primary)] my-1" />
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-center text-xs h-9 rounded-xl border-[var(--color-border-primary)]">Sign In</Button>
            </Link>
            <Link href="/signup" onClick={() => setIsOpen(false)}>
              <Button className="w-full justify-center text-xs h-9 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}