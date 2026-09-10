"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowRight, Bot, Target, AlertTriangle, FileText, CheckCircle2,
  TrendingUp, Loader2, Sparkles, Shield, Award, Zap, ChevronRight, Compass
} from "lucide-react"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import { CareerReadinessResult } from "@/lib/intelligence/engine"
import { apiClient } from "@/lib/api-client"
import { ReadinessNudge } from "@/components/dashboard/readiness-nudge"
import { LivingSkillPassportCard } from "@/components/dashboard/living-skill-passport"

export default function StudentDashboard() {
  const { user, profile } = useAuth()
  const { isDemo, student } = useDemo()
  const [readiness, setReadiness] = useState<CareerReadinessResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setLoading(false)
      return
    }

    async function loadData() {
      try {
        const json = await apiClient<any>('/api/student/readiness')
        if (json.success && json.data) {
          setReadiness(json.data)
        }
      } catch (err) {
        console.warn("Failed to load student dashboard intelligence:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isDemo])

  if (loading && !isDemo) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-500">Loading skill intelligence...</p>
        </div>
      </div>
    )
  }

  const studentName = isDemo ? student.name : (profile?.full_name || user?.email?.split('@')[0] || 'Student')

  // Demo View
  if (isDemo) {
    return (
      <div className="relative space-y-6 animate-in fade-in duration-300 pb-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome back, {studentName}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Sparkles className="h-3 w-3 text-amber-500" /> Demo Profile
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Here is your verified skill intelligence and opportunity alignment overview.
            </p>
          </div>
        </div>

        {/* Actionable Readiness Nudge Banner */}
        <ReadinessNudge
          pointsAway={student.priorityGap?.gap || 21}
          activeInternshipsCount={3}
          skillName={student.priorityGap?.skillName || "REST APIs"}
        />

        {/* Top Area: Floating Readiness Hero Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-6 md:col-span-1 bg-[#F8FAFC] flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Career Target</span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-5">{student.targetCareer}</h3>
                
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Career Readiness</span>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-black tracking-tight text-emerald-700">{student.readinessPercentage}%</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {student.readinessCategory}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${student.readinessPercentage}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Deterministic score calculation</span>
              </div>
            </div>

            <div className="p-6 md:col-span-3 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                    <Zap className="h-3 w-3 text-emerald-600" /> Priority Insight
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight mb-1.5">
                  {student.priorityGap ? `Top Focus: ${student.priorityGap.skillName} (${student.priorityGap.gap} pts to target)` : 'All Core Skill Benchmarks Satisfied'}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                  {student.priorityGap?.recommendation || 'You are well-prepared for opportunities matching your career target.'}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link href="/student/assessment">
                  <Button className="rounded-xl h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all">
                    Take Skill Assessment <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/student/career">
                  <Button variant="outline" className="rounded-xl h-10 px-5 border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs active:scale-[0.98] transition-all">
                    Explore Career Requirements
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Skills Breakdown & Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs">
              <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Skill Benchmark Breakdown</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Verified capability versus target career requirements</p>
                </div>
                <Link href="/student/passport">
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg">
                    View in Passport <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3.5">
                {student.skills.map((skill) => (
                  <div key={skill.id} className="group p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-200">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{skill.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          {skill.verificationLabel}
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {skill.currentLevel} <span className="text-slate-400 font-normal">/ {skill.requiredLevel}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          skill.gap === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, (skill.currentLevel / Math.max(skill.requiredLevel, 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-2">
                      <span className={skill.gap === 0 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                        {skill.gap === 0 ? "Benchmark satisfied" : `${skill.gap} pts below target`}
                      </span>
                      <span className="capitalize text-slate-400">{skill.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 tracking-tight pb-3 mb-4 border-b border-slate-100">
                Quick Intelligence Links
              </h3>
              <div className="space-y-3">
                <Link
                  href="/student/assessment"
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md active:scale-[0.98] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-2xs">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Take Assessment</div>
                      <div className="text-[10px] text-slate-500">MCQ, Practical & Evidence</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/student/skill-gap"
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md active:scale-[0.98] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shadow-2xs">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Skill Gap Engine</div>
                      <div className="text-[10px] text-slate-500">Benchmark gap diagnostics</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/student/passport"
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md active:scale-[0.98] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-2xs">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Skill Passport</div>
                      <div className="text-[10px] text-slate-500">Verifiable credentials & ledger</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/student/career-navigator"
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md active:scale-[0.98] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shadow-2xs">
                      <Compass className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-slate-900 transition-colors">Career Navigator</div>
                      <div className="text-[10px] text-slate-500">Compare paths & market demand</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Living Skill Passport Card */}
        <LivingSkillPassportCard
          studentName={studentName}
          targetRole={student.targetCareer}
          readinessScore={student.readinessPercentage}
          skills={student.skills.map(s => ({
            skillName: s.name,
            score: s.currentLevel,
            tier: s.currentLevel >= 80 ? 'Evidence Verified' : s.currentLevel >= 70 ? 'Practical Verified' : 'Assessment Verified',
          }))}
        />
      </div>
    )
  }

  // Live Assessed / Unassessed state
  if (!readiness || (!readiness.careerId && !readiness.careerName)) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white border border-slate-200/90 p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
            <Target className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Set Your Career Target</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Select a target role to calculate your deterministic readiness score against industry benchmark requirements.
          </p>
          <Link href="/student/career">
            <Button className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md">
              Select Career Target <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const d = readiness

  return (
    <div className="relative space-y-6 animate-in fade-in duration-300 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {studentName}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Target Role: <strong className="text-slate-900 font-bold">{d.careerName}</strong>
          </p>
        </div>
      </div>

      {/* Actionable Readiness Nudge Banner */}
      <ReadinessNudge
        pointsAway={d.priorityGap?.gap || 21}
        activeInternshipsCount={3}
        skillName={d.priorityGap?.skillName || "REST APIs"}
      />

      {/* Top Area: Floating Readiness Hero Card */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-6 md:col-span-1 bg-[#F8FAFC] flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Career Target</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-5">{d.careerName}</h3>
              
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Career Readiness</span>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-black tracking-tight text-emerald-700">{d.readinessPercentage}%</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {d.readinessCategory}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${d.readinessPercentage}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Deterministic score calculation</span>
            </div>
          </div>

          <div className="p-6 md:col-span-3 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  <Zap className="h-3 w-3 text-emerald-600" /> Priority Insight
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 tracking-tight mb-1.5">
                {d.priorityGap ? `Top Focus: ${d.priorityGap.skillName} (${d.priorityGap.gap} pts to target)` : 'All Core Skill Benchmarks Satisfied'}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                {d.priorityGap?.recommendation || 'You are well-prepared for opportunities matching your career target.'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/student/assessment">
                <Button className="rounded-xl h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all">
                  Take Skill Assessment <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/student/career">
                <Button variant="outline" className="rounded-xl h-10 px-5 border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs active:scale-[0.98] transition-all">
                  Explore Career Requirements
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Skills Breakdown & Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs">
            <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Skill Benchmark Breakdown</h2>
                <p className="text-xs text-slate-500 mt-0.5">Verified capability versus target career requirements</p>
              </div>
              <Link href="/student/passport">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg">
                  View in Passport <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3.5">
              {d.skills.map((skill) => (
                <div key={skill.skillId} className="group p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-200">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-bold text-slate-900">{skill.skillName}</span>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      {skill.isAssessed ? `${skill.currentLevel} / ${skill.requiredLevel}` : `Not assessed (Req: ${skill.requiredLevel})`}
                    </span>
                  </div>
                  {skill.isAssessed ? (
                    <>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            skill.gap === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (skill.currentLevel / Math.max(skill.requiredLevel, 1)) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-2">
                        <span className={skill.gap > 0 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                          {skill.gap > 0 ? `${skill.gap} pts below benchmark` : 'Benchmark satisfied'}
                        </span>
                        <span className="capitalize text-slate-400">{skill.status.replace('_', ' ')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400 italic">Complete assessment to evaluate gap</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 tracking-tight pb-3 mb-4 border-b border-slate-100">
              Quick Intelligence Links
            </h3>
            <div className="space-y-3">
              <Link
                href="/student/assessment"
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-2xs">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Take Assessment</div>
                    <div className="text-[10px] text-slate-500">MCQ, Practical & Evidence</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/student/skill-gap"
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shadow-2xs">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Skill Gap Engine</div>
                    <div className="text-[10px] text-slate-500">Benchmark gap diagnostics</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/student/passport"
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-2xs">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Skill Passport</div>
                    <div className="text-[10px] text-slate-500">Verifiable credentials & ledger</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/student/career-navigator"
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shadow-2xs">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-slate-900 transition-colors">Career Navigator</div>
                    <div className="text-[10px] text-slate-500">Compare paths & market demand</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Living Skill Passport Component */}
      <LivingSkillPassportCard
        studentName={studentName}
        targetRole={d.careerName || "Career Target"}
        readinessScore={d.readinessPercentage}
        skills={d.skills.map(s => ({
          skillName: s.skillName,
          score: s.currentLevel,
          tier: s.currentLevel >= 80 ? 'Evidence Verified' : s.currentLevel >= 70 ? 'Practical Verified' : s.isAssessed ? 'Assessment Verified' : 'Self-Declared',
        }))}
      />
    </div>
  )
}