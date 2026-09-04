"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export interface SidebarItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SidebarProps {
  items: SidebarItem[];
  basePath?: string;
}

export function Sidebar({ items, basePath = "" }: SidebarProps) {
  const pathname = usePathname()
  const groups = [
    { label: "Overview", items: items.filter(item => item.label === "Dashboard") },
    { label: "Career", items: items.filter(item => ["Career Target", "Skill Gap", "Opportunities", "Applications"].includes(item.label)) },
    { label: "Development", items: items.filter(item => ["Assessments", "Skills", "AI Skill Coach", "Progress"].includes(item.label)) },
    { label: "Profile", items: items.filter(item => item.label === "Skill Passport") },
  ].filter(group => group.items.length > 0)

  return (
    <div className="flex flex-col w-full h-full bg-[var(--color-surface-card)]">
      <div className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="eyebrow px-3 pb-2 text-[10px]">{group.label}</p>
            <div className="space-y-1">
        {group.items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className={cn(
              "group flex h-10 w-full items-center rounded-[var(--radius-control)] px-3 text-sm font-semibold transition-all",
              isActive ? "bg-[var(--color-accent-light)] text-[var(--color-accent-hover)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-foreground)]"
            )}>
                {item.icon && <span className="mr-3 text-current">{item.icon}</span>}
                {item.label}
            </Link>
          )
        })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}