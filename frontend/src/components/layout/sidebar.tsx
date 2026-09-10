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
    { label: "Career Alignment", items: items.filter(item => ["Career Target", "Career Navigator", "Skill Gap", "Opportunities", "Applications", "Candidates", "Talent Pool"].includes(item.label)) },
    { label: "Verification & Learning", items: items.filter(item => ["Assessments", "Assignments & Assessments", "Skills", "Academician Verification", "Verification", "Progress", "Interventions", "Workshops", "Mentorship", "Students"].includes(item.label)) },
    { label: "Credentials & Profile", items: items.filter(item => ["Skill Passport", "Profile", "Experience", "Settings"].includes(item.label)) },
    { label: "Other", items: items.filter(item => !["Dashboard", "Career Target", "Career Navigator", "Skill Gap", "Opportunities", "Applications", "Candidates", "Talent Pool", "Assessments", "Assignments & Assessments", "Skills", "Academician Verification", "Verification", "Progress", "Interventions", "Workshops", "Mentorship", "Students", "Skill Passport", "Profile", "Experience", "Settings"].includes(item.label)) }
  ].filter(group => group.items.length > 0)

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <div className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/student" && item.href !== "/academia" && item.href !== "/industry" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex h-9.5 w-full items-center px-3 text-xs font-semibold transition-all rounded-xl",
                      isActive
                        ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80 shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {item.icon && (
                      <span className={cn("mr-2.5 transition-colors", isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-700")}>
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
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