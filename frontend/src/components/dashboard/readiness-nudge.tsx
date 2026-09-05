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
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100/90 bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/80 p-6 shadow-[0_12px_35px_-10px_rgba(99,102,241,0.1)] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_45px_-12px_rgba(99,102,241,0.16)]">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-400/15 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-sky-400/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/30">
            <Zap className="h-6 w-6 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">
                Actionable Readiness Nudge
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-400/30" />
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-snug">
              You are <span className="font-extrabold text-indigo-600">{pointsAway} points</span> away from matching <span className="font-extrabold text-slate-900">{activeInternshipsCount} active internships</span>.
              <span className="block sm:inline sm:ml-1.5 font-normal text-slate-600">
                Recommended today: Complete a 15-minute <strong className="font-semibold text-slate-900">{skillName}</strong> practical challenge.
              </span>
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <Link href="/student/assessment">
            <Button size="sm" className="w-full sm:w-auto h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]">
              Start Practical Task <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
