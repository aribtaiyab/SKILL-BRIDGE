"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Target, CheckCircle2, ChevronRight, BookOpen, Code, Loader2 } from "lucide-react"
import { EvaluatedSkillGap } from "@/lib/intelligence/engine"

interface SkillGapsResponse {
  careerName: string
  priorityGap: EvaluatedSkillGap | null
  criticalGaps: EvaluatedSkillGap[]
  nearReadySkills: EvaluatedSkillGap[]
  readySkills: EvaluatedSkillGap[]
  allGaps: EvaluatedSkillGap[]
  summary: {
    strengthsText: string[]
    nearReadyText: string[]
    criticalText: string[]
    recommendedAction: string
  }
}

export default function SkillGapPage() {
  const [data, setData] = useState<SkillGapsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/student/skill-gaps')
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
        }
      } catch (err) {
        console.warn('Failed to load skill gaps:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Analyzing skill gap intelligence...</p>
        </div>
      </div>
    )
  }

  const d = data!
  const priority = d?.priorityGap

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Skill Gap Analysis</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Specific benchmarks holding you back from {d?.careerName || "your target role"}.</p>
        </div>
      </div>

      {/* Priority Focus Banner */}
      {priority && (
        <div className="flex gap-4 p-5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] shadow-sm">
          <AlertTriangle className="h-6 w-6 text-[var(--color-critical)] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-[var(--color-foreground)]">Priority Focus: {priority.skillName}</h3>
              <Badge variant="critical">Critical Gap ({priority.gap} pts)</Badge>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Closing this {priority.gap}-point gap is the highest priority factor in unlocking opportunities for {d.careerName}.
            </p>
            <div className="pt-1">
              <Link href="/student/assessment">
                <Button size="sm" className="bg-[var(--color-accent)]">Take {priority.skillName} Assessment</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Ranked Skill Gaps List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Detailed Competency Breakdown</h2>

        {(d?.allGaps || []).map((gap) => (
          <Card key={gap.skillId} className="border-[var(--color-border-primary)]">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base">{gap.skillName}</h3>
                    <Badge variant={gap.status === 'ready' ? 'success' : gap.status === 'critical' ? 'critical' : 'warning'}>
                      {gap.status === 'ready' ? 'Ready' : gap.status === 'critical' ? 'Critical Gap' : 'Needs Improvement'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">{gap.importance} Priority • {gap.category || "Technical"}</p>
                </div>
                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  <div className="text-sm font-semibold">{gap.currentLevel} / {gap.requiredLevel}</div>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {gap.gap > 0 ? `${gap.gap} pts to close` : 'Benchmark satisfied'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Progress value={(gap.currentLevel / Math.max(gap.requiredLevel, 1)) * 100} className="h-2" />
                <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-1">
                  <span>Recommendation: {gap.recommendation}</span>
                  <Link href="/student/assessment">
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-[var(--color-accent)] hover:underline p-0">
                      Verify →
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}