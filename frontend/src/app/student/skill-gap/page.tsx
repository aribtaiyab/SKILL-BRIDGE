"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Target, CheckCircle2, ChevronRight, BookOpen, Code, Loader2, ArrowRight } from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"
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
  const { isDemo, student } = useDemo()
  const [data, setData] = useState<SkillGapsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      const allGaps: EvaluatedSkillGap[] = student.skills.map(s => ({
        skillId: s.id,
        skillName: s.name,
        category: s.category,
        requiredLevel: s.requiredLevel,
        currentLevel: s.currentLevel,
        gap: s.gap,
        status: s.status,
        importance: s.importance,
        priorityScore: s.gap * (s.importance === 'High' ? 2 : 1),
        isAssessed: s.isAssessed,
        recommendation: s.gap > 0 ? `Improve ${s.name} benchmark by ${s.gap} points.` : `${s.name} benchmark satisfied.`,
      }))

      const criticalGaps = allGaps.filter(g => g.status === 'critical')
      const nearReadySkills = allGaps.filter(g => g.status === 'needs_improvement')
      const readySkills = allGaps.filter(g => g.status === 'ready')
      const priority = criticalGaps[0] || nearReadySkills[0] || null

      setData({
        careerName: student.targetCareer,
        priorityGap: priority,
        criticalGaps,
        nearReadySkills,
        readySkills,
        allGaps,
        summary: {
          strengthsText: readySkills.map(r => `${r.skillName} (${r.currentLevel}/${r.requiredLevel})`),
          nearReadyText: nearReadySkills.map(r => `${r.skillName} (${r.gap} pts to target)`),
          criticalText: criticalGaps.map(r => `${r.skillName} (${r.gap} pts to target)`),
          recommendedAction: priority ? `Prioritize closing the ${priority.gap}-point gap in ${priority.skillName} to advance to 90%+ readiness.` : 'All benchmarks satisfied.',
        },
      })
      setLoading(false)
      return
    }

    async function load() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/student/skill-gaps`)
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
  }, [isDemo, student])

  if (loading && !isDemo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Analyzing skill gap intelligence...</p>
        </div>
      </div>
    )
  }

  // Real user with no assessment data yet (Section 9 requirement: Hide Priority Gap completely)
  if (!isDemo && (!data || !data.allGaps.some(g => g.isAssessed))) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <div>
          <h1 className="text-h1 font-semibold">Skill Gap Analysis</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Identify the exact missing capabilities holding you back from target opportunities.</p>
        </div>

        <Card className="border-[var(--color-border-primary)] shadow-sm bg-[var(--color-surface-secondary)] p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 text-[var(--color-warning)]" />
            </div>
            <h3 className="text-h3 font-semibold">Take an Assessment to Identify Gaps</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Before we can calculate your skill gaps, complete a benchmark assessment for your target career.
            </p>
            <div className="pt-2">
              <Link href="/student/assessment">
                <Button className="px-6">
                  Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
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