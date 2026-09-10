"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users, AlertTriangle, TrendingUp, Calendar, BookOpen,
  ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Loader2,
  Presentation, Zap, ArrowUpRight, Award, Plus, ChevronRight, UserCheck
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
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-500">Synthesizing cohort skill intelligence...</p>
        </div>
      </div>
    )
  }

  const kpis = data?.kpis
  const distribution = data?.readinessDistribution
  const topGaps = data?.topSkillGaps || []
  const priorityAction = data?.priorityAction || {
    skillName: "REST APIs",
    affectedCount: 78,
    severity: "Critical",
    recommendation: "78% of students targeting Backend Roles have weak REST API skills.",
    suggestedActionType: "workshop" as const,
  }
  const progressEvents = data?.recentProgressEvents || []
  const totalAssessed = kpis?.studentsAssessed || 0
  const totalStudents = kpis?.totalStudents || 1

  // Compute distribution percentages for unified progress bar
  const nrCount = distribution?.notReady || 0
  const epCount = distribution?.earlyProgress || 0
  const devCount = distribution?.developing || 0
  const readyCount = distribution?.ready || 0
  const hrCount = distribution?.highlyReady || 0
  const distTotal = Math.max(1, nrCount + epCount + devCount + readyCount + hrCount)

  const pctNR = (nrCount / distTotal) * 100
  const pctEP = (epCount / distTotal) * 100
  const pctDEV = (devCount / distTotal) * 100
  const pctREADY = (readyCount / distTotal) * 100
  const pctHR = (hrCount / distTotal) * 100

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* 1. Context Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full">
              Institutional Intelligence
            </span>
            {isDemo && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
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
            <Button size="sm" className="rounded-xl h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> New Workshop
            </Button>
          </Link>
          <Link href="/academia/students">
            <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50">
              View All Students
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Four Balanced Uniform KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Cohort Coverage */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between h-[165px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cohort Coverage</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{kpis?.totalStudents || 0}</span>
              <span className="text-xs font-bold text-slate-500">Students Total</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-600">
              {totalAssessed} of {kpis?.totalStudents || 0} assessed
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-slate-700 rounded-full" style={{ width: `${(totalAssessed / totalStudents) * 100}%` }} />
          </div>
        </div>

        {/* Card 2: Average Readiness */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between h-[165px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Average Readiness</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{kpis?.avgCohortReadiness || 0}%</span>
              <span className="text-xs font-bold text-emerald-700">Cohort Standard</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-600">
              Against target role benchmarks
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${kpis?.avgCohortReadiness || 0}%` }} />
          </div>
        </div>

        {/* Card 3: Requiring Attention */}
        <div className="rounded-3xl bg-white border border-rose-200 bg-rose-50/20 p-6 shadow-xs flex flex-col justify-between h-[165px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Requiring Attention</span>
            <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-800">{kpis?.requiringAttentionCount || 0}</span>
              <span className="text-xs font-bold text-rose-600">Under 60% Readiness</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-rose-700">
              Bottlenecked by core skill gaps
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-rose-100 overflow-hidden">
            <div className="h-full bg-rose-600 rounded-full" style={{ width: `${Math.min(100, (kpis?.requiringAttentionCount || 0) * 8)}%` }} />
          </div>
        </div>

        {/* Card 4: Active Interventions */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between h-[165px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Active Interventions</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{kpis?.upcomingWorkshopsCount || 0}</span>
              <span className="text-xs font-bold text-amber-700">Workshops Active</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-600">
              {kpis?.activeMentorshipsCount || 0} Active Mentorship Sessions
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (kpis?.upcomingWorkshopsCount || 1) * 25)}%` }} />
          </div>
        </div>

      </div>

      {/* 3. Unified Placement Readiness Distribution Bar */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cohort Placement Readiness Distribution</h3>
            <p className="text-xs text-slate-500">Benchmark qualification brackets among assessed students</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {totalAssessed} Assessed Students
          </span>
        </div>

        {/* Single Unified Multi-Segment Progress Bar */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 p-0.5 gap-0.5 shadow-inner">
          <div
            className="h-full bg-rose-500 transition-all duration-500 rounded-l-full"
            style={{ width: `${pctNR}%` }}
            title={`Critical Assistance (<40%): ${nrCount} students (${pctNR.toFixed(1)}%)`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${pctEP}%` }}
            title={`Foundational Practice (40-54%): ${epCount} students (${pctEP.toFixed(1)}%)`}
          />
          <div
            className="h-full bg-slate-400 transition-all duration-500"
            style={{ width: `${pctDEV}%` }}
            title={`Moderate Deficit (55-69%): ${devCount} students (${pctDEV.toFixed(1)}%)`}
          />
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pctREADY}%` }}
            title={`Placement Ready (70-84%): ${readyCount} students (${pctREADY.toFixed(1)}%)`}
          />
          <div
            className="h-full bg-emerald-950 transition-all duration-500 rounded-r-full"
            style={{ width: `${pctHR}%` }}
            title={`Benchmark Exceeded (85%+): ${hrCount} students (${pctHR.toFixed(1)}%)`}
          />
        </div>

        {/* Segment Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200/70">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">&lt;40% Critical</span>
            </div>
            <p className="text-xl font-black text-rose-800">{nrCount}</p>
            <p className="text-[11px] text-rose-600 font-medium">Critical assistance</p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">40-54% Practice</span>
            </div>
            <p className="text-xl font-black text-amber-800">{epCount}</p>
            <p className="text-[11px] text-amber-600 font-medium">Foundational practice</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">55-69% Deficit</span>
            </div>
            <p className="text-xl font-black text-slate-900">{devCount}</p>
            <p className="text-[11px] text-slate-500 font-medium">Moderate deficit</p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">70-84% Ready</span>
            </div>
            <p className="text-xl font-black text-emerald-800">{readyCount}</p>
            <p className="text-[11px] text-emerald-600 font-medium">Placement ready</p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950 text-white border border-emerald-900">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">85%+ Exceeded</span>
            </div>
            <p className="text-xl font-black text-white">{hrCount}</p>
            <p className="text-[11px] text-emerald-200 font-medium">Exceeds benchmark</p>
          </div>
        </div>
      </div>

      {/* 4. Automated Intervention Trigger Card */}
      <div className="rounded-3xl bg-emerald-950 text-white p-6 sm:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
              Automated Priority Diagnosis
            </span>
            <span className="text-xs text-emerald-200">Highest Cohort Impact</span>
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">
            {priorityAction.recommendation}
          </h3>
          <p className="text-xs text-emerald-200/80 leading-relaxed font-medium">
            SkillBridge gap engine identified {priorityAction.affectedCount} students bottlenecked by {priorityAction.skillName}. Launching a targeted workshop unlocks immediate internship qualification.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/academia/workshops">
            <Button className="rounded-xl h-10 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md">
              + Launch Workshop Intervention
            </Button>
          </Link>
          <Link href="/academia/mentorship">
            <Button variant="outline" className="rounded-xl h-10 px-4 border-emerald-700 hover:bg-emerald-900 text-white font-bold text-xs">
              Assign Mentors
            </Button>
          </Link>
        </div>
      </div>

      {/* 5. Student Triage & Deficit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Skill Gaps (2 columns) */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Aggregated Skill Deficits</h3>
              <p className="text-xs text-slate-500">Skills with largest measured deficit across authorized students</p>
            </div>
            <Link href="/academia/skill-gaps">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-700 hover:bg-emerald-50">
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
                <div key={gap.skillId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all">
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
                    <span className="text-xs font-black text-rose-600 font-mono">
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

        {/* Recent Reassessment Events */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Verification Events</h3>
              <p className="text-xs text-slate-500">Live capability upgrades</p>
            </div>
            <Link href="/academia/verification">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-700 hover:bg-emerald-50">
                View All →
              </Button>
            </Link>
          </div>

          {progressEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed">
              No recent progress events recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {progressEvents.slice(0, 5).map(event => (
                <div key={event.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900">{event.skillName}</span>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      +{event.improvementPoints} pts
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Score: {event.previousScore} → {event.newScore}</span>
                    <span>{event.reassessedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
