import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  CheckCircle2, ArrowRight, ShieldCheck, Target, Award,
  Users, Building2, Briefcase, Zap, Sparkles, Check, ChevronRight,
  TrendingUp, BarChart3, Code2, GraduationCap
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 sm:px-6 py-16 sm:py-24 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-14 items-center">
              
              {/* Left Column (Typography & Call to Action) */}
              <div className="space-y-7">
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Verified Skill Intelligence Engine</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-slate-900 leading-[1.12]">
                  Know exactly how ready you are for your{" "}
                  <span className="text-emerald-700">next opportunity.</span>
                </h1>

                <p className="max-w-[540px] text-base sm:text-lg text-slate-600 leading-relaxed">
                  SkillBridge measures your skills against real industry benchmarks, isolates your exact gaps, provides targeted remediation, verifies your proof, and connects you directly with hiring employers.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto h-12 px-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 text-sm rounded-xl">
                      Check Your Readiness <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/student/career">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl">
                      Explore Role Benchmarks
                    </Button>
                  </Link>
                </div>

                {/* Feature Progression Strip */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-slate-200/80 pt-6 text-xs sm:text-sm text-slate-600 font-bold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Assess</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Identify</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Improve</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Prove</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Connect</span>
                  </div>
                </div>
              </div>

              {/* Right Column (Target Role Preview Card) */}
              <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto">
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.09)] backdrop-blur-md">
                  
                  {/* Card Header */}
                  <div className="border-b border-slate-100 pb-5 mb-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Target Role Preview</span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">Junior Backend Developer</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> 78% Ready
                      </span>
                    </div>
                  </div>

                  {/* Animated Skill Score Bars */}
                  <div className="space-y-4 mb-5">
                    {/* Node.js (Rose Deficit) */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-800">Node.js</span>
                        <span className="text-rose-600 font-extrabold">65 / 80 (Deficit -15 pts)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: "65%" }} />
                      </div>
                    </div>

                    {/* REST APIs (Amber Progress) */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-800">REST APIs</span>
                        <span className="text-amber-600 font-extrabold">72 / 80 (Near Ready -8 pts)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: "72%" }} />
                      </div>
                    </div>

                    {/* SQL (Emerald Ready) */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-800">SQL & Databases</span>
                        <span className="text-emerald-600 font-extrabold">82 / 80 (Benchmark Satisfied)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "82%" }} />
                      </div>
                    </div>

                    {/* Git (Emerald Ready) */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-800">Git & Version Control</span>
                        <span className="text-emerald-600 font-extrabold">75 / 70 (Benchmark Satisfied)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "75%" }} />
                      </div>
                    </div>
                  </div>

                  {/* Priority Gap Action Box */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-black text-slate-900">Priority Gap: Node.js</span>
                      </div>
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        Critical Deficit
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      Complete a 15-minute targeted async/await and streaming practical challenge to raise readiness by 12%.
                    </p>
                    <Link href="/student/assessment" className="block pt-1">
                      <Button size="sm" className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs">
                        Start Practice Task →
                      </Button>
                    </Link>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3 Pillars Section */}
        <section className="py-16 sm:py-20 border-t border-slate-200/80 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Three Integrated Ecosystems
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Designed for Students, Universities, and Industry.
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Bridging the gap between academic curriculum and high-growth technology hiring.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Student Pillar */}
              <div className="group rounded-3xl border border-slate-200/90 bg-[#F8FAFC] p-7 shadow-xs hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold mb-6 group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">For Students</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Know exactly where you stand against target jobs. Take assessments, complete practical sandboxes, build verified proof, and apply with confidence.
                </p>
                <Link href="/student" className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                  Explore Student Portal <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </div>

              {/* Academia Pillar */}
              <div className="group rounded-3xl border border-slate-200/90 bg-[#F8FAFC] p-7 shadow-xs hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold mb-6 group-hover:scale-105 transition-transform">
                  <Building2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">For Academia</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Aggregate cohort-level skill telemetry. Identify curriculum blindspots, schedule targeted faculty workshops, and verify project submissions.
                </p>
                <Link href="/academia" className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                  Explore Academia Portal <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </div>

              {/* Industry Pillar */}
              <div className="group rounded-3xl border border-slate-200/90 bg-[#F8FAFC] p-7 shadow-xs hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold mb-6 group-hover:scale-105 transition-transform">
                  <Briefcase className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">For Employers</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Eliminate resume guesswork. Filter candidates by deterministic verification scores, review real code evidence, and hire pre-calibrated talent.
                </p>
                <Link href="/industry" className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                  Explore Employer Portal <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Workflow Section */}
        <section className="py-16 sm:py-20 border-t border-slate-200/80 bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Deterministic Career Readiness
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                How SkillBridge Connect Works
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white font-black text-sm mb-5">
                  01
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">1. Select Target & Calibrate</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Choose your target role. SkillBridge loads active industry benchmark thresholds across essential runtime, database, and system skills.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-sm mb-5">
                  02
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">2. Verify in 4 Progressive Tiers</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Graduate from self-declaration to structured MCQs, timed interactive sandbox tasks, and verified project GitHub repositories.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-950 text-white font-black text-sm mb-5">
                  03
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">3. Unlock Living Passport</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Share your living verified skill passport directly with employers. Auto-match to internship openings matching your readiness tier.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-16 sm:py-20 bg-emerald-950 text-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Ready to verify your skills and unlock your career potential?
            </h2>
            <p className="text-base sm:text-lg text-emerald-200/90 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students and faculty using SkillBridge Connect to turn classroom knowledge into verified, hireable credentials.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="h-12 px-7 border-emerald-700 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl">
                  Try Interactive Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}