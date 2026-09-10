"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  GraduationCap,
  Briefcase,
  Users,
  Target,
  ShieldCheck,
  TrendingUp,
  Layers,
  BookOpen
} from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"

interface PersonaMetric {
  label: string
  value: string
  isAlert?: boolean
  isHighlight?: boolean
}

interface PersonaItem {
  roleKey: 'academician' | 'student' | 'industry'
  icon: React.ReactNode
  badgeText: string
  isRecommended?: boolean
  title: string
  subtitle: string
  description: string
  metrics: PersonaMetric[]
  buttonText: string
}

export default function DemoLandingPage() {
  const { enterDemo } = useDemo()
  const router = useRouter()

  const personas: PersonaItem[] = [
    {
      roleKey: 'academician',
      icon: <Users className="w-6 h-6" />,
      badgeText: "Recommended",
      isRecommended: true,
      title: "Academia Faculty Portal",
      subtitle: "Dr. Ananya Sharma • Computer Science & Engineering",
      description: "Monitor the Class of 2026 (48 students), evaluate cohort skill deficit heatmaps, conduct targeted workshops, track 1-on-1 mentorships, and verify longitudinal score gains (+16 pts).",
      metrics: [
        { label: "Enrolled Cohort:", value: "48 Students (41 Assessed)" },
        { label: "Cohort Avg Readiness:", value: "68%", isHighlight: true },
        { label: "Active Mentorships:", value: "8 Sessions" },
        { label: "Upcoming Workshops:", value: "4 Masterclasses" },
      ],
      buttonText: "Launch Academia Demo",
    },
    {
      roleKey: 'student',
      icon: <GraduationCap className="w-6 h-6" />,
      badgeText: "Student Persona",
      isRecommended: false,
      title: "Student Skill Passport",
      subtitle: "Aarav Mehta • Full Stack Developer Track",
      description: "Explore a verified Living Skill Passport with 72% role readiness. Discover the 21-point REST API blocker, view GitHub proof artifacts, and test opportunity-specific matching.",
      metrics: [
        { label: "Role Benchmark:", value: "Full Stack Developer" },
        { label: "Overall Readiness:", value: "72% (Developing)", isHighlight: true },
        { label: "Priority Blocker:", value: "REST APIs (-21 pts)", isAlert: true },
        { label: "Verified Proof:", value: "2 Practical Repos" },
      ],
      buttonText: "Launch Student Demo",
    },
    {
      roleKey: 'industry',
      icon: <Briefcase className="w-6 h-6" />,
      badgeText: "Corporate Persona",
      isRecommended: false,
      title: "Industry Talent Pipeline",
      subtitle: "TechNova Labs • Talent Acquisition",
      description: "Experience recruitment through pre-verified skill readiness instead of unverified resumes. Review candidate pipelines filtered by proven code benchmarks and practical evidence.",
      metrics: [
        { label: "Active Postings:", value: "Full Stack & Cloud" },
        { label: "Pipeline Candidates:", value: "Matched Cohort", isHighlight: true },
        { label: "Hiring Verification:", value: "Skill Benchmark Driven" },
        { label: "FDP Collaboration:", value: "Active Partnership" },
      ],
      buttonText: "Launch Industry Demo",
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            Interactive Prototype Sandbox
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Explore SkillBridge Connect <br />
            <span className="text-emerald-700">
              In Full Interactive Demo Mode
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Experience our opportunity-specific skill intelligence system populated with a realistic, deterministic 48-student engineering cohort dataset. No signup, login, or credentials required.
          </p>
        </div>

        {/* 6-Step Loop Architecture Strip */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Core Platform Architecture
            </span>
            <span className="text-xs font-bold text-emerald-700">
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
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <s.icon className="h-4 w-4 mx-auto text-emerald-600" />
                <div className="text-xs font-black text-slate-900">{s.step}</div>
                <div className="text-[10px] text-slate-500">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Unified 3 Demo Persona Cards */}
        <section className="w-full">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Select a Demonstration Persona
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
              Switch personas freely at any time using the top Demo Bar
            </p>
          </div>

          {/* 3 Unified Persona Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {personas.map((persona, index) => (
              <div 
                key={index}
                className="group relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-12px_rgba(5,150,105,0.12)] hover:border-emerald-300"
              >
                {/* Card Header: Icon + Badge */}
                <div>
                  <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                      {persona.icon}
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      persona.isRecommended 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                    }`}>
                      {persona.badgeText}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="mt-5">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      {persona.title}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-700 mt-1">
                      {persona.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">
                    {persona.description}
                  </p>

                  {/* Key Metrics / Snapshot */}
                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                    {persona.metrics.map((metric, mIdx) => (
                      <div key={mIdx} className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">{metric.label}</span>
                        <span className={`font-semibold ${
                          metric.isAlert 
                            ? 'text-rose-600 font-bold' 
                            : metric.isHighlight 
                            ? 'text-emerald-700 font-bold' 
                            : 'text-slate-800'
                        }`}>
                          {metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Launch CTA Button */}
                <div className="mt-8 pt-4">
                  <button
                    onClick={() => enterDemo(persona.roleKey)}
                    className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 group-hover:bg-emerald-700 cursor-pointer"
                  >
                    <span>{persona.buttonText}</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* Security & Safety Notice Footer */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Safe Sandbox Guarantee:</strong> Demo mode runs strictly on pre-seeded fictional data. Actions do not alter real production records.
            </span>
          </div>
          <Link href="/signup" className="text-emerald-700 font-bold hover:underline shrink-0">
            Create Real Account &rarr;
          </Link>
        </div>
      </main>
    </div>
  )
}
