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
    { href: "/academician", label: "Academia" },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--color-border-primary)] bg-[var(--color-background)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-background)]/75">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-accent)] text-white text-xs font-bold shadow-sm">
              SC
            </div>
            <span className="hidden sm:inline-block text-[15px] font-bold tracking-tight text-[var(--color-foreground)]">SkillBridge <span className="font-medium text-[var(--color-text-secondary)]">Connect</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-1 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]/70 p-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:text-[var(--color-foreground)]",
                  pathname === link.href
                    ? "bg-[var(--color-surface-secondary)] text-[var(--color-foreground)]"
                    : "text-[var(--color-text-secondary)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-3">
          <Link href="/student?demo=true">
            <Button variant="outline" className="border-[var(--color-accent)]/40 bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] font-medium hover:bg-[var(--color-accent)]/20 text-xs h-9">
              Explore Demo ✨
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="font-semibold">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button className="px-5">Get Started</Button>
          </Link>
        </div>

        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-[var(--color-border-primary)] p-4 bg-background">
          <div className="flex flex-col space-y-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-[var(--color-border-subtle)] my-2" />
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-center">Sign In</Button>
            </Link>
            <Link href="/signup" onClick={() => setIsOpen(false)}>
              <Button className="w-full justify-center">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}