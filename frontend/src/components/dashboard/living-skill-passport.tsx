"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield, CheckCircle2, GitBranch, ExternalLink, Award,
  Sparkles, GraduationCap, Building2, Calendar, Check,
  Copy, Printer, Share2
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
    { skillName: "SQL & Databases", score: 82, tier: "Evidence Verified", category: "Databases", lastEvaluated: "Verified Aug 2026" },
    { skillName: "Git & Version Control", score: 75, tier: "Practical Verified", category: "Engineering Workflow", lastEvaluated: "Verified Aug 2026" },
  ],
  linkedRepoUrl = "https://github.com/developer/ecommerce-platform-api",
  projectTitle = "E-Commerce Microservices Platform",
  degree = "B.Tech in Computer Science & Engineering",
  institution = "Faculty of Engineering & Technology",
  studentId = "SB-2026-8842",
  cohort = "2nd Year / 4th Semester",
  liveDemoUrl = "https://ecommerce-api-demo.vercel.app",
}: LivingSkillPassportCardProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  const getTierPill = (tier: SkillMatrixItem["tier"]) => {
    switch (tier) {
      case "Evidence Verified":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-950 text-white border border-emerald-900 shadow-2xs">
            <Shield className="h-3 w-3 text-emerald-400" /> Evidence Verified
          </span>
        )
      case "Practical Verified":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <Check className="h-3 w-3 text-emerald-600" /> Practical Verified
          </span>
        )
      case "Assessment Verified":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
            <Check className="h-3 w-3 text-slate-500" /> Assessment Verified
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            Self-Declared
          </span>
        )
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] transition-all duration-300">
      
      {/* Official Identity Header */}
      <div className="relative z-10 border-b border-slate-100 pb-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <Shield className="h-3.5 w-3.5 text-emerald-600" /> Living Skill Passport
              </span>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                ID: {studentId}
              </span>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {cohort}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{studentName}</h2>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mt-0.5">{degree}</p>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-1 flex-wrap">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{institution}</span>
                <span className="text-slate-300">•</span>
                <span>Target Career: <strong className="text-slate-900 font-bold">{targetRole}</strong></span>
              </div>
            </div>
          </div>

          {/* Readiness Gauge */}
          <div className="shrink-0 flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-600 p-1 shadow-xs">
                <div className="h-full w-full rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-900 leading-none">{readinessScore}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-tight text-emerald-700">Ready</span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Overall Benchmark</span>
              <span className="text-sm font-extrabold text-slate-900">
                {readinessScore >= 80 ? "Benchmark Satisfied" : readinessScore >= 65 ? "Near Ready" : "Developing"}
              </span>
              <div className="w-28 sm:w-32 mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Tier Verification Legend */}
      <div className="relative z-10 mb-6 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
          Four-Tier Verification Model
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-amber-200 text-amber-700 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>1. Self-Declared</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span>2. Assessment</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>3. Practical</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-950 text-white text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>4. Evidence</span>
          </div>
        </div>
      </div>

      {/* Verified Skills Matrix (2-Column Grid) */}
      <div className="relative z-10 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">
              Verified Skills Matrix ({skills.length} Calibrated Competencies)
            </h3>
            <Link href="/student/skills" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
              View All Skills →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {skills.map((item) => (
              <div
                key={item.skillName}
                className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {item.category || "Technical Competency"}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {item.skillName}
                    </h4>
                  </div>
                  {getTierPill(item.tier)}
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Benchmark Score</span>
                    <span className="text-slate-900 font-mono">{item.score} / 100</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${Math.min(item.score, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{item.lastEvaluated || "Evaluated via Engine"}</span>
                  <span className="font-bold text-slate-700">{item.score >= 80 ? "Benchmark Satisfied" : `${80 - item.score} pts to target`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Practical Project Showcase */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <GitBranch className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Verified Practical Proof Project
              </span>
              <p className="text-sm font-black text-slate-900 truncate">
                {projectTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {linkedRepoUrl && (
              <a
                href={linkedRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 shadow-2xs hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                GitHub Repo <ExternalLink className="h-3 w-3 ml-0.5 text-slate-400" />
              </a>
            )}
            {liveDemoUrl && (
              <a
                href={liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-all active:scale-[0.98]"
              >
                Live Demo <ExternalLink className="h-3 w-3 ml-0.5 text-emerald-600" />
              </a>
            )}
          </div>
        </div>

        {/* Credential Export Utilities */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs h-8.5 rounded-xl border-slate-300 text-slate-700 font-bold"
            >
              <Copy className="h-3.5 w-3.5 mr-1 text-slate-500" />
              {copied ? "Link Copied!" : "Copy Public Link"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8.5 rounded-xl border-slate-300 text-slate-700 font-bold"
            >
              <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
              Print / Save PDF
            </Button>
          </div>

          <Link href="/student/passport">
            <Button size="sm" className="text-xs h-8.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs">
              Full Living Passport <Award className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}
