"use client"

import Link from "next/link"
import { ArrowRight, Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReadinessNudgeProps {
  pointsAway?: number
  activeInternshipsCount?: number
  skillName?: string
}

export function ReadinessNudge({
  pointsAway = 21,
  activeInternshipsCount = 3,
  skillName = "REST APIs",
}: ReadinessNudgeProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-white to-white p-4 sm:p-5 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
            <Zap className="h-5 w-5 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                Actionable Readiness Nudge
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
              You are <span className="font-black text-emerald-700">{pointsAway} points</span> away from matching <span className="font-black text-slate-900">{activeInternshipsCount} active internships</span>.
              <span className="block sm:inline sm:ml-1.5 font-normal text-slate-600">
                Recommended today: Complete a 15-minute <strong className="font-bold text-slate-900">{skillName}</strong> practical challenge.
              </span>
            </p>
          </div>
        </div>

        <div className="shrink-0 pt-1 sm:pt-0">
          <Link href="/student/assessment">
            <Button size="sm" className="w-full sm:w-auto h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98]">
              Start Practical Task <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
