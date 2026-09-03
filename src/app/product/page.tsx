import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

export default function ProductPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      
      <main className="flex-1 py-16 px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center mb-16 space-y-4 max-w-[800px] mx-auto">
            <h1 className="text-h1 font-semibold">The Core Intelligence</h1>
            <p className="text-h3 text-[var(--color-text-secondary)] font-normal">
              Opportunity-Specific Readiness is the foundation of SkillBridge Connect.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="space-y-6">
              <h2 className="text-h2 font-semibold">Stop guessing your readiness.</h2>
              <div className="space-y-4 text-body text-[var(--color-text-secondary)]">
                <p>
                  Most platforms ask "How skilled are you?" and leave you with a generic badge.
                </p>
                <p className="text-[var(--color-foreground)] font-medium border-l-4 border-[var(--color-accent)] pl-4 py-1 bg-[var(--color-accent-light)] rounded-r-md">
                  SkillBridge asks: "Are you ready for THIS role, and what exactly is stopping you?"
                </p>
                <p>
                  By mapping your verified skills directly against the specific requirements of active opportunities, we provide actionable intelligence that actually helps you get hired.
                </p>
              </div>
              <Link href="/signup">
                <Button>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
            
            <div>
              <Card className="shadow-md">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">The Student Problem</h3>
                      <ul className="space-y-2 text-body">
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--color-critical)] mt-1">•</span>
                          <span>Uncertainty about actual skill level</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--color-critical)] mt-1">•</span>
                          <span>Blind spots regarding missing skills</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--color-critical)] mt-1">•</span>
                          <span>Disconnect from real industry requirements</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="h-px bg-[var(--color-border-primary)]" />
                    
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">The Industry Problem</h3>
                      <ul className="space-y-2 text-body">
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--color-warning)] mt-1">•</span>
                          <span>Struggling to find candidates with verified skills</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--color-warning)] mt-1">•</span>
                          <span>Resumes don't reflect practical capability</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}