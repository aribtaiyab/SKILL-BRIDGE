"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Award, Users, CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"

interface ProgressSummary {
  averageReadiness: number
  readinessGain: string
  assessmentsCompleted: number
  practicalPassRate: string
}

interface ReassessmentItem {
  id: string
  studentName: string
  skillName: string
  previousScore: number
  currentScore: number
  gain: number
  date: string
  notes: string
}

export default function AcademicianProgressPage() {
  const { isDemo, cohortStudents } = useDemo()
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [reassessments, setReassessments] = useState<ReassessmentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setSummary({
        averageReadiness: 76,
        readinessGain: "+14%",
        assessmentsCompleted: 12,
        practicalPassRate: "84%",
      })
      setReassessments([
        {
          id: "re-1",
          studentName: "Aditi Sharma",
          skillName: "Node.js Streams & Error Recovery",
          previousScore: 56,
          currentScore: 82,
          gain: 26,
          date: "2026-08-25",
          notes: "Targeted lab intervention on async streams and pipeline error handling.",
        },
        {
          id: "re-2",
          studentName: "Rahul Verma",
          skillName: "PostgreSQL Index Optimization",
          previousScore: 68,
          currentScore: 85,
          gain: 17,
          date: "2026-08-22",
          notes: "Reassessed following department database tuning workshop.",
        },
        {
          id: "re-3",
          studentName: "Sneha Patel",
          skillName: "React Component Lifecycle & Hooks",
          previousScore: 62,
          currentScore: 78,
          gain: 16,
          date: "2026-08-18",
          notes: "Mentorship session on state management and memoization.",
        },
      ])
      setLoading(false)
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/academician/progress`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setSummary(json.data.summary)
          setReassessments(json.data.reassessments || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isDemo, cohortStudents])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading cohort progression analytics...</p>
        </div>
      </div>
    )
  }

  const s = summary || {
    averageReadiness: 0,
    readinessGain: "+0%",
    assessmentsCompleted: 0,
    practicalPassRate: "0%",
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-h1 font-semibold">Cohort Progression & Growth</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Measure semester-over-semester technical capability improvements across academic departments.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-[var(--color-surface-secondary)] border-[var(--color-border-primary)] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Cohort Average Readiness</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-[var(--color-success)]">{s.averageReadiness}%</span>
              {s.readinessGain !== '+0%' && (
                <span className="text-sm font-medium text-[var(--color-success)] flex items-center mb-1">
                  <TrendingUp className="h-4 w-4 mr-1" /> {s.readinessGain} vs Start
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-[var(--color-border-primary)] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Reassessments Recorded</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-[var(--color-foreground)]">{s.assessmentsCompleted}</span>
              <span className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Post-intervention evaluations
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-[var(--color-border-primary)] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Verified Skill Rate</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-[var(--color-accent)]">{s.practicalPassRate}</span>
              <span className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Backed by verified evidence
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Before → After Reassessment Feed */}
      <div className="space-y-4">
        <div>
          <h2 className="text-h2 font-semibold">Verified Improvement Records</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Before → After score changes resulting from targeted workshops and mentorship sessions.
          </p>
        </div>

        {reassessments.length === 0 ? (
          <Card className="p-8 border-dashed text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              No reassessment records found yet. Progression data appears when students complete post-intervention assessments.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {reassessments.map(r => (
              <Card key={r.id} className="border-[var(--color-border-primary)] shadow-sm">
                <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{r.studentName}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">• {r.date}</span>
                    </div>
                    <p className="text-xs text-[var(--color-foreground)] font-medium">{r.skillName}</p>
                    {r.notes && <p className="text-xs text-[var(--color-text-muted)]">{r.notes}</p>}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-[var(--color-text-secondary)]">Score Progression</div>
                      <div className="text-sm font-semibold">
                        <span className="text-[var(--color-text-muted)] line-through mr-1">{r.previousScore}</span>
                        <ArrowRight className="inline h-3 w-3 text-[var(--color-text-muted)] mx-1" />
                        <span className="text-[var(--color-success)]">{r.currentScore} pts</span>
                      </div>
                    </div>
                    <Badge variant="success" className="text-xs">
                      +{r.gain} pts gain
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
