import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Target, TrendingUp, Shield, Link as LinkIcon, ArrowRight } from "lucide-react"

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      title: "Assess",
      desc: "Measure actual knowledge and practical ability.",
      detail: "Go beyond self-reported skills. Complete adaptive assessments that benchmark your current capability in specific technical domains.",
      icon: <CheckCircle2 className="h-6 w-6 text-[var(--color-success)]" />
    },
    {
      num: "02",
      title: "Identify",
      desc: "Find the skills holding you back.",
      detail: "Compare your current level against the actual requirements of your target role. SkillBridge highlights exactly which gaps are most critical to fill.",
      icon: <Target className="h-6 w-6 text-[var(--color-warning)]" />
    },
    {
      num: "03",
      title: "Improve",
      desc: "Receive targeted recommendations and an improvement plan.",
      detail: "Access AI-guided coaching, practical tasks, and targeted resources designed specifically to close your identified skill gaps.",
      icon: <TrendingUp className="h-6 w-6 text-[var(--color-accent)]" />
    },
    {
      num: "04",
      title: "Prove",
      desc: "Reassess and build verified evidence.",
      detail: "Retake assessments and submit practical challenges. Your progress is verified and recorded in your permanent digital Skill Passport.",
      icon: <Shield className="h-6 w-6 text-[var(--color-foreground)]" />
    },
    {
      num: "05",
      title: "Connect",
      desc: "Get matched with relevant opportunities.",
      detail: "When your verified readiness matches industry requirements, you get connected with internships, jobs, and mentorship programs.",
      icon: <LinkIcon className="h-6 w-6 text-[var(--color-text-secondary)]" />
    }
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      
      <main className="flex-1 py-16 px-6">
        <div className="mx-auto max-w-[800px]">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-h1 font-semibold">How SkillBridge Works</h1>
            <p className="text-h3 text-[var(--color-text-secondary)] font-normal">
              A clear, verified path from where you are to where you want to be.
            </p>
          </div>

          <div className="space-y-12 relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-12 bottom-12 w-px bg-[var(--color-border-primary)] hidden md:block"></div>
            
            {steps.map((step, idx) => (
              <div key={step.num} className="relative flex flex-col md:flex-row gap-8 items-start">
                <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-surface-card)] border-2 border-[var(--color-border-primary)] z-10 shrink-0 shadow-sm">
                  {step.icon}
                </div>
                <div className="flex-1 bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-4 md:hidden">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-surface-secondary)]">
                      {step.icon}
                    </div>
                    <span className="text-sm font-bold text-[var(--color-text-muted)]">{step.num}</span>
                  </div>
                  
                  <div className="hidden md:block text-sm font-bold text-[var(--color-text-muted)] mb-2">
                    STEP {step.num}
                  </div>
                  
                  <h2 className="text-h2 font-semibold mb-3">{step.title}</h2>
                  <p className="text-h3 font-medium text-[var(--color-foreground)] mb-3">
                    {step.desc}
                  </p>
                  <p className="text-body text-[var(--color-text-secondary)]">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8">
                Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}