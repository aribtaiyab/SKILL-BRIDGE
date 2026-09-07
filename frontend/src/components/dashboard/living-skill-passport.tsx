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
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F0F6F9] text-[#24546D] border border-[#A8C9D9]/80 ring-1 ring-[#A8C9D9]/30 shadow-xs">
            <CheckCircle2 className="h-3 w-3 text-[#24546D]" /> Evidence Verified
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
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border border-[var(--color-accent)]/30 ring-1 ring-[var(--color-accent)]/20 shadow-xs">
            <Check className="h-3 w-3 text-[var(--color-accent)]" /> Assessment Verified
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
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-primary)] bg-white p-5 md:p-6 shadow-[var(--shadow-soft)] transition-all duration-300">
      {/* Background ambient lighting orbs */}
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[var(--color-accent)]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[var(--color-accent-sky)]/15 blur-3xl pointer-events-none" />

      {/* Official Identity Header Card */}
      <div className="relative z-10 border-b border-[var(--color-border-primary)] pb-5 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border border-[var(--color-accent)]/30 shadow-xs">
                <Shield className="h-3.5 w-3.5 text-[var(--color-accent)]" /> Living Skill Passport
              </span>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-foreground)] border border-[var(--color-border-primary)]">
                ID: {studentId}
              </span>
              <span className="font-mono text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]">
                {cohort}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-foreground)] tracking-tight">{studentName}</h2>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] mt-0.5">{degree}</p>
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] mt-1">
                <Building2 className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                <span>{institution}</span>
                <span className="text-slate-300">•</span>
                <span>Target Career: <strong className="text-[var(--color-foreground)]">{targetRole}</strong></span>
              </div>
            </div>
          </div>

          {/* Readiness Meter */}
          <div className="relative shrink-0 flex items-center gap-4 p-4 sm:p-5 rounded-xl bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border-primary)] shadow-xs">
            <div className="relative flex items-center justify-center">
              {/* Ring */}
              <div className="h-16 w-16 rounded-full bg-[var(--color-accent)] p-1 shadow-xs">
                <div className="h-full w-full rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-[var(--color-foreground)] leading-none">{readinessScore}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-tight text-[var(--color-accent)]">Ready</span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] block">Overall Benchmark</span>
              <span className="text-sm font-extrabold text-[var(--color-foreground)]">
                {readinessScore >= 80 ? "Benchmark Met" : readinessScore >= 65 ? "Near Ready" : "Developing"}
              </span>
              <div className="w-28 sm:w-32 mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Skills Matrix (2-Column Grid) */}
      <div className="relative z-10 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
              Verified Skill Score Matrix ({skills.length} Calibrated Competencies)
            </h3>
            <Link href="/student/skills" className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover:underline">
              View All Skills →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            {skills.map((item) => (
              <div
                key={item.skillName}
                className="group relative rounded-xl border border-[var(--color-border-primary)] bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/40 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      {item.category || "Technical Competency"}
                    </span>
                    <h4 className="text-sm font-bold text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors">
                      {item.skillName}
                    </h4>
                  </div>
                  {getTierPill(item.tier)}
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--color-text-secondary)]">Benchmark Score</span>
                    <span className="text-[var(--color-foreground)]">{item.score} / 100</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                      style={{ width: `${Math.min(item.score, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                  <span>{item.lastEvaluated || "Evaluated via Engine"}</span>
                  <span className="font-semibold text-[var(--color-foreground)]">{item.score >= 80 ? "Benchmark Satisfied" : `${80 - item.score} pts to target`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Practical Projects Card */}
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] shadow-xs">
              <GitBranch className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] block">
                Verified Practical Proof Project
              </span>
              <p className="text-sm font-bold text-[var(--color-foreground)] truncate">
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
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--color-border-primary)] bg-white text-[var(--color-foreground)] shadow-xs hover:bg-[var(--color-surface-secondary)] transition-all duration-150 active:scale-[0.98]"
              >
                GitHub Repository <ExternalLink className="h-3 w-3 ml-0.5 text-[var(--color-text-secondary)]" />
              </a>
            )}
            {liveDemoUrl && (
              <a
                href={liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] shadow-xs hover:bg-[var(--color-accent)]/20 transition-all duration-150 active:scale-[0.98]"
              >
                Live Preview <ExternalLink className="h-3 w-3 ml-0.5 text-[var(--color-accent)]" />
              </a>
            )}
            <Link
              href="/student/passport"
              className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-[var(--color-accent)] text-white shadow-xs hover:bg-[var(--color-accent-hover)] transition-all duration-150 active:scale-[0.98]"
            >
              Full Passport <Award className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
