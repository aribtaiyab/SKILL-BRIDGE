"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Shield, CheckCircle2, GitBranch, ExternalLink, Award,
  Sparkles, GraduationCap, Building2, Calendar, Check
} from "lucide-react"

export interface SkillMatrixItem {
  skillName: string
  score: number
  tier: "Self-Declared" | "Assessment Verified" | "Practical Verified" | "Evidence Verified"
  category?: string
  lastEvaluated?: string
}

export interface LivingSkillPassportCardProps {
  studentName?: string
  targetRole?: string
  readinessScore?: number
  skills?: SkillMatrixItem[]
  linkedRepoUrl?: string
  projectTitle?: string
  degree?: string
  institution?: string
  studentId?: string
  cohort?: string
  liveDemoUrl?: string
}

export function LivingSkillPassportCard({
  studentName = "Sarah Jenkins",
  targetRole = "Backend Developer (Internship/Junior)",
  readinessScore = 78,
  skills = [
    { skillName: "Node.js", score: 80, tier: "Assessment Verified", category: "Core Runtime", lastEvaluated: "Verified Aug 2026" },
    { skillName: "REST APIs", score: 75, tier: "Practical Verified", category: "API Design", lastEvaluated: "Verified Aug 2026" },
    { skillName: "SQL", score: 82, tier: "Evidence Verified", category: "Databases", lastEvaluated: "Verified Aug 2026" },
    { skillName: "Git & Version Control", score: 75, tier: "Practical Verified", category: "Engineering Workflow", lastEvaluated: "Verified Aug 2026" },
  ],
  linkedRepoUrl = "https://github.com/developer/ecommerce-platform-api",
  projectTitle = "E-Commerce Microservices Platform",
  degree = "B.Tech Computer Science & Engineering",
  institution = "National Institute of Technology",
  studentId = "SB-2026-8842",
  cohort = "Cohort 2026 · Sem 7",
  liveDemoUrl = "https://ecommerce-api-demo.vercel.app",
}: LivingSkillPassportCardProps) {

  const getTierPill = (tier: SkillMatrixItem["tier"]) => {
    switch (tier) {
      case "Evidence Verified":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 ring-1 ring-purple-400/20 shadow-xs">
            <CheckCircle2 className="h-3 w-3 text-purple-600" /> Evidence Verified
          </span>
        )
      case "Practical Verified":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ring-1 ring-emerald-400/20 shadow-xs">
            <Check className="h-3 w-3 text-emerald-600" /> Practical Verified
          </span>
        )
      case "Assessment Verified":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 ring-1 ring-sky-400/20 shadow-xs">
            <Check className="h-3 w-3 text-sky-600" /> Assessment Verified
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ring-1 ring-amber-400/20 shadow-xs">
            Self-Declared
          </span>
        )
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100/80 bg-white/90 p-6 md:p-8 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.12)] backdrop-blur-xl transition-all duration-300">
      {/* Background ambient lighting orbs */}
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      {/* Official Identity Header Card */}
      <div className="relative z-10 border-b border-slate-100 pb-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70 shadow-xs">
                <Shield className="h-3.5 w-3.5 text-indigo-600" /> Living Skill Passport
              </span>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                ID: {studentId}
              </span>
              <span className="font-mono text-xs font-medium px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200/60">
                {cohort}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{studentName}</h2>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mt-0.5">{degree}</p>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mt-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{institution}</span>
                <span className="text-slate-300">•</span>
                <span>Target Career: <strong className="text-slate-900">{targetRole}</strong></span>
              </div>
            </div>
          </div>

          {/* Anti-Gravity Readiness Meter */}
          <div className="relative shrink-0 flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/80 border border-indigo-100/90 shadow-[0_10px_25px_-5px_rgba(99,102,241,0.15)]">
            <div className="relative flex items-center justify-center">
              {/* Glowing ring */}
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-500 p-1 shadow-md shadow-indigo-500/20 animate-pulse">
                <div className="h-full w-full rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-900 leading-none">{readinessScore}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-tight text-indigo-600">Ready</span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Overall Benchmark</span>
              <span className="text-sm font-extrabold text-slate-900">
                {readinessScore >= 80 ? "Benchmark Met" : readinessScore >= 65 ? "Near Ready" : "Developing"}
              </span>
              <div className="w-28 sm:w-32 mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Skills Matrix (2-Column Floating Grid) */}
      <div className="relative z-10 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Verified Skill Score Matrix ({skills.length} Calibrated Competencies)
            </h3>
            <Link href="/student/skills" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
              View All Skills →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {skills.map((item) => (
              <div
                key={item.skillName}
                className="group relative rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category || "Technical Competency"}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.skillName}
                    </h4>
                  </div>
                  {getTierPill(item.tier)}
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Benchmark Score</span>
                    <span className="text-slate-900">{item.score} / 100</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-500"
                      style={{ width: `${Math.min(item.score, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.lastEvaluated || "Evaluated via Engine"}</span>
                  <span className="font-semibold text-slate-700">{item.score >= 80 ? "Benchmark Satisfied" : `${80 - item.score} pts to target`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Practical Projects Card */}
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 shadow-xs">
              <GitBranch className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                Verified Practical Proof Project
              </span>
              <p className="text-sm font-bold text-slate-900 truncate">
                {projectTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {linkedRepoUrl && (
              <a
                href={linkedRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                GitHub Repository <ExternalLink className="h-3 w-3 ml-0.5 text-slate-400" />
              </a>
            )}
            {liveDemoUrl && (
              <a
                href={liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 text-indigo-700 shadow-xs hover:bg-indigo-100/70 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Live Preview <ExternalLink className="h-3 w-3 ml-0.5 text-indigo-500" />
              </a>
            )}
            <Link
              href="/student/passport"
              className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Full Passport <Award className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
