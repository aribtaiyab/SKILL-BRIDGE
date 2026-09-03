import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle2, TrendingUp, Target, Shield, Briefcase, GraduationCap, Building2, Users } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-24 md:py-32">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <div className="space-y-8">
                <h1 className="text-h1 md:text-[48px] md:leading-[56px] font-semibold tracking-tight">
                  Know exactly how ready you are for your next opportunity.
                </h1>
                <p className="text-h3 text-[var(--color-text-secondary)] font-normal leading-relaxed max-w-[540px]">
                  SkillBridge measures your skills against real career and opportunity requirements, identifies the gaps holding you back, helps you improve, verifies your progress, and connects you with relevant opportunities.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/how-it-works">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                      See How It Works
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-6 pt-4 text-sm text-[var(--color-text-secondary)] font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                    <span>Assess</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[var(--color-warning)]" />
                    <span>Identify</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" />
                    <span>Improve</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[var(--color-foreground)]" />
                    <span>Prove</span>
                  </div>
                </div>
              </div>

              {/* Core Intelligence Hero Preview */}
              <div className="relative mx-auto w-full max-w-[500px] lg:ml-auto">
                <Card className="border-[var(--color-border-primary)] shadow-lg overflow-hidden">
                  <div className="border-b border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-small text-[var(--color-text-secondary)] font-medium">Target Role</p>
                        <p className="font-semibold text-[var(--color-foreground)]">Backend Developer Internship</p>
                      </div>
                      <Badge variant="success" className="text-sm px-3 py-1">78% Ready</Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Skill Analysis</span>
                        <span className="text-[var(--color-text-secondary)]">Required vs Verified</span>
                      </div>
                      
                      {[
                        { name: "Node.js", req: 80, val: 65, status: "gap" },
                        { name: "REST APIs", req: 75, val: 72, status: "near" },
                        { name: "SQL", req: 70, val: 82, status: "ready" },
                        { name: "Git", req: 60, val: 75, status: "ready" },
                      ].map((skill) => (
                        <div key={skill.name} className="flex items-center gap-4">
                          <span className="w-24 text-sm font-medium">{skill.name}</span>
                          <div className="flex-1 relative h-2 bg-[var(--color-surface-secondary)] rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 h-full bg-[var(--color-border-primary)]" 
                              style={{ width: `${skill.req}%` }}
                            />
                            <div 
                              className={`absolute top-0 left-0 h-full ${
                                skill.status === 'gap' ? 'bg-[var(--color-critical)]' : 
                                skill.status === 'near' ? 'bg-[var(--color-warning)]' : 
                                'bg-[var(--color-success)]'
                              }`} 
                              style={{ width: `${skill.val}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-sm font-medium">{skill.val}</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg bg-[var(--color-accent-light)] p-4 border border-[var(--color-accent)]/20">
                      <p className="text-sm font-semibold text-[var(--color-accent-hover)] mb-1">Priority Gap: Node.js</p>
                      <p className="text-small text-[var(--color-text-secondary)]">Recommended Action: Complete targeted Node.js practical task to improve readiness by 12%.</p>
                      <Button variant="outline" size="sm" className="mt-3 w-full border-[var(--color-accent)] text-[var(--color-accent-hover)]">
                        Start Practice Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section className="border-t border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-6 py-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-16">
              <h2 className="text-h2 font-semibold mb-4">One ecosystem. Four connected experiences.</h2>
              <p className="text-body text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                SkillBridge unites students, industry, academicians, and institutions with actionable intelligence.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <GraduationCap className="h-8 w-8 text-[var(--color-accent)] mb-6" />
                  <h3 className="text-h3 font-semibold mb-3">For Students</h3>
                  <p className="text-body text-[var(--color-text-secondary)] mb-6 h-20">
                    Target a career, assess your current level, find the gaps holding you back, improve with AI coaching, and get matched to real opportunities.
                  </p>
                  <Link href="/signup?role=student">
                    <Button variant="outline" className="w-full">Explore Student Journey</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <Briefcase className="h-8 w-8 text-[var(--color-accent)] mb-6" />
                  <h3 className="text-h3 font-semibold mb-3">For Industry</h3>
                  <p className="text-body text-[var(--color-text-secondary)] mb-6 h-20">
                    Define precise skill requirements, publish opportunities, and discover candidates based on verified capabilities rather than just resumes.
                  </p>
                  <Link href="/signup?role=industry">
                    <Button variant="outline" className="w-full">Explore Industry Portal</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <Users className="h-8 w-8 text-[var(--color-accent)] mb-6" />
                  <h3 className="text-h3 font-semibold mb-3">For Academicians</h3>
                  <p className="text-body text-[var(--color-text-secondary)] mb-6 h-20">
                    View precise skill gaps in your student cohorts, identify weak areas, and conduct targeted mentorship and interventions.
                  </p>
                  <Link href="/signup?role=academician">
                    <Button variant="outline" className="w-full">Explore Academic Portal</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <Building2 className="h-8 w-8 text-[var(--color-accent)] mb-6" />
                  <h3 className="text-h3 font-semibold mb-3">For Institutions</h3>
                  <p className="text-body text-[var(--color-text-secondary)] mb-6 h-20">
                    Monitor cohort readiness, track skill improvement trends, and take data-driven action to bridge the academia-industry gap.
                  </p>
                  <Link href="/signup?role=institution">
                    <Button variant="outline" className="w-full">Explore Institution Portal</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </main>
      
      <footer className="border-t border-[var(--color-border-primary)] bg-[var(--color-surface-card)] py-12 px-6">
        <div className="mx-auto max-w-[1200px] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--color-accent)] text-white text-xs">
              SC
            </div>
            SkillBridge Connect
          </div>
          <div>
            &copy; {new Date().getFullYear()} SkillBridge Connect. Prototype Phase 1.
          </div>
        </div>
      </footer>
    </div>
  )
}