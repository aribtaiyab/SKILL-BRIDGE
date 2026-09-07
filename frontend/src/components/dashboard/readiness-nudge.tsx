"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, Target, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReadinessNudgeProps {
  pointsAway?: number
  activeInternshipsCount?: number
  skillName?: string
}

export function ReadinessNudge({
  pointsAway = 8,
  activeInternshipsCount = 3,
  skillName = "Node.js",
}: ReadinessNudgeProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-primary)] bg-gradient-to-r from-[#FAF6F3] via-white to-[#F2F7F9] p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-[var(--color-accent-pink)]/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-[var(--color-accent-sky)]/25 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white shadow-xs">
            <Zap className="h-5 w-5 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
                Actionable Readiness Nudge
              </span>
              <span className="flex h-2 w-2 rounded-full bg-[var(--color-success)] animate-pulse ring-2 ring-[var(--color-success)]/30" />
            </div>
            <p className="text-sm font-semibold text-[var(--color-foreground)] leading-snug">
              You are <span className="font-extrabold text-[var(--color-accent)]">{pointsAway} points</span> away from matching <span className="font-extrabold text-[var(--color-foreground)]">{activeInternshipsCount} active internships</span>.
              <span className="block sm:inline sm:ml-1.5 font-normal text-[var(--color-text-secondary)]">
                Recommended today: Complete a 15-minute <strong className="font-semibold text-[var(--color-foreground)]">{skillName}</strong> practical challenge.
              </span>
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <Link href="/student/assessment">
            <Button size="sm" className="w-full sm:w-auto h-9 px-5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold shadow-xs transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98]">
              Start Practical Task <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
