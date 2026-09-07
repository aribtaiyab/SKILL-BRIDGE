"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle, Target, CheckCircle2, ChevronRight, BookOpen,
  Code, Loader2, ArrowRight, Sparkles, Zap, Bot, Shield
} from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"
import { EvaluatedSkillGap } from "@/lib/intelligence/engine"
import { apiClient } from "@/lib/api-client"

interface SkillGapsResponse {
  careerName: string
  priorityGap: EvaluatedSkillGap | null
  criticalGaps: EvaluatedSkillGap[]
  nearReadySkills: EvaluatedSkillGap[]
  readySkills: EvaluatedSkillGap[]
  allGaps: EvaluatedSkillGap[]
  summary: {
    strengthsText: string[]
    nearReadyText: string[]
    criticalText: string[]
    recommendedAction: string
  }
}

export default function SkillGapPage() {
  const { isDemo, student } = useDemo()
  const [data, setData] = useState<SkillGapsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      const allGaps: EvaluatedSkillGap[] = student.skills.map(s => ({
        skillId: s.id,
        skillName: s.name,
        category: s.category,
        requiredLevel: s.requiredLevel,
        currentLevel: s.currentLevel,
        gap: s.gap,
        status: s.status,
        importance: s.importance,
        priorityScore: s.gap * (s.importance === 'High' ? 2 : 1),
        isAssessed: s.isAssessed,
        recommendation: s.gap > 0 ? `Improve ${s.name} benchmark by ${s.gap} points.` : `${s.name} benchmark satisfied.`,
      }))

      const criticalGaps = allGaps.filter(g => g.status === 'critical')
      const nearReadySkills = allGaps.filter(g => g.status === 'needs_improvement')
      const readySkills = allGaps.filter(g => g.status === 'ready')
      const priority = criticalGaps[0] || nearReadySkills[0] || null

      setData({
        careerName: student.targetCareer,
        priorityGap: priority,
        criticalGaps,
        nearReadySkills,
        readySkills,
        allGaps,
        summary: {
          strengthsText: readySkills.map(r => `${r.skillName} (${r.currentLevel}/${r.requiredLevel})`),
          nearReadyText: nearReadySkills.map(r => `${r.skillName} (${r.gap} pts to target)`),
          criticalText: criticalGaps.map(r => `${r.skillName} (${r.gap} pts to target)`),
          recommendedAction: priority ? `Prioritize closing the ${priority.gap}-point gap in ${priority.skillName} to advance to 90%+ readiness.` : 'All benchmarks satisfied.',
        },
      })
      setLoading(false)
      return
    }

    async function load() {
      try {
        const json = await apiClient<any>('/api/student/skill-gaps')
        if (json.success && json.data) {
          const rawGaps = json.data.gaps || json.data.allGaps || []
          setData({
            careerName: json.data.careerName || 'Target Role',
            priorityGap: json.data.priorityGap || null,
            criticalGaps: json.data.criticalGaps || [],
            nearReadySkills: json.data.nearReadySkills || [],
            readySkills: json.data.strengths || json.data.readySkills || [],
            allGaps: rawGaps,
            summary: json.data.explanation ? {
              strengthsText: json.data.explanation.strengthsText || [],
              nearReadyText: json.data.explanation.nearReadyText || [],
              criticalText: json.data.explanation.criticalText || [],
              recommendedAction: json.data.explanation.recommendedAction || 'Complete assessments to satisfy benchmark gaps.',
            } : {
              strengthsText: [],
              nearReadyText: [],
              criticalText: [],
              recommendedAction: 'Complete initial assessment to evaluate your skill gaps against target benchmarks.',
            },
          })
        }
      } catch (err) {
        console.warn('Failed to load skill gaps:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isDemo, student])

  if (loading && !isDemo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-slate-500">Analyzing skill gap intelligence...</p>
        </div>
      </div>
    )
  }

  // Real user with no career target set yet
  if (!isDemo && (!data || data.allGaps.length === 0)) {
    return (
      <div className="relative space-y-8 animate-in fade-in duration-500 pb-16">
        <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-[var(--color-accent)]/8 blur-3xl pointer-events-none" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Skill Gap Analysis</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Identify the exact missing capabilities holding you back from target opportunities.
          </p>
        </div>

        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-10 sm:p-12 text-center shadow-[0_15px_35px_-10px_rgba(15,23,42,0.06)]">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Select a Career Target</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Before we can calculate your skill gaps, choose your target role to load official industry benchmarks.
            </p>
            <div className="pt-2">
              <Link href="/student/career">
                <Button className="rounded-xl px-7 h-11 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                  Choose Career Target <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }


  const d = data!
  const priority = d?.priorityGap

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-[var(--color-accent)]/8 blur-3xl pointer-events-none" />
      <div className="absolute top-[480px] -left-12 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Skill Gap Engine</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Deterministic gap analysis evaluated against target: <strong className="text-slate-900 font-bold">{d?.careerName || "Target Role"}</strong>.
          </p>
        </div>
      </div>

      {/* Priority Focus Banner */}
      {priority && (
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-rose-200/80 p-6 sm:p-7 shadow-[0_15px_35px_-10px_rgba(244,63,94,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">Priority Focus: {priority.skillName}</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 ring-1 ring-rose-400/20">
                  Critical Gap ({priority.gap} pts)
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl font-medium">
                Closing this {priority.gap}-point gap is the highest-leverage action to advance past industry benchmarks for {d.careerName}.
              </p>
            </div>
          </div>
          <Link href="/student/assessment" className="shrink-0 w-full md:w-auto">
            <Button className="w-full md:w-auto rounded-xl h-11 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all">
              Assess {priority.skillName} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Floating AI Diagnostic Box */}
      {d?.summary && (
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-[var(--color-border-primary)] p-6 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.08)] space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] text-[var(--color-accent)] flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Diagnostic Summary</h3>
              <p className="text-xs text-slate-500">Benchmark synthesis & prioritized roadmap</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-primary)]">
            <p className="text-xs text-[var(--color-foreground)] font-medium leading-relaxed">
              <strong className="font-bold text-[var(--color-foreground)]">Recommended Action:</strong> {d.summary.recommendedAction}
            </p>
          </div>
        </div>
      )}

      {/* Ranked Skill Gaps List with Anti-Gravity styling */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Detailed Competency Breakdown</h2>

        {(d?.allGaps || []).map((gap) => {
          const isUnassessed = !gap.isAssessed
          const isReady = !isUnassessed && gap.status === 'ready'
          const isCritical = !isUnassessed && gap.status === 'critical'

          const cardStyle = isUnassessed
            ? 'border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]/30'
            : isCritical
            ? 'border-rose-200/70 bg-rose-50/30'
            : isReady
            ? 'border-emerald-200/70 bg-emerald-50/30'
            : 'border-amber-200/70 bg-amber-50/30'

          const badgeStyle = isUnassessed
            ? 'bg-[var(--color-surface-secondary)] text-[var(--color-foreground)] border-[var(--color-border-primary)] ring-1 ring-slate-200'
            : isCritical
            ? 'bg-rose-50 text-rose-800 border-rose-200/80 ring-1 ring-rose-400/20'
            : isReady
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 ring-1 ring-emerald-400/20'
            : 'bg-amber-50 text-amber-800 border-amber-200/80 ring-1 ring-amber-400/20'

          return (
            <div
              key={gap.skillId}
              className={`group rounded-3xl bg-white/90 backdrop-blur-xl border ${cardStyle} p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:shadow-[0_20px_45px_-10px_rgba(15,23,42,0.1)] transition-all duration-300`}
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-base text-slate-900">{gap.skillName}</h3>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                      {isUnassessed ? (
                        <Target className="h-3 w-3 text-[var(--color-accent)]" />
                      ) : isReady ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ) : isCritical ? (
                        <AlertTriangle className="h-3 w-3 text-rose-600" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-amber-600" />
                      )}
                      {isUnassessed ? 'Unassessed Skill' : isReady ? 'Ready' : isCritical ? 'Critical Gap' : 'Needs Improvement'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {gap.importance} Priority • {gap.category || "Technical"}
                  </p>
                </div>
                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  <div className="text-sm font-black text-slate-900 font-mono">
                    {isUnassessed ? (
                      <span className="text-[var(--color-text-secondary)] font-semibold">Unassessed</span>
                    ) : (
                      <>{gap.currentLevel} <span className="text-slate-400 font-normal">/ {gap.requiredLevel}</span></>
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${isUnassessed ? 'text-[var(--color-accent)]' : gap.gap > 0 ? (isCritical ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-600'}`}>
                    {isUnassessed ? `Target: ${gap.requiredLevel} pts required` : gap.gap > 0 ? `${gap.gap} pts below benchmark` : 'Benchmark satisfied'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-2 rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnassessed ? 'bg-slate-300' : isReady ? 'bg-emerald-500' : isCritical ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${isUnassessed ? 15 : Math.min(100, (gap.currentLevel / Math.max(gap.requiredLevel, 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-1">
                  <span>Recommendation: {gap.recommendation}</span>
                  <Link href="/student/assessment">
                    <Button size="sm" variant="ghost" className="h-7 text-xs font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover:bg-[var(--color-accent-light)] rounded-lg px-2">
                      {isUnassessed ? 'Start Initial Assessment →' : 'Verify Skill →'}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}