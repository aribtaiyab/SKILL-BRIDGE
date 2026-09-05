"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users, AlertTriangle, TrendingUp, Calendar, BookOpen,
  ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Loader2,
  Presentation, Zap, ArrowUpRight, Award, Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api-client"

import { useDemo } from "@/lib/demo/demo-context"

interface DashboardData {
  kpis: {
    totalStudents: number
    studentsAssessed: number
    avgCohortReadiness: number
    requiringAttentionCount: number
    activeMentorshipsCount: number
    upcomingWorkshopsCount: number
    activeInterventionsCount: number
  }
  readinessDistribution: {
    notReady: number
    earlyProgress: number
    developing: number
    ready: number
    highlyReady: number
  }
  topSkillGaps: Array<{
    skillId: string
    skillName: string
    category: string
    affectedCount: number
    avgGap: number
    severity: string
  }>
  priorityAction: {
    skillName: string
    affectedCount: number
    severity: string
    recommendation: string
    suggestedActionType: 'workshop' | 'mentorship'
  } | null
  recentProgressEvents: Array<{
    id: string
    studentId: string
    skillName: string
    previousScore: number
    newScore: number
    improvementPoints: number
    reassessedAt: string
  }>
}

export default function AcademiaDashboardPage() {
  const { isDemo, demoService } = useDemo()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setData(demoService.getDashboardData())
      setLoading(false)
      return
    }

    apiClient<{ success: boolean; data: DashboardData }>('/api/academia/dashboard')
      .then(res => {
        if (res?.success && res.data) {
          setData(res.data)
        }
      })
      .catch(err => console.warn('Dashboard fetch error:', err))
      .finally(() => setLoading(false))
  }, [isDemo, demoService])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Synthesizing cohort skill intelligence...</p>
        </div>
      </div>
    )
  }

  const kpis = data?.kpis
  const distribution = data?.readinessDistribution
  const topGaps = data?.topSkillGaps || []
  const priorityAction = data?.priorityAction
  const progressEvents = data?.recentProgressEvents || []

  const totalAssessed = kpis?.studentsAssessed || 0

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* 1. WELCOME & CONTEXT HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
              Institutional Intelligence
            </span>
            {isDemo && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                Pre-Seeded Demo Data &bull; Class of 2026
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Academia Dashboard
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Real-time cohort competency distribution, diagnostic skill deficits, and automated intervention actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/academia/workshops">
            <Button size="sm" className="rounded-xl h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20">
              <Plus className="h-3.5 w-3.5 mr-1" /> New Workshop
            </Button>
          </Link>
          <Link href="/academia/students">
            <Button size="sm" variant="outline" className="rounded-xl h-9 px-3.5 border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50">
              View All Students
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. QUESTION 1: HOW ARE MY STUDENTS DOING? (CORE KPI CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Students & Assessed */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cohort Coverage</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-slate-900">{kpis?.totalStudents || 0}</span>
            <span className="text-xs font-bold text-slate-500">Students Accessible</span>
          </div>
          <div className="mt-3 text-xs font-semibold text-slate-600">
            {totalAssessed} of {kpis?.totalStudents || 0} students assessed
          </div>
          <Progress
            value={kpis?.totalStudents ? (totalAssessed / kpis.totalStudents) * 100 : 0}
            className="h-1.5 mt-2"
          />
        </div>

        {/* Cohort Average Readiness */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Readiness</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-slate-900">{kpis?.avgCohortReadiness || 0}%</span>
            <span className="text-xs font-bold text-emerald-600">Cohort Standard</span>
          </div>
          <div className="mt-3 text-xs font-semibold text-slate-600">
            Calculated against role requirements
          </div>
          <Progress value={kpis?.avgCohortReadiness || 0} className="h-1.5 mt-2" />
        </div>

        {/* Requiring Attention */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-rose-200/70 bg-rose-50/20 p-6 shadow-[0_10px_30px_-10px_rgba(244,63,94,0.06)] hover:-translate-y-1 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Requiring Attention</span>
            <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-rose-800">{kpis?.requiringAttentionCount || 0}</span>
            <span className="text-xs font-bold text-rose-600">Under 60% Readiness</span>
          </div>
          <div className="mt-3 text-xs font-semibold text-rose-700">
            Bottlenecked by core skill gaps
          </div>
          <p className="text-[11px] text-rose-500 font-medium mt-1">Recommended for 1-on-1 coaching</p>
        </div>

        {/* Active Actions */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Interventions</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-slate-900">{kpis?.upcomingWorkshopsCount || 0}</span>
            <span className="text-xs font-bold text-amber-600">Workshops</span>
          </div>
          <div className="mt-3 text-xs font-semibold text-slate-600">
            {kpis?.activeMentorshipsCount || 0} Active Mentorship Sessions
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Faculty-guided remedial actions</p>
        </div>
      </div>

      {/* 3. STUDENT READINESS DISTRIBUTION */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 sm:p-7 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900">Student Placement Readiness Distribution</h3>
            <p className="text-xs text-slate-500">Benchmark qualification brackets among assessed students</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
            {totalAssessed} Assessed Students
          </span>
        </div>

        {totalAssessed === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed">
            No student assessment records found. Readiness distribution will compute automatically when students complete skill assessments.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Not Ready (&lt;40%)</span>
              <p className="text-2xl font-black text-rose-800 mt-1">{distribution?.notReady || 0}</p>
              <p className="text-[11px] text-rose-600 font-medium">Critical assistance</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Early Progress (40-54%)</span>
              <p className="text-2xl font-black text-amber-800 mt-1">{distribution?.earlyProgress || 0}</p>
              <p className="text-[11px] text-amber-600 font-medium">Foundational practice</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Developing (55-69%)</span>
              <p className="text-2xl font-black text-sky-800 mt-1">{distribution?.developing || 0}</p>
              <p className="text-[11px] text-sky-600 font-medium">Moderate deficit</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Ready (70-84%)</span>
              <p className="text-2xl font-black text-emerald-800 mt-1">{distribution?.ready || 0}</p>
              <p className="text-[11px] text-emerald-600 font-medium">Meets corporate bar</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Highly Ready (85%+)</span>
              <p className="text-2xl font-black text-purple-800 mt-1">{distribution?.highlyReady || 0}</p>
              <p className="text-[11px] text-purple-600 font-medium">Exceeds benchmarks</p>
            </div>
          </div>
        )}
      </div>

      {/* 4. QUESTION 3: WHAT ACTION SHOULD I TAKE? (PRIORITY ACTION CARD) */}
      {priorityAction && (
        <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-48 w-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                Automated Priority Diagnosis
              </span>
              <span className="text-xs text-indigo-300">Highest Cohort Impact</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              {priorityAction.recommendation}
            </h3>
            <p className="text-xs text-indigo-200 leading-relaxed font-medium">
              SkillBridge gap engine identified {priorityAction.affectedCount} students bottlenecked by {priorityAction.skillName}. Resolving this deficit unlocks immediate placement eligibility.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0">
            <Link href="/academia/workshops">
              <Button className="rounded-xl h-10 px-5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/30">
                Create {priorityAction.skillName} Workshop →
              </Button>
            </Link>
            <Link href="/academia/mentorship">
              <Button variant="outline" className="rounded-xl h-10 px-4 border-white/20 hover:bg-white/10 text-white font-bold text-xs">
                Start Mentorship
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 5. QUESTION 2 & 4: WHAT SKILLS ARE THEY STRUGGLING WITH? & IS MY INTERVENTION HELPING? */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Skill Gaps (2 columns) */}
        <div className="lg:col-span-2 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 sm:p-7 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Aggregated Skill Deficits</h3>
              <p className="text-xs text-slate-500">Skills with largest measured deficit across authorized students</p>
            </div>
            <Link href="/academia/skill-gaps">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50">
                Full Gap Engine →
              </Button>
            </Link>
          </div>

          {topGaps.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed">
              No skill deficit data found for authorized cohort.
            </div>
          ) : (
            <div className="space-y-3">
              {topGaps.map(gap => (
                <div key={gap.skillId} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:bg-white transition-all">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{gap.skillName}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        gap.severity === 'Critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {gap.severity}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-rose-600 font-mono">
                      -{gap.avgGap} pts deficit
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>{gap.category}</span>
                    <span className="text-slate-700 font-bold">{gap.affectedCount} students affected</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Question 4: Recent Student Progress (1 column) */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Recent Student Improvement</h3>
            <p className="text-xs text-slate-500">Real reassessment events</p>
          </div>

          {progressEvents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed">
              No reassessment records yet. Student score lifts will appear as students retake assessments post-intervention.
            </div>
          ) : (
            <div className="space-y-3">
              {progressEvents.map(evt => (
                <div key={evt.id} className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/60 space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                    <span>{evt.skillName}</span>
                    <span className="text-emerald-700">+{evt.improvementPoints} pts</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Reassessed: {evt.previousScore} → <strong className="text-emerald-800">{evt.newScore}</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {new Date(evt.reassessedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
