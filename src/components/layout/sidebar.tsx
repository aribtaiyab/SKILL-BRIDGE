"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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

  return (
    <div className="flex flex-col w-full h-full border-r border-[var(--color-border-primary)] bg-[var(--color-surface-card)]">
      <div className="flex-1 py-6 px-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start font-medium",
                  isActive 
                    ? "text-[var(--color-foreground)] bg-[var(--color-surface-secondary)]" 
                    : "text-[var(--color-text-secondary)]"
                )}
              >
                {item.icon && <span className="mr-3 text-current">{item.icon}</span>}
                {item.label}
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}