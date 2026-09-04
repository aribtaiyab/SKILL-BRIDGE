"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Shield, CheckCircle2, GitBranch, ExternalLink, Award, ArrowRight } from "lucide-react"

interface SkillMatrixItem {
  skillName: string
  score: number
  tier: "Self-Declared" | "Assessment Verified" | "Practical Verified" | "Evidence Verified"
}

interface LivingSkillPassportCardProps {
  studentName?: string
  targetRole?: string
  readinessScore?: number
  skills?: SkillMatrixItem[]
  linkedRepoUrl?: string
  projectTitle?: string
}

export function LivingSkillPassportCard({
  studentName = "Sarah Jenkins",
  targetRole = "Backend Developer (Internship/Junior)",
  readinessScore = 78,
  skills = [
    { skillName: "Node.js", score: 80, tier: "Assessment Verified" },
    { skillName: "REST APIs", score: 75, tier: "Practical Verified" },
    { skillName: "SQL", score: 82, tier: "Evidence Verified" },
    { skillName: "Git & Version Control", score: 75, tier: "Practical Verified" },
  ],
  linkedRepoUrl = "https://github.com/developer/ecommerce-platform-api",
  projectTitle = "E-Commerce Microservices Platform",
}: LivingSkillPassportCardProps) {
  const getBadgeClass = (tier: SkillMatrixItem["tier"]) => {
    switch (tier) {
      case "Evidence Verified":
        return "bg-purple-600 text-white"
      case "Practical Verified":
        return "bg-emerald-600 text-white"
      case "Assessment Verified":
        return "bg-blue-600 text-white"
      default:
        return "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <Card className="border-[var(--color-border-primary)] shadow-sm bg-[var(--color-surface-card)]">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs uppercase tracking-wider">
                <Shield className="h-3 w-3 mr-1 text-[var(--color-accent)] inline" /> Official Skill Passport
              </Badge>
            </div>
            <CardTitle className="text-xl font-bold">{studentName}</CardTitle>
            <CardDescription className="text-sm mt-0.5">Target: {targetRole}</CardDescription>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-[var(--color-text-secondary)] block">Cumulative Readiness</span>
            <span className="text-3xl font-extrabold text-[var(--color-success)]">{readinessScore}%</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
            <span>Career Benchmark Readiness Gauge</span>
            <span className="font-semibold">{readinessScore} / 100</span>
          </div>
          <Progress value={readinessScore} className="h-2" />
        </div>

        <div>
          <h4 className="text-xs uppercase font-semibold text-[var(--color-text-secondary)] tracking-wider mb-3">
            Verified Skill Score Matrix
          </h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {skills.map((item) => (
              <div
                key={item.skillName}
                className="p-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-sm">{item.skillName}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">Score: {item.score} / 100</div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getBadgeClass(item.tier)}`}>
                  {item.tier}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--color-border-primary)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
            <span className="truncate">
              Verified Project: <strong className="text-[var(--color-foreground)]">{projectTitle}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={linkedRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline inline-flex items-center font-medium"
            >
              GitHub Repo <ExternalLink className="h-3 w-3 ml-1" />
            </a>
            <span className="text-[var(--color-text-muted)]">•</span>
            <Link href="/student/passport" className="text-[var(--color-accent)] hover:underline font-medium">
              Full Passport
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
