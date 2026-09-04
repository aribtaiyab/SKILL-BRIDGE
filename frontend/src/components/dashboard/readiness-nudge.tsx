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
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-accent)]/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white shadow-sm">
            <Zap className="h-5 w-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                Readiness Nudge
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="mt-0.5 text-sm font-medium text-[var(--color-foreground)]">
              You are <span className="font-bold text-[var(--color-accent)]">{pointsAway} points</span> away from matching <span className="font-bold text-[var(--color-foreground)]">{activeInternshipsCount} active internships</span>.
              <span className="block sm:inline sm:ml-1 text-[var(--color-text-secondary)]">
                Recommended today: Complete a 15-minute <span className="font-semibold text-[var(--color-foreground)]">{skillName}</span> practical task.
              </span>
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <Link href="/student/assessment">
            <Button size="sm" className="w-full sm:w-auto shadow-sm">
              Start Practical Task <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
