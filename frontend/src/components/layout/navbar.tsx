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
    { href: "/academician", label: "Academician" },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--color-border-primary)] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-accent)] text-white font-bold">
              SC
            </div>
            <span className="text-h3 font-semibold text-[var(--color-foreground)] hidden sm:inline-block">
              SkillBridge Connect
            </span>
          </Link>
          <div className="hidden md:flex gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[var(--color-foreground)]",
                  pathname === link.href
                    ? "text-[var(--color-foreground)]"
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
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
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