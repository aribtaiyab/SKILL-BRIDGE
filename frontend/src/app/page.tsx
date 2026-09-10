import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, TrendingUp, Target, Shield, Briefcase, GraduationCap, Users, Sparkles, Zap, Star } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden px-6 pt-20 pb-28 md:pt-32 md:pb-36">
          {/* Ambient glow orbs */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[700px] rounded-full bg-[var(--color-accent)]/20 blur-[120px]" />
          <div className="pointer-events-none absolute top-1/2 -right-48 h-80 w-80 rounded-full bg-sky-500/10 blur-[80px]" />
          <div className="pointer-events-none absolute bottom-0 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />

          <div className="relative mx-auto max-w-[1240px]">
            <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20 items-center">
              {/* Left column */}
              <div className="space-y-8">
                {/* Eyebrow badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  <span className="text-xs font-semibold tracking-wider text-[var(--color-accent)] uppercase">Career Intelligence Platform</span>
                </div>

                <h1 className="text-[44px] md:text-[60px] leading-[1.1] font-black tracking-tight">
                  Know exactly{" "}
                  <span className="text-gradient">how ready</span>{" "}
                  you are for your next opportunity.
                </h1>

                <p className="max-w-[520px] text-[17px] leading-8 text-[var(--color-text-secondary)]">
                  SkillBridge measures your skills against real career requirements, finds the gaps holding you back, helps you improve, verifies your progress, and connects you with relevant opportunities.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href="/signup">
                    <Button size="lg" className="btn-gradient w-full sm:w-auto h-12 px-8 text-[15px] font-semibold rounded-xl shadow-lg">
                      <span>Get Started Free</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/student?demo=true">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto h-12 px-8 text-[15px] font-semibold rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur">
                      Explore Demo ✨
                    </Button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pt-3 border-t border-white/8">
                  {[
                    { icon: CheckCircle2, label: "Assess Skills", color: "text-emerald-400" },
                    { icon: Target, label: "Identify Gaps", color: "text-amber-400" },
                    { icon: TrendingUp, label: "Improve Fast", color: "text-[var(--color-accent)]" },
                    { icon: Shield, label: "Prove Progress", color: "text-sky-400" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column — interactive preview card */}
              <div className="relative mx-auto w-full max-w-[520px] animate-float">
                {/* Card glow backdrop */}
                <div className="absolute -inset-4 rounded-3xl bg-[var(--color-accent)]/15 blur-2xl" />

                <div className="relative glass rounded-2xl overflow-hidden shadow-[var(--shadow-float)] border border-white/10">
                  {/* Card header */}
                  <div className="border-b border-white/8 bg-white/4 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Target Role</p>
                        <p className="text-base font-bold text-white">Backend Developer Internship</p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 border border-emerald-400/25 px-3 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-400">78% Ready</span>
                      </div>
                    </div>
                  </div>

                  {/* Skill bars */}
                  <div className="px-6 py-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-white uppercase tracking-wider">Skill Analysis</span>
                      <span className="text-xs text-[var(--color-text-muted)]">Required vs Verified</span>
                    </div>

                    {[
                      { name: "Node.js", req: 80, val: 65, status: "gap" },
                      { name: "REST APIs", req: 75, val: 72, status: "near" },
                      { name: "SQL", req: 70, val: 82, status: "ready" },
                      { name: "Git", req: 60, val: 75, status: "ready" },
                    ].map((skill) => (
                      <div key={skill.name} className="flex items-center gap-4">
                        <span className="w-20 text-sm font-medium text-[var(--color-text-secondary)]">{skill.name}</span>
                        <div className="flex-1 relative h-2 bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full rounded-full bg-white/15"
                            style={{ width: `${skill.req}%` }}
                          />
                          <div
                            className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                              skill.status === 'gap' ? 'bg-[var(--color-critical)]' :
                              skill.status === 'near' ? 'bg-[var(--color-warning)]' :
                              'bg-[var(--color-success)]'
                            }`}
                            style={{ width: `${skill.val}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-sm font-bold text-white">{skill.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Priority action */}
                  <div className="mx-6 mb-6 rounded-xl bg-[var(--color-accent)]/12 border border-[var(--color-accent)]/25 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Zap className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                      <p className="text-sm font-bold text-[var(--color-accent)]">Priority Gap: Node.js</p>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-5">Complete a targeted Node.js practical task to improve readiness by 12%.</p>
                    <div className="mt-3 h-8 rounded-lg bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 flex items-center justify-center text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 transition-colors cursor-pointer">
                      Start Practice Task →
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section className="border-y border-white/6 bg-white/3 backdrop-blur px-6 py-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "94%", label: "Accuracy Rate" },
                { value: "3 Roles", label: "Connected Portals" },
                { value: "AI-Powered", label: "Career Intelligence" },
                { value: "Real-time", label: "Skill Tracking" },
              ].map(({ value, label }) => (
                <div key={label} className="space-y-1">
                  <div className="text-2xl font-black text-white tracking-tight">{value}</div>
                  <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Role Portals Section ── */}
        <section className="px-6 py-28">
          <div className="mx-auto max-w-[1240px]">
            <div className="text-center mb-16 space-y-4">
              <div className="eyebrow">Three connected experiences</div>
              <h2 className="text-h2 text-white">One ecosystem, built for everyone.</h2>
              <p className="text-[17px] text-[var(--color-text-secondary)] max-w-xl mx-auto leading-7">
                SkillBridge unites students, industry, and academia with actionable career intelligence.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Student Card */}
              <div className="group relative rounded-2xl p-8 glass card-glow border border-white/6 flex flex-col">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 border border-emerald-400/20">
                    <GraduationCap className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">For Students</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-6 mb-8 flex-1">
                    Target a career, assess your skill level, find gaps holding you back, improve with AI coaching, and get matched to real opportunities.
                  </p>
                  <div className="space-y-2 mb-8">
                    {["Career Readiness Score", "Skill Gap Analysis", "AI Coach", "Opportunity Matching"].map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/signup?role=student" className="block">
                    <button className="w-full h-10 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 text-sm font-semibold hover:bg-emerald-400/20 transition-colors">
                      Explore Student Journey →
                    </button>
                  </Link>
                </div>
              </div>

              {/* Industry Card */}
              <div className="group relative rounded-2xl p-8 glass card-glow border border-white/6 flex flex-col">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/20">
                    <Briefcase className="h-6 w-6 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">For Industry</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-6 mb-8 flex-1">
                    Define precise skill requirements, publish opportunities, and discover verified candidates based on real capabilities — not just resumes.
                  </p>
                  <div className="space-y-2 mb-8">
                    {["Verified Candidate Pool", "Skill-based Matching", "Opportunity Hub", "Hiring Insights"].map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/signup?role=industry" className="block">
                    <button className="w-full h-10 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-violet-400 text-sm font-semibold hover:bg-[var(--color-accent)]/20 transition-colors">
                      Explore Industry Portal →
                    </button>
                  </Link>
                </div>
              </div>

              {/* Academia Card */}
              <div className="group relative rounded-2xl p-8 glass card-glow border border-white/6 flex flex-col">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/15 border border-sky-400/20">
                    <Users className="h-6 w-6 text-sky-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">For Academia</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-6 mb-8 flex-1">
                    View precise skill gaps in your student cohorts, identify weak areas, and conduct targeted mentorship and skill interventions.
                  </p>
                  <div className="space-y-2 mb-8">
                    {["Cohort Skill Analysis", "Intervention Planner", "Industry Demand View", "Verification Authority"].map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/signup?role=academician" className="block">
                    <button className="w-full h-10 rounded-xl border border-sky-400/30 bg-sky-400/10 text-sky-400 text-sm font-semibold hover:bg-sky-400/20 transition-colors">
                      Explore Academia Portal →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="px-6 py-20 border-t border-white/6 bg-white/2">
          <div className="mx-auto max-w-[1240px]">
            <div className="text-center mb-14 space-y-3">
              <div className="eyebrow">Simple process</div>
              <h2 className="text-[32px] font-bold text-white tracking-tight">How SkillBridge works</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "01", title: "Set Your Target", desc: "Choose a career path or specific opportunity you want to pursue.", icon: Target, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
                { step: "02", title: "Get Assessed", desc: "Complete skill assessments and AI evaluations against role requirements.", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
                { step: "03", title: "Close the Gap", desc: "Follow personalized action plans to improve verified skill scores.", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
                { step: "04", title: "Get Connected", desc: "Match with verified opportunities that align with your confirmed readiness.", icon: Star, color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20" },
              ].map(({ step, title, desc, icon: Icon, color, bg, border }) => (
                <div key={step} className="relative glass rounded-2xl p-6 border border-white/6 group hover:border-white/12 transition-all duration-300">
                  <div className="text-xs font-black text-[var(--color-text-muted)] tracking-[0.2em] mb-4">{step}</div>
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${bg} border ${border}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-6">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="px-6 py-28">
          <div className="mx-auto max-w-[640px] text-center">
            <div className="glass-strong rounded-3xl p-12 border border-[var(--color-accent)]/20 relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/10 via-transparent to-indigo-500/10" />
              <div className="relative space-y-6">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 mx-auto">
                  <Sparkles className="h-7 w-7 text-[var(--color-accent)]" />
                </div>
                <h2 className="text-[32px] font-black text-white tracking-tight leading-tight">
                  Start your career intelligence journey today
                </h2>
                <p className="text-[var(--color-text-secondary)] text-base leading-7">
                  Join thousands of students, educators, and industry partners building a smarter skills ecosystem.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Link href="/signup">
                    <Button size="lg" className="btn-gradient h-12 px-10 text-[15px] font-semibold rounded-xl">
                      <span>Create Free Account</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/how-it-works">
                    <Button size="lg" variant="ghost" className="h-12 px-8 text-[15px] text-[var(--color-text-secondary)] hover:text-white hover:bg-white/8 rounded-xl font-medium">
                      Learn More →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 bg-white/2 py-10 px-6">
        <div className="mx-auto max-w-[1240px] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white text-xs font-black shadow-lg">
              SC
            </div>
            <div>
              <div className="text-sm font-bold text-white">SkillBridge Connect</div>
              <div className="text-xs text-[var(--color-text-muted)]">Career Intelligence Platform</div>
            </div>
          </div>
          <div className="flex items-center gap-8 text-xs text-[var(--color-text-muted)]">
            <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Get Started</Link>
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} SkillBridge Connect. Prototype Phase 1.
          </div>
        </div>
      </footer>
    </div>
  )
}