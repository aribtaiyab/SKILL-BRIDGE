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
      <nav className="pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-slate-200/80 bg-white/85 px-5 sm:px-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              SC
            </div>
            <span className="hidden sm:inline-block text-[15px] font-black tracking-tight text-slate-900">
              SkillBridge <span className="font-semibold text-indigo-600">Connect</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-50/80 p-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-1 text-xs font-semibold transition-all hover:text-slate-900",
                  pathname === link.href
                    ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50"
                    : "text-slate-600 hover:bg-white/60"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-3">
          <Link href="/demo">
            <Button variant="outline" className="border-indigo-200 bg-indigo-50/50 text-indigo-700 font-semibold hover:bg-indigo-100/60 text-xs h-8.5 rounded-xl px-3.5 shadow-xs">
              Explore Demo ✨
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="text-slate-700 font-semibold text-xs h-8.5 hover:bg-slate-100/70 rounded-xl">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button className="px-4 text-xs h-8.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/25">Get Started</Button>
          </Link>
        </div>

        <div className="md:hidden">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5 text-slate-700" /> : <Menu className="h-5 w-5 text-slate-700" />}
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>
      </nav>

      {isOpen && (
        <div className="pointer-events-auto mt-2 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-xl md:hidden">
          <div className="flex flex-col space-y-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-slate-100 my-1" />
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-center text-xs h-9 rounded-xl">Sign In</Button>
            </Link>
            <Link href="/signup" onClick={() => setIsOpen(false)}>
              <Button className="w-full justify-center text-xs h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}