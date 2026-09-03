"use client"

import React, { useState } from "react"
import { useDemo, DemoRole } from "@/lib/demo/demo-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, LogOut, RotateCcw, Sparkles, User, Briefcase, GraduationCap, Building2 } from "lucide-react"

export function DemoBar() {
  const { isDemo, demoRole, switchDemoRole, exitDemo, resetDemo } = useDemo()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  if (!isDemo) return null

  const roles: { role: DemoRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      role: 'student',
      label: 'Student — Aditi Sharma',
      icon: <GraduationCap className="h-4 w-4 text-[var(--color-accent)]" />,
      desc: 'Backend Developer Track (82% Readiness)',
    },
    {
      role: 'industry',
      label: 'Industry — TechNova Solutions',
      icon: <Briefcase className="h-4 w-4 text-blue-600" />,
      desc: 'Talent pipeline & matching',
    },
    {
      role: 'academician',
      label: 'Academician — Faculty Cohort',
      icon: <User className="h-4 w-4 text-emerald-600" />,
      desc: 'Class of 2026 Skill Gap Analytics',
    },
    {
      role: 'institution',
      label: 'Institution — Apex Institute',
      icon: <Building2 className="h-4 w-4 text-purple-600" />,
      desc: 'Department & Ecosystem Alignment',
    },
  ]

  const currentRoleObj = roles.find(r => r.role === demoRole) || roles[0]

  return (
    <div className="sticky top-0 z-50 w-full bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        {/* Left: Demo Badge & Indicator */}
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
            DEMO MODE
          </Badge>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 rounded-md border border-slate-700 transition-colors focus:outline-none"
            >
              <span className="text-slate-400">Viewing as:</span>
              <span className="flex items-center gap-1.5 text-slate-100 font-semibold">
                {currentRoleObj.icon}
                {currentRoleObj.label.split('—')[0].trim()}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-72 rounded-lg bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                    Switch Prototype Persona
                  </div>
                  {roles.map(r => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchDemoRole(r.role)
                        setDropdownOpen(false)
                      }}
                      className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors ${
                        demoRole === r.role
                          ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent-hover)] font-medium border border-[var(--color-accent)]/30'
                          : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <span className="mt-0.5">{r.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold">{r.label}</div>
                        <div className="text-[11px] text-slate-400 truncate">{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions (Reset & Exit) */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDemo}
            title="Reset to pristine seeded demo data"
            className="h-8 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 hidden sm:flex items-center gap-1.5 px-2.5"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exitDemo}
            className="h-8 text-xs bg-slate-800 hover:bg-red-950/40 hover:text-red-300 hover:border-red-800 border-slate-700 text-slate-200 flex items-center gap-1.5 px-3"
          >
            <LogOut className="h-3 w-3" />
            Exit Demo
          </Button>
        </div>
      </div>
    </div>
  )
}
