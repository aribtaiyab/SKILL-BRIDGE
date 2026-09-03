"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Target, Award, Calendar, CheckCircle2, Loader2, ArrowUpRight, ArrowRight } from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"

interface ProgressData {
  growthTimeline: { month: string; score: number; label: string }[]
  reassessments: { id: string; previous_score: number; new_score: number; recorded_at: string; skills?: { name: string } }[]
  recentAttempts: { id: string; score: number; percentage: number; completed_at: string; assessments?: { title: string } }[]
  summary: {
    overallReadiness: number
    verifiedSkillsCount: number
    sixMonthGain: string
  }
}

export default function ProgressPage() {
  const { isDemo, student } = useDemo()
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setData({
        growthTimeline: [
          { month: 'Month 1', score: 55, label: 'Java Initial' },
          { month: 'Month 2', score: 68, label: 'Java Core Assessment' },
          { month: 'Month 3', score: 60, label: 'SQL Assessment' },
          { month: 'Month 4', score: 50, label: 'Spring Boot Assessment' },
          { month: 'Current', score: 80, label: 'Java Practical Reassessment' },
        ],
        reassessments: student.reassessmentHistory.map((h, i) => ({
          id: `reassess-${i}`,
          previous_score: h.baselineScore,
          new_score: h.currentScore,
          recorded_at: h.date,
          skills: { name: h.skillName },
        })),
        recentAttempts: [
          {
            id: 'att-1',
            score: 80,
            percentage: 80,
            completed_at: '2026-08-20',
            assessments: { title: 'Java Practical Benchmark Assessment' },
          },
          {
            id: 'att-2',
            score: 60,
            percentage: 60,
            completed_at: '2026-08-10',
            assessments: { title: 'SQL & Database Architecture' },
          },
          {
            id: 'att-3',
            score: 50,
            percentage: 50,
            completed_at: '2026-08-05',
            assessments: { title: 'Spring Boot REST Microservices' },
          },
        ],
        summary: {
          overallReadiness: student.readinessPercentage,
          verifiedSkillsCount: student.passport.verifiedSkillsCount,
          sixMonthGain: '+12 pts',
        },
      })
      setLoading(false)
      return
    }

    async function load() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/student/progress`)
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
        }
      } catch (err) {
        console.warn('Failed to load progress data:', err)
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
          <p className="text-sm text-[var(--color-text-secondary)]">Loading historical progress...</p>
        </div>
      </div>
    )
  }

  // Real user with no history yet (Section 11 requirement)
  if (!isDemo && (!data || (data.reassessments.length === 0 && data.recentAttempts.length === 0))) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-h1 font-semibold">My Progress</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">Track your verified skill development and score history over time.</p>
          </div>
        </div>

        <Card className="border-[var(--color-border-primary)] shadow-sm bg-[var(--color-surface-secondary)] p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-h3 font-semibold">No Progress History Yet</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              No history yet — your first assessment becomes your baseline.
            </p>
            <div className="pt-2">
              <Link href="/student/assessment">
                <Button className="px-6">
                  Take Your First Assessment <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const d = data || {
    growthTimeline: [
      { month: 'Month 1', score: 45, label: 'Node.js Initial' },
      { month: 'Month 2', score: 55, label: 'Async Foundations' },
      { month: 'Month 3', score: 65, label: 'Node.js Practical' },
      { month: 'Month 4', score: 72, label: 'REST APIs Verified' },
      { month: 'Month 5', score: 82, label: 'SQL Architecture' },
      { month: 'Current', score: 85, label: 'Verified Readiness' },
    ],
    reassessments: [],
    recentAttempts: [],
    summary: { overallReadiness: 78, verifiedSkillsCount: 4, sixMonthGain: '+15%' },
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">My Progress</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Track your verified skill development and score history over time.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Overall Career Readiness</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-[var(--color-success)]">{d.summary.overallReadiness}%</span>
              <span className="text-sm font-medium text-[var(--color-success)] flex items-center mb-1">
                <TrendingUp className="h-4 w-4 mr-1" /> {d.summary.sixMonthGain} (6mo)
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Verified Skills</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold">{d.summary.verifiedSkillsCount}</span>
              <span className="text-sm font-medium text-[var(--color-accent)] flex items-center mb-1">
                <TrendingUp className="h-4 w-4 mr-1" /> +2 (6mo)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Opportunities Matched</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-[var(--color-accent-hover)]">12</span>
              <span className="text-sm font-medium text-[var(--color-accent)] flex items-center mb-1">
                <TrendingUp className="h-4 w-4 mr-1" /> +8 (6mo)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Growth Timeline</CardTitle>
          <CardDescription>Measured benchmark progression across core competencies.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full bg-[var(--color-surface-secondary)] rounded-lg flex items-center justify-center border border-[var(--color-border-subtle)] relative overflow-hidden">
            <div className="absolute inset-0 p-8 flex items-end justify-between gap-4">
              {d.growthTimeline.map((item, index) => (
                <div key={index} className="w-full flex flex-col items-center gap-2 group">
                  <div 
                    className="w-full max-w-[40px] bg-[var(--color-accent)] rounded-t transition-all group-hover:bg-[var(--color-accent-hover)]"
                    style={{ height: `${Math.max(item.score, 15)}%` }}
                  />
                  <span className="text-xs font-semibold">{item.score}</span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] truncate">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reassessment & Milestone Records */}
      <div>
        <h3 className="text-h3 font-semibold mb-4">Reassessment & Verification Audit History</h3>
        <Card>
          <CardContent className="p-0 divide-y divide-[var(--color-border-primary)]">
            {d.reassessments && d.reassessments.length > 0 ? (
              d.reassessments.map((r) => {
                const diff = r.new_score - r.previous_score
                return (
                  <div key={r.id} className="flex gap-4 p-6">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] shrink-0">
                      <CheckCircle2 className={`h-5 w-5 ${diff >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-critical)]'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-[var(--color-foreground)]">
                          {r.skills?.name || 'Skill'} Reassessment: {r.previous_score} → {r.new_score}
                        </h4>
                        <Badge variant={diff >= 0 ? 'success' : 'critical'}>
                          {diff > 0 ? `+${diff} pts` : `${diff} pts`}
                        </Badge>
                        <span className="text-xs text-[var(--color-text-secondary)] flex items-center">
                          <Calendar className="h-3 w-3 mr-1" /> {new Date(r.recorded_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Authoritative server evaluation recorded in skill history.
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              [
                { icon: <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />, title: "SQL Skill Reached Advanced (82)", date: "Recent", desc: "Successfully completed practical assessment verifying advanced database design capabilities." },
                { icon: <Target className="h-5 w-5 text-[var(--color-warning)]" />, title: "Set Career Target: Backend Developer", date: "Recent", desc: "Changed focus to Backend Developer, automatically recalculating skill gap and readiness metrics." },
                { icon: <Award className="h-5 w-5 text-[var(--color-accent)]" />, title: "Node.js Fundamentals Assessment (65)", date: "Recent", desc: "Completed knowledge assessment. Next step: practice error-handling in Streams." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-6">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-[var(--color-foreground)]">{item.title}</h4>
                      <span className="text-xs text-[var(--color-text-secondary)] flex items-center"><Calendar className="h-3 w-3 mr-1" /> {item.date}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{item.desc}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}