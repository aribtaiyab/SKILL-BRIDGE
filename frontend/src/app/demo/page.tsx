"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  GraduationCap,
  Briefcase,
  Users,
  Target,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Layers,
  Zap,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDemo } from "@/lib/demo/demo-context"

export default function DemoLandingPage() {
  const { enterDemo } = useDemo()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[var(--color-accent)]/10 via-[var(--color-accent-pink)]/5 to-transparent blur-3xl pointer-events-none" />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider animate-in fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            Interactive Prototype Sandbox
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            Explore SkillBridge Connect <br />
            <span className="bg-gradient-to-r from-[var(--color-accent)] via-[#4A7C59] to-[#E8B4B8] bg-clip-text text-transparent">
              In Full Interactive Demo Mode
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed">
            Experience our opportunity-specific skill intelligence system populated with a realistic, deterministic 48-student engineering cohort dataset. No signup, login, or credentials required.
          </p>
        </div>

        {/* The 6-Step Loop Infographic */}
        <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Core Platform Architecture
            </span>
            <span className="text-xs font-semibold text-[var(--color-accent)]">
              Opportunity-Specific Readiness
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {[
              { step: '1. Assess', desc: 'Diagnostic Benchmarking', icon: Target },
              { step: '2. Identify', desc: 'Precise Deficit Gaps', icon: Layers },
              { step: '3. Improve', desc: 'Targeted Interventions', icon: BookOpen },
              { step: '4. Reassess', desc: 'Verified Score Gains', icon: TrendingUp },
              { step: '5. Prove', desc: 'Practical GitHub Proof', icon: ShieldCheck },
              { step: '6. Connect', desc: 'Matched Opportunities', icon: Briefcase },
            ].map((s, idx) => (
              <div key={idx} className="p-3 rounded-[var(--radius-control)] bg-[var(--color-surface-card-hover)]/40 border border-[var(--color-border-primary)] space-y-1">
                <s.icon className="h-4 w-4 mx-auto text-[var(--color-accent)]" />
                <div className="text-xs font-bold text-[var(--color-text-primary)]">{s.step}</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Interactive Persona Cards */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Select a Demonstration Persona</h2>
            <p className="text-xs text-[var(--color-text-muted)]">Switch personas freely at any time using the top Demo Bar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Persona 1: Academia Faculty */}
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] hover:border-emerald-500/50 shadow-sm p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Recommended
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Academia Faculty Portal</h3>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Dr. Ananya Sharma &bull; Computer Science & Engineering
                  </p>
                </div>

                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Monitor the Class of 2026 (48 students), evaluate cohort skill deficit heatmaps, conduct targeted workshops, track 1-on-1 mentorships, and verify longitudinal score gains (+16 pts).
                </p>

                <div className="pt-2 border-t border-[var(--color-border-primary)] space-y-1.5 text-[11px] text-[var(--color-text-muted)]">
                  <div className="flex justify-between">
                    <span>Enrolled Cohort:</span>
                    <strong className="text-[var(--color-text-primary)]">48 Students (41 Assessed)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Cohort Avg Readiness:</span>
                    <strong className="text-emerald-600 font-mono">68%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Mentorships:</span>
                    <strong className="text-[var(--color-text-primary)]">8 Sessions</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Upcoming Workshops:</span>
                    <strong className="text-[var(--color-text-primary)]">4 Masterclasses</strong>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  onClick={() => enterDemo('academician')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
                >
                  Launch Academia Demo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Persona 2: Student */}
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/50 shadow-sm p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center font-bold">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                    Student Persona
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Student Skill Passport</h3>
                  <p className="text-xs font-semibold text-[var(--color-accent)] mt-0.5">
                    Aarav Mehta &bull; Full Stack Developer Track
                  </p>
                </div>

                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Explore a verified Living Skill Passport with 72% role readiness. Discover the 21-point REST API blocker, view GitHub proof artifacts, and test opportunity-specific matching.
                </p>

                <div className="pt-2 border-t border-[var(--color-border-primary)] space-y-1.5 text-[11px] text-[var(--color-text-muted)]">
                  <div className="flex justify-between">
                    <span>Role Benchmark:</span>
                    <strong className="text-[var(--color-text-primary)]">Full Stack Developer</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Overall Readiness:</span>
                    <strong className="text-[var(--color-accent)] font-mono">72% (Developing)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority Blocker:</span>
                    <strong className="text-rose-500 font-mono">REST APIs (-21 pts)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified Proof:</span>
                    <strong className="text-[var(--color-text-primary)]">2 Practical Repos</strong>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  onClick={() => enterDemo('student')}
                  className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
                >
                  Launch Student Demo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Persona 3: Industry */}
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] hover:border-blue-500/50 shadow-sm p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    Corporate Persona
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Industry Talent Pipeline</h3>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                    TechNova Labs &bull; Talent Acquisition
                  </p>
                </div>

                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Experience recruitment through pre-verified skill readiness instead of unverified resumes. Review candidate pipelines filtered by proven code benchmarks and practical evidence.
                </p>

                <div className="pt-2 border-t border-[var(--color-border-primary)] space-y-1.5 text-[11px] text-[var(--color-text-muted)]">
                  <div className="flex justify-between">
                    <span>Active Postings:</span>
                    <strong className="text-[var(--color-text-primary)]">Full Stack & Cloud</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pipeline Candidates:</span>
                    <strong className="text-blue-600 font-mono">Matched Cohort</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Hiring Verification:</span>
                    <strong className="text-[var(--color-text-primary)]">Skill Benchmark Driven</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>FDP Collaboration:</span>
                    <strong className="text-[var(--color-text-primary)]">Active Partnership</strong>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  onClick={() => enterDemo('industry')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
                >
                  Launch Industry Demo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Safety Notice Footer */}
        <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-surface-card-hover)]/40 border border-[var(--color-border-primary)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span>
              <strong>Safe Sandbox Guarantee:</strong> Demo mode runs strictly on pre-seeded fictional data. Actions do not alter real production records.
            </span>
          </div>
          <Link href="/signup" className="text-[var(--color-accent)] font-semibold hover:underline flex-shrink-0">
            Create Real Account &rarr;
          </Link>
        </div>
      </main>
    </div>
  )
}
