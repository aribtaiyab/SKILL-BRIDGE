"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Bot, Target, AlertTriangle, FileText, CheckCircle2, TrendingUp, Loader2, Sparkles, Shield, Award, Zap, ChevronRight, Compass } from "lucide-react"
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
        const json = await apiClient('/api/student/readiness')
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
          <Loader2 className="h-9 w-9 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-slate-500">Loading skill intelligence...</p>
        </div>
      </div>
    )
  }

  // Determine active view mode
  const studentName = isDemo ? student.name : (profile?.full_name || user?.email?.split('@')[0] || 'Student')

  // Demo View
  if (isDemo) {
    return (
      <div className="relative space-y-5 animate-in fade-in duration-500 pb-8">
        {/* Ambient background glow orbs */}
        <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-[var(--color-accent)]/8 blur-3xl pointer-events-none" />
        <div className="absolute top-[450px] -left-12 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome back, {studentName}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ring-1 ring-amber-400/20">
                <Sparkles className="h-3 w-3 text-amber-500" /> Demo Profile
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Here is your verified skill intelligence and opportunity alignment overview.
            </p>
          </div>
        </div>

        {/* Actionable Readiness Nudge Banner */}
        <ReadinessNudge
          pointsAway={student.priorityGap?.gap || 8}
          activeInternshipsCount={3}
          skillName={student.priorityGap?.skillName || "Node.js"}
        />

        {/* Top Area: Floating Readiness Hero Card */}
        <div className="rounded-2xl bg-white border border-[var(--color-border-primary)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] transition-all duration-200 overflow-hidden">
          <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-5 md:col-span-1 bg-gradient-to-br from-[#FAF8F3] via-white to-[#F2F7F9] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--color-border-primary)]">
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Career Target</span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-5">{student.targetCareer}</h3>
                
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Career Readiness</span>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-black tracking-tight text-emerald-800">{student.readinessPercentage}%</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ring-1 ring-emerald-400/20">
                    {student.readinessCategory}
                  </span>
                </div>
              </div>
              <div className="space-y-1 pt-2">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] rounded-full transition-all duration-500"
                    style={{ width: `${student.readinessPercentage}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-600 font-medium">Deterministic score calculation</span>
              </div>
            </div>

            <div className="p-5 md:col-span-3 flex flex-col justify-between space-y-3.5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border border-[var(--color-border-primary)] ring-1 ring-[var(--color-accent)]/20 uppercase tracking-wider">
                    <Zap className="h-3 w-3 text-[var(--color-accent)]" /> Priority Insight
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
                  <Button className="rounded-xl h-10 px-5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                    Take Skill Assessment <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/student/career">
                  <Button variant="outline" className="rounded-xl h-10 px-5 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                    Explore Career Requirements
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Skills Breakdown & Quick Actions */}
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-5">
            <div className="rounded-2xl bg-white border border-[var(--color-border-primary)] p-5 shadow-[var(--shadow-soft)] transition-all duration-200">
              <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Skill Benchmark Breakdown</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Verified capability versus target career requirements</p>
                </div>
                <Link href="/student/passport">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover:bg-[var(--color-accent-light)] rounded-lg">
                    View in Passport <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3.5">
                {student.skills.map((skill) => (
                  <div key={skill.id} className="group p-3.5 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-primary)] hover:bg-white hover:border-[var(--color-accent)]/40 transition-all duration-150">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-[var(--color-foreground)] transition-colors">{skill.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs">
                          {skill.verificationLabel}
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-700 font-mono">
                        {skill.currentLevel} <span className="text-slate-400 font-normal">/ {skill.requiredLevel}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          skill.gap === 0 ? 'bg-emerald-500' : 'bg-[var(--color-accent)]'
                        }`}
                        style={{ width: `${Math.min(100, (skill.currentLevel / Math.max(skill.requiredLevel, 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1.5">
                      <span className={skill.gap > 0 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                        {skill.gap > 0 ? `${skill.gap} pts below benchmark` : 'Benchmark satisfied'}
                      </span>
                      <span className="capitalize text-slate-400">{skill.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl bg-white border border-[var(--color-border-primary)] p-5 shadow-[var(--shadow-soft)] transition-all duration-200">
              <h3 className="text-base font-bold text-slate-900 tracking-tight pb-3 mb-4 border-b border-slate-100">
                Quick Intelligence Links
              </h3>
              <div className="space-y-2.5">
                <Link
                  href="/student/assessment"
                  className="group flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-primary)] hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-accent)]/40 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center shadow-xs">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[var(--color-accent)] transition-colors">Take Assessment</div>
                      <div className="text-[10px] text-slate-500">MCQ, Practical & Evidence</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/student/skill-gap"
                  className="group flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-primary)] hover:bg-amber-50/40 hover:border-amber-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shadow-xs">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Skill Gap Engine</div>
                      <div className="text-[10px] text-slate-500">Benchmark gap diagnostics</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/student/passport"
                  className="group flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-primary)] hover:bg-emerald-50/40 hover:border-emerald-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Skill Passport</div>
                      <div className="text-[10px] text-slate-500">Verifiable credentials & ledger</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/student/career-navigator"
                  className="group flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-primary)] hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-accent)]/40 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center shadow-xs">
                      <Compass className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[var(--color-accent)] transition-colors">Career Navigator</div>
                      <div className="text-[10px] text-slate-500">Compare paths & market demand</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all" />
                </Link>

              </div>
            </div>
          </div>
        </div>

        {/* Living Skill Passport Component: The Anchor Piece */}
        <LivingSkillPassportCard
          studentName={studentName}
          targetRole={student.targetCareer}
          readinessScore={student.readinessPercentage}
          skills={student.skills.map(s => ({
            skillName: s.name,
            score: s.currentLevel,
            tier: s.currentLevel >= 80 ? 'Evidence Verified' : s.currentLevel >= 70 ? 'Practical Verified' : s.isAssessed ? 'Assessment Verified' : 'Self-Declared',
          }))}
        />
      </div>
    )
  }

  // Real User State: 1. No career target chosen
  if (!readiness || !readiness.careerName) {
    return (
      <div className="relative space-y-5 animate-in fade-in duration-500 pb-8">
        <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-[var(--color-accent)]/8 blur-3xl pointer-events-none" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome, {studentName}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Get started by choosing a target career to see what skills are required.
          </p>
        </div>

        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-10 sm:p-12 text-center shadow-[0_15px_35px_-10px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_45px_-10px_rgba(15,23,42,0.1)] transition-all duration-300">
          <div className="max-w-md mx-auto space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] text-[var(--color-accent)] flex items-center justify-center mx-auto shadow-sm">
              <Target className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Choose a target career to see what's required</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                SkillBridge measures your actual capabilities against industry benchmarks and maps out your exact readiness journey.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/student/career">
                <Button className="rounded-xl px-7 h-11 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                  Select Target Career <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Real User State: 2. Career chosen, but NO assessments taken yet
  const hasCompletedAnyAssessment = readiness.skills.some(s => s.isAssessed)

  if (!hasCompletedAnyAssessment) {
    return (
      <div className="relative space-y-5 animate-in fade-in duration-500 pb-8">
        <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-[var(--color-accent)]/8 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {studentName}
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Target Role: <strong className="text-slate-900 font-bold">{readiness.careerName}</strong>
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[var(--color-border-primary)] p-5 shadow-[var(--shadow-soft)] transition-all duration-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Career Target</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{readiness.careerName}</h3>
              <p className="text-xs text-slate-500 font-medium">
                Career Readiness: <span className="text-[var(--color-accent)] font-bold">Complete an assessment to calculate your verified score</span>
              </p>
            </div>
            <Link href="/student/assessment">
              <Button className="rounded-xl px-6 h-11 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                Start Knowledge Assessment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Skill Benchmarks with Not Assessed status */}
        <div className="rounded-2xl bg-white border border-[var(--color-border-primary)] p-5 shadow-[var(--shadow-soft)]">
          <div className="pb-4 border-b border-slate-100 mb-5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Required Career Benchmarks</h2>
            <p className="text-xs text-slate-500 mt-0.5">Skills required for {readiness.careerName}. Complete assessments to verify your score.</p>
          </div>
          <div className="space-y-3">
            {readiness.skills.map((skill) => (
              <div key={skill.skillId} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:bg-white transition-all">
                <div>
                  <div className="font-bold text-sm text-slate-900">{skill.skillName}</div>
                  <div className="text-xs text-slate-500 font-medium">Required Benchmark: {skill.requiredLevel} / 100</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 italic">Not assessed</span>
                  <Link href="/student/assessment">
                    <Button size="sm" variant="outline" className="text-xs h-8 rounded-lg border-slate-200 hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)]">
                      Assess
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Real User State: 3. Assessed User
  const d = readiness

  return (
    <div className="relative space-y-5 animate-in fade-in duration-500 pb-8">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-[var(--color-accent)]/8 blur-3xl pointer-events-none" />
      <div className="absolute top-[450px] -left-12 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {studentName}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Here is your verified skill intelligence overview for today.
          </p>
        </div>
      </div>

      {/* Actionable Readiness Nudge Banner */}
      <ReadinessNudge
        pointsAway={d.priorityGap?.gap || 8}
        activeInternshipsCount={3}
        skillName={d.priorityGap?.skillName || "Node.js"}
      />

      {/* Top Area: Floating Readiness Hero Card */}
      <div className="rounded-2xl bg-white border border-[var(--color-border-primary)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] transition-all duration-200 overflow-hidden">
        <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-5 md:col-span-1 bg-gradient-to-br from-[#FAF8F3] via-white to-[#F2F7F9] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--color-border-primary)]">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Career Target</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-5">{d.careerName}</h3>
              
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Career Readiness</span>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-black tracking-tight text-emerald-600">{d.readinessPercentage}%</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-400/20">
                  {d.readinessCategory}
                </span>
              </div>
            </div>
            <div className="space-y-1 pt-2">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] rounded-full transition-all duration-500"
                  style={{ width: `${d.readinessPercentage}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Deterministic score calculation</span>
            </div>
          </div>

          <div className="p-5 md:col-span-3 flex flex-col justify-between space-y-3.5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border border-[var(--color-border-primary)] ring-1 ring-[var(--color-accent)]/20 uppercase tracking-wider">
                  <Zap className="h-3 w-3 text-[var(--color-accent)]" /> Priority Insight
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 tracking-tight mb-1.5">
                {d.priorityGap ? `Top Focus: ${d.priorityGap.skillName} (${d.priorityGap.gap} pts to target)` : 'All Core Skill Benchmarks Satisfied'}
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                {d.priorityGap?.recommendation || 'You are well-prepared for opportunities matching your career target.'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/student/assessment">
                <Button className="rounded-xl h-10 px-5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                  Take Skill Assessment <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/student/career">
                <Button variant="outline" className="rounded-xl h-10 px-5 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                  Explore Career Requirements
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Skills Breakdown & Quick Actions */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <div className="rounded-2xl bg-white border border-[var(--color-border-primary)] p-5 shadow-[var(--shadow-soft)] transition-all duration-200">
            <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Skill Benchmark Breakdown</h2>
                <p className="text-xs text-slate-500 mt-0.5">Verified capability versus target career requirements</p>
              </div>
              <Link href="/student/passport">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover:bg-[var(--color-accent-light)] rounded-lg">
                  View in Passport <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3.5">
              {d.skills.map((skill) => (
                <div key={skill.skillId} className="group p-3.5 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-primary)] hover:bg-white hover:border-[var(--color-accent)]/40 transition-all duration-150">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-bold text-slate-900 group-hover:text-[var(--color-foreground)] transition-colors">{skill.skillName}</span>
                    <span className="text-xs font-black text-slate-700 font-mono">
                      {skill.isAssessed ? `${skill.currentLevel} / ${skill.requiredLevel}` : `Not assessed (Req: ${skill.requiredLevel})`}
                    </span>
                  </div>
                  {skill.isAssessed ? (
                    <>
                      <div className="h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            skill.gap === 0 ? 'bg-emerald-500' : 'bg-[var(--color-accent)]'
                          }`}
                          style={{ width: `${Math.min(100, (skill.currentLevel / Math.max(skill.requiredLevel, 1)) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1.5">
                        <span className={skill.gap > 0 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
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

        <div className="space-y-5">
          <div className="rounded-2xl bg-white border border-[var(--color-border-primary)] p-5 shadow-[var(--shadow-soft)] transition-all duration-200">
            <h3 className="text-base font-bold text-slate-900 tracking-tight pb-3 mb-4 border-b border-slate-100">
              Quick Intelligence Links
            </h3>
            <div className="space-y-2.5">
              <Link
                href="/student/assessment"
                className="group flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-primary)] hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-accent)]/40 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center shadow-xs">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[var(--color-accent)] transition-colors">Take Assessment</div>
                    <div className="text-[10px] text-slate-500">MCQ, Practical & Evidence</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/student/skill-gap"
                className="group flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-primary)] hover:bg-amber-50/40 hover:border-amber-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shadow-xs">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Skill Gap Engine</div>
                    <div className="text-[10px] text-slate-500">Benchmark gap diagnostics</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/student/passport"
                className="group flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-primary)] hover:bg-emerald-50/40 hover:border-emerald-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Skill Passport</div>
                    <div className="text-[10px] text-slate-500">Verifiable credentials & ledger</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/student/career-navigator"
                className="group flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-primary)] hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-accent)]/40 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center shadow-xs">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[var(--color-accent)] transition-colors">Career Navigator</div>
                    <div className="text-[10px] text-slate-500">Compare paths & market demand</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all" />
              </Link>

            </div>
          </div>
        </div>
      </div>

      {/* Living Skill Passport Component: The Anchor Piece */}
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